import { useState } from 'react';
import type { Goal, GoalPlan, GoalLevel } from '../../types/goals';
import type { DayArchive } from '../../types';
import GoalEditor from './GoalEditor';
import GoalCalendar from './GoalCalendar';
import GoalProgressPanel from './GoalProgressPanel';
import GoalFlowGraph from './GoalFlowGraph';
import GoalTableView from './GoalTableView';
import GoalPlanManager from './GoalPlanManager';
import './GoalPlanView.css';

interface Props {
  goalPlan?: GoalPlan;
  archive?: DayArchive[];
  onCreateGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onCreateGoalPlan?: (plan: GoalPlan) => void;
  onDeleteGoalPlan?: (planId: string) => void;
  onBack: () => void;
}

function GoalPlanView({ goalPlan, archive = [], onCreateGoal, onUpdateGoal, onDeleteGoal, onDeleteGoalPlan, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'progress' | 'mindmap' | 'table'>('mindmap');
  const [showEditor, setShowEditor] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [parentGoal, setParentGoal] = useState<Goal | undefined>();
  const [initialLevel, setInitialLevel] = useState<GoalLevel | undefined>();
  const [initialParentId, setInitialParentId] = useState<string | undefined>();
  const [showPlanManager, setShowPlanManager] = useState(false);

  const handleCreateNewYearGoal = (level: GoalLevel, parentId?: string) => {
    setEditingGoal(undefined);
    setParentGoal(undefined);
    setInitialLevel(level);
    setInitialParentId(parentId);
    setShowEditor(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setParentGoal(undefined);
    setInitialLevel(undefined);
    setInitialParentId(undefined);
    setShowEditor(true);
  };

  const handleAddChild = (parent: Goal) => {
    setEditingGoal(undefined);
    setParentGoal(parent);
    setInitialLevel(undefined);
    setInitialParentId(undefined);
    setShowEditor(true);
  };

  const handleSaveGoal = (goal: Goal) => {
    if (editingGoal) {
      onUpdateGoal(goal);
    } else {
      onCreateGoal(goal);
    }
    setShowEditor(false);
    setEditingGoal(undefined);
    setParentGoal(undefined);
    setInitialLevel(undefined);
    setInitialParentId(undefined);
  };

  const handleCancelEditor = () => {
    setShowEditor(false);
    setEditingGoal(undefined);
    setParentGoal(undefined);
    setInitialLevel(undefined);
    setInitialParentId(undefined);
  };

  const handlePlanDeleted = (planId: string) => {
    if (onDeleteGoalPlan) {
      onDeleteGoalPlan(planId);
    }
    setShowPlanManager(false);
  };

  // No goal plan exists - allow user to create first year goal
  if (!goalPlan) {
    return (
      <div className="goal-plan-view">
        <div className="goal-plan-header">
          <button className="btn btn-back" onClick={onBack}>
            ← Back to Tasks
          </button>
          <h1>Goal Planning</h1>
        </div>

        <div className="goal-plan-empty">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h2>No Goals Yet</h2>
            <p>
              Create your first year goal to start planning.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => handleCreateNewYearGoal('year')}
              style={{ marginTop: '20px' }}
            >
              + Create Year Goal
            </button>
          </div>
        </div>

        {showEditor && (
          <GoalEditor
            goal={editingGoal}
            parentGoal={parentGoal}
            initialLevel={initialLevel}
            initialParentId={initialParentId}
            onSave={handleSaveGoal}
            onCancel={handleCancelEditor}
          />
        )}
      </div>
    );
  }

  // Goal plan exists - show flow graph
  const yearGoalIds = goalPlan.yearGoalIds || [goalPlan.yearGoalId];
  const yearGoals = goalPlan.goals.filter(g => yearGoalIds.includes(g.id));

  return (
    <div className="goal-plan-view">
      <div className="goal-plan-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back to Tasks
        </button>
        <div className="header-content">
          <h1>{goalPlan.title}</h1>
          <p className="goal-plan-subtitle">
            {yearGoals.length} year goal{yearGoals.length !== 1 ? 's' : ''} • {goalPlan.goals.length} total goals
          </p>
        </div>
      </div>

      <div className="goal-plan-content">
        {/* Tab Navigation */}
        <div className="goal-plan-tabs">
          <button
            className={`tab-button ${activeTab === 'mindmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('mindmap')}
          >
            🔀 Flow Graph
          </button>
          <button
            className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 Calendar
          </button>
          <button
            className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            📊 Progress
          </button>
          <button
            className={`tab-button ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            📋 Table
          </button>
        </div>

        {/* Flow Graph View */}
        {activeTab === 'mindmap' && (
          <GoalFlowGraph
            goalPlan={goalPlan}
            archive={archive}
            onEditGoal={handleEditGoal}
            onUpdateGoal={onUpdateGoal}
            onAddChild={handleAddChild}
            onDeleteGoal={onDeleteGoal}
            onCreateNewGoal={handleCreateNewYearGoal}
          />
        )}

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <GoalCalendar
            goalPlan={goalPlan}
            archive={archive}
            onEditGoal={(goal: Goal) => {
              setActiveTab('mindmap');
              handleEditGoal(goal);
            }}
          />
        )}

        {/* Progress View */}
        {activeTab === 'progress' && (
          <GoalProgressPanel
            goalPlan={goalPlan}
            archive={archive}
            onEditGoal={(goal: Goal) => {
              setActiveTab('mindmap');
              handleEditGoal(goal);
            }}
          />
        )}

        {/* Table View */}
        {activeTab === 'table' && (
          <GoalTableView
            goalPlan={goalPlan}
            archive={archive}
            onEditGoal={handleEditGoal}
            onDeleteGoal={onDeleteGoal}
          />
        )}
      </div>

      {showEditor && (
        <GoalEditor
          goal={editingGoal}
          parentGoal={parentGoal}
          initialLevel={initialLevel}
          initialParentId={initialParentId}
          onSave={handleSaveGoal}
          onCancel={handleCancelEditor}
        />
      )}

      {showPlanManager && (
        <GoalPlanManager
          currentPlanId={goalPlan.id}
          onClose={() => setShowPlanManager(false)}
          onPlanDeleted={handlePlanDeleted}
        />
      )}
    </div>
  );
}

export default GoalPlanView;
