import type { Task } from '../types';
import { isToday } from './timeUtils';
import { calculateTaskStreak } from './streakCalculations';

/**
 * Calculate total duration for a task in seconds
 */
export function calculateTotalDuration(task: Task): number {
  if (task.type !== 'duration' || !task.sessions) return 0;
  return task.sessions.reduce((total, session) => total + session.duration, 0);
}

/**
 * Calculate today's duration for a task in seconds
 */
export function calculateTodayDuration(task: Task): number {
  if (task.type !== 'duration' || !task.sessions) return 0;
  return task.sessions
    .filter(session => isToday(session.date))
    .reduce((total, session) => total + session.duration, 0);
}

/**
 * Calculate total count for a task
 */
export function calculateTotalCount(task: Task): number {
  if (task.type !== 'count' || !task.countLogs) return 0;
  return task.countLogs.reduce((total, log) => total + log.count, 0);
}

/**
 * Calculate today's count for a task
 */
export function calculateTodayCount(task: Task): number {
  if (task.type !== 'count' || !task.countLogs) return 0;
  return task.countLogs
    .filter(log => isToday(log.date))
    .reduce((total, log) => total + log.count, 0);
}

/**
 * Get today's completion status for a task
 */
export function getTodayCompletion(task: Task): boolean {
  if ((task.type !== 'completion' && task.type !== 'homework') || !task.completions) return false;
  return task.completions.some(c => isToday(c.date) && c.completed);
}

/**
 * Calculate streak for a completion task
 * Re-exported from streakCalculations for convenience
 */
export function calculateStreak(task: Task): number {
  return calculateTaskStreak(task);
}

/**
 * Get task icon based on type
 */
export function getTaskIcon(type: Task['type']): string {
  switch (type) {
    case 'duration':
      return '⏱️';
    case 'count':
      return '💪';
    case 'completion':
      return '☑️';
    case 'homework':
      return '📚';
    default:
      return '📝';
  }
}
