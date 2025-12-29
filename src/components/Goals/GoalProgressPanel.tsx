import type { Goal, GoalPlan } from '../../types/goals';
import type { DayArchive } from '../../types';
import {
  calculateActualProgress,
  calculateExpectedProgress,
  getProgressStatus,
  generateGoalInsights,
  getGoalsNeedingAttention,
  calculateStreak
} from '../../utils/goalVisualization';
import { getActiveGoals } from '../../utils/goalCalculations';
import './GoalProgressPanel.css';

interface Props {
  goalPlan: GoalPlan;
  archive: DayArchive[];
  onEditGoal: (goal: Goal) => void;
}

function GoalProgressPanel({ goalPlan, archive, onEditGoal }: Props) {
  const yearGoal = goalPlan.goals.find(g => g.id === goalPlan.yearGoalId);
  const activeGoals = getActiveGoals(goalPlan);
  const goalsNeedingAttention = getGoalsNeedingAttention(goalPlan, archive);
  const streak = calculateStreak(archive);

  if (!yearGoal) {
    return (
      <div className="progress-panel">
        <div className="progress-error">
          <p>Year goal not found</p>
        </div>
      </div>
    );
  }

  const yearActual = calculateActualProgress(yearGoal, goalPlan, archive);
  const yearExpected = calculateExpectedProgress(yearGoal);
  const yearStatus = getProgressStatus(yearActual, yearExpected);
  const yearInsights = generateGoalInsights(yearGoal, goalPlan, archive);

  // Get current quarter, month, week goals
  const currentQuarter = activeGoals.find(g => g.level === 'quarter');
  const currentMonth = activeGoals.find(g => g.level === 'month');
  const currentWeek = activeGoals.find(g => g.level === 'week');

  return (
    <div className="progress-panel">
      {/* Overall Progress */}
      <div className="progress-section">
        <h2>Overall Progress</h2>
        <div className="progress-card year-progress">
          <div className="progress-card-header">
            <h3>{yearGoal.title}</h3>
            <div className="progress-badge year-badge">Year Goal</div>
          </div>

          <div className="progress-bar-large">
            <div
              className="progress-fill-large"
              style={{
                width: `${yearActual}%`,
                backgroundColor: yearStatus.color
              }}
            />
            <div className="progress-overlay">
              <span className="progress-percentage">{yearActual}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>

          <div className="progress-stats">
            <div className="progress-stat">
              <span className="stat-label">Expected</span>
              <span className="stat-value">{yearExpected}%</span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">Status</span>
              <span className="stat-value" style={{ color: yearStatus.color }}>
                {yearStatus.message}
              </span>
            </div>
            <div className="progress-stat">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{streak} day{streak !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="progress-insights">
            {yearInsights.map((insight, index) => (
              <div key={index} className="insight-item">
                {insight}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Period Goals */}
      <div className="progress-section">
        <h2>Current Period</h2>
        <div className="current-goals">
          {currentQuarter && (
            <GoalProgressCard
              goal={currentQuarter}
              goalPlan={goalPlan}
              archive={archive}
              onEdit={onEditGoal}
            />
          )}
          {currentMonth && (
            <GoalProgressCard
              goal={currentMonth}
              goalPlan={goalPlan}
              archive={archive}
              onEdit={onEditGoal}
            />
          )}
          {currentWeek && (
            <GoalProgressCard
              goal={currentWeek}
              goalPlan={goalPlan}
              archive={archive}
              onEdit={onEditGoal}
            />
          )}
        </div>
      </div>

      {/* Goals Needing Attention */}
      {goalsNeedingAttention.length > 0 && (
        <div className="progress-section">
          <h2>Needs Attention</h2>
          <div className="attention-goals">
            {goalsNeedingAttention.map(goal => (
              <div
                key={goal.id}
                className="attention-goal-card"
                onClick={() => onEditGoal(goal)}
              >
                <div className="attention-icon">⚠️</div>
                <div className="attention-content">
                  <h4>{goal.title}</h4>
                  <p className="attention-dates">
                    {goal.startDate} → {goal.endDate}
                  </p>
                  {(() => {
                    const actual = calculateActualProgress(goal, goalPlan, archive);
                    const expected = calculateExpectedProgress(goal);
                    const { message, color } = getProgressStatus(actual, expected);
                    return (
                      <p className="attention-status" style={{ color }}>
                        {message}
                      </p>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Goals Summary */}
      <div className="progress-section">
        <h2>Active Goals</h2>
        <div className="active-goals-summary">
          <div className="summary-stat">
            <div className="summary-value">{activeGoals.length}</div>
            <div className="summary-label">Active Goals</div>
          </div>
          <div className="summary-stat">
            <div className="summary-value">
              {activeGoals.filter(g => g.status === 'completed').length}
            </div>
            <div className="summary-label">Completed</div>
          </div>
          <div className="summary-stat">
            <div className="summary-value">
              {activeGoals.filter(g => g.status === 'in-progress').length}
            </div>
            <div className="summary-label">In Progress</div>
          </div>
          <div className="summary-stat">
            <div className="summary-value">
              {activeGoals.filter(g => g.status === 'not-started').length}
            </div>
            <div className="summary-label">Not Started</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GoalProgressCardProps {
  goal: Goal;
  goalPlan: GoalPlan;
  archive: DayArchive[];
  onEdit: (goal: Goal) => void;
}

function GoalProgressCard({ goal, goalPlan, archive, onEdit }: GoalProgressCardProps) {
  const actual = calculateActualProgress(goal, goalPlan, archive);
  const expected = calculateExpectedProgress(goal);
  const { message, color } = getProgressStatus(actual, expected);

  const LEVEL_COLORS: Record<string, string> = {
    quarter: '#667eea',
    month: '#3b82f6',
    week: '#06b6d4',
  };

  return (
    <div className="period-goal-card" onClick={() => onEdit(goal)}>
      <div className="period-card-header">
        <div
          className="period-level-badge"
          style={{ backgroundColor: LEVEL_COLORS[goal.level] }}
        >
          {goal.level}
        </div>
        <div className="period-dates">
          {goal.startDate} → {goal.endDate}
        </div>
      </div>

      <h3 className="period-goal-title">{goal.title}</h3>

      <div className="period-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${actual}%`, backgroundColor: color }}
          />
        </div>
        <div className="period-progress-labels">
          <span>{actual}% complete</span>
          <span style={{ color }}>{message}</span>
        </div>
      </div>
    </div>
  );
}

export default GoalProgressPanel;
