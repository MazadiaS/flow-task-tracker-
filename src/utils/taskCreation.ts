import type { Task } from '../types';
import type { Goal, GoalPlan } from '../types/goals';
import type { GoalRecommendation } from './adaptiveRecommendations';
import { getGoalPath } from './goalVisualization';

/**
 * Create a task from a goal recommendation
 * Centralized task creation logic for goal-based recommendations
 *
 * @param recommendation - The goal recommendation
 * @param taskName - Name for the task
 * @param goalPlan - The goal plan for context
 * @param taskId - Optional custom task ID (defaults to timestamp)
 * @returns A new Task object
 */
export function createTaskFromGoalRecommendation(
  recommendation: GoalRecommendation,
  taskName: string,
  goalPlan: GoalPlan,
  taskId?: string
): Task {
  const now = Date.now();
  const goalPath = getGoalPath(recommendation.goal, goalPlan);

  // Map urgency to priority and importance
  const priorityMap = {
    critical: 'high' as const,
    high: 'medium' as const,
    medium: 'low' as const
  };

  const importanceMap = {
    critical: 8,
    high: 6,
    medium: 4
  };

  const targetDurationMap = {
    critical: 60,
    high: 30,
    medium: 30
  };

  return {
    id: taskId || now.toString(),
    name: taskName,
    type: 'duration',
    priority: priorityMap[recommendation.urgency],
    importance: importanceMap[recommendation.urgency],
    order: 0,
    target: {
      value: targetDurationMap[recommendation.urgency],
      unit: 'minutes'
    },
    notes: `Suggested for: ${goalPath}\n\nGoal is ${recommendation.progressGap}% behind schedule with ${recommendation.daysRemaining} days remaining.`,
    sessions: [],
    subtasks: [],
    isCollapsed: false,
    media: [],
    isRecurring: false,
    createdAt: now,
    linkedGoalId: recommendation.goal.id,
    goalContext: goalPath
  };
}

/**
 * Create a simple task from a goal
 * Used for basic goal-to-task conversion
 *
 * @param goal - The goal to create a task from
 * @param taskName - Name for the task
 * @param goalPlan - The goal plan for context
 * @returns A new Task object
 */
export function createTaskFromGoal(
  goal: Goal,
  taskName: string,
  goalPlan: GoalPlan
): Task {
  const now = Date.now();
  const goalPath = getGoalPath(goal, goalPlan);

  return {
    id: now.toString(),
    name: taskName,
    type: 'duration',
    priority: 'medium',
    importance: 5,
    order: 0,
    target: {
      value: 30,
      unit: 'minutes'
    },
    notes: `For goal: ${goalPath}`,
    sessions: [],
    subtasks: [],
    isCollapsed: false,
    media: [],
    isRecurring: false,
    createdAt: now,
    linkedGoalId: goal.id,
    goalContext: goalPath
  };
}
