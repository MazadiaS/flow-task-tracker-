import type { GoalPlan, GoalPlanIndex } from '../types/goals';

// Storage keys
const GOAL_PLAN_PREFIX = 'task-tracker-goal-plan-';
const GOAL_PLAN_INDEX_KEY = 'task-tracker-goal-plan-index';

/**
 * Save a goal plan to localStorage
 * Active plans are stored in main AppState, inactive plans get separate keys
 */
export const saveGoalPlan = (plan: GoalPlan): void => {
  try {
    const storageKey = `${GOAL_PLAN_PREFIX}${plan.id}`;
    const serialized = JSON.stringify(plan);
    localStorage.setItem(storageKey, serialized);
  } catch (error) {
    console.error('Failed to save goal plan:', error);
    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete old goal plans.');
    }
    throw error;
  }
};

/**
 * Load a goal plan from localStorage by ID
 */
export const loadGoalPlan = (planId: string): GoalPlan | null => {
  try {
    const storageKey = `${GOAL_PLAN_PREFIX}${planId}`;
    const serialized = localStorage.getItem(storageKey);

    if (!serialized) {
      return null;
    }

    const plan = JSON.parse(serialized) as GoalPlan;

    // Migrate old plans to new format with yearGoalIds
    if (!plan.yearGoalIds && plan.yearGoalId) {
      plan.yearGoalIds = [plan.yearGoalId];
    }

    return plan;
  } catch (error) {
    console.error('Failed to load goal plan:', error);
    return null;
  }
};

/**
 * Delete a goal plan from localStorage
 */
export const deleteGoalPlan = (planId: string): void => {
  try {
    const storageKey = `${GOAL_PLAN_PREFIX}${planId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to delete goal plan:', error);
  }
};

/**
 * Get or create the goal plan index
 * The index tracks all goal plans for quick access
 */
export const getGoalPlanIndex = (): GoalPlanIndex[] => {
  try {
    const serialized = localStorage.getItem(GOAL_PLAN_INDEX_KEY);

    if (!serialized) {
      return [];
    }

    return JSON.parse(serialized) as GoalPlanIndex[];
  } catch (error) {
    console.error('Failed to load goal plan index:', error);
    return [];
  }
};

/**
 * Update the goal plan index
 */
export const updateGoalPlanIndex = (index: GoalPlanIndex[]): void => {
  try {
    const serialized = JSON.stringify(index);
    localStorage.setItem(GOAL_PLAN_INDEX_KEY, serialized);
  } catch (error) {
    console.error('Failed to update goal plan index:', error);
  }
};

/**
 * Add a new plan to the index
 */
export const addToGoalPlanIndex = (plan: GoalPlan): void => {
  const index = getGoalPlanIndex();

  // Check if already exists
  const existingIndex = index.findIndex(item => item.id === plan.id);

  const yearGoal = plan.goals.find(g => g.id === plan.yearGoalId);
  const indexItem: GoalPlanIndex = {
    id: plan.id,
    title: plan.title,
    yearGoalTitle: yearGoal?.title || plan.title,
    isActive: plan.isActive,
    createdAt: plan.createdAt,
    storageKey: `${GOAL_PLAN_PREFIX}${plan.id}`
  };

  if (existingIndex >= 0) {
    index[existingIndex] = indexItem;
  } else {
    index.push(indexItem);
  }

  updateGoalPlanIndex(index);
};

/**
 * Remove a plan from the index
 */
export const removeFromGoalPlanIndex = (planId: string): void => {
  const index = getGoalPlanIndex();
  const filtered = index.filter(item => item.id !== planId);
  updateGoalPlanIndex(filtered);
};

/**
 * Mark a plan as active (and deactivate others)
 */
export const setActivePlan = (planId: string): void => {
  const index = getGoalPlanIndex();
  const updated = index.map(item => ({
    ...item,
    isActive: item.id === planId
  }));
  updateGoalPlanIndex(updated);
};

/**
 * Get total size of all goal-related localStorage data in bytes
 */
export const getGoalStorageSize = (): number => {
  let totalSize = 0;

  try {
    // Check all goal plan keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(GOAL_PLAN_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }

    // Add index size
    const indexValue = localStorage.getItem(GOAL_PLAN_INDEX_KEY);
    if (indexValue) {
      totalSize += GOAL_PLAN_INDEX_KEY.length + indexValue.length;
    }
  } catch (error) {
    console.error('Failed to calculate goal storage size:', error);
  }

  return totalSize;
};

/**
 * Clean up old goal plans to free up storage space
 * Keeps the N most recent plans
 */
export const cleanupOldGoalPlans = (keepCount: number = 2): void => {
  try {
    const index = getGoalPlanIndex();

    // Sort by creation date, newest first
    const sorted = [...index].sort((a, b) => b.createdAt - a.createdAt);

    // Keep active plan + newest keepCount inactive plans
    const activePlan = sorted.find(item => item.isActive);
    const inactivePlans = sorted.filter(item => !item.isActive);

    const toKeep = new Set<string>();
    if (activePlan) {
      toKeep.add(activePlan.id);
    }

    inactivePlans.slice(0, keepCount).forEach(item => {
      toKeep.add(item.id);
    });

    // Delete plans not in keep set
    sorted.forEach(item => {
      if (!toKeep.has(item.id)) {
        deleteGoalPlan(item.id);
      }
    });

    // Update index to only include kept plans
    const newIndex = index.filter(item => toKeep.has(item.id));
    updateGoalPlanIndex(newIndex);

    console.log(`Cleaned up ${sorted.length - toKeep.size} old goal plans`);
  } catch (error) {
    console.error('Failed to cleanup old goal plans:', error);
  }
};

/**
 * Get all goal plans (useful for plan switcher UI)
 */
export const getAllGoalPlans = (): GoalPlan[] => {
  const index = getGoalPlanIndex();
  const plans: GoalPlan[] = [];

  index.forEach(item => {
    const plan = loadGoalPlan(item.id);
    if (plan) {
      plans.push(plan);
    }
  });

  return plans;
};

/**
 * Export goal plan as JSON for backup/sharing
 */
export const exportGoalPlan = (planId: string): string | null => {
  const plan = loadGoalPlan(planId);
  if (!plan) {
    return null;
  }

  return JSON.stringify(plan, null, 2);
};

/**
 * Import goal plan from JSON
 */
export const importGoalPlan = (jsonString: string): GoalPlan | null => {
  try {
    const plan = JSON.parse(jsonString) as GoalPlan;

    // Validate basic structure
    if (!plan.id || !plan.goals || !plan.yearGoalId) {
      throw new Error('Invalid goal plan structure');
    }

    // Generate new ID to avoid conflicts
    const newId = Date.now().toString();
    plan.id = newId;
    plan.isActive = false;  // Imported plans start inactive

    saveGoalPlan(plan);
    addToGoalPlanIndex(plan);

    return plan;
  } catch (error) {
    console.error('Failed to import goal plan:', error);
    return null;
  }
};
