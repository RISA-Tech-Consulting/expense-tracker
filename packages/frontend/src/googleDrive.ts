import { exportBackup, importBackup, type BackupData } from './api';
import db from './db';

// ── Configuration ──
// Replace with your own Google Cloud Console OAuth 2.0 Client ID.
// 1. Go to https://console.cloud.google.com/apis/credentials
// 2. Create an OAuth 2.0 Client ID (type: Web application)
// 3. Add your app's origin to Authorized JavaScript origins
// 4. Enable the Google Drive API in APIs & Services → Library
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'expense-tracker-backup.json';
const BACKUP_MIME = 'application/json';

// ── State ──
let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

// ── Helpers: script loading ──

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

async function loadGapiClient(): Promise<void> {
  await loadScript('https://apis.google.com/js/api.js', 'gapi-script');
  return new Promise((resolve, reject) => {
    gapi.load('client', {
      callback: () => resolve(),
      onerror: () => reject(new Error('Failed to load gapi client')),
    });
  });
}

async function loadGis(): Promise<void> {
  await loadScript('https://accounts.google.com/gsi/client', 'gis-script');
}

// ── Initialization ──

let initPromise: Promise<void> | null = null;

export function isConfigured(): boolean {
  return !!CLIENT_ID;
}

async function ensureInit(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error(
      'Google Drive sync is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.',
    );
  }
  if (!initPromise) {
    initPromise = (async () => {
      await Promise.all([loadGapiClient(), loadGis()]);
      await gapi.client.init({});
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {}, // overridden per-call
      });
    })();
  }
  return initPromise;
}

// ── Auth ──

export async function signIn(): Promise<string> {
  await ensureInit();
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialised'));
      return;
    }
    tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      resolve(accessToken);
    };
    tokenClient.error_callback = (err: google.accounts.oauth2.ClientConfigError) => {
      reject(new Error(err.message ?? 'Sign-in failed'));
    };
    if (accessToken) {
      // Already have a token – silently request a new one
      tokenClient.requestAccessToken({ prompt: '' });
    } else {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  });
}

export function signOut(): void {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = null;
  }
}

export function isSignedIn(): boolean {
  return !!accessToken;
}

// ── Drive API helpers ──

async function findBackupFile(): Promise<string | null> {
  const resp = await gapi.client.request<{ files?: Array<{ id: string }> }>({
    path: 'https://www.googleapis.com/drive/v3/files',
    params: {
      q: `name='${BACKUP_FILENAME}' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      spaces: 'drive',
      pageSize: 1,
    },
  });
  const files = resp.result.files;
  return files && files.length > 0 ? files[0].id : null;
}

async function uploadFile(content: string, existingFileId?: string): Promise<string> {
  const boundary = '===expense_tracker_boundary===';
  const metadata: Record<string, string> = {
    name: BACKUP_FILENAME,
    mimeType: BACKUP_MIME,
  };
  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${BACKUP_MIME}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const method = existingFileId ? 'PATCH' : 'POST';

  const resp = await gapi.client.request<{ id: string }>({
    path: url,
    method,
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  return resp.result.id;
}

async function downloadFile(fileId: string): Promise<string> {
  const resp = await gapi.client.request({
    path: `https://www.googleapis.com/drive/v3/files/${fileId}`,
    params: { alt: 'media' },
  });
  // resp.body is the raw string when alt=media
  return typeof resp.result === 'string' ? resp.result : JSON.stringify(resp.result);
}

// ── Public API ──

export interface SyncResult {
  action: 'uploaded' | 'downloaded' | 'up-to-date';
  timestamp: string;
}

/** Push local DB to Google Drive */
export async function pushToDrive(): Promise<SyncResult> {
  await ensureInit();
  if (!accessToken) throw new Error('Not signed in to Google');

  const backup = await exportBackup();
  const json = JSON.stringify(backup, null, 2);
  const existingId = await findBackupFile();
  await uploadFile(json, existingId ?? undefined);

  const now = new Date().toISOString();
  await db.settings.put({ key: 'lastDriveSync', value: now });
  return { action: 'uploaded', timestamp: now };
}

/** Pull from Google Drive and replace local DB */
export async function pullFromDrive(): Promise<SyncResult> {
  await ensureInit();
  if (!accessToken) throw new Error('Not signed in to Google');

  const fileId = await findBackupFile();
  if (!fileId) throw new Error('No backup file found in Google Drive');

  const content = await downloadFile(fileId);
  const data: BackupData = JSON.parse(content);
  await importBackup(data);

  const now = new Date().toISOString();
  await db.settings.put({ key: 'lastDriveSync', value: now });
  return { action: 'downloaded', timestamp: now };
}

/** Get info about the remote backup file (if any) */
export async function getRemoteBackupInfo(): Promise<{ exists: boolean; modifiedTime?: string }> {
  await ensureInit();
  if (!accessToken) return { exists: false };

  const resp = await gapi.client.request<{ files?: Array<{ id: string; modifiedTime: string }> }>({
    path: 'https://www.googleapis.com/drive/v3/files',
    params: {
      q: `name='${BACKUP_FILENAME}' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      spaces: 'drive',
      pageSize: 1,
    },
  });
  const files = resp.result.files;
  if (files && files.length > 0) {
    return { exists: true, modifiedTime: files[0].modifiedTime };
  }
  return { exists: false };
}

/** Get last sync timestamp from local settings */
export async function getLastDriveSyncTime(): Promise<string | null> {
  const row = await db.settings.get('lastDriveSync');
  return row?.value ?? null;
}
