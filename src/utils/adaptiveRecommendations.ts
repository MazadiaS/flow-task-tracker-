import type { Task, DayArchive } from '../types';
import type { Goal, GoalPlan } from '../types/goals';
import {
  calculateActualProgress,
  calculateExpectedProgress,
  getGoalsNeedingAttention,
  getGoalPath
} from './goalVisualization';

export interface GoalRecommendation {
  goal: Goal;
  urgency: 'critical' | 'high' | 'medium';
  progressGap: number; // percentage behind schedule
  daysRemaining: number;
  suggestedActions: string[];
  aiGeneratedTask?: string;
}

/**
 * Get goals that need attention with recommendation details
 */
export const getGoalRecommendations = (
  goalPlan: GoalPlan,
  archive: DayArchive[],
  currentTasks: Task[]
): GoalRecommendation[] => {
  const goalsNeedingAttention = getGoalsNeedingAttention(goalPlan, archive, currentTasks);
  const now = Date.now();

  const recommendations: GoalRecommendation[] = goalsNeedingAttention.map(goal => {
    const actual = calculateActualProgress(goal, goalPlan, archive, currentTasks);
    const expected = calculateExpectedProgress(goal);
    const progressGap = expected - actual;

    const endDate = new Date(goal.endDate).getTime();
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    // Determine urgency
    let urgency: 'critical' | 'high' | 'medium';
    if (daysRemaining <= 2 || progressGap >= 30) {
      urgency = 'critical';
    } else if (daysRemaining <= 7 || progressGap >= 20) {
      urgency = 'high';
    } else {
      urgency = 'medium';
    }

    // Generate suggested actions
    const suggestedActions = generateSuggestedActions(
      goal,
      goalPlan,
      progressGap,
      daysRemaining,
      currentTasks
    );

    return {
      goal,
      urgency,
      progressGap,
      daysRemaining,
      suggestedActions
    };
  });

  // Sort by urgency (critical > high > medium) and then by days remaining
  return recommendations.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.daysRemaining - b.daysRemaining;
  });
};

/**
 * Generate specific action suggestions for a goal
 */
const generateSuggestedActions = (
  goal: Goal,
  goalPlan: GoalPlan,
  progressGap: number,
  daysRemaining: number,
  currentTasks: Task[]
): string[] => {
  const actions: string[] = [];

  // Check if there are existing tasks linked to this goal
  const linkedTasks = currentTasks.filter(t => t.linkedGoalId === goal.id);
  const hasLinkedTasks = linkedTasks.length > 0;

  // Action 1: Create tasks if none exist
  if (!hasLinkedTasks) {
    actions.push(`Create tasks for "${goal.title}"`);
  } else {
    actions.push(`Complete ${linkedTasks.length} pending task${linkedTasks.length > 1 ? 's' : ''}`);
  }

  // Action 2: Time-based suggestions
  if (daysRemaining <= 2) {
    actions.push('Focus on this goal today');
  } else if (daysRemaining <= 7) {
    actions.push('Schedule daily work sessions');
  }

  // Action 3: Progress-based suggestions
  if (progressGap >= 30) {
    actions.push('Consider breaking into smaller steps');
    actions.push('Dedicate focused time blocks');
  } else if (progressGap >= 20) {
    actions.push('Increase daily time allocation');
  }

  // Action 4: Child goals suggestion
  if (goal.childIds.length > 0) {
    const childGoals = goal.childIds
      .map(id => goalPlan.goals.find(g => g.id === id))
      .filter(Boolean) as Goal[];

    const completedChildren = childGoals.filter(g => g.status === 'completed').length;
    const totalChildren = childGoals.length;

    if (completedChildren < totalChildren) {
      actions.push(`Complete ${totalChildren - completedChildren} sub-goal${totalChildren - completedChildren > 1 ? 's' : ''}`);
    }
  }

  return actions.slice(0, 3); // Return top 3 actions
};

/**
 * Generate AI-powered task suggestions for a goal
 * This provides template-based suggestions (AI integration optional)
 */
export const generateTaskSuggestions = (
  goal: Goal,
  _goalPlan: GoalPlan // eslint-disable-line @typescript-eslint/no-unused-vars
): string[] => {
  const suggestions: string[] = [];

  // Template-based suggestions based on goal level
  switch (goal.level) {
    case 'week':
      suggestions.push(`Daily progress check: ${goal.title}`);
      suggestions.push(`Research for: ${goal.title}`);
      suggestions.push(`Planning session: ${goal.title}`);
      break;
    case 'day':
      suggestions.push(`Work session: ${goal.title}`);
      suggestions.push(`Review progress: ${goal.title}`);
      break;
    case 'month':
      suggestions.push(`Weekly milestone: ${goal.title}`);
      suggestions.push(`Strategic planning: ${goal.title}`);
      break;
    default:
      suggestions.push(`Action item: ${goal.title}`);
  }

  // Add context-aware suggestions based on description
  const desc = goal.description.toLowerCase();

  if (desc.includes('learn') || desc.includes('study')) {
    suggestions.unshift(`Study session: ${goal.title}`);
    suggestions.push(`Practice exercises: ${goal.title}`);
  }

  if (desc.includes('build') || desc.includes('create')) {
    suggestions.unshift(`Development work: ${goal.title}`);
    suggestions.push(`Testing & review: ${goal.title}`);
  }

  if (desc.includes('write') || desc.includes('document')) {
    suggestions.unshift(`Writing session: ${goal.title}`);
    suggestions.push(`Edit & proofread: ${goal.title}`);
  }

  return suggestions.slice(0, 4);
};

/**
 * Get recommended tasks to add from goal plan
 */
export const getRecommendedTasksFromGoals = (
  goalPlan: GoalPlan,
  archive: DayArchive[],
  currentTasks: Task[],
  dismissedGoalIds: string[] = []
): Task[] => {
  const recommendations = getGoalRecommendations(goalPlan, archive, currentTasks);
  const recommendedTasks: Task[] = [];

  // Only show recommendations for top 3 urgent goals not dismissed
  const urgentGoals = recommendations
    .filter(rec => !dismissedGoalIds.includes(rec.goal.id))
    .slice(0, 3);

  urgentGoals.forEach(rec => {
    const suggestions = generateTaskSuggestions(rec.goal, goalPlan);

    // Create task from first suggestion
    if (suggestions.length > 0) {
      const taskName = suggestions[0];
      const now = Date.now();

      const task: Task = {
        id: `goal-rec-${rec.goal.id}-${now}`,
        name: taskName,
        type: 'duration',
        priority: rec.urgency === 'critical' ? 'high' : rec.urgency === 'high' ? 'medium' : 'low',
        importance: rec.urgency === 'critical' ? 8 : rec.urgency === 'high' ? 6 : 4,
        order: 0,
        target: {
          value: rec.urgency === 'critical' ? 60 : 30,
          unit: 'minutes'
        },
        notes: `Auto-suggested for: ${getGoalPath(rec.goal, goalPlan)}\n\nGoal is ${rec.progressGap}% behind schedule with ${rec.daysRemaining} days remaining.`,
        sessions: [],
        subtasks: [],
        isCollapsed: false,
        media: [],
        isRecurring: false,
        createdAt: now,
        linkedGoalId: rec.goal.id,
        goalContext: getGoalPath(rec.goal, goalPlan)
      };

      recommendedTasks.push(task);
    }
  });

  return recommendedTasks;
};

/**
 * Check if a goal needs urgent attention
 */
export const isGoalUrgent = (
  goal: Goal,
  goalPlan: GoalPlan,
  archive: DayArchive[],
  currentTasks?: Task[]
): boolean => {
  const actual = calculateActualProgress(goal, goalPlan, archive, currentTasks);
  const expected = calculateExpectedProgress(goal);
  const progressGap = expected - actual;

  const now = Date.now();
  const endDate = new Date(goal.endDate).getTime();
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

  return (daysRemaining <= 7 && progressGap >= 10) || progressGap >= 20;
};
