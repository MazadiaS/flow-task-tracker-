import type { Goal, GoalPlan } from '../types/goals';
import type { DayArchive, Task } from '../types';
import {
  calculateActualProgress as calcProgress,
  calculateExpectedProgress as calcExpected
} from './goalCalculations';

/**
 * Calculate actual progress for a goal based on completed tasks
 * Re-exported from goalCalculations for convenience
 */
export const calculateActualProgress = (
  goal: Goal,
  plan: GoalPlan,
  archive: DayArchive[],
  currentTasks?: Task[]
): number => {
  return calcProgress(goal.id, plan, archive, currentTasks);
};

/**
 * Calculate expected progress based on time elapsed
 * Re-exported from goalCalculations for convenience
 */
export const calculateExpectedProgress = (goal: Goal): number => {
  return calcExpected(goal);
};

/**
 * Get progress status message
 */
export const getProgressStatus = (
  actual: number,
  expected: number
): { status: 'ahead' | 'on-track' | 'behind'; message: string; color: string } => {
  const difference = actual - expected;

  if (difference >= 10) {
    return {
      status: 'ahead',
      message: `${Math.abs(difference)}% ahead of schedule`,
      color: '#10b981'
    };
  } else if (difference <= -10) {
    return {
      status: 'behind',
      message: `${Math.abs(difference)}% behind schedule`,
      color: '#ef4444'
    };
  } else {
    return {
      status: 'on-track',
      message: 'On track',
      color: '#3b82f6'
    };
  }
};

/**
 * Generate insights about goal progress
 */
export const generateGoalInsights = (
  goal: Goal,
  plan: GoalPlan,
  archive: DayArchive[]
): string[] => {
  const insights: string[] = [];
  const actual = calculateActualProgress(goal, plan, archive);
  const expected = calculateExpectedProgress(goal);
  const { status } = getProgressStatus(actual, expected);

  // Progress insights
  if (status === 'ahead') {
    insights.push(`Great progress! You're ahead of schedule.`);
    if (goal.childIds.length > 0) {
      insights.push(`Consider starting work on the next milestone.`);
    }
  } else if (status === 'behind') {
    insights.push(`You're falling behind. Consider adjusting your plan.`);
    insights.push(`Focus on high-priority tasks to catch up.`);
  } else {
    insights.push(`You're right on track. Keep up the good work!`);
  }

  // Time insights
  const daysLeft = Math.ceil(
    (new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft > 0 && daysLeft <= 7) {
    insights.push(`Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining!`);
  }

  // Completion insights
  if (actual === 100) {
    insights.push(`🎉 Goal completed! Excellent work!`);
  } else if (actual === 0 && expected > 20) {
    insights.push(`Time to get started on this goal.`);
  }

  return insights;
};

/**
 * Get goal path (e.g., "Year Goal > Q1 > January > Week 1")
 * Wrapper that accepts Goal object and converts to goalId
 */
import { getGoalPathString } from './goalCalculations';

export const getGoalPath = (goal: Goal, plan: GoalPlan): string => {
  return getGoalPathString(goal.id, plan);
};

/**
 * Calculate task completion streak (consecutive days with completed tasks)
 * Used for goal progress tracking
 */
export const calculateStreak = (archive: DayArchive[]): number => {
  if (archive.length === 0) return 0;

  // Sort by date descending (most recent first)
  const sorted = [...archive].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = today;

  for (const day of sorted) {
    if (day.date !== currentDate) {
      // Check if there's a gap
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (day.date !== expectedDateStr) {
        break; // Streak broken
      }
    }

    // Check if this day has completed tasks
    const hasCompletedTasks = day.tasks.some(t => t.completed);
    if (hasCompletedTasks) {
      streak++;
      currentDate = day.date;
    } else {
      break; // Streak broken
    }
  }

  return streak;
};

/**
 * Get goals that need attention (behind schedule or ending soon)
 */
export const getGoalsNeedingAttention = (
  plan: GoalPlan,
  archive: DayArchive[],
  currentTasks?: Task[]
): Goal[] => {
  const now = Date.now();
  const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

  return plan.goals.filter(goal => {
    const endDate = new Date(goal.endDate).getTime();
    const isSoon = endDate <= sevenDaysFromNow && endDate >= now;

    const actual = calculateActualProgress(goal, plan, archive, currentTasks);
    const expected = calculateExpectedProgress(goal);
    const isBehind = expected - actual >= 10;

    return (isSoon || isBehind) && goal.status !== 'completed';
  });
};
