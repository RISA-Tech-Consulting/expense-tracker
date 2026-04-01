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
  type BackupData,
  type BackupSchedule,
} from '../api';

export default function Backup() {
  const [schedule, setScheduleState] = useState<BackupSchedule>('off');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [sched, last] = await Promise.all([getBackupSchedule(), getLastBackupTime()]);
    setScheduleState(sched);
    setLastBackup(last);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
