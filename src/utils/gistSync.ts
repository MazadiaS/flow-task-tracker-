/**
 * GitHub Gist Sync - Free cloud backup for single user
 *
 * How it works:
 * 1. User creates a Personal Access Token (PAT) on GitHub with 'gist' scope
 * 2. Data is stored as a private Gist (only you can see it)
 * 3. Sync manually or automatically on changes
 */

import type { AppState } from '../types';
import type { GoalPlan } from '../types/goals';

const GIST_FILENAME = 'flow-task-tracker-backup.json';
const GIST_DESCRIPTION = 'Flow Task Tracker - Backup Data (Auto-generated)';

interface GistFile {
  content: string;
}

interface GistResponse {
  id: string;
  html_url: string;
  files: Record<string, GistFile>;
  updated_at: string;
}

interface BackupData {
  version: number;
  exportedAt: string;
  appState: AppState;
  goalPlans: GoalPlan[];
  flowchartData: string | null;
}

// Storage key for Gist settings
const GIST_SETTINGS_KEY = 'task-tracker-gist-settings';

interface GistSettings {
  token: string;
  gistId: string | null;
  lastSyncAt: string | null;
  autoSync: boolean;
}

export const getGistSettings = (): GistSettings | null => {
  try {
    const settings = localStorage.getItem(GIST_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : null;
  } catch {
    return null;
  }
};

export const saveGistSettings = (settings: GistSettings): void => {
  localStorage.setItem(GIST_SETTINGS_KEY, JSON.stringify(settings));
};

export const clearGistSettings = (): void => {
  localStorage.removeItem(GIST_SETTINGS_KEY);
};

/**
 * Collect all data from localStorage for backup
 */
export const collectBackupData = (): BackupData => {
  // Get main app state
  const appStateRaw = localStorage.getItem('task-tracker-data');
  const appState = appStateRaw ? JSON.parse(appStateRaw) : null;

  // Get all goal plans
  const goalPlans: GoalPlan[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('task-tracker-goal-plan-')) {
      const plan = localStorage.getItem(key);
      if (plan) {
        goalPlans.push(JSON.parse(plan));
      }
    }
  }

  // Get flowchart data
  const flowchartData = localStorage.getItem('task-tracker-flowchart-data');

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    appState,
    goalPlans,
    flowchartData,
  };
};

/**
 * Restore data from backup to localStorage
 */
export const restoreBackupData = (backup: BackupData): void => {
  // Restore main app state
  if (backup.appState) {
    localStorage.setItem('task-tracker-data', JSON.stringify(backup.appState));
  }

  // Restore goal plans
  for (const plan of backup.goalPlans) {
    localStorage.setItem(`task-tracker-goal-plan-${plan.id}`, JSON.stringify(plan));
  }

  // Restore flowchart data
  if (backup.flowchartData) {
    localStorage.setItem('task-tracker-flowchart-data', backup.flowchartData);
  }
};

/**
 * Create a new private Gist with backup data
 */
export const createGist = async (token: string, data: BackupData): Promise<GistResponse> => {
  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false, // Private gist
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create Gist');
  }

  return response.json();
};

/**
 * Update existing Gist with new backup data
 */
export const updateGist = async (token: string, gistId: string, data: BackupData): Promise<GistResponse> => {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update Gist');
  }

  return response.json();
};

/**
 * Fetch backup data from Gist
 */
export const fetchGist = async (token: string, gistId: string): Promise<BackupData> => {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch Gist');
  }

  const gist: GistResponse = await response.json();
  const file = gist.files[GIST_FILENAME];

  if (!file) {
    throw new Error('Backup file not found in Gist');
  }

  return JSON.parse(file.content);
};

/**
 * Verify token is valid
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  // Trim whitespace and hidden characters
  const cleanToken = token.trim();
  console.log('[Token Verify] Token length:', cleanToken.length, 'starts with ghp_:', cleanToken.startsWith('ghp_'));

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Accept': 'application/vnd.github+json',
      },
    });
    console.log('[Token Verify] Response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Token Verify] Failed:', response.status, errorData);
    }
    return response.ok;
  } catch (error) {
    console.error('[Token Verify] Error:', error);
    return false;
  }
};

/**
 * Main sync function - Push local data to Gist
 */
export const syncToGist = async (): Promise<{ success: boolean; message: string; gistUrl?: string }> => {
  const settings = getGistSettings();

  if (!settings?.token) {
    return { success: false, message: 'No GitHub token configured' };
  }

  try {
    const backupData = collectBackupData();

    let gist: GistResponse;
    if (settings.gistId) {
      // Update existing gist
      gist = await updateGist(settings.token, settings.gistId, backupData);
    } else {
      // Create new gist
      gist = await createGist(settings.token, backupData);
      // Save the gist ID for future updates
      saveGistSettings({
        ...settings,
        gistId: gist.id,
        lastSyncAt: new Date().toISOString(),
      });
    }

    // Update last sync time
    saveGistSettings({
      ...settings,
      gistId: gist.id,
      lastSyncAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Synced successfully!',
      gistUrl: gist.html_url,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sync failed',
    };
  }
};

/**
 * Pull data from Gist to local storage
 */
export const syncFromGist = async (): Promise<{ success: boolean; message: string }> => {
  const settings = getGistSettings();

  if (!settings?.token || !settings?.gistId) {
    return { success: false, message: 'No GitHub sync configured' };
  }

  try {
    const backupData = await fetchGist(settings.token, settings.gistId);
    restoreBackupData(backupData);

    saveGistSettings({
      ...settings,
      lastSyncAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Restored from backup (${new Date(backupData.exportedAt).toLocaleString()})`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Restore failed',
    };
  }
};

/**
 * Export data as downloadable JSON file (manual backup)
 */
export const exportToFile = (): void => {
  const data = collectBackupData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flow-task-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Import data from JSON file (manual restore)
 */
export const importFromFile = (file: File): Promise<{ success: boolean; message: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        if (!data.version || !data.appState) {
          throw new Error('Invalid backup file format');
        }
        restoreBackupData(data);
        resolve({
          success: true,
          message: `Imported backup from ${new Date(data.exportedAt).toLocaleString()}`,
        });
      } catch (error) {
        resolve({
          success: false,
          message: error instanceof Error ? error.message : 'Import failed',
        });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, message: 'Failed to read file' });
    };
    reader.readAsText(file);
  });
};

// ============ AUTO-SYNC ============

const AUTO_SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes
const AUTO_SYNC_DEBOUNCE = 10 * 1000; // 10 seconds after last change

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;
let autoSyncInterval: ReturnType<typeof setInterval> | null = null;
let lastDataHash: string | null = null;

/**
 * Generate a simple hash of the current data to detect changes
 */
const getDataHash = (): string => {
  const data = collectBackupData();
  return JSON.stringify({
    appState: data.appState,
    goalPlans: data.goalPlans,
    flowchartData: data.flowchartData,
  });
};

/**
 * Check if auto-sync is enabled
 */
export const isAutoSyncEnabled = (): boolean => {
  const settings = getGistSettings();
  return !!(settings?.token && settings?.autoSync);
};

/**
 * Enable auto-sync
 */
export const enableAutoSync = (): void => {
  const settings = getGistSettings();
  if (settings) {
    saveGistSettings({ ...settings, autoSync: true });
    startAutoSync();
  }
};

/**
 * Disable auto-sync
 */
export const disableAutoSync = (): void => {
  const settings = getGistSettings();
  if (settings) {
    saveGistSettings({ ...settings, autoSync: false });
    stopAutoSync();
  }
};

/**
 * Debounced sync - called when data changes
 */
export const triggerAutoSync = (): void => {
  if (!isAutoSyncEnabled()) return;

  // Clear existing timer
  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
  }

  // Set new timer - sync after 10 seconds of no changes
  autoSyncTimer = setTimeout(async () => {
    const currentHash = getDataHash();
    if (currentHash !== lastDataHash) {
      lastDataHash = currentHash;
      const result = await syncToGist();
      if (import.meta.env.DEV) {
        console.log('[Auto-sync]', result.message);
      }
    }
  }, AUTO_SYNC_DEBOUNCE);
};

/**
 * Start the auto-sync interval
 */
export const startAutoSync = (): void => {
  if (!isAutoSyncEnabled()) return;

  // Stop existing interval if any
  stopAutoSync();

  // Initialize hash
  lastDataHash = getDataHash();

  // Sync every 2 minutes as a safety net
  autoSyncInterval = setInterval(async () => {
    if (!isAutoSyncEnabled()) {
      stopAutoSync();
      return;
    }

    const currentHash = getDataHash();
    if (currentHash !== lastDataHash) {
      lastDataHash = currentHash;
      const result = await syncToGist();
      if (import.meta.env.DEV) {
        console.log('[Auto-sync interval]', result.message);
      }
    }
  }, AUTO_SYNC_INTERVAL);

  if (import.meta.env.DEV) {
    console.log('[Auto-sync] Started');
  }
};

/**
 * Stop the auto-sync interval
 */
export const stopAutoSync = (): void => {
  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
    autoSyncTimer = null;
  }
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
  if (import.meta.env.DEV) {
    console.log('[Auto-sync] Stopped');
  }
};

/**
 * Initialize auto-sync on app load
 */
export const initAutoSync = (): void => {
  if (isAutoSyncEnabled()) {
    startAutoSync();
  }
};
