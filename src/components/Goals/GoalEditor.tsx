import { useState, useEffect } from 'react';
import type { Goal, GoalLevel, GoalStatus } from '../../types/goals';
import { getGoalTimeframe } from '../../utils/goalCalculations';
import './GoalEditor.css';

interface Props {
  goal?: Goal;  // undefined for new goal
  parentGoal?: Goal;  // if creating child
  initialLevel?: GoalLevel;  // explicitly set level for new goal
  initialParentId?: string;  // explicitly set parent ID for new goal
  onSave: (goal: Goal) => void;
  onCancel: () => void;
}

const LEVEL_LABELS: Record<GoalLevel, string> = {
  year: 'Year',
  quarter: 'Quarter',
  month: 'Month',
  week: 'Week',
  day: 'Day'
};

function GoalEditor({ goal, parentGoal, initialLevel, initialParentId, onSave, onCancel }: Props) {
  const isEditing = !!goal;
  const level = goal?.level || initialLevel || (parentGoal ? getChildLevel(parentGoal.level) : 'year');
  const parentId = goal?.parentId || initialParentId || parentGoal?.id;

  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [status, setStatus] = useState<GoalStatus>(goal?.status || 'not-started');
  const [startDate, setStartDate] = useState(goal?.startDate || '');
  const [endDate, setEndDate] = useState(goal?.endDate || '');

  // Initialize dates based on parent or current date
  useEffect(() => {
    if (!goal && !startDate) {
      const timeframe = getGoalTimeframe(level, new Date());
      setStartDate(timeframe.start);
      setEndDate(timeframe.end);
    }
  }, [goal, level, startDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a goal title');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    if (startDate > endDate) {
      alert('Start date must be before end date');
      return;
    }

    // Validate dates are within parent range
    if (parentGoal) {
      if (startDate < parentGoal.startDate) {
        alert(`Start date cannot be before parent goal start (${parentGoal.startDate})`);
        return;
      }
      if (endDate > parentGoal.endDate) {
        alert(`End date cannot be after parent goal end (${parentGoal.endDate})`);
        return;
      }
    }

    const savedGoal: Goal = {
      id: goal?.id || `goal-${level}-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      level,
      parentId,
      childIds: goal?.childIds || [],
      linkedTaskIds: goal?.linkedTaskIds || [],
      startDate,
      endDate,
      aiGenerated: goal?.aiGenerated || false,
      aiContext: goal?.aiContext,
      status,
      completionPercentage: goal?.completionPercentage || 0,
      order: goal?.order || 0,
      customFields: goal?.customFields,
      createdAt: goal?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(savedGoal);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content goal-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Goal' : 'Create New Goal'}</h2>
          <button className="btn-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goal-editor-form">
          <div className="form-group">
            <label>Goal Level</label>
            <div className="goal-level-badge">
              {LEVEL_LABELS[level]}
              {parentGoal && (
                <span className="parent-info"> (Child of: {parentGoal.title})</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder={`Enter ${LEVEL_LABELS[level].toLowerCase()} goal title...`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={100}
            />
            <span className="char-count">{title.length}/100</span>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe what success looks like for this goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{description.length}/500</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={parentGoal?.startDate}
                max={parentGoal?.endDate}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || parentGoal?.startDate}
                max={parentGoal?.endDate}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="not-started"
                  checked={status === 'not-started'}
                  onChange={() => setStatus('not-started')}
                />
                <span>Not Started</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="in-progress"
                  checked={status === 'in-progress'}
                  onChange={() => setStatus('in-progress')}
                />
                <span>In Progress</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={status === 'completed'}
                  onChange={() => setStatus('completed')}
                />
                <span>Completed</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="status"
                  value="abandoned"
                  checked={status === 'abandoned'}
                  onChange={() => setStatus('abandoned')}
                />
                <span>Abandoned</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getChildLevel(parentLevel: GoalLevel): GoalLevel {
  const levels: GoalLevel[] = ['year', 'quarter', 'month', 'week', 'day'];
  const index = levels.indexOf(parentLevel);
  return levels[index + 1] || 'day';
}

export default GoalEditor;
