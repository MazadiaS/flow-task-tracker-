import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { AppState, Task } from './types';
import type { Goal, GoalPlan } from './types/goals';
import { getInitialState, saveState } from './utils/storage';
import { saveGoalPlan, addToGoalPlanIndex } from './utils/goalStorage';
import { triggerAutoSync, initAutoSync } from './utils/gistSync';
import { getAllDescendantIds } from './utils/goalCalculations';
import { debounce } from './utils/debounce';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { requestNotificationPermission } from './utils/notifications';
import TaskList from './components/tasks/TaskList';
import DaySession from './components/session/DaySession';
import AddTaskModal from './components/modals/AddTaskModal';
import EditTaskModal from './components/modals/EditTaskModal';
import KeyboardShortcutsHelp from './components/common/KeyboardShortcutsHelp';
import WelcomeScreen from './components/common/WelcomeScreen';
import Footer from './components/common/Footer';
import './App.css';

// Lazy load heavy components
const TaskDetail = lazy(() => import('./components/tasks/TaskDetail'));
const Statistics = lazy(() => import('./components/views/Statistics'));
const Archive = lazy(() => import('./components/views/Archive'));
const TimelineView = lazy(() => import('./components/views/TimelineView'));
const GoalPlanView = lazy(() => import('./components/Goals/GoalPlanView'));
const FlowchartEditor = lazy(() => import('./components/flowchart/FlowchartEditor'));
const BackupSettings = lazy(() => import('./components/views/BackupSettings'));

function App() {
  const [state, setState] = useState<AppState>(getInitialState());
  const [currentView, setCurrentView] = useState<'start' | 'list' | 'detail' | 'stats' | 'archive' | 'timeline' | 'goals' | 'flowchart' | 'backup'>('start');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem('flow-onboarding-completed') !== 'true';
  });

  // Check developer mode from sessionStorage
  const isDeveloperMode = sessionStorage.getItem('developer-mode') === 'true';

  // Debounced save to localStorage (500ms delay)
  const debouncedSaveState = useMemo(
    () => debounce(saveState, 500),
    []
  );

  useEffect(() => {
    debouncedSaveState(state);
    // Trigger auto-sync when state changes
    triggerAutoSync();
  }, [state, debouncedSaveState]);

  // Initialize auto-sync and request notification permission on app startup
  useEffect(() => {
    initAutoSync();
    // Request notification permission (non-blocking)
    requestNotificationPermission().catch(console.error);
  }, []);

  useEffect(() => {
    // Determine initial view based on currentDay state
    if (state.currentDay.isActive) {
      setCurrentView('list');
    } else {
      setCurrentView('start');
    }
  }, [state.currentDay.isActive]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      meta: true,
      handler: () => setShowAddTaskModal(true),
      description: 'Add new task'
    },
    {
      key: 'e',
      ctrl: true,
      meta: true,
      handler: () => {
        const dataStr = JSON.stringify(state, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `flow-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      },
      description: 'Export data'
    },
    {
      key: '1',
      handler: () => setCurrentView('list'),
      description: 'Switch to Tasks view',
      preventDefault: state.currentDay.isActive
    },
    {
      key: '2',
      handler: () => setCurrentView('goals'),
      description: 'Switch to Goals view',
      preventDefault: true
    },
    {
      key: '3',
      handler: () => setCurrentView('timeline'),
      description: 'Switch to Timeline view',
      preventDefault: state.currentDay.isActive
    },
    {
      key: '4',
      handler: () => setCurrentView('stats'),
      description: 'Switch to Statistics view',
      preventDefault: true
    },
    {
      key: '5',
      handler: () => setCurrentView('archive'),
      description: 'Switch to Archive view',
      preventDefault: true
    },
    {
      key: 'i',
      ctrl: true,
      meta: true,
      handler: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const importedData = JSON.parse(event.target?.result as string);
                if (confirm('This will replace all your current data. Are you sure?')) {
                  setState(importedData);
                  saveState(importedData);
                  alert('Data imported successfully!');
                }
              } catch (error) {
                alert('Error importing data. Please check the file format.');
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      },
      description: 'Import data'
    },
    {
      key: '?',
      shift: true,
      handler: () => setShowShortcutsHelp(true),
      description: 'Show keyboard shortcuts'
    },
    {
      key: 'Escape',
      handler: () => {
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        } else if (currentView === 'detail') {
          handleBackToList();
        }
      },
      description: 'Go back / Close modal',
      preventDefault: false
    }
  ], currentView !== 'start');

  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentView('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedTaskId(null);
  }, []);

  const handleShowStats = useCallback(() => {
    setCurrentView('stats');
  }, []);

  const handleShowArchive = useCallback(() => {
    setCurrentView('archive');
  }, []);

  const handleShowTimeline = useCallback(() => {
    setCurrentView('timeline');
  }, []);

  const handleShowFlowchart = useCallback(() => {
    setCurrentView('flowchart');
  }, []);

  const handleShowBackup = useCallback(() => {
    setCurrentView('backup');
  }, []);

  const handleDataRestored = useCallback(() => {
    // Reload the state from localStorage after a restore
    setState(getInitialState());
    setCurrentView('start');
  }, []);

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
        // Create new plan with this goal as root
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
        // Add goal to existing plan
        const updatedPlan = {
          ...prevState.activeGoalPlan,
          goals: [...prevState.activeGoalPlan.goals, goal],
          updatedAt: Date.now()
        };

        // If it's a year-level goal without parent, add to yearGoalIds
        if (goal.level === 'year' && !goal.parentId) {
          if (!updatedPlan.yearGoalIds) {
            updatedPlan.yearGoalIds = [updatedPlan.yearGoalId];
          }
          if (!updatedPlan.yearGoalIds.includes(goal.id)) {
            updatedPlan.yearGoalIds.push(goal.id);
          }
        }

        // Update parent's childIds
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

      // Get all descendant IDs
      const toDelete = new Set<string>([goalId, ...getAllDescendantIds(goalId, prevState.activeGoalPlan)]);

      const updatedPlan = {
        ...prevState.activeGoalPlan,
        goals: prevState.activeGoalPlan.goals.filter(g => !toDelete.has(g.id)),
        updatedAt: Date.now()
      };

      // Remove from parent's childIds
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
      // Deactivate current plan if one exists
      if (prevState.activeGoalPlan) {
        const oldPlan = { ...prevState.activeGoalPlan, isActive: false };
        saveGoalPlan(oldPlan);
      }

      // Save new plan
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
    setState(prevState => {
      // If deleting the active plan, clear it
      if (prevState.activeGoalPlan?.id === planId) {
        return {
          ...prevState,
          activeGoalPlan: undefined,
          goalPlanIndex: prevState.goalPlanIndex.filter(p => p.id !== planId)
        };
      }

      // Otherwise just remove from index
      return {
        ...prevState,
        goalPlanIndex: prevState.goalPlanIndex.filter(p => p.id !== planId)
      };
    });
  }, []);

  // Memoize selectedTask to prevent unnecessary re-renders
  const selectedTask = useMemo(
    () => selectedTaskId ? state.currentDay.tasks.find(t => t.id === selectedTaskId) : null,
    [selectedTaskId, state.currentDay.tasks]
  );

  return (
    <div className="app">
      {showWelcome && (
        <WelcomeScreen onComplete={() => setShowWelcome(false)} />
      )}

      {currentView !== 'start' && currentView !== 'archive' && currentView !== 'goals' && currentView !== 'flowchart' && currentView !== 'backup' && (
        <DaySession
          state={state}
          setState={setState}
          onViewChange={setCurrentView}
        />
      )}

      {currentView === 'start' && (
        <DaySession
          state={state}
          setState={setState}
          onViewChange={setCurrentView}
          onShowArchive={handleShowArchive}
          onShowBackup={handleShowBackup}
        />
      )}

      {currentView === 'list' && (
        <TaskList
          tasks={state.currentDay.tasks}
          taskLibrary={state.taskLibrary}
          archive={state.archive}
          dismissedRecommendations={state.currentDay.dismissedRecommendations}
          goalPlan={state.activeGoalPlan}
          onTaskClick={handleTaskClick}
          onShowStats={handleShowStats}
          onShowAddTask={() => setShowAddTaskModal(true)}
          onShowArchive={handleShowArchive}
          onShowTimeline={handleShowTimeline}
          onShowFlowchart={handleShowFlowchart}
          onShowBackup={handleShowBackup}
          onEditTask={setEditingTask}
          onAddRecommendation={(task) => {
            handleAddTask(task);
            // Also dismiss the recommendation immediately after adding
            setState(prev => ({
              ...prev,
              currentDay: {
                ...prev.currentDay,
                dismissedRecommendations: [...prev.currentDay.dismissedRecommendations, task.id]
              }
            }));
          }}
          onDismissRecommendation={(taskId) => {
            setState(prev => ({
              ...prev,
              currentDay: {
                ...prev.currentDay,
                dismissedRecommendations: [...prev.currentDay.dismissedRecommendations, taskId]
              }
            }));
          }}
          activeDaySession={state.activeDaySession}
          onReorderTasks={handleReorderTasks}
        />
      )}

      {currentView === 'timeline' && (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <TimelineView
            tasks={state.currentDay.tasks}
            onTaskClick={handleTaskClick}
            onBack={handleBackToList}
          />
        </Suspense>
      )}

      {currentView === 'detail' && selectedTask && (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <TaskDetail
            task={selectedTask}
            onBack={handleBackToList}
            updateTask={updateTask}
            state={state}
            setState={setState}
          />
        </Suspense>
      )}

      {currentView === 'stats' && (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Statistics
            tasks={state.currentDay.tasks}
            archive={state.archive}
            onBack={handleBackToList}
          />
        </Suspense>
      )}

      {currentView === 'archive' && (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Archive
            archive={state.archive}
            onBack={() => setCurrentView(state.currentDay.isActive ? 'list' : 'start')}
          />
        </Suspense>
      )}

      {currentView === 'goals' && (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <GoalPlanView
            goalPlan={state.activeGoalPlan}
            archive={state.archive}
            onCreateGoal={handleCreateGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onCreateGoalPlan={handleCreateGoalPlan}
            onDeleteGoalPlan={handleDeleteGoalPlan}
            onBack={() => setCurrentView(state.currentDay.isActive ? 'list' : 'start')}
          />
        </Suspense>
      )}

      {currentView === 'flowchart' && (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <FlowchartEditor
            onBack={() => setCurrentView(state.currentDay.isActive ? 'list' : 'start')}
            onShowGoals={() => setCurrentView('goals')}
            goalPlan={state.activeGoalPlan}
            onCreateGoal={handleCreateGoal}
            isDeveloperMode={isDeveloperMode}
          />
        </Suspense>
      )}

      {currentView === 'backup' && (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <BackupSettings
            onBack={() => setCurrentView(state.currentDay.isActive ? 'list' : 'start')}
            onDataRestored={handleDataRestored}
          />
        </Suspense>
      )}

      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onAddTask={handleAddTask}
          existingTasks={state.currentDay.tasks}
          goalPlan={state.activeGoalPlan}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          goalPlan={state.activeGoalPlan}
          onClose={() => setEditingTask(null)}
          onUpdateTask={(updatedTask) => {
            handleUpdateTask(updatedTask);
            setEditingTask(null);
          }}
          onDeleteTask={() => {
            handleDeleteTask(editingTask.id);
            setEditingTask(null);
          }}
        />
      )}

      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      <Footer />
    </div>
  );
}

export default App;
