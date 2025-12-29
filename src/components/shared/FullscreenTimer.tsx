import { useState, useEffect } from 'react';
import type { Task } from '../../types';
import { formatDuration } from '../../utils/timeUtils';
import './FullscreenTimer.css';

interface Props {
  task: Task;
  currentTime: number;
  isRunning: boolean;
  estimatedDuration?: number | null;
  onStop: () => void;
  onExit: () => void;
}

const MOTIVATIONAL_TIPS = [
  "💡 Take a break every hour to stay fresh",
  "💪 You're making great progress!",
  "🧠 Focus brings clarity",
  "⏰ One step at a time",
  "🎯 Deep work pays off",
  "✨ You're in the zone!",
  "🔥 Keep that momentum going",
  "🌟 Quality over speed"
];

function FullscreenTimer({ task, currentTime, estimatedDuration, onStop, onExit }: Props) {
  const [tip, setTip] = useState(MOTIVATIONAL_TIPS[0]);
  const estimatedSeconds = estimatedDuration ? estimatedDuration * 60 : 0;
  const targetSeconds = (task.target?.value || 0) * 60;

  // Determine color based on estimated time
  const getTimerColor = (): string => {
    if (!estimatedSeconds) return '#10b981'; // Green - no estimate

    const progress = currentTime / estimatedSeconds;

    if (progress < 0.8) {
      return '#10b981'; // Green - doing well
    } else if (progress < 1.0) {
      return '#fbbf24'; // Yellow - approaching limit
    } else {
      return '#fb923c'; // Gentle orange - overtime
    }
  };

  const getOvertimeMessage = (): string | null => {
    if (!estimatedSeconds || currentTime <= estimatedSeconds) return null;

    const overtimeSeconds = currentTime - estimatedSeconds;
    const overtimeMinutes = Math.floor(overtimeSeconds / 60);

    if (overtimeMinutes < 1) return null;
    return `+${overtimeMinutes} min over estimate 🔥 You're in the zone!`;
  };

  // Rotate tips every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setTip(MOTIVATIONAL_TIPS[Math.floor(Math.random() * MOTIVATIONAL_TIPS.length)]);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const timerColor = getTimerColor();
  const overtime = getOvertimeMessage();
  const progress = targetSeconds > 0 ? Math.min((currentTime / targetSeconds) * 100, 100) : 0;

  return (
    <div className="fullscreen-timer">
      <button className="btn-exit-fullscreen" onClick={onExit}>
        ✕
      </button>

      <div className="fullscreen-content">
        <div className="task-name-screensaver">{task.name}</div>

        <div
          className="timer-display-screensaver"
          style={{ color: timerColor }}
        >
          {formatDuration(currentTime)}
        </div>

        {estimatedSeconds > 0 && (
          <div className="estimate-info">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min((currentTime / estimatedSeconds) * 100, 100)}%`,
                  backgroundColor: timerColor
                }}
              />
            </div>
            <div className="estimate-text">
              Estimate: {Math.floor(estimatedSeconds / 60)} min
              {overtime && <div className="overtime-text">{overtime}</div>}
            </div>
          </div>
        )}

        {!estimatedSeconds && task.target && (
          <div className="target-info-screensaver">
            Target: {task.target.value} min
            <div className="progress-text">{Math.floor(progress)}% complete</div>
          </div>
        )}

        <div className="motivational-tip">{tip}</div>

        <div className="fullscreen-controls">
          <button className="btn btn-stop-fullscreen" onClick={onStop}>
            ⏹ STOP
          </button>
        </div>
      </div>
    </div>
  );
}

export default FullscreenTimer;
