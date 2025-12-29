import type { GoalLevel } from '../types/goals';

/**
 * Centralized color constants for goal levels
 * Used across all goal visualization components
 */
export const GOAL_LEVEL_COLORS: Record<GoalLevel, string> = {
  year: '#8b5cf6',
  quarter: '#667eea',
  month: '#3b82f6',
  week: '#06b6d4',
  day: '#10b981'
};

/**
 * Color constants for goal status
 */
export const GOAL_STATUS_COLORS = {
  completed: '#10b981',
  'in-progress': '#667eea',
  abandoned: '#ef4444',
  'not-started': '#6b7280'
} as const;

/**
 * Node sizes for mind map visualization
 */
export const GOAL_NODE_SIZES: Record<GoalLevel, number> = {
  year: 80,
  quarter: 60,
  month: 50,
  week: 40,
  day: 30
};

/**
 * Radius values for mind map visualization
 */
export const GOAL_LEVEL_RADIUS: Record<GoalLevel, number> = {
  year: 0,
  quarter: 150,
  month: 280,
  week: 410,
  day: 540
};

/**
 * Get color for a goal level
 */
export const getLevelColor = (level: string): string => {
  return GOAL_LEVEL_COLORS[level as GoalLevel] || '#6b7280';
};

/**
 * Get color for a goal status
 */
export const getStatusColor = (status: string): string => {
  return GOAL_STATUS_COLORS[status as keyof typeof GOAL_STATUS_COLORS] || '#6b7280';
};
