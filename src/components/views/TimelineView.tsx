import { useMemo } from 'react';
import type { Task } from '../../types';
import { formatTime } from '../../utils/timeUtils';
import './TimelineView.css';

interface Props {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onBack: () => void;
}

interface TimelineBlock {
  task: Task;
  startTime: Date;
  endTime: Date;
  top: number;
  height: number;
  isActive: boolean;
  isPast: boolean;
}

function TimelineView({ tasks, onTaskClick, onBack }: Props) {
  const HOUR_HEIGHT = 60; // pixels per hour
  const START_HOUR = 6; // Start timeline at 6 AM
  const END_HOUR = 23; // End at 11 PM

  // Use current time for timeline
  const currentTime = new Date();

  // Calculate timeline blocks for scheduled tasks
  const timelineBlocks = useMemo(() => {
    const blocks: TimelineBlock[] = [];
    const now = currentTime.getTime();

    // Filter tasks that have a scheduled time for today
    const scheduledTasks = tasks.filter(task => {
      if (task.type === 'completion') return false; // Skip completion tasks
      return task.scheduledFor && new Date(task.scheduledFor).toDateString() === currentTime.toDateString();
    });

    // Sort by scheduled time
    scheduledTasks.sort((a, b) => {
      const timeA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
      const timeB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
      return timeA - timeB;
    });

    scheduledTasks.forEach(task => {
      if (!task.scheduledFor) return;

      const startTime = new Date(task.scheduledFor);
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();

      // Calculate duration
      let durationMinutes = 30; // Default 30 min
      if (task.type === 'duration' && task.target) {
        durationMinutes = task.target.value;
      } else if (task.estimatedTime) {
        durationMinutes = task.estimatedTime;
      }

      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      // Calculate position on timeline
      const topOffset = ((startHour - START_HOUR) * 60 + startMinute) * (HOUR_HEIGHT / 60);
      const blockHeight = (durationMinutes * HOUR_HEIGHT) / 60;

      const taskEndTime = endTime.getTime();
      const isActive = now >= startTime.getTime() && now < taskEndTime;
      const isPast = now >= taskEndTime;

      blocks.push({
        task,
        startTime,
        endTime,
        top: topOffset,
        height: Math.max(blockHeight, 40), // Min height for visibility
        isActive,
        isPast
      });
    });

    return blocks;
  }, [tasks, currentTime]);

  // Calculate current time indicator position
  const currentTimePosition = useMemo(() => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();

    if (hour < START_HOUR || hour >= END_HOUR) return null;

    return ((hour - START_HOUR) * 60 + minute) * (HOUR_HEIGHT / 60);
  }, [currentTime]);

  // Generate hour markers
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#f5576c';
      case 'medium': return '#fbbf24';
      case 'low': return '#667eea';
      default: return '#764ba2';
    }
  };

  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '16px' }}>
          ← Back to Tasks
        </button>
        <h2>📅 Today's Timeline</h2>
        <p className="timeline-date">{currentTime.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>

      <div className="timeline-container">
        <div className="timeline-hours">
          {hours.map(hour => (
            <div key={hour} className="hour-marker" style={{ height: `${HOUR_HEIGHT}px` }}>
              <span className="hour-label">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        <div className="timeline-track">
          {/* Hour grid lines */}
          {hours.map(hour => (
            <div
              key={`grid-${hour}`}
              className="hour-grid-line"
              style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
            />
          ))}

          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <div
              className="current-time-indicator"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="time-dot" />
              <div className="time-line" />
              <span className="time-label">{formatTime(currentTime.getTime())}</span>
            </div>
          )}

          {/* Task blocks */}
          {timelineBlocks.map((block, index) => (
            <div
              key={`${block.task.id}-${index}`}
              className={`timeline-block ${block.isActive ? 'active' : ''} ${block.isPast ? 'past' : ''}`}
              style={{
                top: `${block.top}px`,
                height: `${block.height}px`,
                borderLeft: `4px solid ${getPriorityColor(block.task.priority)}`
              }}
              onClick={() => onTaskClick(block.task.id)}
            >
              <div className="block-header">
                <span className="block-icon">{block.task.icon || '📝'}</span>
                <span className="block-time">{formatTime(block.startTime.getTime())}</span>
              </div>
              <h4 className="block-title">{block.task.name}</h4>
              {block.task.target && (
                <span className="block-duration">
                  {block.task.target.value} {block.task.target.unit}
                </span>
              )}
              {block.isActive && (
                <div className="block-active-indicator">
                  <span className="pulse-dot" />
                  <span>In Progress</span>
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {timelineBlocks.length === 0 && (
            <div className="timeline-empty">
              <p>📅 No scheduled tasks for today</p>
              <p className="empty-hint">Add tasks with scheduled times to see them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimelineView;
