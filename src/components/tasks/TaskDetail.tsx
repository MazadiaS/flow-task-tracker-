import { useState, useEffect, memo } from 'react';
import type { Task, AppState, TaskSession, CountLog, CompletionLog, CompletionStatus } from '../../types';
import { formatDuration, formatDate, formatTime, formatDurationShort, isToday } from '../../utils/timeUtils';
import { sanitizeNotes } from '../../utils/security';
import { showTimerCompleteNotification } from '../../utils/notifications';
import FullscreenTimer from '../shared/FullscreenTimer';
import SubtaskManager from '../shared/SubtaskManager';
import EstimatedTimeModal from '../modals/EstimatedTimeModal';
import CompletionStatusModal from '../modals/CompletionStatusModal';
import './TaskDetail.css';

interface Props {
  task: Task;
  onBack: () => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

function TaskDetail({ task, onBack, updateTask, state, setState }: Props) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState(task.notes);
  const [sessionNotes, setSessionNotes] = useState('');
  const [countInput, setCountInput] = useState(task.target?.value || 50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const isTimerActive = state.activeTaskTimer?.taskId === task.id;

  useEffect(() => {
    if (!isTimerActive) return;

    setIsRunning(true);
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.activeTaskTimer!.startTime) / 1000);
      setCurrentTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, state.activeTaskTimer]);

  const handleStartTimerClick = () => {
    if (!state.activeDaySession) {
      alert('Please start your day first!');
      return;
    }
    // Show estimate modal before starting
    setShowEstimateModal(true);
  };

  const startTimerWithEstimate = (estimatedMinutes: number | null) => {
    setEstimatedDuration(estimatedMinutes);
    setShowEstimateModal(false);

    setState(prev => ({
      ...prev,
      activeTaskTimer: {
        taskId: task.id,
        startTime: Date.now()
      }
    }));
  };

  const stopTimer = () => {
    if (!state.activeTaskTimer) return;

    const duration = Math.floor((Date.now() - state.activeTaskTimer.startTime) / 1000);
    const estimatedSeconds = estimatedDuration ? estimatedDuration * 60 : undefined;
    const wentOvertime = estimatedSeconds ? duration > estimatedSeconds : undefined;

    const newSession: TaskSession = {
      date: Date.now(),
      duration,
      estimatedDuration: estimatedSeconds,
      wentOvertime,
      notes: sessionNotes
    };

    const updatedSessions = [...(task.sessions || []), newSession];
    updateTask(task.id, { sessions: updatedSessions });

    // Show browser notification for timer completion
    showTimerCompleteNotification(task.name, duration);

    // Add to day session
    if (state.activeDaySession) {
      setState(prev => ({
        ...prev,
        activeDaySession: {
          ...prev.activeDaySession!,
          taskSessions: [
            ...prev.activeDaySession!.taskSessions,
            {
              taskId: task.id,
              taskName: task.name,
              taskType: task.type,
              duration,
              startTime: state.activeTaskTimer!.startTime,
              endTime: Date.now()
            }
          ],
          totalActiveTime: prev.activeDaySession!.totalActiveTime + duration
        },
        activeTaskTimer: undefined
      }));
    }

    setIsRunning(false);
    setCurrentTime(0);
    setSessionNotes('');
    setEstimatedDuration(null);
  };

  const saveNotes = () => {
    // Sanitize notes to prevent XSS attacks
    const sanitizedNotes = sanitizeNotes(notes);
    updateTask(task.id, { notes: sanitizedNotes });
  };

  const handleAddSubtask = (parentId: string, subtask: Task) => {
    const addSubtaskToTask = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (t.id === parentId) {
          return {
            ...t,
            subtasks: [...(t.subtasks || []), subtask]
          };
        }
        if (t.subtasks && t.subtasks.length > 0) {
          return {
            ...t,
            subtasks: addSubtaskToTask(t.subtasks)
          };
        }
        return t;
      });
    };

    setState(prev => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        tasks: addSubtaskToTask(prev.currentDay.tasks)
      }
    }));
  };

  const handleUpdateSubtask = (updatedSubtask: Task) => {
    const updateSubtaskInTask = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (t.id === updatedSubtask.id) {
          return updatedSubtask;
        }
        if (t.subtasks && t.subtasks.length > 0) {
          return {
            ...t,
            subtasks: updateSubtaskInTask(t.subtasks)
          };
        }
        return t;
      });
    };

    setState(prev => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        tasks: updateSubtaskInTask(prev.currentDay.tasks)
      }
    }));
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const deleteSubtaskFromTask = (tasks: Task[]): Task[] => {
      return tasks.map(t => ({
        ...t,
        subtasks: t.subtasks
          ? deleteSubtaskFromTask(t.subtasks.filter(st => st.id !== subtaskId))
          : t.subtasks
      }));
    };

    setState(prev => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        tasks: deleteSubtaskFromTask(prev.currentDay.tasks)
      }
    }));
  };

  const handleToggleSubtask = (taskId: string) => {
    const toggleInTask = (tasks: Task[]): Task[] => {
      return tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            isCollapsed: !t.isCollapsed
          };
        }
        if (t.subtasks && t.subtasks.length > 0) {
          return {
            ...t,
            subtasks: toggleInTask(t.subtasks)
          };
        }
        return t;
      });
    };

    setState(prev => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        tasks: toggleInTask(prev.currentDay.tasks)
      }
    }));
  };

  const logCount = () => {
    if (!state.activeDaySession) {
      alert('Please start your day first!');
      return;
    }

    const newLog: CountLog = {
      date: Date.now(),
      count: countInput,
      notes: sessionNotes
    };

    const updatedLogs = [...(task.countLogs || []), newLog];
    updateTask(task.id, { countLogs: updatedLogs });

    // Add to day session
    if (state.activeDaySession) {
      setState(prev => ({
        ...prev,
        activeDaySession: {
          ...prev.activeDaySession!,
          taskSessions: [
            ...prev.activeDaySession!.taskSessions,
            {
              taskId: task.id,
              taskName: task.name,
              taskType: task.type,
              count: countInput,
              startTime: Date.now(),
              endTime: Date.now()
            }
          ]
        }
      }));
    }

    setSessionNotes('');
    setCountInput(task.target?.value || 50);
  };

  const toggleCompletion = () => {
    if (!state.activeDaySession) {
      alert('Please start your day first!');
      return;
    }

    const todayCompleted = task.completions?.some(c => isToday(c.date) && c.completed);

    if (todayCompleted) {
      // Remove today's completion
      const updatedCompletions = task.completions?.filter(c => !isToday(c.date)) || [];
      updateTask(task.id, { completions: updatedCompletions });
    } else {
      // Show modal to choose completion status
      setShowCompletionModal(true);
    }
  };

  const handleCompletionStatus = (status: CompletionStatus, percentage?: number, notes?: string) => {
    const updatedCompletions = [...(task.completions || [])];
    const todayIndex = updatedCompletions.findIndex(c => isToday(c.date));

    const newCompletion: CompletionLog = {
      date: Date.now(),
      completed: status === 'done' || status === 'partial',
      status,
      completionPercentage: percentage,
      notes: notes || sessionNotes
    };

    if (todayIndex >= 0) {
      updatedCompletions[todayIndex] = newCompletion;
    } else {
      updatedCompletions.push(newCompletion);
    }

    // Add to day session
    if (state.activeDaySession) {
      setState(prev => ({
        ...prev,
        activeDaySession: {
          ...prev.activeDaySession!,
          taskSessions: [
            ...prev.activeDaySession!.taskSessions,
            {
              taskId: task.id,
              taskName: task.name,
              taskType: task.type,
              completed: status === 'done' || status === 'partial',
              startTime: Date.now(),
              endTime: Date.now()
            }
          ]
        }
      }));
    }

    updateTask(task.id, { completions: updatedCompletions });
    setSessionNotes('');
    setShowCompletionModal(false);
  };

  const getTodayCompletion = (): boolean => {
    return task.completions?.some(c => isToday(c.date) && c.completed) || false;
  };

  if (isFullscreen && task.type === 'duration') {
    return (
      <FullscreenTimer
        task={task}
        currentTime={currentTime}
        isRunning={isRunning}
        estimatedDuration={estimatedDuration}
        onStop={stopTimer}
        onExit={() => setIsFullscreen(false)}
      />
    );
  }

  return (
    <div className="task-detail">
      <div className="task-detail-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back
        </button>
        <h1>{task.name}</h1>
      </div>

      {task.type === 'duration' && (
        <div className="timer-section">
          {task.target && (
            <div className="target-info">
              Target: {task.target.value} {task.target.unit}
            </div>
          )}

          <div className="timer-display-container">
            <div className="timer-display">{formatDuration(currentTime)}</div>
            <button
              className="btn-fullscreen"
              onClick={() => setIsFullscreen(true)}
              disabled={!isRunning}
            >
              ⛶
            </button>
          </div>

          <div className="timer-controls">
            {!isRunning ? (
              <button className="btn btn-start" onClick={handleStartTimerClick}>
                START
              </button>
            ) : (
              <button className="btn btn-stop" onClick={stopTimer}>
                STOP
              </button>
            )}
          </div>

          {showEstimateModal && (
            <EstimatedTimeModal
              taskName={task.name}
              onConfirm={startTimerWithEstimate}
              onSkip={() => startTimerWithEstimate(null)}
            />
          )}

          <div className="session-notes-input">
            <textarea
              placeholder="Add notes for this session..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              disabled={!isRunning}
              spellCheck="true"
            />
          </div>
        </div>
      )}

      {task.type === 'count' && (
        <div className="count-section">
          {task.target && (
            <div className="target-info">
              Target: {task.target.value} {task.target.unit}
            </div>
          )}

          <div className="count-input-container">
            <p>How many did you complete?</p>
            <div className="count-controls">
              <button
                className="btn btn-count"
                onClick={() => setCountInput(Math.max(0, countInput - 10))}
              >
                -
              </button>
              <input
                type="number"
                className="count-input"
                value={countInput}
                onChange={(e) => setCountInput(parseInt(e.target.value) || 0)}
              />
              <button
                className="btn btn-count"
                onClick={() => setCountInput(countInput + 10)}
              >
                +
              </button>
            </div>
            <button className="btn btn-primary btn-log" onClick={logCount}>
              LOG IT
            </button>
          </div>

          <div className="session-notes-input">
            <textarea
              placeholder="Add notes for this log..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              spellCheck="true"
            />
          </div>
        </div>
      )}

      {task.type === 'completion' && (
        <div className="completion-section">
          <div className="target-info">Daily Goal</div>

          <div className="completion-status">
            <p>Did you complete this today?</p>
            <button
              className={`btn btn-completion ${getTodayCompletion() ? 'completed' : ''}`}
              onClick={toggleCompletion}
            >
              <span className="completion-icon">{getTodayCompletion() ? '✓' : '○'}</span>
              <span>{getTodayCompletion() ? 'MARK INCOMPLETE' : 'MARK COMPLETE'}</span>
            </button>
          </div>

          <div className="session-notes-input">
            <textarea
              placeholder="Add notes..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              spellCheck="true"
            />
          </div>

          {showCompletionModal && (
            <CompletionStatusModal
              taskName={task.name}
              onClose={() => setShowCompletionModal(false)}
              onComplete={handleCompletionStatus}
            />
          )}
        </div>
      )}

      {task.type === 'homework' && task.homework && (
        <div className="homework-section">
          <div className="homework-header">
            <div className="homework-info-grid">
              <div className="homework-info-item">
                <span className="info-label">Subject</span>
                <span className="info-value">{task.homework.subject}</span>
              </div>
              <div className="homework-info-item">
                <span className="info-label">Due Date</span>
                <span className="info-value">
                  {new Date(task.homework.dueDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="homework-info-item">
                <span className="info-label">Type</span>
                <span className="info-value">{task.homework.assignmentType}</span>
              </div>
              <div className="homework-info-item">
                <span className="info-label">Difficulty</span>
                <span className="info-value">
                  {task.homework.difficulty === 'easy' && '😊 Easy'}
                  {task.homework.difficulty === 'medium' && '🤔 Medium'}
                  {task.homework.difficulty === 'hard' && '😰 Hard'}
                </span>
              </div>
              <div className="homework-info-item">
                <span className="info-label">Estimated Time</span>
                <span className="info-value">{task.homework.estimatedTime} min</span>
              </div>
              <div className="homework-info-item">
                <span className="info-label">Status</span>
                <span className="info-value">
                  {task.homework.submitted ? '✅ Submitted' : getTodayCompletion() ? '✓ Done' : '📝 Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="homework-actions">
            {!task.homework.submitted && (
              <button
                className={`btn btn-completion ${getTodayCompletion() ? 'completed' : ''}`}
                onClick={toggleCompletion}
              >
                <span className="completion-icon">{getTodayCompletion() ? '✓' : '○'}</span>
                <span>{getTodayCompletion() ? 'Mark as Not Done' : 'Mark as Done'}</span>
              </button>
            )}

            {getTodayCompletion() && !task.homework.submitted && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  updateTask(task.id, {
                    homework: {
                      ...task.homework!,
                      submitted: true,
                      submittedAt: Date.now()
                    }
                  });
                }}
              >
                🎉 Mark as Submitted
              </button>
            )}

            {task.homework.submitted && (
              <div className="submitted-badge">
                ✅ Submitted on {new Date(task.homework.submittedAt!).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="session-notes-input">
            <textarea
              placeholder="Add notes about your work..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              spellCheck="true"
            />
          </div>

          {showCompletionModal && (
            <CompletionStatusModal
              taskName={task.name}
              onClose={() => setShowCompletionModal(false)}
              onComplete={handleCompletionStatus}
            />
          )}
        </div>
      )}

      <div className="subtasks-section">
        <h2>Subtasks</h2>
        <p className="section-description">
          Break down this task into smaller, manageable subtasks (up to 5 levels deep)
        </p>
        <SubtaskManager
          parentTask={task}
          currentDepth={0}
          onAddSubtask={handleAddSubtask}
          onUpdateSubtask={handleUpdateSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onToggleSubtask={handleToggleSubtask}
        />
      </div>

      <div className="notes-section">
        <h2>Notes</h2>
        <textarea
          className="notes-textarea"
          placeholder="Add notes about your progress, challenges, or insights..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          spellCheck="true"
        />
        <button className="btn btn-secondary" onClick={saveNotes}>
          Save Notes
        </button>
      </div>

      <div className="history-section">
        <h2>History</h2>

        {task.type === 'duration' && (
          <div className="history-list">
            {task.sessions && task.sessions.length > 0 ? (
              [...task.sessions].reverse().map((session, index) => (
                <div key={index} className="history-item">
                  <div className="history-date">
                    {formatDate(session.date)} - {formatTime(session.date)}
                  </div>
                  <div className="history-duration">
                    {formatDurationShort(session.duration)}
                  </div>
                  {session.notes && (
                    <div className="history-notes">{session.notes}</div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-history">No sessions yet</p>
            )}
          </div>
        )}

        {task.type === 'count' && (
          <div className="history-list">
            {task.countLogs && task.countLogs.length > 0 ? (
              [...task.countLogs].reverse().map((log, index) => (
                <div key={index} className="history-item">
                  <div className="history-date">
                    {formatDate(log.date)} - {formatTime(log.date)}
                  </div>
                  <div className="history-count">
                    {log.count} {task.target?.unit || 'reps'}
                  </div>
                  {log.notes && (
                    <div className="history-notes">{log.notes}</div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-history">No logs yet</p>
            )}
          </div>
        )}

        {task.type === 'completion' && (
          <div className="history-list">
            {task.completions && task.completions.length > 0 ? (
              [...task.completions].reverse().map((completion, index) => (
                <div key={index} className="history-item">
                  <div className="history-date">
                    {formatDate(completion.date)}
                  </div>
                  <div className="history-status">
                    {completion.status === 'done' && '✓ Done'}
                    {completion.status === 'partial' && `◐ Partial (${completion.completionPercentage}%)`}
                    {completion.status === 'skipped' && '⊘ Skipped'}
                    {!completion.status && (completion.completed ? '✓ Completed' : '○ Not completed')}
                  </div>
                  {completion.notes && (
                    <div className="history-notes">{completion.notes}</div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-history">No completions yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TaskDetail);
