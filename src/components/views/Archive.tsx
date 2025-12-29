import { useState } from 'react';
import type { DayArchive } from '../../types';
import { formatDurationShort } from '../../utils/timeUtils';
import './Archive.css';

interface Props {
  archive: DayArchive[];
  onBack: () => void;
}

type FilterType = 'all' | 'week' | 'month';

function Archive({ archive, onBack }: Props) {
  const [selectedArchive, setSelectedArchive] = useState<DayArchive | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const getFilteredArchive = (): DayArchive[] => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    switch (filter) {
      case 'week':
        return archive.filter(a => a.dateTimestamp >= weekAgo);
      case 'month':
        return archive.filter(a => a.dateTimestamp >= monthAgo);
      default:
        return archive;
    }
  };

  const filteredArchive = getFilteredArchive();
  const sortedArchive = [...filteredArchive].sort((a, b) => b.dateTimestamp - a.dateTimestamp);

  if (selectedArchive) {
    const efficiency = selectedArchive.daySession.totalDuration
      ? (selectedArchive.daySession.activeDuration / selectedArchive.daySession.totalDuration) * 100
      : 0;

    return (
      <div className="archive-detail">
        <div className="archive-detail-header">
          <button className="btn btn-back" onClick={() => setSelectedArchive(null)}>
            ← Back to Archive
          </button>
          <h1>{selectedArchive.date}</h1>
        </div>

        <div className="archive-summary">
          <div className="archive-stat">
            <span className="stat-label">Day Duration:</span>
            <span className="stat-value">
              {formatDurationShort(selectedArchive.daySession.totalDuration)}
            </span>
          </div>
          <div className="archive-stat">
            <span className="stat-label">Active:</span>
            <span className="stat-value active">
              {formatDurationShort(selectedArchive.daySession.activeDuration)} ({Math.round(efficiency)}%)
            </span>
          </div>
          <div className="archive-stat">
            <span className="stat-label">Inactive:</span>
            <span className="stat-value inactive">
              {formatDurationShort(selectedArchive.daySession.inactiveDuration)}
            </span>
          </div>
        </div>

        <div className="archived-tasks-section">
          <h2>Tasks</h2>
          <div className="archived-tasks-list">
            {selectedArchive.tasks.length === 0 ? (
              <p className="no-tasks">No tasks completed</p>
            ) : (
              selectedArchive.tasks.map((task, index) => (
                <div key={index} className={`archived-task-card ${task.completed ? 'completed' : 'incomplete'}`}>
                  <div className="task-header">
                    <span className="task-icon">
                      {task.taskType === 'duration' && '⏱️'}
                      {task.taskType === 'count' && '💪'}
                      {task.taskType === 'completion' && '☑️'}
                    </span>
                    <h3>{task.taskName}</h3>
                    <span className="completion-badge">
                      {task.completed ? '✓' : '✗'}
                    </span>
                  </div>

                  <div className="task-details">
                    {task.target && (
                      <div className="task-detail-row">
                        <span className="label">Target:</span>
                        <span className="value">
                          {task.target.value} {task.target.unit}
                        </span>
                      </div>
                    )}
                    <div className="task-detail-row">
                      <span className="label">Actual:</span>
                      <span className="value">
                        {task.actual.value} {task.actual.unit}
                      </span>
                    </div>
                    {task.taskType === 'duration' && (
                      <div className="task-detail-row">
                        <span className="label">Sessions:</span>
                        <span className="value">{task.sessions.length}</span>
                      </div>
                    )}
                  </div>

                  {task.notes && (
                    <div className="task-notes">
                      <strong>Notes:</strong> {task.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="archive">
      <div className="archive-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back
        </button>
        <h1>📦 Archive</h1>
      </div>

      <div className="archive-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
          onClick={() => setFilter('week')}
        >
          This Week
        </button>
        <button
          className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
          onClick={() => setFilter('month')}
        >
          This Month
        </button>
      </div>

      <div className="archive-list">
        {sortedArchive.length === 0 ? (
          <div className="empty-archive">
            <p>No archived days yet</p>
            <p className="empty-subtitle">Complete your first day to see it here</p>
          </div>
        ) : (
          sortedArchive.map((dayArchive, index) => {
            const completedTasks = dayArchive.tasks.filter(t => t.completed).length;
            const totalTasks = dayArchive.tasks.length;
            const efficiency = dayArchive.daySession.totalDuration
              ? (dayArchive.daySession.activeDuration / dayArchive.daySession.totalDuration) * 100
              : 0;

            return (
              <div
                key={index}
                className="archive-card"
                onClick={() => setSelectedArchive(dayArchive)}
              >
                <div className="archive-card-header">
                  <h3>📅 {dayArchive.date}</h3>
                  <span className="efficiency-badge">
                    {Math.round(efficiency)}% efficiency
                  </span>
                </div>

                <div className="archive-card-stats">
                  <div className="stat">
                    <span className="stat-label">Active:</span>
                    <span className="stat-value">
                      {formatDurationShort(dayArchive.daySession.activeDuration)}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Tasks:</span>
                    <span className="stat-value">
                      {completedTasks}/{totalTasks} completed
                    </span>
                  </div>
                </div>

                <button className="view-btn">View Details →</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Archive;
