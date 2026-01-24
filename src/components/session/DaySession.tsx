import { useState, useEffect, memo } from 'react';
import type { AppState, DaySession as DaySessionType, DayArchive, ArchivedTask, Task } from '../../types';
import { formatTime, formatDurationShort, isToday, getTodayDateString, isSameLocalDate } from '../../utils/timeUtils';
import EndDayModal from '../modals/EndDayModal';
import UserMenu from '../Auth/UserMenu';
import './DaySession.css';

interface Props {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onViewChange?: (view: 'start' | 'list' | 'detail' | 'stats' | 'archive') => void;
  onShowArchive?: () => void;
  onShowBackup?: () => void;
}

function DaySession({ state, setState, onViewChange, onShowArchive, onShowBackup }: Props) {
  const [currentDayDuration, setCurrentDayDuration] = useState(0);
  const [showEndDaySummary, setShowEndDaySummary] = useState(false);
  const [showEndDayConfirm, setShowEndDayConfirm] = useState(false);

  useEffect(() => {
    if (!state.activeDaySession) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.activeDaySession!.startTime) / 1000);
      setCurrentDayDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.activeDaySession]);

  const startDay = () => {
    const now = Date.now();
    const newDaySession: DaySessionType = {
      date: now,
      startTime: now,
      taskSessions: [],
      totalActiveTime: 0
    };

    setState(prev => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        isActive: true,
        startTime: now,
        dismissedRecommendations: []
      },
      activeDaySession: newDaySession
    }));

    if (onViewChange) {
      onViewChange('list');
    }
  };

  const getIncompleteTasks = (): Task[] => {
    return state.currentDay.tasks.filter(task => {
      if (task.type === 'duration' && task.sessions && task.target) {
        const totalMinutes = Math.floor(task.sessions.reduce((sum, s) => sum + s.duration, 0) / 60);
        return totalMinutes < task.target.value;
      } else if (task.type === 'count' && task.countLogs && task.target) {
        const totalCount = task.countLogs.reduce((sum, l) => sum + l.count, 0);
        return totalCount < task.target.value;
      } else if (task.type === 'completion' && task.completions) {
        const todayCompletion = task.completions.find(c => isToday(c.date) && c.completed);
        return !todayCompletion;
      }
      return false;
    });
  };

  const confirmEndDay = () => {
    setShowEndDayConfirm(true);
  };

  const cancelEndDay = () => {
    setShowEndDayConfirm(false);
  };

  interface IncompleteTaskData {
    task: Task;
    reason: string;
    remindTomorrow: boolean;
  }

  const endDay = (incompleteTaskData?: IncompleteTaskData[]) => {
    if (!state.activeDaySession || !state.currentDay.isActive) return;

    setShowEndDayConfirm(false);

    // TODO: Store incomplete task data for tomorrow's reminders
    // This could be added to the archive or a separate reminder system
    if (import.meta.env.DEV && incompleteTaskData && incompleteTaskData.length > 0) {
      console.log('Incomplete task reasons:', incompleteTaskData);
    }
    const endTime = Date.now();
    const totalDayDuration = Math.floor((endTime - state.activeDaySession.startTime) / 1000);
    const totalInactiveTime = totalDayDuration - state.activeDaySession.totalActiveTime;

    // Create archived tasks from current day tasks
    const archivedTasks: ArchivedTask[] = state.currentDay.tasks.map(task => {
      let actualValue = 0;
      let actualUnit = task.target?.unit || 'minutes';
      let completed = false;

      if (task.type === 'duration' && task.sessions) {
        actualValue = Math.floor(task.sessions.reduce((sum, s) => sum + s.duration, 0) / 60);
        completed = task.target ? actualValue >= task.target.value : false;
      } else if (task.type === 'count' && task.countLogs) {
        actualValue = task.countLogs.reduce((sum, l) => sum + l.count, 0);
        completed = task.target ? actualValue >= task.target.value : false;
      } else if (task.type === 'completion' && task.completions) {
        const todayCompletion = task.completions.find(c => {
          return isSameLocalDate(c.date, Date.now()) && c.completed;
        });
        completed = !!todayCompletion;
        actualValue = completed ? 1 : 0;
      }

      return {
        taskId: task.id,
        taskName: task.name,
        taskType: task.type,
        target: task.target,
        actual: {
          value: actualValue,
          unit: actualUnit
        },
        sessions: (task.sessions || task.countLogs || task.completions || []) as any,
        notes: task.notes,
        completed,
        icon: task.icon,
        linkedGoalId: task.linkedGoalId
      };
    });

    // Create day archive
    const dayArchive: DayArchive = {
      date: new Date(state.activeDaySession.startTime).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      dateTimestamp: state.activeDaySession.startTime,
      daySession: {
        startTime: state.activeDaySession.startTime,
        endTime,
        totalDuration: totalDayDuration,
        activeDuration: state.activeDaySession.totalActiveTime,
        inactiveDuration: totalInactiveTime
      },
      tasks: archivedTasks
    };

    setState(prev => ({
      ...prev,
      currentDay: {
        date: getTodayDateString(),
        isActive: false,
        tasks: [],
        dismissedRecommendations: []
      },
      archive: [...prev.archive, dayArchive],
      activeDaySession: undefined
    }));

    setShowEndDaySummary(true);
  };

  const closeSummary = () => {
    setShowEndDaySummary(false);
    if (onViewChange) {
      onViewChange('start');
    }
  };

  const lastCompletedArchive = state.archive[state.archive.length - 1];

  if (showEndDayConfirm) {
    const incompleteTasks = getIncompleteTasks();

    return (
      <EndDayModal
        incompleteTasks={incompleteTasks}
        onConfirmEndDay={endDay}
        onCancel={cancelEndDay}
      />
    );
  }

  if (showEndDaySummary && lastCompletedArchive) {
    return (
      <div className="day-summary-modal">
        <div className="day-summary-content">
          <h2>Day Summary - {lastCompletedArchive.date}</h2>

          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Day Duration:</span>
              <span className="stat-value">{formatDurationShort(lastCompletedArchive.daySession.totalDuration)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active (Task Work):</span>
              <span className="stat-value active">{formatDurationShort(lastCompletedArchive.daySession.activeDuration)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Inactive Time:</span>
              <span className="stat-value inactive">{formatDurationShort(lastCompletedArchive.daySession.inactiveDuration)}</span>
            </div>
          </div>

          <div className="task-breakdown">
            <h3>Tasks Completed:</h3>
            {lastCompletedArchive.tasks.length === 0 ? (
              <p className="no-tasks">No tasks completed today</p>
            ) : (
              <ul>
                {lastCompletedArchive.tasks.map((task, index) => (
                  <li key={index} className="task-session-item">
                    <span className="task-icon">
                      {task.taskType === 'duration' && '⏱️'}
                      {task.taskType === 'count' && '💪'}
                      {task.taskType === 'completion' && '☑️'}
                    </span>
                    <span className="task-name">{task.taskName}:</span>
                    <span className="task-value">
                      {task.actual.value} {task.actual.unit}
                      {task.completed ? ' ✓' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="btn btn-primary" onClick={closeSummary}>
            Finish
          </button>
        </div>
      </div>
    );
  }

  if (!state.currentDay.isActive) {
    return (
      <div className="day-session-start">
        <div className="user-menu-container">
          <UserMenu />
        </div>
        <div className="start-day-container">
          <h1 className="app-title">Flow</h1>
          <h2 className="current-date">{new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</h2>
          <button className="btn btn-start-day" onClick={startDay}>
            START DAY
          </button>
          <div className="bottom-links">
            {onShowArchive && (
              <button className="link-btn" onClick={onShowArchive}>
                View Archive
              </button>
            )}
            {onShowBackup && (
              <button className="link-btn" onClick={onShowBackup}>
                Backup & Sync
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="day-session-active">
      <div className="day-info">
        <span className="day-started">Day started at: {state.activeDaySession ? formatTime(state.activeDaySession.startTime) : '-'}</span>
        <span className="day-duration">Day duration: {formatDurationShort(currentDayDuration)}</span>
      </div>
      <div className="session-actions">
        <UserMenu />
        <button className="btn btn-end-day" onClick={confirmEndDay}>
          END DAY
        </button>
      </div>
    </div>
  );
}

export default memo(DaySession);
