import { useState } from 'react';
import type { Task, TaskType, TaskPriority, HomeworkData } from '../../types';
import type { GoalPlan } from '../../types/goals';
import { getCurrentWeekGoals } from '../../utils/goalCalculations';
import { getGoalPath } from '../../utils/goalVisualization';
import { getTodayDateString } from '../../utils/timeUtils';
import { sanitizeTaskName, sanitizeNumber } from '../../utils/security';
import { useAISuggestion } from '../../hooks/useAISuggestion';
import './AddTaskModal.css';

interface Props {
  onClose: () => void;
  onAddTask: (task: Task) => void;
  existingTasks?: Task[];
  goalPlan?: GoalPlan;
}

function AddTaskModal({ onClose, onAddTask, existingTasks = [], goalPlan }: Props) {
  // Use custom hook for AI suggestions - eliminates duplicate logic
  const {
    taskName,
    setTaskName,
    aiSuggestion,
    isLoadingSuggestion,
    handleGetSuggestion,
    handleApplySuggestion,
    handleDismissSuggestion
  } = useAISuggestion();

  const [taskType, setTaskType] = useState<TaskType | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [targetValue, setTargetValue] = useState(30);
  const [linkedGoalId, setLinkedGoalId] = useState<string>('');

  // Homework-specific fields
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignmentType, setAssignmentType] = useState<HomeworkData['assignmentType']>('other');
  const [difficulty, setDifficulty] = useState<HomeworkData['difficulty']>('medium');
  const [estimatedTime, setEstimatedTime] = useState(60);

  // Get current week goals for dropdown
  const weekGoals = goalPlan ? getCurrentWeekGoals(goalPlan) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      alert('Please enter a task name');
      return;
    }

    if (!taskType) {
      alert('Please select a task type');
      return;
    }

    if (!priority) {
      alert('Please select a priority level');
      return;
    }

    // Check for duplicate task names
    const isDuplicate = existingTasks.some(
      task => task.name.toLowerCase().trim() === taskName.toLowerCase().trim()
    );

    if (isDuplicate) {
      alert(`A task with the name "${taskName}" already exists in today's session. Please use a different name.`);
      return;
    }

    // Validate homework-specific fields
    if (taskType === 'homework') {
      if (!subject.trim()) {
        alert('Please enter a subject for homework');
        return;
      }
      if (!dueDate) {
        alert('Please select a due date for homework');
        return;
      }
    }

    const unit = taskType === 'duration' ? 'minutes' : taskType === 'count' ? 'reps' : 'times';

    const now = Date.now();
    const importanceMap = { high: 8, medium: 5, low: 3 };

    // Sanitize all user inputs to prevent XSS attacks
    const sanitizedTaskName = sanitizeTaskName(taskName);
    const sanitizedSubject = sanitizeTaskName(subject);
    const sanitizedTarget = sanitizeNumber(targetValue, 1, 10000);

    const newTask: Task = {
      id: now.toString(),
      name: sanitizedTaskName,
      type: taskType,
      priority: priority,
      importance: importanceMap[priority],
      order: 0,
      target: taskType !== 'homework' ? {
        value: sanitizedTarget,
        unit
      } : undefined,
      notes: '',
      sessions: taskType === 'duration' ? [] : undefined,
      countLogs: taskType === 'count' ? [] : undefined,
      completions: taskType === 'completion' || taskType === 'homework' ? [] : undefined,
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now,
      linkedGoalId: linkedGoalId || undefined,
      homework: taskType === 'homework' ? {
        subject: sanitizedSubject,
        dueDate,
        assignmentType,
        difficulty,
        estimatedTime: sanitizeNumber(estimatedTime || 0, 0, 1440), // Max 24 hours
        submitted: false,
        resources: [] // Will be sanitized when added via EditTaskModal
      } : undefined
    };

    onAddTask(newTask);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
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
                  onChange={() => setTaskType('duration' as TaskType)}
                />
                <span>Duration (timer)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="taskType"
                  value="count"
                  checked={taskType === 'count'}
                  onChange={() => setTaskType('count' as TaskType)}
                />
                <span>Count (reps/times)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="taskType"
                  value="completion"
                  checked={taskType === 'completion'}
                  onChange={() => setTaskType('completion' as TaskType)}
                />
                <span>Completion (yes/no)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="taskType"
                  value="homework"
                  checked={taskType === 'homework'}
                  onChange={() => setTaskType('homework' as TaskType)}
                />
                <span>📚 Homework (student mode)</span>
              </label>
            </div>
          </div>

          {taskType === 'homework' && (
            <>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics, History..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  spellCheck="true"
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={getTodayDateString()}
                />
              </div>

              <div className="form-group">
                <label>Assignment Type</label>
                <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value as HomeworkData['assignmentType'])}>
                  <option value="reading">📖 Reading</option>
                  <option value="writing">✍️ Writing/Essay</option>
                  <option value="problem-set">🔢 Problem Set</option>
                  <option value="project">🎨 Project</option>
                  <option value="exam-prep">📝 Exam Prep</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Difficulty Level</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="difficulty"
                      value="easy"
                      checked={difficulty === 'easy'}
                      onChange={() => setDifficulty('easy')}
                    />
                    <span>😊 Easy</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="difficulty"
                      value="medium"
                      checked={difficulty === 'medium'}
                      onChange={() => setDifficulty('medium')}
                    />
                    <span>🤔 Medium</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="difficulty"
                      value="hard"
                      checked={difficulty === 'hard'}
                      onChange={() => setDifficulty('hard')}
                    />
                    <span>😰 Hard</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Estimated Time (minutes)</label>
                <input
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="How long will this take?"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Priority</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="priority"
                  value="high"
                  checked={priority === 'high'}
                  onChange={() => setPriority('high' as TaskPriority)}
                />
                <span className="priority-text-high">High (Critical)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="priority"
                  value="medium"
                  checked={priority === 'medium'}
                  onChange={() => setPriority('medium' as TaskPriority)}
                />
                <span className="priority-text-medium">Medium (Important)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="priority"
                  value="low"
                  checked={priority === 'low'}
                  onChange={() => setPriority('low' as TaskPriority)}
                />
                <span className="priority-text-low">Low (Nice to have)</span>
              </label>
            </div>
          </div>

          {goalPlan && weekGoals.length > 0 && (
            <div className="form-group">
              <label>
                🎯 Link to Goal <span className="label-optional">(optional)</span>
              </label>
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
            </div>
          )}

          {taskType !== 'homework' && taskType !== '' && (
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
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;
