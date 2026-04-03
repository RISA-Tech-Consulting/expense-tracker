import { useEffect, useState, useCallback, useRef } from 'react';
import {
  exportBackup,
  importBackup,
  downloadBackupFile,
  getBackupSchedule,
  setBackupSchedule,
  getLastBackupTime,
  setLastBackupTime,
  isBackupDue,
  getDrivePushSchedule,
  setDrivePushSchedule,
  getLastDrivePushTime,
  setLastDrivePushTime,
  type BackupData,
  type BackupSchedule,
} from '../api';
import {
  isConfigured as isDriveConfigured,
  isSignedIn as isDriveSignedIn,
  signIn as driveSignIn,
  signOut as driveSignOut,
  pushToDrive,
  pullFromDrive,
  getRemoteBackupInfo,
  getLastDriveSyncTime,
  restoreSession as restoreDriveSession,
} from '../googleDrive';

export default function Backup() {
  const [schedule, setScheduleState] = useState<BackupSchedule>('off');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Google Drive state
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [lastDriveSync, setLastDriveSync] = useState<string | null>(null);
  const [remoteModified, setRemoteModified] = useState<string | null>(null);
  const [drivePushSchedule, setDrivePushScheduleState] = useState<BackupSchedule>('off');
  const [lastDrivePush, setLastDrivePush] = useState<string | null>(null);
  const driveAvailable = isDriveConfigured();

  const load = useCallback(async () => {
    const [sched, last] = await Promise.all([getBackupSchedule(), getLastBackupTime()]);
    setScheduleState(sched);
    setLastBackup(last);
    const driveSync = await getLastDriveSyncTime();
    setLastDriveSync(driveSync);
    const [dps, ldp] = await Promise.all([getDrivePushSchedule(), getLastDrivePushTime()]);
    setDrivePushScheduleState(dps);
    setLastDrivePush(ldp);
    if (isDriveSignedIn()) {
      setDriveConnected(true);
    } else if (isDriveConfigured()) {
      const restored = await restoreDriveSession();
      setDriveConnected(restored);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Google Drive handlers ──

  const handleDriveConnect = async () => {
    setMessage(null);
    try {
      await driveSignIn();
      setDriveConnected(true);
      // Fetch remote info
      const info = await getRemoteBackupInfo();
      setRemoteModified(info.modifiedTime ?? null);
      setMessage({ text: 'Connected to Google Drive.', type: 'success' });
    } catch {
      setMessage({ text: 'Failed to connect to Google Drive.', type: 'danger' });
    }
  };

  const handleDriveDisconnect = () => {
    driveSignOut();
    setDriveConnected(false);
    setRemoteModified(null);
    setMessage({ text: 'Disconnected from Google Drive.', type: 'success' });
  };

  const handleDrivePushScheduleChange = async (value: BackupSchedule) => {
    setDrivePushScheduleState(value);
    await setDrivePushSchedule(value);
    setMessage({ text: `Drive push schedule set to ${value === 'off' ? 'off' : value}.`, type: 'success' });
  };

  const handlePushToDrive = async () => {
    setDriveSyncing(true);
    setMessage(null);
    try {
      const result = await pushToDrive();
      const now = result.timestamp;
      await setLastDrivePushTime(now);
      setLastDrivePush(now);
      setLastDriveSync(now);
      setMessage({ text: 'Backup uploaded to Google Drive.', type: 'success' });
    } catch (err) {
      setMessage({ text: `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'danger' });
    } finally {
      setDriveSyncing(false);
    }
  };

  const handlePullFromDrive = async () => {
    setDriveSyncing(true);
    setMessage(null);
    try {
      const result = await pullFromDrive();
      setLastDriveSync(result.timestamp);
      setMessage({ text: 'Data restored from Google Drive. Reload the app to see updated data.', type: 'success' });
    } catch (err) {
      setMessage({ text: `Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'danger' });
    } finally {
      setDriveSyncing(false);
    }
  };

  // Auto drive push check on mount
  useEffect(() => {
    if (loading || !driveConnected) return;
    (async () => {
      if (isBackupDue(drivePushSchedule, lastDrivePush)) {
        try {
          setDriveSyncing(true);
          const result = await pushToDrive();
          const now = result.timestamp;
          await setLastDrivePushTime(now);
          setLastDrivePush(now);
          setLastDriveSync(now);
          setMessage({ text: 'Scheduled Drive push completed automatically.', type: 'success' });
        } catch {
          setMessage({ text: 'Scheduled Drive push failed.', type: 'danger' });
        } finally {
          setDriveSyncing(false);
        }
      }
    })();
  }, [loading, drivePushSchedule, lastDrivePush, driveConnected]);

  // Auto-backup check on mount
  useEffect(() => {
    if (loading) return;
    (async () => {
      if (isBackupDue(schedule, lastBackup)) {
        try {
          const data = await exportBackup();
          downloadBackupFile(data);
          const now = new Date().toISOString();
          await setLastBackupTime(now);
          setLastBackup(now);
          setMessage({ text: 'Scheduled backup completed automatically.', type: 'success' });
        } catch {
          setMessage({ text: 'Scheduled backup failed.', type: 'danger' });
        }
      }
    })();
  }, [loading, schedule, lastBackup]);

  const handleBackupNow = async () => {
    setBacking(true);
    setMessage(null);
    try {
      const data = await exportBackup();
      downloadBackupFile(data);
      const now = new Date().toISOString();
      await setLastBackupTime(now);
      setLastBackup(now);
      setMessage({ text: 'Backup downloaded successfully.', type: 'success' });
    } catch {
      setMessage({ text: 'Backup failed.', type: 'danger' });
    } finally {
      setBacking(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    setMessage(null);
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);
      if (!data.version || !Array.isArray(data.expenses) || !Array.isArray(data.categories)) {
        throw new Error('Invalid backup file');
      }
      await importBackup(data);
      setMessage({ text: `Restored backup from ${data.createdAt?.slice(0, 10) ?? 'unknown date'}. Reload the app to see updated data.`, type: 'success' });
    } catch {
      setMessage({ text: 'Restore failed. Please check the file is a valid backup.', type: 'danger' });
    } finally {
      setRestoring(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleScheduleChange = async (value: BackupSchedule) => {
    setScheduleState(value);
    await setBackupSchedule(value);
    setMessage({ text: `Backup schedule set to ${value === 'off' ? 'off' : value}.`, type: 'success' });
  };

  if (loading) {
    return (
      <div className="p-5 text-muted">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        Loading...
      </div>
    );
  }

  return (
    <div className="p-3 p-md-5">
      <h2 className="mb-2">Backup</h2>
      <p className="text-muted mb-4 mb-md-5">Back up and restore your expense data</p>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)} />
        </div>
      )}

      <div className="row g-4">
        {/* Backup Now */}
         {/* Google Drive Sync */}
        <div className="col-12">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 87.3 78" className="me-2">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.95 10.3z" fill="#ea4335"/>
                <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h22.6c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <h5 className="mb-0">Google Drive Sync</h5>
            </div>
            <div className="card-body">
              {!driveAvailable ? (
                <div className="text-muted small">
                  <p className="mb-2">
                    To enable Google Drive sync, set <code>VITE_GOOGLE_CLIENT_ID</code> in
                    your <code>.env</code> file with your Google Cloud OAuth 2.0 Client ID.
                  </p>
                  <ol className="small mb-0">
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console → Credentials</a></li>
                    <li>Create an OAuth 2.0 Client ID (Web application)</li>
                    <li>Add your app URL to Authorized JavaScript origins</li>
                    <li>Enable the <strong>Google Drive API</strong> in APIs &amp; Services → Library</li>
                    <li>Create <code>.env</code> in <code>packages/frontend/</code> with:<br/>
                      <code>VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</code>
                    </li>
                  </ol>
                </div>
              ) : !driveConnected ? (
                <>
                  <p className="text-muted small mb-3">
                    Connect your Google account to sync your expense data to Google Drive.
                    Your data is stored as a single JSON file in your Drive.
                  </p>
                  <button className="btn btn-outline-primary" onClick={handleDriveConnect}>
                    <i className="bi bi-google me-2"></i>Connect Google Drive
                  </button>
                </>
              ) : (
                <>
                  <p className="text-muted small mb-3">
                    Connected to Google Drive. Push your local data up or pull the latest backup down.
                  </p>
                  {lastDriveSync && (
                    <p className="small mb-3">
                      <strong>Last sync:</strong> {new Date(lastDriveSync).toLocaleString()}
                    </p>
                  )}
                  {remoteModified && (
                    <p className="small mb-3">
                      <strong>Remote backup:</strong> {new Date(remoteModified).toLocaleString()}
                    </p>
                  )}
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-primary"
                      onClick={handlePushToDrive}
                      disabled={driveSyncing}
                    >
                      {driveSyncing ? (
                        <><span className="spinner-border spinner-border-sm me-2" role="status" />Syncing...</>
                      ) : (
                        <><i className="bi bi-cloud-upload me-2"></i>Push to Drive</>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={handlePullFromDrive}
                      disabled={driveSyncing}
                    >
                      <i className="bi bi-cloud-download me-2"></i>Pull from Drive
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleDriveDisconnect}
                      disabled={driveSyncing}
                    >
                      Disconnect
                    </button>
                  </div>

                  <hr className="my-3" />
                  <h6 className="mb-2">Scheduled Push</h6>
                  <p className="text-muted small mb-3">
                    Automatically push your local data to Google Drive when you open the app and a push is due.
                  </p>
                  <div className="row g-3 align-items-center">
                    <div className="col-auto">
                      <label className="form-label mb-0 small fw-bold">Frequency:</label>
                    </div>
                    <div className="col-12 col-sm-4">
                      <select
                        className="form-select form-select-sm"
                        value={drivePushSchedule}
                        onChange={e => handleDrivePushScheduleChange(e.target.value as BackupSchedule)}
                      >
                        <option value="off">Off</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <span className={`badge ${drivePushSchedule === 'off' ? 'bg-secondary' : 'bg-success'}`}>
                        {drivePushSchedule === 'off' ? 'Scheduled push is disabled' : `Pushing ${drivePushSchedule}`}
                      </span>
                      {lastDrivePush && drivePushSchedule !== 'off' && (
                        <span className="text-muted small ms-2">
                          Last push: {new Date(lastDrivePush).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-12 col-lg-6">
          <div className="card border-0 h-100">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Backup Now</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                Export all your expenses, categories, and settings as a JSON file.
                Save this file to iCloud Drive, Google Drive, or any cloud storage for safekeeping.
              </p>
              {lastBackup && (
                <p className="small mb-3">
                  <strong>Last backup:</strong>{' '}
                  {new Date(lastBackup).toLocaleString()}
                </p>
              )}
              <button
                className="btn btn-primary"
                onClick={handleBackupNow}
                disabled={backing}
              >
                {backing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Backing up...
                  </>
                ) : (
                  'Download Backup'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Restore */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 h-100">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Restore from Backup</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                Import a previously exported backup file. This will <strong>replace</strong> all
                current data with the backup contents.
              </p>
              <div className="mb-3">
                <input
                  ref={fileRef}
                  className="form-control"
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  disabled={restoring}
                />
              </div>
              {restoring && (
                <div className="text-muted small">
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Restoring...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="col-12">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Scheduled Backup</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                When enabled, the app will automatically download a backup file when you
                open the app and a backup is due. Save the downloaded file to iCloud Drive
                or your preferred cloud storage.
              </p>
              <div className="row g-3 align-items-center">
                <div className="col-auto">
                  <label className="form-label mb-0 small fw-bold">Frequency:</label>
                </div>
                <div className="col-12 col-sm-4">
                  <select
                    className="form-select form-select-sm"
                    value={schedule}
                    onChange={e => handleScheduleChange(e.target.value as BackupSchedule)}
                  >
                    <option value="off">Off</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="col-12">
                  <span className={`badge ${schedule === 'off' ? 'bg-secondary' : 'bg-success'}`}>
                    {schedule === 'off' ? 'Scheduled backup is disabled' : `Backing up ${schedule}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
}
