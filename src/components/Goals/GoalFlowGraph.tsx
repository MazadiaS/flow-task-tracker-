import { useCallback, useMemo, useState, memo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Goal, GoalPlan, GoalLevel } from '../../types/goals';
import type { DayArchive } from '../../types';
import { calculateActualProgress } from '../../utils/goalVisualization';
import GoalHierarchy from './GoalHierarchy';
import QuickAddGoalMenu from './QuickAddGoalMenu';
import './GoalFlowGraph.css';

interface Props {
  goalPlan: GoalPlan;
  archive: DayArchive[];
  onEditGoal: (goal: Goal) => void;
  onUpdateGoal?: (goal: Goal) => void;
  onAddChild?: (parent: Goal) => void;
  onDeleteGoal?: (goalId: string) => void;
  onCreateNewGoal?: (level: GoalLevel, parentId?: string) => void;
}

interface GoalNodeData extends Record<string, unknown> {
  goal: Goal;
  progress: number;
  onEdit: () => void;
  onAddChild?: () => void;
  onDelete?: () => void;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 80;

// Custom Goal Node Component
function GoalNode({ data }: { data: GoalNodeData }) {
  const { goal, progress, onEdit, onAddChild, onDelete } = data;

  const getLevelColor = (level: GoalLevel) => {
    switch (level) {
      case 'year': return '#667eea';
      case 'quarter': return '#10b981';
      case 'month': return '#f59e0b';
      case 'week': return '#ec4899';
      case 'day': return '#8b5cf6';
      default: return '#667eea';
    }
  };

  const getStatusColor = (goal: Goal) => {
    if (goal.status === 'completed') return '#10b981';
    if (goal.status === 'abandoned') return '#ef4444';
    if (progress > 0) return '#f59e0b';
    return '#6b7280';
  };

  const levelColor = getLevelColor(goal.level);
  const statusColor = getStatusColor(goal);

  return (
    <div
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
        border: `2px solid ${levelColor}`,
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Level Badge */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: levelColor,
          color: '#fff',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {goal.level}
      </div>

      {/* Title */}
      <div
        style={{
          color: '#f0f0f0',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          paddingRight: '50px',
        }}
      >
        {goal.title}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: '#2a2a2a',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${statusColor} 0%, ${levelColor} 100%)`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Status and Date Info */}
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
        <div>{goal.startDate} → {goal.endDate}</div>
        <div style={{ color: statusColor, marginTop: '2px' }}>
          {goal.status} • {Math.round(progress)}%
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px',
        }}
        className="node-actions"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            background: '#667eea',
            border: 'none',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
          title="Edit Goal"
        >
          ✏️
        </button>
        {onAddChild && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
            style={{
              background: '#10b981',
              border: 'none',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            title="Add Child Goal"
          >
            +
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete goal "${goal.title}"?`)) {
                onDelete();
              }
            }}
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            title="Delete Goal"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  goalNode: GoalNode,
};

function GoalFlowGraph({ goalPlan, archive, onEditGoal, onAddChild, onDeleteGoal, onCreateNewGoal }: Props) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Calculate hierarchical layout
  const calculateLayout = useCallback((goals: Goal[]) => {
    const positions = new Map<string, { x: number; y: number }>();
    const yearGoalIds = goalPlan.yearGoalIds || [goalPlan.yearGoalId];
    const yearGoals = goals.filter(g => yearGoalIds.includes(g.id));

    let yearXOffset = 100;

    yearGoals.forEach((yearGoal) => {
      const processNode = (
        goal: Goal,
        depth: number,
        xOffset: number
      ): number => {
        const children = goals.filter(g => g.parentId === goal.id);
        const y = 100 + depth * (NODE_HEIGHT + VERTICAL_SPACING);

        if (children.length === 0) {
          positions.set(goal.id, { x: xOffset, y });
          return xOffset + NODE_WIDTH + HORIZONTAL_SPACING;
        }

        let childX = xOffset;
        const childPositions: number[] = [];

        children.forEach(child => {
          const childXPos = childX;
          childPositions.push(childXPos);
          childX = processNode(child, depth + 1, childX);
        });

        const firstChildX = childPositions[0];
        const lastChildX = childPositions[childPositions.length - 1];
        const centerX = (firstChildX + lastChildX) / 2;

        positions.set(goal.id, { x: centerX, y });
        return childX;
      };

      const treeWidth = processNode(yearGoal, 0, yearXOffset);
      yearXOffset = treeWidth + 200;
    });

    return positions;
  }, [goalPlan.yearGoalId, goalPlan.yearGoalIds]);

  // Convert goals to React Flow nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const positions = calculateLayout(goalPlan.goals);

    const nodes: Node<GoalNodeData>[] = goalPlan.goals.map((goal) => {
      const pos = positions.get(goal.id) || { x: 0, y: 0 };
      const progress = calculateActualProgress(goal, goalPlan, archive);

      return {
        id: goal.id,
        type: 'goalNode',
        position: pos,
        data: {
          goal,
          progress,
          onEdit: () => onEditGoal(goal),
          onAddChild: onAddChild ? () => onAddChild(goal) : undefined,
          onDelete: onDeleteGoal ? () => onDeleteGoal(goal.id) : undefined,
        },
      };
    });

    const edges: Edge[] = goalPlan.goals
      .filter(goal => goal.parentId)
      .map(goal => ({
        id: `${goal.parentId}-${goal.id}`,
        source: goal.parentId!,
        target: goal.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#667eea', strokeWidth: 2 },
      }));

    // Add custom connections
    goalPlan.goals.forEach(goal => {
      if (goal.customConnectionIds) {
        goal.customConnectionIds.forEach(targetId => {
          edges.push({
            id: `custom-${goal.id}-${targetId}`,
            source: goal.id,
            target: targetId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5' },
          });
        });
      }
    });

    return { nodes, edges };
  }, [goalPlan, archive, onEditGoal, onAddChild, onDeleteGoal, calculateLayout]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="goal-flow-graph">
      {/* Sidebar Toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        📋 {showSidebar ? 'Hide' : 'Show'} Hierarchy
      </button>

      {/* Sidebar */}
      {showSidebar && (
        <>
          <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} />
          <div className="flow-sidebar visible">
            <div className="sidebar-header">
              <h3>Goal Hierarchy</h3>
              <button className="sidebar-close" onClick={() => setShowSidebar(false)}>
                ✕
              </button>
            </div>
            <div className="sidebar-content">
              {(goalPlan.yearGoalIds || [goalPlan.yearGoalId]).map(yearGoalId => {
                const yearGoal = goalPlan.goals.find(g => g.id === yearGoalId);
                if (!yearGoal) return null;

                return (
                  <div key={yearGoal.id} className="sidebar-year-section">
                    <h4>{yearGoal.title}</h4>
                    <GoalHierarchy
                      goals={goalPlan.goals}
                      rootGoalId={yearGoal.id}
                      onEditGoal={onEditGoal}
                      onAddChild={onAddChild || (() => {})}
                      onDeleteGoal={onDeleteGoal || (() => {})}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const goal = (node.data as GoalNodeData).goal;
            switch (goal.level) {
              case 'year': return '#667eea';
              case 'quarter': return '#10b981';
              case 'month': return '#f59e0b';
              case 'week': return '#ec4899';
              case 'day': return '#8b5cf6';
              default: return '#667eea';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />

        {/* Add Goal Button */}
        {onCreateNewGoal && (
          <Panel position="bottom-right">
            <button
              className="floating-add-button"
              onClick={() => setShowAddMenu(true)}
              title="Add New Goal"
            >
              + Add Goal
            </button>
          </Panel>
        )}

        {/* Hint */}
        <Panel position="bottom-left">
          <div className="flow-hint">
            💡 Drag nodes • Scroll to zoom • Click to select
          </div>
        </Panel>
      </ReactFlow>

      {/* Quick Add Goal Menu */}
      {showAddMenu && onCreateNewGoal && (
        <QuickAddGoalMenu
          allGoals={goalPlan.goals}
          onSelect={(level, parentId) => {
            onCreateNewGoal(level, parentId);
            setShowAddMenu(false);
          }}
          onCancel={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
}

export default memo(GoalFlowGraph);
