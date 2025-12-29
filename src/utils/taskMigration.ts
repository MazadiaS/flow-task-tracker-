import type { Task } from '../types';

/**
 * Migrates old task format to new format with all required fields
 */
export function migrateTask(task: any, orderIndex: number = 0): Task {
  const now = Date.now();

  return {
    // Existing fields
    id: task.id || `task-${now}`,
    name: task.name || 'Unnamed Task',
    type: task.type || 'duration',
    icon: task.icon,
    target: task.target,
    notes: task.notes || '',
    sessions: task.sessions || [],
    countLogs: task.countLogs || [],
    completions: task.completions || [],
    parentId: task.parentId,
    subtasks: task.subtasks?.map((st: any, idx: number) => migrateTask(st, idx)) || [],
    isCollapsed: task.isCollapsed || false,

    // New fields with defaults
    priority: task.priority || 'medium',
    importance: task.importance || 5,
    order: task.order !== undefined ? task.order : orderIndex,
    estimatedTime: task.estimatedTime,
    scheduledFor: task.scheduledFor,
    isRecurring: task.isRecurring || false,
    recurrence: task.recurrence,
    media: task.media || [],
    createdAt: task.createdAt || now,
    homework: task.homework,

    // Goal linking fields (Phase 1)
    linkedGoalId: task.linkedGoalId,
    goalContext: task.goalContext
  };
}

/**
 * Migrates an array of tasks
 */
export function migrateTasks(tasks: any[]): Task[] {
  return tasks.map((task, index) => migrateTask(task, index));
}
