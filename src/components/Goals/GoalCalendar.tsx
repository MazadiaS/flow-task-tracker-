import { useState } from 'react';
import type { Goal, GoalPlan, GoalLevel } from '../../types/goals';
import type { DayArchive } from '../../types';
import { calculateActualProgress, calculateExpectedProgress, getProgressStatus } from '../../utils/goalVisualization';
import { getLocalDateString } from '../../utils/timeUtils';
import './GoalCalendar.css';

interface Props {
  goalPlan: GoalPlan;
  archive: DayArchive[];
  onEditGoal: (goal: Goal) => void;
}

const LEVEL_COLORS: Record<GoalLevel, string> = {
  year: '#8b5cf6',
  quarter: '#667eea',
  month: '#3b82f6',
  week: '#06b6d4',
  day: '#10b981'
};

function GoalCalendar({ goalPlan, archive, onEditGoal }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get goals for the selected level
  const goalsForLevel = goalPlan.goals
    .filter(g => g.level === selectedLevel)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const handlePreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (selectedLevel === 'year') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else if (selectedLevel === 'quarter') {
      newDate.setMonth(newDate.getMonth() - 3);
    } else if (selectedLevel === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (selectedLevel === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (selectedLevel === 'year') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else if (selectedLevel === 'quarter') {
      newDate.setMonth(newDate.getMonth() + 3);
    } else if (selectedLevel === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (selectedLevel === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getPeriodLabel = (): string => {
    if (selectedLevel === 'year') {
      return currentDate.getFullYear().toString();
    } else if (selectedLevel === 'quarter') {
      const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
      return `Q${quarter} ${currentDate.getFullYear()}`;
    } else if (selectedLevel === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (selectedLevel === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  // Filter goals visible in current period
  const visibleGoals = goalsForLevel.filter(goal => {
    const goalStart = new Date(goal.startDate);
    const goalEnd = new Date(goal.endDate);

    if (selectedLevel === 'year') {
      return goalStart.getFullYear() === currentDate.getFullYear() ||
             goalEnd.getFullYear() === currentDate.getFullYear();
    } else if (selectedLevel === 'quarter') {
      const currentQuarter = Math.floor(currentDate.getMonth() / 3);
      const goalStartQuarter = Math.floor(goalStart.getMonth() / 3);
      const goalEndQuarter = Math.floor(goalEnd.getMonth() / 3);
      return (goalStartQuarter === currentQuarter || goalEndQuarter === currentQuarter) &&
             (goalStart.getFullYear() === currentDate.getFullYear() || goalEnd.getFullYear() === currentDate.getFullYear());
    } else if (selectedLevel === 'month') {
      return (goalStart.getMonth() === currentDate.getMonth() && goalStart.getFullYear() === currentDate.getFullYear()) ||
             (goalEnd.getMonth() === currentDate.getMonth() && goalEnd.getFullYear() === currentDate.getFullYear());
    } else if (selectedLevel === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const goalStartTime = goalStart.getTime();
      const goalEndTime = goalEnd.getTime();
      return goalStartTime <= weekEnd.getTime() && goalEndTime >= weekStart.getTime();
    } else {
      const currentDay = getLocalDateString(currentDate);
      return goal.startDate === currentDay || goal.endDate === currentDay;
    }
  });

  return (
    <div className="goal-calendar">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button className="btn btn-secondary" onClick={handlePreviousPeriod}>
            ← Previous
          </button>
          <div className="calendar-period">
            <h2>{getPeriodLabel()}</h2>
          </div>
          <button className="btn btn-secondary" onClick={handleNextPeriod}>
            Next →
          </button>
          <button className="btn btn-secondary" onClick={handleToday}>
            Today
          </button>
        </div>

        <div className="level-selector">
          {(['year', 'quarter', 'month', 'week', 'day'] as GoalLevel[]).map(level => (
            <button
              key={level}
              className={`level-btn ${selectedLevel === level ? 'active' : ''}`}
              onClick={() => setSelectedLevel(level)}
              style={{
                borderColor: selectedLevel === level ? LEVEL_COLORS[level] : undefined,
                color: selectedLevel === level ? LEVEL_COLORS[level] : undefined
              }}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="calendar-content">
        {visibleGoals.length === 0 ? (
          <div className="calendar-empty">
            <p>No {selectedLevel} goals for this period</p>
          </div>
        ) : (
          <div className="calendar-goals">
            {visibleGoals.map(goal => {
              const actual = calculateActualProgress(goal, goalPlan, archive);
              const expected = calculateExpectedProgress(goal);
              const { status, message, color } = getProgressStatus(actual, expected);

              return (
                <div
                  key={goal.id}
                  className={`calendar-goal-card ${status}`}
                  onClick={() => onEditGoal(goal)}
                >
                  <div className="goal-card-header">
                    <div className="goal-card-dates">
                      <span className="goal-date-start">{goal.startDate}</span>
                      <span className="goal-date-arrow">→</span>
                      <span className="goal-date-end">{goal.endDate}</span>
                    </div>
                    <div
                      className="goal-level-badge"
                      style={{ backgroundColor: LEVEL_COLORS[goal.level] }}
                    >
                      {goal.level}
                    </div>
                  </div>

                  <h3 className="goal-card-title">{goal.title}</h3>

                  {goal.description && (
                    <p className="goal-card-description">{goal.description}</p>
                  )}

                  <div className="goal-card-progress">
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${actual}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                      <div className="progress-labels">
                        <span className="progress-actual">{actual}% complete</span>
                        <span className="progress-status" style={{ color }}>
                          {message}
                        </span>
                      </div>
                    </div>
                  </div>

                  {goal.aiGenerated && (
                    <div className="ai-badge">✨ AI Generated</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default GoalCalendar;
