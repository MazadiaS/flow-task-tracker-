import { useState, useMemo } from 'react';
import type { Goal, GoalLevel } from '../../types/goals';
import './QuickAddGoalMenu.css';

interface Props {
  allGoals: Goal[];
  onSelect: (level: GoalLevel, parentId?: string) => void;
  onCancel: () => void;
  defaultParentId?: string;
}

const LEVEL_INFO: Record<GoalLevel, { label: string; description: string; color: string }> = {
  year: {
    label: 'Year',
    description: 'Long-term annual goals',
    color: '#667eea'
  },
  quarter: {
    label: 'Quarter',
    description: '3-month milestones',
    color: '#f093fb'
  },
  month: {
    label: 'Month',
    description: '30-day objectives',
    color: '#4facfe'
  },
  week: {
    label: 'Week',
    description: '7-day targets',
    color: '#43e97b'
  },
  day: {
    label: 'Day',
    description: 'Daily tasks',
    color: '#fa709a'
  }
};

function QuickAddGoalMenu({ allGoals, onSelect, onCancel, defaultParentId }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(defaultParentId);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter potential parent goals based on search
  const filteredParentGoals = useMemo(() => {
    if (!searchQuery) return allGoals;

    const query = searchQuery.toLowerCase();
    return allGoals.filter(g =>
      g.title.toLowerCase().includes(query) ||
      g.description.toLowerCase().includes(query)
    );
  }, [allGoals, searchQuery]);

  const handleCreate = () => {
    if (selectedLevel) {
      onSelect(selectedLevel, selectedParentId);
    }
  };

  const getLevelColor = (level: GoalLevel) => LEVEL_INFO[level].color;

  return (
    <div className="quick-add-menu-overlay" onClick={onCancel}>
      <div className="quick-add-menu" onClick={(e) => e.stopPropagation()}>
        <div className="menu-header">
          <h3>Create New Goal</h3>
          <button className="btn-close-menu" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="menu-content">
          {/* Step 1: Select Level */}
          <div className="menu-section">
            <label className="section-label">Goal Level</label>
            <div className="level-buttons">
              {(Object.keys(LEVEL_INFO) as GoalLevel[]).map(level => (
                <button
                  key={level}
                  className={`level-button ${selectedLevel === level ? 'selected' : ''}`}
                  onClick={() => setSelectedLevel(level)}
                  style={{
                    borderColor: selectedLevel === level ? getLevelColor(level) : '#333',
                    background: selectedLevel === level ? `${getLevelColor(level)}22` : 'transparent'
                  }}
                >
                  <div
                    className="level-indicator"
                    style={{ backgroundColor: getLevelColor(level) }}
                  />
                  <div className="level-info">
                    <div className="level-label">{LEVEL_INFO[level].label}</div>
                    <div className="level-description">{LEVEL_INFO[level].description}</div>
                  </div>
                  {selectedLevel === level && (
                    <div className="level-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Optional Parent Selection */}
          <div className="menu-section">
            <label className="section-label">
              Parent Goal <span className="optional">(Optional)</span>
            </label>
            <p className="section-hint">
              Leave empty to create a standalone goal, or select a parent to nest this goal under.
            </p>

            <div className="parent-selection">
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="parent-search"
              />

              <div className="parent-options">
                <label className="parent-option">
                  <input
                    type="radio"
                    name="parent"
                    checked={!selectedParentId}
                    onChange={() => setSelectedParentId(undefined)}
                  />
                  <span className="parent-option-label">
                    <strong>No Parent</strong>
                    <span className="parent-option-hint">Create as standalone goal</span>
                  </span>
                </label>

                {filteredParentGoals.map(goal => (
                  <label key={goal.id} className="parent-option">
                    <input
                      type="radio"
                      name="parent"
                      checked={selectedParentId === goal.id}
                      onChange={() => setSelectedParentId(goal.id)}
                    />
                    <span className="parent-option-label">
                      <strong>{goal.title}</strong>
                      <span className="parent-option-hint">
                        {goal.level} • {goal.startDate} to {goal.endDate}
                      </span>
                    </span>
                    <span
                      className="parent-level-badge"
                      style={{ backgroundColor: getLevelColor(goal.level) }}
                    >
                      {goal.level}
                    </span>
                  </label>
                ))}

                {filteredParentGoals.length === 0 && searchQuery && (
                  <div className="no-results">No goals found matching "{searchQuery}"</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="menu-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!selectedLevel}
            style={{
              opacity: selectedLevel ? 1 : 0.5,
              cursor: selectedLevel ? 'pointer' : 'not-allowed'
            }}
          >
            Create Goal
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickAddGoalMenu;
