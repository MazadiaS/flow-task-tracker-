import { useState } from 'react';
import type { Task } from '../../types';
import type { GoalPlan } from '../../types/goals';
import type { GoalRecommendation } from '../../utils/adaptiveRecommendations';
import { getGoalPath } from '../../utils/goalVisualization';
import { generateTaskSuggestions } from '../../utils/adaptiveRecommendations';
import './GoalRecommendations.css';

interface Props {
  recommendations: GoalRecommendation[];
  goalPlan: GoalPlan;
  onAddTask: (task: Task) => void;
  onDismiss: (goalId: string) => void;
}

function GoalRecommendations({ recommendations, goalPlan, onAddTask, onDismiss }: Props) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [fadingOutIds, setFadingOutIds] = useState<string[]>([]);

  if (recommendations.length === 0) {
    return null;
  }

  const handleQuickAdd = (rec: GoalRecommendation, taskName: string) => {
    const now = Date.now();
    const task: Task = {
      id: now.toString(),
      name: taskName,
      type: 'duration',
      priority: rec.urgency === 'critical' ? 'high' : rec.urgency === 'high' ? 'medium' : 'low',
      importance: rec.urgency === 'critical' ? 8 : rec.urgency === 'high' ? 6 : 4,
      order: 0,
      target: {
        value: rec.urgency === 'critical' ? 60 : 30,
        unit: 'minutes'
      },
      notes: `Suggested for: ${getGoalPath(rec.goal, goalPlan)}\n\nGoal is ${rec.progressGap}% behind schedule with ${rec.daysRemaining} days remaining.`,
      sessions: [],
      subtasks: [],
      isCollapsed: false,
      media: [],
      isRecurring: false,
      createdAt: now,
      linkedGoalId: rec.goal.id,
      goalContext: getGoalPath(rec.goal, goalPlan)
    };

    onAddTask(task);
    setExpandedGoalId(null);
  };

  const handleDismiss = (goalId: string) => {
    setFadingOutIds(prev => [...prev, goalId]);
    setTimeout(() => {
      onDismiss(goalId);
      setFadingOutIds(prev => prev.filter(id => id !== goalId));
    }, 300);
  };

  const getUrgencyEmoji = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      default: return '⚪';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'Critical';
      case 'high': return 'High Priority';
      case 'medium': return 'Attention Needed';
      default: return 'Low';
    }
  };

  return (
    <div className="goal-recommendations-section">
      <div className="goal-rec-header">
        <h2 className="section-title">🎯 Goals Need Attention</h2>
        <p className="goal-rec-subtitle">
          These goals are behind schedule. Add tasks to get back on track.
        </p>
      </div>

      <div className="goal-rec-list">
        {recommendations.map((rec) => (
          <div
            key={rec.goal.id}
            className={`goal-rec-card ${rec.urgency} ${fadingOutIds.includes(rec.goal.id) ? 'fading-out' : ''}`}
          >
            <div className="goal-rec-main">
              <div className="goal-rec-info">
                <div className="goal-rec-badges">
                  <span className={`urgency-badge ${rec.urgency}`}>
                    {getUrgencyEmoji(rec.urgency)} {getUrgencyText(rec.urgency)}
                  </span>
                  <span className="days-badge">
                    {rec.daysRemaining} day{rec.daysRemaining !== 1 ? 's' : ''} left
                  </span>
                </div>
                <h3 className="goal-rec-title">{rec.goal.title}</h3>
                <p className="goal-rec-path">{getGoalPath(rec.goal, goalPlan)}</p>
                <div className="goal-rec-stats">
                  <span className="stat-item">
                    <span className="stat-label">Behind by:</span>
                    <span className="stat-value">{rec.progressGap}%</span>
                  </span>
                </div>
              </div>

              <div className="goal-rec-actions">
                <button
                  className="btn btn-quick-add"
                  onClick={() => setExpandedGoalId(
                    expandedGoalId === rec.goal.id ? null : rec.goal.id
                  )}
                >
                  {expandedGoalId === rec.goal.id ? 'Cancel' : '+ Quick Add'}
                </button>
                <button
                  className="btn btn-dismiss-goal"
                  onClick={() => handleDismiss(rec.goal.id)}
                  title="Dismiss this recommendation"
                >
                  ✕
                </button>
              </div>
            </div>

            {expandedGoalId === rec.goal.id && (
              <div className="goal-rec-suggestions">
                <p className="suggestions-title">Suggested tasks:</p>
                <div className="suggestions-list">
                  {generateTaskSuggestions(rec.goal, goalPlan).map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="suggestion-item"
                      onClick={() => handleQuickAdd(rec, suggestion)}
                    >
                      <span className="suggestion-icon">➕</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!expandedGoalId && (
              <div className="goal-rec-actions-list">
                <p className="actions-title">Next steps:</p>
                <ul className="actions-list">
                  {rec.suggestedActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GoalRecommendations;
