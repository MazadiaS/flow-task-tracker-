import { useState } from 'react';
import type { Task, TaskType } from '../../types';
import type { GoalPlan } from '../../types/goals';
import { getCurrentWeekGoals } from '../../utils/goalCalculations';
import { getGoalPath } from '../../utils/goalVisualization';
import { sanitizeTaskName, sanitizeNumber } from '../../utils/security';
import { useAISuggestion } from '../../hooks/useAISuggestion';
import './AddTaskModal.css';

interface Props {
  task: Task;
  goalPlan?: GoalPlan;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: () => void;
}

const TASK_ICONS = ['⏱️', '💪', '☑️', '📚', '🎯', '🏃', '🧘', '💻', '🎨', '🎵'];

function EditTaskModal({ task, goalPlan, onClose, onUpdateTask, onDeleteTask }: Props) {
  // Use custom hook for AI suggestions - eliminates duplicate logic
  const {
    taskName,
    setTaskName,
    aiSuggestion,
    isLoadingSuggestion,
    handleGetSuggestion,
    handleApplySuggestion,
    handleDismissSuggestion
  } = useAISuggestion(task.name);

  const [taskType, setTaskType] = useState<TaskType>(task.type);
  const [targetValue, setTargetValue] = useState(task.target?.value || 30);
  const [selectedIcon, setSelectedIcon] = useState(task.icon || '⏱️');
  const [linkedGoalId, setLinkedGoalId] = useState<string>(task.linkedGoalId || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get current week goals for dropdown
  const weekGoals = goalPlan ? getCurrentWeekGoals(goalPlan) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      alert('Please enter a task name');
      return;
    }

    const unit = taskType === 'duration' ? 'minutes' : taskType === 'count' ? 'reps' : 'times';

    // Sanitize all user inputs to prevent XSS attacks
    const sanitizedTaskName = sanitizeTaskName(taskName);
    const sanitizedTarget = sanitizeNumber(targetValue, 1, 10000);

    // Build updated task, preserving type-specific data only when type matches
    const updatedTask: Task = {
      ...task,
      name: sanitizedTaskName,
      type: taskType,
      icon: selectedIcon,
      target: {
        value: sanitizedTarget,
        unit
      },
      linkedGoalId: linkedGoalId || undefined,
      goalContext: linkedGoalId && goalPlan ? (() => {
        const goal = goalPlan.goals.find(g => g.id === linkedGoalId);
        return goal ? getGoalPath(goal, goalPlan) : undefined;
      })() : undefined,
      // Clean up type-specific data when type changes
      sessions: taskType === 'duration' && task.type === 'duration' ? task.sessions : undefined,
      countLogs: taskType === 'count' && task.type === 'count' ? task.countLogs : undefined,
      completions: (taskType === 'completion' && task.type === 'completion') ||
                   (taskType === 'homework' && task.type === 'homework') ? task.completions : undefined,
      homework: taskType === 'homework' && task.type === 'homework' ? task.homework : undefined
    };

    onUpdateTask(updatedTask);
    onClose();
  };

  const handleDelete = () => {
    onDeleteTask();
    onClose();
  };

  const getUnitLabel = () => {
    switch (taskType) {
      case 'duration':
        return 'minutes';
      case 'count':
        return 'reps';
      case 'completion':
        return 'times';
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Delete Task</h2>
            <button className="btn-close" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="delete-confirm-content">
            <p>Are you sure you want to delete "{task.name}"?</p>
            <p className="warning-text">This will remove all history and data for this task.</p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-task-form">
          <div className="form-group">
            <div className="label-with-action">
              <label>Task Name</label>
              <button
                type="button"
                className="btn-ai-suggest"
                onClick={handleGetSuggestion}
                disabled={isLoadingSuggestion || !taskName.trim() || taskName.trim().length < 3}
                title="Get AI suggestion"
              >
                {isLoadingSuggestion ? '✨ ...' : '✨ AI Help'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter task name..."
              value={taskName}
              onChange={(e) => {
                setTaskName(e.target.value);
                handleDismissSuggestion();
              }}
              autoFocus
              spellCheck="true"
            />
            {aiSuggestion && (
              <div className="ai-suggestion-box">
                <div className="suggestion-content">
                  <span className="suggestion-icon">💡</span>
                  <span className="suggestion-text">{aiSuggestion}</span>
                </div>
                <div className="suggestion-actions">
                  <button
                    type="button"
                    className="btn-suggestion-apply"
                    onClick={handleApplySuggestion}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="btn-suggestion-dismiss"
                    onClick={handleDismissSuggestion}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Task Type</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="taskType"
                  value="duration"
                  checked={taskType === 'duration'}
                  onChange={() => setTaskType('duration')}
                />
                <span>Duration (timer)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="taskType"
                  value="count"
                  checked={taskType === 'count'}
                  onChange={() => setTaskType('count')}
                />
                <span>Count (reps/times)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="taskType"
                  value="completion"
                  checked={taskType === 'completion'}
                  onChange={() => setTaskType('completion')}
                />
                <span>Completion (yes/no)</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Target</label>
            <div className="target-input">
              <input
                type="number"
                value={targetValue}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  // Limit duration to 24 hours (1440 minutes)
                  if (taskType === 'duration') {
                    setTargetValue(Math.min(value, 1440));
                  } else {
                    setTargetValue(value);
                  }
                }}
                min="1"
                max={taskType === 'duration' ? 1440 : undefined}
                placeholder={taskType === 'duration' ? 'Max 1440 (24h)' : 'Enter value'}
              />
              <span className="target-unit">{getUnitLabel()}</span>
            </div>
          </div>

          {goalPlan && (
            <div className="form-group">
              <label>
                🎯 Link to Goal <span className="label-optional">(optional)</span>
              </label>
              {weekGoals.length === 0 ? (
                <p className="form-hint">
                  No active goals for this week. Create week goals in Goals view.
                </p>
              ) : (
                <>
                  <select
                    value={linkedGoalId}
                    onChange={(e) => setLinkedGoalId(e.target.value)}
                    className="goal-selector"
                  >
                    <option value="">No goal (standalone task)</option>
                    {weekGoals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {getGoalPath(goal, goalPlan)}
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">
                    Link this task to a goal from your current week to track progress
                  </p>
                </>
              )}
            </div>
          )}

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-selector">
              {TASK_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-button ${selectedIcon === icon ? 'selected' : ''}`}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
            <div className="action-group">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTaskModal;
