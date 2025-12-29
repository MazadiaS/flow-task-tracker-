import type { AppState, Task, DayArchive } from '../types';
import { migrateTasks } from './taskMigration';
import { getTodayDateString } from './timeUtils';
import { validateAppState } from './validation';
import { safeLocalStorageSet } from './security';
import { STORAGE_KEY_PREFIX } from '../constants';

const STORAGE_KEY = `${STORAGE_KEY_PREFIX}-data`;
const MAX_ARCHIVE_ENTRIES = 365; // Keep max 1 year of archives

// Trim old archive entries to prevent localStorage from growing too large
const trimArchive = (archive: DayArchive[]): DayArchive[] => {
  if (archive.length <= MAX_ARCHIVE_ENTRIES) {
    return archive;
  }
  // Keep the most recent entries
  return archive.slice(-MAX_ARCHIVE_ENTRIES);
};

export const loadState = (): AppState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }

    const parsedState = JSON.parse(serializedState);

    // Validate data to prevent corrupted/malicious data from breaking the app
    const validatedState = validateAppState(parsedState);

    if (!validatedState) {
      console.warn('State validation failed - data may be corrupted. Using fallback.');
      // Don't delete the data - just return null and let getInitialState create fresh state
      // This allows manual recovery if needed
      return null;
    }

    return validatedState;
  } catch (err) {
    console.error('Error loading state:', err);
    return null;
  }
};

export const saveState = (state: AppState): void => {
  try {
    // Trim archive to prevent localStorage from growing too large
    const trimmedState: AppState = {
      ...state,
      archive: trimArchive(state.archive),
    };

    const serializedState = JSON.stringify(trimmedState);
    const success = safeLocalStorageSet(STORAGE_KEY, serializedState);

    if (!success) {
      console.error('Failed to save state - localStorage quota exceeded or unavailable');
      // Could notify user here
    }
  } catch (err) {
    console.error('Error saving state:', err);
  }
};

export const getDefaultTasks = (): Task[] => {
  const now = Date.now();
  return [
    {
      id: '1',
      name: 'Typing Practice (30 min)',
      type: 'duration',
      priority: 'medium',
      importance: 5,
      order: 0,
      target: { value: 30, unit: 'minutes' },
      notes: '',
      sessions: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now
    },
    {
      id: '2',
      name: 'Learning Database',
      type: 'duration',
      priority: 'high',
      importance: 8,
      order: 1,
      target: { value: 60, unit: 'minutes' },
      notes: '',
      sessions: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now
    },
    {
      id: '3',
      name: 'Learning Algorithms',
      type: 'duration',
      priority: 'high',
      importance: 8,
      order: 2,
      target: { value: 60, unit: 'minutes' },
      notes: '',
      sessions: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now
    },
    {
      id: '4',
      name: 'Learning Servers',
      type: 'duration',
      priority: 'high',
      importance: 8,
      order: 3,
      target: { value: 60, unit: 'minutes' },
      notes: '',
      sessions: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now
    },
    {
      id: '5',
      name: 'GitHub Green Square',
      type: 'completion',
      priority: 'medium',
      importance: 6,
      order: 4,
      target: { value: 1, unit: 'times' },
      notes: '',
      completions: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now
    },
    {
      id: '6',
      name: 'Speaking Practice (20-30 min)',
      type: 'duration',
      priority: 'medium',
      importance: 6,
      order: 5,
      target: { value: 25, unit: 'minutes' },
      notes: '',
      sessions: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now
    },
    {
      id: '7',
      name: '50 Push-ups',
      type: 'count',
      priority: 'low',
      importance: 4,
      order: 6,
      target: { value: 50, unit: 'reps' },
      notes: '',
      countLogs: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now
    },
    {
      id: '8',
      name: 'Doing Nothing (10 min)',
      type: 'duration',
      priority: 'low',
      importance: 3,
      order: 7,
      target: { value: 10, unit: 'minutes' },
      notes: '',
      sessions: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now
    }
  ];
};

export const getInitialState = (): AppState => {
  const savedState = loadState();
  if (savedState) {
    // Migrate old state if necessary
    if (!savedState.currentDay) {
      const oldTasks = (savedState as any).tasks || [];
      return {
        currentDay: {
          date: getTodayDateString(),
          isActive: false,
          tasks: migrateTasks(oldTasks),
          dismissedRecommendations: []
        },
        taskLibrary: getDefaultTasks(),
        archive: [],
        activeDaySession: savedState.activeDaySession,
        activeTaskTimer: savedState.activeTaskTimer,
        activeGoalPlan: savedState.activeGoalPlan,
        goalPlanIndex: []
      };
    }

    // Migrate tasks in current state and add goal fields if missing
    const migratedState = {
      ...savedState,
      currentDay: {
        ...savedState.currentDay,
        tasks: migrateTasks(savedState.currentDay.tasks)
      },
      taskLibrary: migrateTasks(savedState.taskLibrary),
      activeGoalPlan: savedState.activeGoalPlan,
      goalPlanIndex: savedState.goalPlanIndex || []
    };

    return migratedState;
  }
  return {
    currentDay: {
      date: getTodayDateString(),
      isActive: false,
      tasks: [],
      dismissedRecommendations: []
    },
    taskLibrary: getDefaultTasks(),
    archive: [],
    activeDaySession: undefined,
    activeTaskTimer: undefined,
    activeGoalPlan: undefined,
    goalPlanIndex: []
  };
};
