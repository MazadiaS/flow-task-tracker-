import { useState, useCallback, useRef, memo } from 'react';
import {
  getGistSettings,
  saveGistSettings,
  clearGistSettings,
  syncToGist,
  syncFromGist,
  exportToFile,
  importFromFile,
  verifyToken,
  isAutoSyncEnabled,
  enableAutoSync,
  disableAutoSync,
} from '../../utils/gistSync';
import './BackupSettings.css';

interface Props {
  onBack: () => void;
  onDataRestored: () => void;
}

function BackupSettings({ onBack, onDataRestored }: Props) {
  const [token, setToken] = useState(() => getGistSettings()?.token || '');
  const [isConfigured, setIsConfigured] = useState(() => !!getGistSettings()?.token);
  const [lastSync, setLastSync] = useState(() => getGistSettings()?.lastSyncAt || null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(() => isAutoSyncEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveToken = useCallback(async () => {
    if (!token.trim()) {
      setStatus({ type: 'error', message: 'Please enter a token' });
      return;
    }

    setIsSyncing(true);
    setStatus({ type: 'info', message: 'Verifying token...' });

    const isValid = await verifyToken(token);
    if (!isValid) {
      setStatus({ type: 'error', message: 'Invalid token. Make sure it has "gist" scope.' });
      setIsSyncing(false);
      return;
    }

    saveGistSettings({
      token,
      gistId: getGistSettings()?.gistId || null,
      lastSyncAt: getGistSettings()?.lastSyncAt || null,
      autoSync: false,
    });

    setIsConfigured(true);
    setStatus({ type: 'success', message: 'Token saved! You can now sync your data.' });
    setIsSyncing(false);
  }, [token]);

  const handleDisconnect = useCallback(() => {
    if (confirm('Disconnect from GitHub? Your local data will be kept.')) {
      clearGistSettings();
      setToken('');
      setIsConfigured(false);
      setLastSync(null);
      setAutoSync(false);
      setStatus({ type: 'info', message: 'Disconnected from GitHub' });
    }
  }, []);

  const handleToggleAutoSync = useCallback(() => {
    if (autoSync) {
      disableAutoSync();
      setAutoSync(false);
      setStatus({ type: 'info', message: 'Auto-sync disabled' });
    } else {
      enableAutoSync();
      setAutoSync(true);
      setStatus({ type: 'success', message: 'Auto-sync enabled! Your data will sync automatically.' });
    }
  }, [autoSync]);

  const handlePushToCloud = useCallback(async () => {
    setIsSyncing(true);
    setStatus({ type: 'info', message: 'Uploading to GitHub...' });

    const result = await syncToGist();

    if (result.success) {
      setLastSync(new Date().toISOString());
      setStatus({ type: 'success', message: result.message });
    } else {
      setStatus({ type: 'error', message: result.message });
    }

    setIsSyncing(false);
  }, []);

  const handlePullFromCloud = useCallback(async () => {
    if (!confirm('This will replace your local data with the cloud backup. Continue?')) {
      return;
    }

    setIsSyncing(true);
    setStatus({ type: 'info', message: 'Downloading from GitHub...' });

    const result = await syncFromGist();

    if (result.success) {
      setLastSync(new Date().toISOString());
      setStatus({ type: 'success', message: result.message + ' - Reloading...' });
      setTimeout(() => {
        onDataRestored();
      }, 1000);
    } else {
      setStatus({ type: 'error', message: result.message });
    }

    setIsSyncing(false);
  }, [onDataRestored]);

  const handleExportFile = useCallback(() => {
    exportToFile();
    setStatus({ type: 'success', message: 'Backup file downloaded!' });
  }, []);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('This will replace your local data with the imported file. Continue?')) {
      e.target.value = '';
      return;
    }

    const result = await importFromFile(file);

    if (result.success) {
      setStatus({ type: 'success', message: result.message + ' - Reloading...' });
      setTimeout(() => {
        onDataRestored();
      }, 1000);
    } else {
      setStatus({ type: 'error', message: result.message });
    }

    e.target.value = '';
  }, [onDataRestored]);

  return (
    <div className="backup-settings">
      <div className="backup-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back
        </button>
        <h1>Backup & Sync</h1>
      </div>

      <div className="backup-content">
        {/* Status Message */}
        {status && (
          <div className={`status-message status-${status.type}`}>
            {status.message}
          </div>
        )}

        {/* GitHub Gist Section */}
        <section className="backup-section">
          <h2>GitHub Cloud Sync</h2>
          <p className="section-description">
            Sync your data to a private GitHub Gist. Free, secure, and accessible from anywhere.
          </p>

          {!isConfigured ? (
            <div className="setup-form">
              <div className="setup-instructions">
                <h3>Setup Instructions:</h3>
                <ol>
                  <li>Go to <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer">GitHub Token Settings</a></li>
                  <li>Click "Generate new token (classic)"</li>
                  <li>Name it "Flow Task Tracker"</li>
                  <li>Select only the <strong>"gist"</strong> scope</li>
                  <li>Click "Generate token" and copy it</li>
                </ol>
              </div>

              <div className="token-input-group">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your GitHub token here"
                  className="token-input"
                />
                <button
                  onClick={handleSaveToken}
                  disabled={isSyncing}
                  className="btn btn-primary"
                >
                  {isSyncing ? 'Verifying...' : 'Connect'}
                </button>
              </div>
            </div>
          ) : (
            <div className="sync-controls">
              <div className="sync-status">
                <span className="connected-badge">Connected to GitHub</span>
                {lastSync && (
                  <span className="last-sync">
                    Last sync: {new Date(lastSync).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="auto-sync-toggle">
                <label className="toggle-label">
                  <span>Auto-sync</span>
                  <span className="toggle-description">
                    Automatically sync when you make changes
                  </span>
                </label>
                <button
                  onClick={handleToggleAutoSync}
                  className={`toggle-switch ${autoSync ? 'active' : ''}`}
                  aria-pressed={autoSync}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              <div className="sync-buttons">
                <button
                  onClick={handlePushToCloud}
                  disabled={isSyncing}
                  className="btn btn-sync btn-push"
                >
                  {isSyncing ? 'Syncing...' : 'Push to Cloud'}
                </button>
                <button
                  onClick={handlePullFromCloud}
                  disabled={isSyncing}
                  className="btn btn-sync btn-pull"
                >
                  {isSyncing ? 'Syncing...' : 'Pull from Cloud'}
                </button>
              </div>

              <button
                onClick={handleDisconnect}
                className="btn btn-disconnect"
              >
                Disconnect
              </button>
            </div>
          )}
        </section>

        {/* Manual Backup Section */}
        <section className="backup-section">
          <h2>Manual Backup</h2>
          <p className="section-description">
            Export your data as a JSON file or import from a previous backup.
          </p>

          <div className="manual-backup-buttons">
            <button onClick={handleExportFile} className="btn btn-export-file">
              Export to File
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-import-file"
            >
              Import from File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </div>
        </section>

        {/* Info Section */}
        <section className="backup-section backup-info">
          <h2>About Your Data</h2>
          <ul>
            <li>Your data is stored locally in your browser</li>
            <li>GitHub sync creates a <strong>private</strong> Gist only you can see</li>
            <li>Your GitHub token is stored locally, never sent to any server</li>
            <li>Exported files contain all tasks, goals, and flowcharts</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default memo(BackupSettings);
