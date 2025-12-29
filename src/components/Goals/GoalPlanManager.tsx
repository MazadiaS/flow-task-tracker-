import { useState, useEffect } from 'react';
import type { GoalPlanIndex } from '../../types/goals';
import { getGoalPlanIndex, deleteGoalPlan, removeFromGoalPlanIndex } from '../../utils/goalStorage';
import './GoalPlanManager.css';

interface Props {
  currentPlanId?: string;
  onClose: () => void;
  onPlanDeleted: (planId: string) => void;
}

function GoalPlanManager({ currentPlanId, onClose, onPlanDeleted }: Props) {
  const [plans, setPlans] = useState<GoalPlanIndex[]>([]);

  useEffect(() => {
    setPlans(getGoalPlanIndex());
  }, []);

  const handleDeletePlan = (planId: string, planTitle: string) => {
    if (!confirm(`Delete goal plan "${planTitle}"?\n\nThis cannot be undone.`)) {
      return;
    }

    // Delete from localStorage
    deleteGoalPlan(planId);
    removeFromGoalPlanIndex(planId);

    // Update local state
    setPlans(prev => prev.filter(p => p.id !== planId));

    // Notify parent
    onPlanDeleted(planId);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="goal-plan-manager-overlay" onClick={onClose}>
      <div className="goal-plan-manager" onClick={(e) => e.stopPropagation()}>
        <div className="manager-header">
          <h2>📂 Manage Goal Plans</h2>
          <button onClick={onClose} className="manager-close-btn">✕</button>
        </div>

        <div className="manager-content">
          {plans.length === 0 ? (
            <div className="empty-plans">
              <p>No goal plans found</p>
            </div>
          ) : (
            <div className="plans-list">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`plan-item ${plan.id === currentPlanId ? 'current' : ''}`}
                >
                  <div className="plan-info">
                    <div className="plan-header">
                      <h3>{plan.title}</h3>
                      {plan.id === currentPlanId && (
                        <span className="current-badge">Current</span>
                      )}
                      {plan.isActive && plan.id !== currentPlanId && (
                        <span className="active-badge">Active</span>
                      )}
                    </div>
                    <p className="plan-year-goal">{plan.yearGoalTitle}</p>
                    <p className="plan-date">Created {formatDate(plan.createdAt)}</p>
                  </div>

                  <div className="plan-actions">
                    <button
                      onClick={() => handleDeletePlan(plan.id, plan.title)}
                      className="btn-delete"
                      title="Delete this plan"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="manager-footer">
          <p className="hint">💡 Deleting a plan is permanent and cannot be undone</p>
        </div>
      </div>
    </div>
  );
}

export default GoalPlanManager;
