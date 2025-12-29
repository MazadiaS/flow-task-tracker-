import type { Task, DayArchive } from '../../types';
import { formatDurationShort, getWeekStart } from '../../utils/timeUtils';
import './Statistics.css';

interface Props {
  tasks: Task[];
  archive: DayArchive[];
  onBack: () => void;
}

function Statistics({ tasks, archive, onBack }: Props) {
  const getWeeklyDuration = (task: Task): number => {
    if (task.type !== 'duration' || !task.sessions) return 0;
    const weekStart = getWeekStart();
    return task.sessions
      .filter(session => session.date >= weekStart)
      .reduce((total, session) => total + session.duration, 0);
  };

  const getTotalDuration = (task: Task): number => {
    if (task.type !== 'duration' || !task.sessions) return 0;
    return task.sessions.reduce((total, session) => total + session.duration, 0);
  };

  const getWeeklyCount = (task: Task): number => {
    if (task.type !== 'count' || !task.countLogs) return 0;
    const weekStart = getWeekStart();
    return task.countLogs
      .filter(log => log.date >= weekStart)
      .reduce((total, log) => total + log.count, 0);
  };

  const getTotalCount = (task: Task): number => {
    if (task.type !== 'count' || !task.countLogs) return 0;
    return task.countLogs.reduce((total, log) => total + log.count, 0);
  };

  const getWeeklyCompletions = (task: Task): number => {
    if (task.type !== 'completion' || !task.completions) return 0;
    const weekStart = getWeekStart();
    return task.completions.filter(c => c.date >= weekStart && c.completed).length;
  };

  const getStreak = (task: Task): number => {
    if (task.type !== 'completion' || !task.completions) return 0;

    const sortedCompletions = [...task.completions]
      .filter(c => c.completed)
      .sort((a, b) => b.date - a.date);

    if (sortedCompletions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = new Date(sortedCompletions[i].date);
      completionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (completionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const durationTasks = tasks.filter(t => t.type === 'duration');
  const countTasks = tasks.filter(t => t.type === 'count');
  const completionTasks = tasks.filter(t => t.type === 'completion');

  return (
    <div className="statistics">
      <div className="statistics-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back
        </button>
        <h1>Track & Statistics</h1>
      </div>

      <div className="stats-content">
        {durationTasks.length > 0 && (
          <section className="stats-section">
            <h2>⏱️ Duration Tasks</h2>
            <div className="stats-list">
              {durationTasks.map(task => {
                const weeklyTime = getWeeklyDuration(task);
                const totalTime = getTotalDuration(task);
                const targetSeconds = (task.target?.value || 0) * 60;
                const weeklyProgress = targetSeconds > 0 ? (weeklyTime / (targetSeconds * 7)) * 100 : 0;

                return (
                  <div key={task.id} className="stat-item">
                    <div className="stat-header">
                      <h3>{task.name}</h3>
                      <span className="stat-badge">
                        {formatDurationShort(weeklyTime)} this week
                      </span>
                    </div>
                    <div className="stat-details">
                      <div className="stat-detail">
                        <span className="label">Total Time:</span>
                        <span className="value">{formatDurationShort(totalTime)}</span>
                      </div>
                      {task.target && (
                        <div className="stat-detail">
                          <span className="label">Weekly Target:</span>
                          <span className="value">
                            {formatDurationShort(targetSeconds * 7)} ({Math.round(weeklyProgress)}%)
                          </span>
                        </div>
                      )}
                    </div>
                    {task.target && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {countTasks.length > 0 && (
          <section className="stats-section">
            <h2>💪 Count Tasks</h2>
            <div className="stats-list">
              {countTasks.map(task => {
                const weeklyCount = getWeeklyCount(task);
                const totalCount = getTotalCount(task);
                const weeklyTarget = (task.target?.value || 0) * 7;
                const weeklyProgress = weeklyTarget > 0 ? (weeklyCount / weeklyTarget) * 100 : 0;

                return (
                  <div key={task.id} className="stat-item">
                    <div className="stat-header">
                      <h3>{task.name}</h3>
                      <span className="stat-badge">
                        {weeklyCount} {task.target?.unit || 'reps'} this week
                      </span>
                    </div>
                    <div className="stat-details">
                      <div className="stat-detail">
                        <span className="label">Total Count:</span>
                        <span className="value">{totalCount} {task.target?.unit || 'reps'}</span>
                      </div>
                      {task.target && (
                        <div className="stat-detail">
                          <span className="label">Weekly Target:</span>
                          <span className="value">
                            {weeklyTarget} {task.target.unit} ({Math.round(weeklyProgress)}%)
                          </span>
                        </div>
                      )}
                    </div>
                    {task.target && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {completionTasks.length > 0 && (
          <section className="stats-section">
            <h2>☑️ Completion Tasks</h2>
            <div className="stats-list">
              {completionTasks.map(task => {
                const weeklyCompletions = getWeeklyCompletions(task);
                const streak = getStreak(task);

                return (
                  <div key={task.id} className="stat-item">
                    <div className="stat-header">
                      <h3>{task.name}</h3>
                      <span className="stat-badge">
                        {weeklyCompletions}/7 days this week
                      </span>
                    </div>
                    <div className="stat-details">
                      <div className="stat-detail">
                        <span className="label">Current Streak:</span>
                        <span className="value">
                          {streak > 0 ? `🔥 ${streak} days` : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(weeklyCompletions / 7) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="stats-section">
          <h2>Day History</h2>
          <div className="day-history-list">
            {archive.length === 0 ? (
              <p className="no-data">No completed days yet</p>
            ) : (
              [...archive].reverse().map((dayArchive, index) => {
                const efficiency = dayArchive.daySession.totalDuration
                  ? (dayArchive.daySession.activeDuration / dayArchive.daySession.totalDuration) * 100
                  : 0;

                return (
                  <div key={index} className="day-history-item">
                    <div className="day-history-header">
                      <h3>{dayArchive.date}</h3>
                      <span className="efficiency-badge">
                        {Math.round(efficiency)}% efficiency
                      </span>
                    </div>
                    <div className="day-history-stats">
                      <div className="day-stat">
                        <span className="label">Total Day:</span>
                        <span className="value">{formatDurationShort(dayArchive.daySession.totalDuration)}</span>
                      </div>
                      <div className="day-stat active">
                        <span className="label">Active:</span>
                        <span className="value">{formatDurationShort(dayArchive.daySession.activeDuration)}</span>
                      </div>
                      <div className="day-stat inactive">
                        <span className="label">Inactive:</span>
                        <span className="value">{formatDurationShort(dayArchive.daySession.inactiveDuration)}</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill active"
                        style={{ width: `${efficiency}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Statistics;
