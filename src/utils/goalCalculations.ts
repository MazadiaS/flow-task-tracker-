import type { Goal, GoalPlan, GoalLevel, GoalNode } from '../types/goals';
import type { DayArchive, Task } from '../types';
import { getLocalDateString } from './timeUtils';

/**
 * Get all direct children of a goal
 */
export const getGoalChildren = (goalId: string, plan: GoalPlan): Goal[] => {
  const goal = plan.goals.find(g => g.id === goalId);
  if (!goal) {
    return [];
  }

  return plan.goals.filter(g => goal.childIds.includes(g.id));
};

/**
 * Get all ancestors of a goal (parent, grandparent, etc.)
 * Returns array from immediate parent to root
 */
export const getGoalAncestors = (goalId: string, plan: GoalPlan): Goal[] => {
  const ancestors: Goal[] = [];
  let currentGoal = plan.goals.find(g => g.id === goalId);

  while (currentGoal?.parentId) {
    const parent = plan.goals.find(g => g.id === currentGoal!.parentId);
    if (parent) {
      ancestors.push(parent);
      currentGoal = parent;
    } else {
      break;
    }
  }

  return ancestors;
};

/**
 * Get all descendant goal IDs (children, grandchildren, etc.)
 */
export const getAllDescendantIds = (goalId: string, plan: GoalPlan): string[] => {
  const descendantIds: string[] = [];
  const goal = plan.goals.find(g => g.id === goalId);

  if (!goal) {
    return descendantIds;
  }

  const processChildren = (parentGoal: Goal) => {
    parentGoal.childIds.forEach(childId => {
      descendantIds.push(childId);
      const childGoal = plan.goals.find(g => g.id === childId);
      if (childGoal) {
        processChildren(childGoal);
      }
    });
  };

  processChildren(goal);
  return descendantIds;
};

/**
 * Get all goals at a specific level
 */
export const getGoalsByLevel = (level: GoalLevel, plan: GoalPlan): Goal[] => {
  return plan.goals.filter(g => g.level === level);
};

/**
 * Get goals for the current week
 * Returns week-level goals that include today's date
 */
export const getCurrentWeekGoals = (plan: GoalPlan): Goal[] => {
  const todayStr = getLocalDateString();

  return plan.goals.filter(g => {
    if (g.level !== 'week') return false;
    return todayStr >= g.startDate && todayStr <= g.endDate;
  });
};

/**
 * Get goals for the current month
 */
export const getCurrentMonthGoals = (plan: GoalPlan): Goal[] => {
  const todayStr = getLocalDateString();

  return plan.goals.filter(g => {
    if (g.level !== 'month') return false;
    return todayStr >= g.startDate && todayStr <= g.endDate;
  });
};

/**
 * Get goals for the current quarter
 */
export const getCurrentQuarterGoals = (plan: GoalPlan): Goal[] => {
  const todayStr = getLocalDateString();

  return plan.goals.filter(g => {
    if (g.level !== 'quarter') return false;
    return todayStr >= g.startDate && todayStr <= g.endDate;
  });
};

/**
 * Calculate actual progress for a goal based on completed tasks
 * @param goalId - The goal ID to calculate progress for
 * @param plan - The goal plan containing all goals
 * @param archive - Historical archived days
 * @param currentTasks - Optional current day tasks (not yet archived)
 */
export const calculateActualProgress = (
  goalId: string,
  plan: GoalPlan,
  archive: DayArchive[],
  currentTasks?: Task[]
): number => {
  const goal = plan.goals.find(g => g.id === goalId);
  if (!goal) return 0;

  // Get all descendant goal IDs (including the goal itself)
  const descendantIds = new Set([goalId, ...getAllDescendantIds(goalId, plan)]);

  // Count tasks linked to this goal or its descendants
  let totalTasks = 0;
  let completedTasks = 0;

  // Count archived tasks
  archive.forEach(day => {
    day.tasks.forEach(task => {
      if (task.linkedGoalId && descendantIds.has(task.linkedGoalId)) {
        totalTasks++;
        if (task.completed) {
          completedTasks++;
        }
      }
    });
  });

  // Count current day tasks (if provided)
  if (currentTasks) {
    currentTasks.forEach(task => {
      if (task.linkedGoalId && descendantIds.has(task.linkedGoalId)) {
        totalTasks++;

        // Check if task is completed based on type
        if (task.type === 'duration' && task.sessions && task.target) {
          const totalMinutes = Math.floor(task.sessions.reduce((sum, s) => sum + s.duration, 0) / 60);
          if (totalMinutes >= task.target.value) {
            completedTasks++;
          }
        } else if (task.type === 'count' && task.countLogs && task.target) {
          const totalCount = task.countLogs.reduce((sum, l) => sum + l.count, 0);
          if (totalCount >= task.target.value) {
            completedTasks++;
          }
        } else if (task.type === 'completion' && task.completions) {
          const todayCompletion = task.completions.find(c => {
            const cDate = getLocalDateString(c.date);
            const today = getLocalDateString();
            return cDate === today && c.completed;
          });
          if (todayCompletion) {
            completedTasks++;
          }
        }
      }
    });
  }

  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
};

/**
 * Calculate expected progress based on time elapsed
 * Returns percentage 0-100
 */
export const calculateExpectedProgress = (goal: Goal): number => {
  const start = new Date(goal.startDate).getTime();
  const end = new Date(goal.endDate).getTime();
  const now = Date.now();

  if (now < start) return 0;
  if (now > end) return 100;

  const totalDuration = end - start;
  const elapsed = now - start;

  return Math.round((elapsed / totalDuration) * 100);
};

/**
 * Update goal progress recursively
 * Updates the goal and all its ancestors
 */
export const updateGoalProgressRecursive = (
  goalId: string,
  plan: GoalPlan,
  archive: DayArchive[],
  currentTasks?: Task[]
): GoalPlan => {
  const goal = plan.goals.find(g => g.id === goalId);
  if (!goal) return plan;

  // Calculate new progress
  const newProgress = calculateActualProgress(goalId, plan, archive, currentTasks);

  // Update this goal
  const updatedGoals = plan.goals.map(g =>
    g.id === goalId
      ? { ...g, completionPercentage: newProgress, updatedAt: Date.now() }
      : g
  );

  let updatedPlan = { ...plan, goals: updatedGoals, updatedAt: Date.now() };

  // Recursively update parent
  if (goal.parentId) {
    updatedPlan = updateGoalProgressRecursive(goal.parentId, updatedPlan, archive, currentTasks);
  }

  return updatedPlan;
};

/**
 * Build a tree structure from flat goal array
 * Useful for hierarchical UI rendering
 */
export const buildGoalTree = (plan: GoalPlan): GoalNode | null => {
  const yearGoal = plan.goals.find(g => g.id === plan.yearGoalId);
  if (!yearGoal) return null;

  const buildNode = (goal: Goal, depth: number): GoalNode => {
    const children = getGoalChildren(goal.id, plan).map(child =>
      buildNode(child, depth + 1)
    );

    return {
      ...goal,
      children,
      depth
    };
  };

  return buildNode(yearGoal, 0);
};

/**
 * Get goal path as string (Year > Quarter > Month > Week)
 */
export const getGoalPathString = (goalId: string, plan: GoalPlan): string => {
  const goal = plan.goals.find(g => g.id === goalId);
  if (!goal) return '';

  const ancestors = getGoalAncestors(goalId, plan);
  const path = [...ancestors.reverse(), goal];

  return path.map(g => g.title).join(' > ');
};

/**
 * Get timeframe boundaries for a goal level starting from a base date
 */
export const getGoalTimeframe = (
  level: GoalLevel,
  baseDate: Date
): { start: string; end: string } => {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  switch (level) {
    case 'year':
      start.setMonth(0, 1);  // January 1
      end.setMonth(11, 31);  // December 31
      break;

    case 'quarter':
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1);  // First day of quarter
      end.setMonth(quarter * 3 + 3, 0);  // Last day of quarter
      break;

    case 'month':
      start.setDate(1);  // First day of month
      end.setMonth(end.getMonth() + 1, 0);  // Last day of month
      break;

    case 'week':
      // Week starts on Monday
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(diff + 6);
      break;

    case 'day':
      // Same day
      break;
  }

  return {
    start: getLocalDateString(start),
    end: getLocalDateString(end)
  };
};

/**
 * Check if a goal is currently active (within its time range)
 */
export const isGoalActive = (goal: Goal): boolean => {
  const now = getLocalDateString();
  return now >= goal.startDate && now <= goal.endDate;
};

/**
 * Check if a goal is overdue (past end date and not completed)
 */
export const isGoalOverdue = (goal: Goal): boolean => {
  const now = getLocalDateString();
  return now > goal.endDate && goal.status !== 'completed';
};

/**
 * Get goals that are currently active
 */
export const getActiveGoals = (plan: GoalPlan): Goal[] => {
  return plan.goals.filter(isGoalActive);
};

/**
 * Get goals that are overdue
 */
export const getOverdueGoals = (plan: GoalPlan): Goal[] => {
  return plan.goals.filter(isGoalOverdue);
};

/**
 * Validate goal dates don't conflict with parent
 */
export const validateGoalDates = (
  goal: Goal,
  plan: GoalPlan
): { valid: boolean; error?: string } => {
  if (!goal.parentId) {
    return { valid: true };
  }

  const parent = plan.goals.find(g => g.id === goal.parentId);
  if (!parent) {
    return { valid: true };
  }

  if (goal.startDate < parent.startDate) {
    return {
      valid: false,
      error: `Goal cannot start before parent goal (${parent.startDate})`
    };
  }

  if (goal.endDate > parent.endDate) {
    return {
      valid: false,
      error: `Goal cannot end after parent goal (${parent.endDate})`
    };
  }

  return { valid: true };
};
