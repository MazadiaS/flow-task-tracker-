import { useState, useMemo } from 'react';
import type { Goal, GoalPlan } from '../../types/goals';
import { calculateActualProgress, calculateExpectedProgress } from '../../utils/goalVisualization';
import type { DayArchive } from '../../types';
import './GoalTableView.css';

interface Props {
  goalPlan: GoalPlan;
  archive: DayArchive[];
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

type SortField = 'title' | 'level' | 'status' | 'startDate' | 'endDate' | 'progress';
type SortDirection = 'asc' | 'desc';

function GoalTableView({ goalPlan, archive, onEditGoal, onDeleteGoal }: Props) {
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort goals
  const filteredGoals = useMemo(() => {
    let goals = [...goalPlan.goals];

    // Apply filters
    if (filterLevel !== 'all') {
      goals = goals.filter(g => g.level === filterLevel);
    }
    if (filterStatus !== 'all') {
      goals = goals.filter(g => g.status === filterStatus);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      goals = goals.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    goals.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'level':
          const levelOrder = { year: 0, quarter: 1, month: 2, week: 3, day: 4 };
          comparison = levelOrder[a.level] - levelOrder[b.level];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'startDate':
          comparison = a.startDate.localeCompare(b.startDate);
          break;
        case 'endDate':
          comparison = a.endDate.localeCompare(b.endDate);
          break;
        case 'progress': {
          const progressA = calculateActualProgress(a, goalPlan, archive);
          const progressB = calculateActualProgress(b, goalPlan, archive);
          comparison = progressA - progressB;
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return goals;
  }, [goalPlan, archive, filterLevel, filterStatus, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in-progress': return '#3b82f6';
      case 'not-started': return '#6b7280';
      case 'abandoned': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'year': return '#667eea';
      case 'quarter': return '#f093fb';
      case 'month': return '#4facfe';
      case 'week': return '#43e97b';
      case 'day': return '#fa709a';
      default: return '#888';
    }
  };

  const getProgressStatus = (goal: Goal): { color: string; text: string } => {
    const actual = calculateActualProgress(goal, goalPlan, archive);
    const expected = calculateExpectedProgress(goal);
    const diff = actual - expected;

    if (diff >= 10) return { color: '#10b981', text: 'Ahead' };
    if (diff <= -10) return { color: '#ef4444', text: 'Behind' };
    return { color: '#3b82f6', text: 'On Track' };
  };

  return (
    <div className="goal-table-view">
      {/* Filters and Search */}
      <div className="table-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Levels</option>
            <option value="year">Year</option>
            <option value="quarter">Quarter</option>
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        <div className="table-info">
          {filteredGoals.length} of {goalPlan.goals.length} goals
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="goals-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} className="sortable">
                Title {getSortIcon('title')}
              </th>
              <th onClick={() => handleSort('level')} className="sortable level-col">
                Level {getSortIcon('level')}
              </th>
              <th onClick={() => handleSort('status')} className="sortable status-col">
                Status {getSortIcon('status')}
              </th>
              <th onClick={() => handleSort('startDate')} className="sortable date-col">
                Start Date {getSortIcon('startDate')}
              </th>
              <th onClick={() => handleSort('endDate')} className="sortable date-col">
                End Date {getSortIcon('endDate')}
              </th>
              <th onClick={() => handleSort('progress')} className="sortable progress-col">
                Progress {getSortIcon('progress')}
              </th>
              <th className="children-col">Children</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGoals.map(goal => {
              const progress = calculateActualProgress(goal, goalPlan, archive);
              const progressStatus = getProgressStatus(goal);

              return (
                <tr key={goal.id} className="goal-row">
                  <td className="title-cell">
                    <div className="title-content">
                      <span className="goal-title">{goal.title}</span>
                      {goal.description && (
                        <span className="goal-description">{goal.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="level-cell">
                    <span
                      className="level-badge"
                      style={{ backgroundColor: getLevelColor(goal.level) }}
                    >
                      {goal.level}
                    </span>
                  </td>
                  <td className="status-cell">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(goal.status) }}
                    >
                      {goal.status}
                    </span>
                  </td>
                  <td className="date-cell">{goal.startDate}</td>
                  <td className="date-cell">{goal.endDate}</td>
                  <td className="progress-cell">
                    <div className="progress-info">
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: progressStatus.color
                          }}
                        />
                      </div>
                      <span className="progress-text">{progress}%</span>
                      <span
                        className="progress-status"
                        style={{ color: progressStatus.color }}
                      >
                        {progressStatus.text}
                      </span>
                    </div>
                  </td>
                  <td className="children-cell">
                    {goal.childIds.length > 0 && (
                      <span className="children-count">{goal.childIds.length}</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-table btn-edit"
                      onClick={() => onEditGoal(goal)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="btn-table btn-delete"
                      onClick={() => {
                        if (confirm(`Delete goal "${goal.title}"?`)) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredGoals.length === 0 && (
          <div className="empty-table">
            <p>No goals match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoalTableView;
