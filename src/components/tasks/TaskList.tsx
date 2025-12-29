import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import type { Task, DaySession, DayArchive } from '../../types';
import type { GoalPlan } from '../../types/goals';
import { formatDurationShort } from '../../utils/timeUtils';
import { generateRecommendations } from '../../utils/recommendations';
import { getGoalPath } from '../../utils/goalVisualization';
import { getGoalRecommendations } from '../../utils/adaptiveRecommendations';
import GoalRecommendations from '../Goals/GoalRecommendations';
import DeveloperModeModal from '../modals/DeveloperModeModal';
import {
  calculateTotalDuration,
  calculateTodayDuration,
  calculateTotalCount,
  calculateTodayCount,
  getTodayCompletion,
  calculateStreak,
  getTaskIcon
} from '../../utils/taskCalculations';
import './TaskList.css';

interface Props {
  tasks: Task[];
  taskLibrary: Task[];
  archive: DayArchive[];
  dismissedRecommendations: string[];
  goalPlan?: GoalPlan;
  onTaskClick: (taskId: string) => void;
  onShowStats: () => void;
  onShowAddTask: () => void;
  onShowArchive: () => void;
  onShowTimeline: () => void;
  onShowFlowchart?: () => void;
  onShowBackup?: () => void;
  onEditTask: (task: Task) => void;
  onAddRecommendation: (task: Task) => void;
  onDismissRecommendation: (taskId: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  activeDaySession?: DaySession;
}

function TaskList({ tasks, taskLibrary, archive, dismissedRecommendations, goalPlan, onTaskClick, onShowStats, onShowAddTask, onShowArchive, onShowTimeline, onShowFlowchart, onShowBackup, onEditTask, onAddRecommendation, onDismissRecommendation, onReorderTasks, activeDaySession }: Props) {
  const [fadingOutIds, setFadingOutIds] = useState<string[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dismissedGoalIds, setDismissedGoalIds] = useState<string[]>([]);
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    return sessionStorage.getItem('developer-mode') === 'true';
  });
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Secret gesture: Click "My Tasks" 7 times in 3 seconds
  const handleTitleClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Reset counter after 3 seconds
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 3000);

    // If clicked 7 times, show developer modal
    if (newCount === 7) {
      setClickCount(0);
      if (!isDeveloperMode) {
        setShowDeveloperModal(true);
      } else {
        // Already in dev mode, ask to exit
        const confirmExit = window.confirm('Exit Developer Mode?');
        if (confirmExit) {
          setIsDeveloperMode(false);
          sessionStorage.removeItem('developer-mode');
        }
      }
    }
  }, [clickCount, isDeveloperMode]);

  const handleAuthenticate = useCallback(() => {
    setIsDeveloperMode(true);
    sessionStorage.setItem('developer-mode', 'true');
    sessionStorage.setItem('developer-mode-timestamp', Date.now().toString());
  }, []);

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!isDeveloperMode) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetInactivityTimer = () => {
      // Clear existing timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      // Update last activity timestamp
      sessionStorage.setItem('developer-mode-timestamp', Date.now().toString());

      // Set new timer
      inactivityTimer = setTimeout(() => {
        setIsDeveloperMode(false);
        sessionStorage.removeItem('developer-mode');
        sessionStorage.removeItem('developer-mode-timestamp');
        alert('Developer mode has been automatically disabled due to inactivity (30 minutes).');
      }, INACTIVITY_TIMEOUT);
    };

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Start initial timer
    resetInactivityTimer();

    // Cleanup on unmount or when developer mode is disabled
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [isDeveloperMode]);

  // Check timestamp on component mount to see if session expired
  useEffect(() => {
    const storedTimestamp = sessionStorage.getItem('developer-mode-timestamp');
    const isDev = sessionStorage.getItem('developer-mode') === 'true';

    if (isDev && storedTimestamp) {
      const lastActivity = parseInt(storedTimestamp, 10);
      const now = Date.now();
      const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

      // If last activity was more than 30 minutes ago, sign out
      if (now - lastActivity > INACTIVITY_TIMEOUT) {
        setIsDeveloperMode(false);
        sessionStorage.removeItem('developer-mode');
        sessionStorage.removeItem('developer-mode-timestamp');
      }
    }
  }, []);

  // Memoize expensive recommendations calculation
  const recommendations = useMemo(
    () => generateRecommendations(taskLibrary, archive, dismissedRecommendations, tasks),
    [taskLibrary, archive, dismissedRecommendations, tasks]
  );

  // Memoize goal recommendations
  const goalRecommendations = useMemo(
    () => goalPlan ? getGoalRecommendations(goalPlan, archive, tasks).filter(
      rec => !dismissedGoalIds.includes(rec.goal.id)
    ) : [],
    [goalPlan, archive, tasks, dismissedGoalIds]
  );

  const handleAddRecommendation = useCallback((task: Task) => {
    setFadingOutIds(prev => [...prev, task.id]);
    setTimeout(() => {
      onAddRecommendation(task);
      setFadingOutIds(prev => prev.filter(id => id !== task.id));
    }, 300);
  }, [onAddRecommendation]);

  const handleDismissRecommendation = useCallback((taskId: string) => {
    setFadingOutIds(prev => [...prev, taskId]);
    setTimeout(() => {
      onDismissRecommendation(taskId);
      setFadingOutIds(prev => prev.filter(id => id !== taskId));
    }, 300);
  }, [onDismissRecommendation]);

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedTask) return;

    const dragIndex = tasks.findIndex(t => t.id === draggedTask.id);
    if (dragIndex === dropIndex) {
      setDraggedTask(null);
      setDragOverIndex(null);
      return;
    }

    const newTasks = [...tasks];
    newTasks.splice(dragIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);

    onReorderTasks(newTasks);
    setDraggedTask(null);
    setDragOverIndex(null);
  }, [draggedTask, tasks, onReorderTasks]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverIndex(null);
  }, []);

  const canInteract = !!activeDaySession;

  return (
    <div className="task-list">
      <div className="task-list-header">
        <h1 onClick={handleTitleClick} style={{ cursor: 'pointer', userSelect: 'none' }}>My Tasks</h1>
        <div className="header-actions">
          {onShowFlowchart && (
            <button className="btn btn-secondary" onClick={onShowFlowchart}>
              📊 Flowchart
            </button>
          )}
          {isDeveloperMode && onShowBackup && (
            <button className="btn btn-secondary" onClick={onShowBackup}>
              ☁️ Backup
            </button>
          )}
          <button className="btn btn-secondary" onClick={onShowTimeline}>
            📅 Timeline
          </button>
          <button className="btn btn-secondary" onClick={onShowArchive}>
            📦 Archive
          </button>
          <button className="btn btn-secondary" onClick={onShowStats}>
            Show Track
          </button>
        </div>
      </div>

      {!activeDaySession && (
        <div className="warning-message">
          Start your day to begin tracking tasks
        </div>
      )}

      {activeDaySession && (
        <div className="add-task-section">
          <button className="btn btn-add-task" onClick={onShowAddTask}>
            + ADD NEW TASK
          </button>
        </div>
      )}

      {tasks.length > 0 && (
        <h2 className="section-title">━━━ Today's Tasks ━━━</h2>
      )}

      {tasks.length === 0 && activeDaySession && (
        <div className="empty-tasks">
          <p>No tasks added yet</p>
          <p className="empty-subtitle">Add tasks from recommendations or create a new one</p>
        </div>
      )}

      <div className="tasks-grid">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`task-card ${task.type} ${!canInteract ? 'disabled' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${draggedTask?.id === task.id ? 'dragging' : ''}`}
            draggable={canInteract}
            onDragStart={(e) => handleDragStart(e, task)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="task-card-header">
              {canInteract && (
                <span className="drag-handle" title="Drag to reorder">
                  ⋮⋮
                </span>
              )}
              <span className="task-icon">{task.icon || getTaskIcon(task.type)}</span>
              <h3 className="task-name">
                {task.priority && (
                  <span className={`priority-badge priority-${task.priority}`}>
                    {task.priority === 'high' && '🔴'}
                    {task.priority === 'medium' && '🟡'}
                    {task.priority === 'low' && '🔵'}
                  </span>
                )}
                {task.name}
              </h3>
              <button
                className="btn-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTask(task);
                }}
                title="Edit task"
              >
                ✏️
              </button>
            </div>

            <div className="task-card-body" onClick={() => canInteract && onTaskClick(task.id)}>
              {task.type === 'duration' && (
                <>
                  <div className="task-stat">
                    <span className="stat-label">Today:</span>
                    <span className="stat-value">
                      {formatDurationShort(calculateTodayDuration(task))}
                      {task.target && ` / ${task.target.value}min`}
                    </span>
                  </div>
                  <div className="task-stat">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{formatDurationShort(calculateTotalDuration(task))}</span>
                  </div>
                </>
              )}

              {task.type === 'count' && (
                <>
                  <div className="task-stat">
                    <span className="stat-label">Today:</span>
                    <span className="stat-value">
                      {calculateTodayCount(task)}
                      {task.target && ` / ${task.target.value} ${task.target.unit}`}
                    </span>
                  </div>
                  <div className="task-stat">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{calculateTotalCount(task)} {task.target?.unit || 'reps'}</span>
                  </div>
                </>
              )}

              {task.type === 'completion' && (
                <>
                  <div className="task-stat">
                    <span className="stat-label">Today:</span>
                    <span className="stat-value">
                      {getTodayCompletion(task) ? '✓ Complete' : '○ Not Yet'}
                    </span>
                  </div>
                  <div className="task-stat">
                    <span className="stat-label">Streak:</span>
                    <span className="stat-value">
                      {calculateStreak(task) > 0 ? `🔥 ${calculateStreak(task)} days` : '-'}
                    </span>
                  </div>
                </>
              )}

              {task.type === 'homework' && task.homework && (
                <>
                  <div className="task-stat">
                    <span className="stat-label">Subject:</span>
                    <span className="stat-value">{task.homework.subject}</span>
                  </div>
                  <div className="task-stat">
                    <span className="stat-label">Due:</span>
                    <span className="stat-value">
                      {new Date(task.homework.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="task-stat">
                    <span className="stat-label">Status:</span>
                    <span className="stat-value">
                      {task.homework.submitted ? '✓ Submitted' : getTodayCompletion(task) ? '✓ Done' : '○ Pending'}
                    </span>
                  </div>
                </>
              )}

              {/* Goal Context */}
              {task.linkedGoalId && goalPlan && (
                <div className="task-goal-context">
                  🎯 {(() => {
                    const linkedGoal = goalPlan.goals.find(g => g.id === task.linkedGoalId);
                    return linkedGoal ? getGoalPath(linkedGoal, goalPlan) : 'Goal not found';
                  })()}
                </div>
              )}
            </div>

            <div className="task-card-footer">
              <span className="task-type-label">{task.type}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Goal-based recommendations */}
      {goalRecommendations.length > 0 && activeDaySession && goalPlan && (
        <GoalRecommendations
          recommendations={goalRecommendations}
          goalPlan={goalPlan}
          onAddTask={onAddRecommendation}
          onDismiss={(goalId) => setDismissedGoalIds(prev => [...prev, goalId])}
        />
      )}

      {recommendations.length > 0 && activeDaySession && (
        <div className="recommendations-section">
          <h2 className="section-title">📌 Recommended from your routine</h2>
          <div className="recommendations-list">
            {recommendations.map((rec) => (
              <div
                key={rec.task.id}
                className={`recommendation-card ${fadingOutIds.includes(rec.task.id) ? 'fading-out' : ''}`}
              >
                <div className="rec-info">
                  <span className="rec-icon">
                    {rec.task.type === 'duration' && '⏱️'}
                    {rec.task.type === 'count' && '💪'}
                    {rec.task.type === 'completion' && '☑️'}
                  </span>
                  <div className="rec-details">
                    <h3>{rec.task.name}</h3>
                    <p className="rec-meta">{rec.lastDone}</p>
                  </div>
                </div>
                <div className="rec-actions">
                  <button
                    className="btn btn-sm btn-add-rec"
                    onClick={() => handleAddRecommendation(rec.task)}
                  >
                    + ADD
                  </button>
                  <button
                    className="btn btn-sm btn-dismiss"
                    onClick={() => handleDismissRecommendation(rec.task.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDeveloperModal && (
        <DeveloperModeModal
          onClose={() => setShowDeveloperModal(false)}
          onAuthenticate={handleAuthenticate}
        />
      )}
    </div>
  );
}

export default memo(TaskList);
