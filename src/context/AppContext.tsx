import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { AppState, Task } from '../types';
import type { Goal, GoalPlan } from '../types/goals';
import { getInitialState, saveState } from '../utils/storage';
import { saveGoalPlan, addToGoalPlanIndex, deleteGoalPlan, removeFromGoalPlanIndex } from '../utils/goalStorage';
import { getAllDescendantIds } from '../utils/goalCalculations';
import { debounce } from '../utils/debounce';
import { triggerAutoSync, initAutoSync } from '../utils/gistSync';
import { requestNotificationPermission } from '../utils/notifications';
import { DEBOUNCE_DELAY_MS } from '../constants';
import { useAuth } from './AuthContext';
import { saveStateToCloud, loadStateFromCloud } from '../utils/cloudStorage';

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  isDeveloperMode: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  // Task handlers
  handleAddTask: (task: Task) => void;
  handleUpdateTask: (updatedTask: Task) => void;
  handleDeleteTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  handleReorderTasks: (reorderedTasks: Task[]) => void;
  // Goal handlers
  handleCreateGoal: (goal: Goal) => void;
  handleUpdateGoal: (updatedGoal: Goal) => void;
  handleDeleteGoal: (goalId: string) => void;
  handleCreateGoalPlan: (plan: GoalPlan) => void;
  handleDeleteGoalPlan: (planId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const { user } = useAuth();

  // Check developer mode from sessionStorage
  const isDeveloperMode = sessionStorage.getItem('developer-mode') === 'true';

  // Debounced save to localStorage
  const debouncedSaveState = useMemo(
    () => debounce(saveState, DEBOUNCE_DELAY_MS),
    []
  );

  // Debounced save to cloud
  const debouncedSaveToCloud = useMemo(
    () => debounce(async (userId: string, appState: AppState) => {
      setIsSyncing(true);
      const success = await saveStateToCloud(userId, appState);
      if (success) {
        setLastSyncTime(Date.now());
      }
      setIsSyncing(false);
    }, DEBOUNCE_DELAY_MS * 2), // Slightly longer debounce for cloud
    []
  );

  // Load from cloud when user logs in
  useEffect(() => {
    if (user) {
      setIsSyncing(true);
      loadStateFromCloud(user.id).then(cloudState => {
        if (cloudState) {
          // Merge cloud state with local state (cloud takes priority if newer)
          setState(cloudState);
        } else {
          // First time user - save current local state to cloud
          saveStateToCloud(user.id, state);
        }
        setLastSyncTime(Date.now());
        setIsSyncing(false);
      });
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Always save to localStorage
    debouncedSaveState(state);
    // Trigger auto-sync when state changes
    triggerAutoSync();

    // Also save to cloud if user is logged in
    if (user) {
      debouncedSaveToCloud(user.id, state);
    }
  }, [state, debouncedSaveState, debouncedSaveToCloud, user]);

  // Initialize auto-sync and request notification permission on app startup
  useEffect(() => {
    initAutoSync();
    // Request notification permission (non-blocking)
    requestNotificationPermission().catch(console.error);
  }, []);

  // Task handlers
  const handleAddTask = useCallback((task: Task) => {
    setState(prevState => ({
      ...prevState,
      currentDay: {
        ...prevState.currentDay,
        tasks: [...prevState.currentDay.tasks, task]
      },
      taskLibrary: [...prevState.taskLibrary, task]
    }));
  }, []);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setState(prevState => ({
      ...prevState,
      currentDay: {
        ...prevState.currentDay,
        tasks: prevState.currentDay.tasks.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        )
      },
      taskLibrary: prevState.taskLibrary.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    }));
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setState(prevState => ({
      ...prevState,
      currentDay: {
        ...prevState.currentDay,
        tasks: prevState.currentDay.tasks.filter(task => task.id !== taskId)
      },
      taskLibrary: prevState.taskLibrary.filter(task => task.id !== taskId)
    }));
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setState(prevState => ({
      ...prevState,
      currentDay: {
        ...prevState.currentDay,
        tasks: prevState.currentDay.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      }
    }));
  }, []);

  const handleReorderTasks = useCallback((reorderedTasks: Task[]) => {
    setState(prevState => ({
      ...prevState,
      currentDay: {
        ...prevState.currentDay,
        tasks: reorderedTasks
      },
      taskLibrary: prevState.taskLibrary.map(libTask => {
        const reordered = reorderedTasks.find(t => t.id === libTask.id);
        return reordered || libTask;
      })
    }));
  }, []);

  // Goal handlers
  const handleCreateGoal = useCallback((goal: Goal) => {
    setState(prevState => {
      if (!prevState.activeGoalPlan) {
        const newPlan: GoalPlan = {
          id: Date.now().toString(),
          title: goal.title,
          yearGoalId: goal.id,
          yearGoalIds: [goal.id],
          goals: [goal],
          interviewDate: Date.now(),
          interviewResponses: [],
          isActive: true,
          aiModel: 'manual',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        saveGoalPlan(newPlan);
        addToGoalPlanIndex(newPlan);
        return {
          ...prevState,
          activeGoalPlan: newPlan,
          goalPlanIndex: [...prevState.goalPlanIndex, {
            id: newPlan.id,
            title: newPlan.title,
            yearGoalTitle: goal.title,
            isActive: true,
            createdAt: newPlan.createdAt,
            storageKey: `task-tracker-goal-plan-${newPlan.id}`
          }]
        };
      } else {
        const updatedPlan = {
          ...prevState.activeGoalPlan,
          goals: [...prevState.activeGoalPlan.goals, goal],
          updatedAt: Date.now()
        };

        if (goal.level === 'year' && !goal.parentId) {
          if (!updatedPlan.yearGoalIds) {
            updatedPlan.yearGoalIds = [updatedPlan.yearGoalId];
          }
          if (!updatedPlan.yearGoalIds.includes(goal.id)) {
            updatedPlan.yearGoalIds.push(goal.id);
          }
        }

        if (goal.parentId) {
          const parentGoal = updatedPlan.goals.find(g => g.id === goal.parentId);
          if (parentGoal && !parentGoal.childIds.includes(goal.id)) {
            parentGoal.childIds.push(goal.id);
          }
        }

        saveGoalPlan(updatedPlan);
        return { ...prevState, activeGoalPlan: updatedPlan };
      }
    });
  }, []);

  const handleUpdateGoal = useCallback((updatedGoal: Goal) => {
    setState(prevState => {
      if (!prevState.activeGoalPlan) return prevState;

      const updatedPlan = {
        ...prevState.activeGoalPlan,
        goals: prevState.activeGoalPlan.goals.map(g =>
          g.id === updatedGoal.id ? updatedGoal : g
        ),
        updatedAt: Date.now()
      };

      saveGoalPlan(updatedPlan);
      return { ...prevState, activeGoalPlan: updatedPlan };
    });
  }, []);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setState(prevState => {
      if (!prevState.activeGoalPlan) return prevState;

      const toDelete = new Set<string>([goalId, ...getAllDescendantIds(goalId, prevState.activeGoalPlan)]);

      const updatedPlan = {
        ...prevState.activeGoalPlan,
        goals: prevState.activeGoalPlan.goals.filter(g => !toDelete.has(g.id)),
        updatedAt: Date.now()
      };

      updatedPlan.goals.forEach(g => {
        if (g.childIds.length > 0) {
          g.childIds = g.childIds.filter(id => !toDelete.has(id));
        }
      });

      saveGoalPlan(updatedPlan);
      return { ...prevState, activeGoalPlan: updatedPlan };
    });
  }, []);

  const handleCreateGoalPlan = useCallback((plan: GoalPlan) => {
    setState(prevState => {
      if (prevState.activeGoalPlan) {
        const oldPlan = { ...prevState.activeGoalPlan, isActive: false };
        saveGoalPlan(oldPlan);
      }

      saveGoalPlan(plan);
      addToGoalPlanIndex(plan);

      return {
        ...prevState,
        activeGoalPlan: plan,
        goalPlanIndex: [...prevState.goalPlanIndex, {
          id: plan.id,
          title: plan.title,
          yearGoalTitle: plan.goals.find(g => g.id === plan.yearGoalId)?.title || plan.title,
          isActive: true,
          createdAt: plan.createdAt,
          storageKey: `task-tracker-goal-plan-${plan.id}`
        }]
      };
    });
  }, []);

  const handleDeleteGoalPlan = useCallback((planId: string) => {
    setState(prevState => ({
      ...prevState,
      activeGoalPlan: prevState.activeGoalPlan?.id === planId ? undefined : prevState.activeGoalPlan,
      goalPlanIndex: prevState.goalPlanIndex.filter(p => p.id !== planId)
    }));
    deleteGoalPlan(planId);
    removeFromGoalPlanIndex(planId);
  }, []);

  const value = useMemo(() => ({
    state,
    setState,
    isDeveloperMode,
    isSyncing,
    lastSyncTime,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    updateTask,
    handleReorderTasks,
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleCreateGoalPlan,
    handleDeleteGoalPlan,
  }), [
    state,
    isDeveloperMode,
    isSyncing,
    lastSyncTime,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    updateTask,
    handleReorderTasks,
    handleCreateGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleCreateGoalPlan,
    handleDeleteGoalPlan,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
