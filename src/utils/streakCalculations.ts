import type { Task, DayArchive } from '../types';

/**
 * Centralized streak calculation for completion tasks
 * Calculates consecutive days from today going backwards
 *
 * @param task - The task to calculate streak for
 * @returns Number of consecutive days the task was completed
 */
export function calculateTaskStreak(task: Task): number {
  if ((task.type !== 'completion' && task.type !== 'homework') || !task.completions) return 0;

  const sortedCompletions = [...task.completions]
    .filter(c => c.completed)
    .sort((a, b) => b.date - a.date);

  if (sortedCompletions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedCompletions.length; i++) {
    const completionDate = new Date(sortedCompletions[i].date);
    completionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate streak for a specific task ID from archive data
 * Used for recommendation system
 *
 * @param taskId - The task ID to calculate streak for
 * @param archive - Historical archive data
 * @returns Number of consecutive days the task appears in archive
 */
export function calculateTaskStreakFromArchive(taskId: string, archive: DayArchive[]): number {
  const sortedArchives = [...archive]
    .filter(a => a.tasks.some(t => t.taskId === taskId && t.completed))
    .sort((a, b) => b.dateTimestamp - a.dateTimestamp);

  if (sortedArchives.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedArchives.length; i++) {
    const archiveDate = new Date(sortedArchives[i].dateTimestamp);
    archiveDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (archiveDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
