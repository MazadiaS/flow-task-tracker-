// Performance and timing constants
export const DEBOUNCE_DELAY_MS = 500;
export const TIMER_INTERVAL_MS = 1000;
export const FADE_OUT_DELAY_MS = 300;
export const API_TIMEOUT_MS = 30000;

// UI constants
export const MAX_NOTES_LENGTH = 5000;
export const MAX_TASK_NAME_LENGTH = 200;
export const MAX_SUBTASK_DEPTH = 5;

// Storage constants
export const STORAGE_KEY_PREFIX = 'task-tracker';
export const GOAL_PLAN_STORAGE_PREFIX = 'task-tracker-goal-plan';

// Goal visualization constants
export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 120;
export const HORIZONTAL_SPACING = 100;
export const VERTICAL_SPACING = 80;

// Color schemes
export const LEVEL_COLORS = {
  year: '#667eea',
  quarter: '#f093fb',
  month: '#4facfe',
  week: '#43e97b',
  day: '#fa709a',
} as const;

export const STATUS_COLORS = {
  completed: '#10b981',
  'in-progress': '#3b82f6',
  'not-started': '#6b7280',
  abandoned: '#ef4444',
} as const;

export const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
} as const;

// Cache expiration
export const FONT_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year
