import { useState, useMemo } from 'react';
import type { Goal, GoalPlan } from '../../types/goals';
import type { DayArchive } from '../../types';
import { calculateActualProgress } from '../../utils/goalVisualization';
import './GoalMindMap.css';

interface Props {
  goalPlan: GoalPlan;
  archive: DayArchive[];
  onEditGoal: (goal: Goal) => void;
}

interface NodePosition {
  x: number;
  y: number;
  goal: Goal;
  angle: number;
  radius: number;
  level: number;
}

const LEVEL_RADIUS = {
  year: 0,
  quarter: 150,
  month: 280,
  week: 410,
  day: 540
};

const LEVEL_COLORS = {
  year: '#667eea',
  quarter: '#f093fb',
  month: '#4facfe',
  week: '#43e97b',
  day: '#fa709a'
};

const NODE_SIZES = {
  year: 80,
  quarter: 60,
  month: 50,
  week: 40,
  day: 30
};

function GoalMindMap({ goalPlan, archive, onEditGoal }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Build node positions for radial layout
  const nodePositions = useMemo(() => {
    const positions: NodePosition[] = [];
    const yearGoalIds = goalPlan.yearGoalIds || [goalPlan.yearGoalId];
    const yearGoals = goalPlan.goals.filter(g => yearGoalIds.includes(g.id));

    // Calculate positions for each year goal tree
    yearGoals.forEach((yearGoal, yearIndex) => {
      const yearAngleOffset = (yearIndex * (2 * Math.PI)) / yearGoals.length;

      // Add year goal at center (with slight offset if multiple)
      const yearOffset = yearGoals.length > 1 ? yearIndex * 120 : 0;
      positions.push({
        x: yearOffset,
        y: 0,
        goal: yearGoal,
        angle: yearAngleOffset,
        radius: 0,
        level: 0
      });

      // Recursively add children in radial pattern
      const addChildren = (parent: Goal, parentAngle: number, level: number) => {
        const children = goalPlan.goals.filter(g => g.parentId === parent.id);
        if (children.length === 0) return;

        const radius = LEVEL_RADIUS[children[0].level] || 200;
        const angleSpan = level === 1 ? (2 * Math.PI) / yearGoals.length : Math.PI / 2;
        const angleStep = children.length > 1 ? angleSpan / (children.length - 1) : 0;
        const startAngle = parentAngle - angleSpan / 2;

        children.forEach((child, i) => {
          const angle = children.length === 1 ? parentAngle : startAngle + (i * angleStep);
          const x = yearOffset + Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          positions.push({
            x,
            y,
            goal: child,
            angle,
            radius,
            level: level + 1
          });

          // Recursively add this child's children
          addChildren(child, angle, level + 1);
        });
      };

      addChildren(yearGoal, yearAngleOffset, 0);
    });

    return positions;
  }, [goalPlan]);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(2, prev * delta)));
  };

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Handle pan move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // Handle pan end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleEditClick = () => {
    if (selectedGoal) {
      onEditGoal(selectedGoal);
      setSelectedGoal(null);
    }
  };

  const handleCloseDetails = () => {
    setSelectedGoal(null);
  };

  const getProgressColor = (goal: Goal): string => {
    const progress = calculateActualProgress(goal, goalPlan, archive);
    if (progress >= 75) return '#10b981';
    if (progress >= 50) return '#3b82f6';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const viewBoxSize = 1200;
  const center = viewBoxSize / 2;

  return (
    <div className="goal-mind-map">
      <div className="mind-map-controls">
        <div className="control-group">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setZoom(prev => Math.min(2, prev * 1.2))}
          >
            🔍+
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setZoom(prev => Math.max(0.3, prev / 1.2))}
          >
            🔍−
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          >
            ⟲ Reset
          </button>
        </div>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: LEVEL_COLORS.year }}></div>
            <span>Year</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: LEVEL_COLORS.quarter }}></div>
            <span>Quarter</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: LEVEL_COLORS.month }}></div>
            <span>Month</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: LEVEL_COLORS.week }}></div>
            <span>Week</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: LEVEL_COLORS.day }}></div>
            <span>Day</span>
          </div>
        </div>
      </div>

      <svg
        className="mind-map-svg"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${center + pan.x / zoom}, ${center + pan.y / zoom}) scale(${zoom})`}>
          {/* Draw connections first */}
          {nodePositions.map(node => {
            if (!node.goal.parentId) return null;
            const parentNode = nodePositions.find(n => n.goal.id === node.goal.parentId);
            if (!parentNode) return null;

            return (
              <line
                key={`line-${node.goal.id}`}
                x1={parentNode.x}
                y1={parentNode.y}
                x2={node.x}
                y2={node.y}
                stroke="#333"
                strokeWidth="2"
                opacity="0.5"
              />
            );
          })}

          {/* Draw nodes */}
          {nodePositions.map(node => {
            const size = NODE_SIZES[node.goal.level] || 40;
            const color = LEVEL_COLORS[node.goal.level] || '#888';
            const progress = calculateActualProgress(node.goal, goalPlan, archive);
            const progressColor = getProgressColor(node.goal);

            return (
              <g
                key={node.goal.id}
                className="mind-map-node"
                onClick={() => handleNodeClick(node.goal)}
                style={{ cursor: 'pointer' }}
              >
                {/* Background circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size}
                  fill="#1a1a1a"
                  stroke={selectedGoal?.id === node.goal.id ? '#fff' : color}
                  strokeWidth={selectedGoal?.id === node.goal.id ? 4 : 2}
                />

                {/* Progress arc */}
                {progress > 0 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={size - 4}
                    fill="none"
                    stroke={progressColor}
                    strokeWidth="4"
                    strokeDasharray={`${(2 * Math.PI * (size - 4) * progress) / 100} ${2 * Math.PI * (size - 4)}`}
                    transform={`rotate(-90 ${node.x} ${node.y})`}
                    opacity="0.8"
                  />
                )}

                {/* Status indicator */}
                {node.goal.status === 'completed' && (
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={size * 0.8}
                  >
                    ✓
                  </text>
                )}

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + size + 20}
                  textAnchor="middle"
                  fill="#f0f0f0"
                  fontSize="14"
                  fontWeight="500"
                  className="node-label"
                >
                  {node.goal.title.length > 20
                    ? `${node.goal.title.substring(0, 17)}...`
                    : node.goal.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Goal details panel */}
      {selectedGoal && (
        <div className="mind-map-details">
          <div className="details-header">
            <h3>{selectedGoal.title}</h3>
            <button
              className="btn-close"
              onClick={handleCloseDetails}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">Level:</span>
              <span className="detail-value">{selectedGoal.level}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{selectedGoal.status}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">
                {selectedGoal.startDate} → {selectedGoal.endDate}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Progress:</span>
              <span className="detail-value">
                {calculateActualProgress(selectedGoal, goalPlan, archive)}%
              </span>
            </div>
            {selectedGoal.description && (
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <p className="detail-description">{selectedGoal.description}</p>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Children:</span>
              <span className="detail-value">{selectedGoal.childIds.length}</span>
            </div>
          </div>
          <div className="details-actions">
            <button
              className="btn btn-primary"
              onClick={handleEditClick}
            >
              Edit Goal
            </button>
          </div>
        </div>
      )}

      <div className="mind-map-hint">
        💡 Scroll to zoom • Drag to pan • Click nodes for details
      </div>
    </div>
  );
}

export default GoalMindMap;
