import type { Task, DayArchive, Recommendation } from '../types';
import { calculateTaskStreakFromArchive } from './streakCalculations';

export const generateRecommendations = (
  taskLibrary: Task[],
  archive: DayArchive[],
  dismissedIds: string[],
  todayTasks: Task[] = []
): Recommendation[] => {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentArchives = archive.filter(a => a.dateTimestamp >= sevenDaysAgo);

  // OPTIMIZATION: Pre-build Maps to avoid O(n²) complexity
  // Build task occurrence map: taskId -> { count, lastTimestamp, archives }
  const taskOccurrenceMap = new Map<string, { count: number; lastTimestamp: number; archives: DayArchive[] }>();

  recentArchives.forEach(dayArchive => {
    dayArchive.tasks.forEach(archivedTask => {
      const existing = taskOccurrenceMap.get(archivedTask.taskId);
      if (existing) {
        existing.count++;
        existing.lastTimestamp = Math.max(existing.lastTimestamp, dayArchive.dateTimestamp);
        existing.archives.push(dayArchive);
      } else {
        taskOccurrenceMap.set(archivedTask.taskId, {
          count: 1,
          lastTimestamp: dayArchive.dateTimestamp,
          archives: [dayArchive]
        });
      }
    });
  });

  // Pre-build Sets for fast lookups
  const dismissedSet = new Set(dismissedIds);
  const todayTasksSet = new Set(todayTasks.map(t => t.id));
  const seenTaskIds = new Set<string>();

  const recommendations: Recommendation[] = [];

  taskLibrary.forEach(task => {
    // Skip dismissed tasks
    if (dismissedSet.has(task.id)) return;

    // Skip tasks already in today's list
    if (todayTasksSet.has(task.id)) return;

    // Skip if we've already added this task (prevent duplicates)
    if (seenTaskIds.has(task.id)) return;
    seenTaskIds.add(task.id);

    // Use pre-built map instead of filtering archives multiple times
    const occurrence = taskOccurrenceMap.get(task.id);
    if (!occurrence) return;

    const frequency = occurrence.count;
    const lastTimestamp = occurrence.lastTimestamp;

    const daysSinceLastDone = Math.floor(
      (now - lastTimestamp) / (24 * 60 * 60 * 1000)
    );

    let lastDoneText = '';
    if (daysSinceLastDone === 0) lastDoneText = 'Today';
    else if (daysSinceLastDone === 1) lastDoneText = 'Yesterday';
    else lastDoneText = `${daysSinceLastDone} days ago`;

    const frequencyText = `Done ${frequency}/7 days this week`;

    // Calculate streak for completion tasks
    let streak = 0;
    if (task.type === 'completion') {
      streak = calculateTaskStreakFromArchive(task.id, archive);
    }

    // Calculate score (higher = more recommended)
    // Factors: frequency (40%), recency (40%), streak (20%)
    const frequencyScore = (frequency / 7) * 40;
    const recencyScore = ((7 - daysSinceLastDone) / 7) * 40;
    const streakScore = task.type === 'completion' ? (streak / 7) * 20 : 0;
    const score = frequencyScore + recencyScore + streakScore;

    recommendations.push({
      task,
      frequency: frequencyText,
      lastDone: lastDoneText,
      streak: task.type === 'completion' ? streak : undefined,
      score
    });
  });

  // Sort by score (highest first)
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
};
