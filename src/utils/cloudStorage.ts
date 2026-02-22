import { supabase } from '../lib/supabase';
import type { AppState } from '../types';
import type { GoalPlan } from '../types/goals';

// Save app state to Supabase
export async function saveStateToCloud(userId: string, state: AppState): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({
        user_id: userId,
        current_day: state.currentDay,
        task_library: state.taskLibrary,
        archive: state.archive,
        active_day_session: state.activeDaySession || null,
        active_task_timer: state.activeTaskTimer || null,
        active_goal_plan: state.activeGoalPlan || null,
        goal_plan_index: state.goalPlanIndex,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error saving to cloud:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving to cloud:', err);
    return false;
  }
}

// Load app state from Supabase
export async function loadStateFromCloud(userId: string): Promise<AppState | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - this is OK for new users
        return null;
      }
      console.error('Error loading from cloud:', error);
      return null;
    }

    if (!data) return null;

    return {
      currentDay: data.current_day,
      taskLibrary: data.task_library,
      archive: data.archive || [],
      activeDaySession: data.active_day_session,
      activeTaskTimer: data.active_task_timer,
      activeGoalPlan: data.active_goal_plan,
      goalPlanIndex: data.goal_plan_index || [],
    };
  } catch (err) {
    console.error('Error loading from cloud:', err);
    return null;
  }
}

// Save a goal plan to Supabase
export async function saveGoalPlanToCloud(userId: string, plan: GoalPlan): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('goal_plans')
      .upsert({
        id: plan.id,
        user_id: userId,
        title: plan.title,
        data: plan,
        is_active: plan.isActive,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Error saving goal plan to cloud:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving goal plan to cloud:', err);
    return false;
  }
}

// Load all goal plans from Supabase
export async function loadGoalPlansFromCloud(userId: string): Promise<GoalPlan[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('goal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading goal plans from cloud:', error);
      return [];
    }

    return data?.map(row => row.data as GoalPlan) || [];
  } catch (err) {
    console.error('Error loading goal plans from cloud:', err);
    return [];
  }
}

// Delete a goal plan from Supabase
export async function deleteGoalPlanFromCloud(planId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('goal_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting goal plan from cloud:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting goal plan from cloud:', err);
    return false;
  }
}

// Create user profile after signup
export async function createUserProfile(userId: string, email: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Error creating profile:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error creating profile:', err);
    return false;
  }
}
