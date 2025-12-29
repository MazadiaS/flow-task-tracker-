import { useState } from 'react';
import type { Goal } from '../../types/goals';
import { getGoalChildren } from '../../utils/goalCalculations';
import './GoalHierarchy.css';

interface Props {
  goals: Goal[];
  rootGoalId: string;
  onEditGoal: (goal: Goal) => void;
  onAddChild: (parentGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

interface GoalNodeProps {
  goal: Goal;
  goals: Goal[];
  depth: number;
  onEditGoal: (goal: Goal) => void;
  onAddChild: (parentGoal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

function GoalNode({ goal, goals, depth, onEditGoal, onAddChild, onDeleteGoal }: GoalNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth <  2); // Auto-expand first 2 levels
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const children = getGoalChildren(goal.id, { goals } as any);
  const hasChildren = children.length > 0;

  const handleDelete = () => {
    if (hasChildren) {
      const confirmMsg = `Delete "${goal.title}" and all ${children.length} child goal(s)?`;
      if (window.confirm(confirmMsg)) {
        onDeleteGoal(goal.id);
      }
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = () => {
    onDeleteGoal(goal.id);
    setShowDeleteConfirm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'in-progress':
        return '#667eea';
      case 'abandoned':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'year':
        return '#8b5cf6';
      case 'quarter':
        return '#667eea';
      case 'month':
        return '#3b82f6';
      case 'week':
        return '#06b6d4';
      case 'day':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="goal-node" style={{ marginLeft: `${depth * 24}px` }}>
      <div className="goal-node-content">
        <div className="goal-node-left">
          {hasChildren && (
            <button
              className="expand-button"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <div className="expand-spacer" />}

          <div className="goal-node-info">
            <div className="goal-node-header">
              <span
                className="goal-level-badge"
                style={{ backgroundColor: getLevelColor(goal.level) }}
              >
                {goal.level}
              </span>
              <h3 className="goal-title">{goal.title}</h3>
              <span
                className="goal-status-badge"
                style={{ backgroundColor: getStatusColor(goal.status) }}
              >
                {goal.status}
              </span>
            </div>

            {goal.description && (
              <p className="goal-description">{goal.description}</p>
            )}

            <div className="goal-metadata">
              <span className="goal-dates">
                {goal.startDate} → {goal.endDate}
              </span>
              {hasChildren && (
                <span className="goal-child-count">
                  {children.length} child goal{children.length !== 1 ? 's' : ''}
                </span>
              )}
              {goal.linkedTaskIds.length > 0 && (
                <span className="goal-task-count">
                  {goal.linkedTaskIds.length} linked task{goal.linkedTaskIds.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="goal-progress-container">
              <div className="goal-progress-bar-small">
                <div
                  className="goal-progress-fill"
                  style={{ width: `${goal.completionPercentage}%` }}
                />
              </div>
              <span className="goal-progress-percentage">
                {goal.completionPercentage}%
              </span>
            </div>
          </div>
        </div>

        <div className="goal-node-actions">
          <button
            className="btn-icon"
            onClick={() => onEditGoal(goal)}
            title="Edit goal"
          >
            ✏️
          </button>
          {goal.level !== 'day' && (
            <button
              className="btn-icon"
              onClick={() => onAddChild(goal)}
              title="Add child goal"
            >
              ➕
            </button>
          )}
          {goal.level !== 'year' && (
            <button
              className="btn-icon btn-delete"
              onClick={handleDelete}
              title="Delete goal"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="goal-node-children">
          {children.map(child => (
            <GoalNode
              key={child.id}
              goal={child}
              goals={goals}
              depth={depth + 1}
              onEditGoal={onEditGoal}
              onAddChild={onAddChild}
              onDeleteGoal={onDeleteGoal}
            />
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-box">
            <p>Delete "{goal.title}"?</p>
            <div className="delete-confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalHierarchy({ goals, rootGoalId, onEditGoal, onAddChild, onDeleteGoal }: Props) {
  const rootGoal = goals.find(g => g.id === rootGoalId);

  if (!rootGoal) {
    return (
      <div className="goal-hierarchy-empty">
        <p>No goals found</p>
      </div>
    );
  }

  return (
    <div className="goal-hierarchy">
      <GoalNode
        goal={rootGoal}
        goals={goals}
        depth={0}
        onEditGoal={onEditGoal}
        onAddChild={onAddChild}
        onDeleteGoal={onDeleteGoal}
      />
    </div>
  );
}

export default GoalHierarchy;
