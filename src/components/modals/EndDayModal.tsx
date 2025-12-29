import { useState } from 'react';
import type { Task } from '../../types';
import './EndDayModal.css';

interface IncompleteTask {
  task: Task;
  reason: string;
  remindTomorrow: boolean;
}

interface Props {
  incompleteTasks: Task[];
  onConfirmEndDay: (incompleteTaskData: IncompleteTask[]) => void;
  onCancel: () => void;
}

const REASON_OPTIONS = [
  'Ran out of time',
  'Forgot about it',
  'Too tired',
  'Lost motivation',
  'Not important today',
  'Other'
];

function EndDayModal({ incompleteTasks, onConfirmEndDay, onCancel }: Props) {
  const [step, setStep] = useState<'confirm' | 'incomplete'>('confirm');
  const [incompleteData, setIncompleteData] = useState<Map<string, IncompleteTask>>(
    new Map()
  );
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [customReason, setCustomReason] = useState('');

  const hasIncompleteTasks = incompleteTasks.length > 0;

  const handleConfirmClick = () => {
    if (hasIncompleteTasks) {
      setStep('incomplete');
    } else {
      onConfirmEndDay([]);
    }
  };

  const handleReasonSelect = (reason: string) => {
    const task = incompleteTasks[currentTaskIndex];
    const newData = new Map(incompleteData);

    newData.set(task.id, {
      task,
      reason: reason === 'Other' ? customReason : reason,
      remindTomorrow: false
    });

    setIncompleteData(newData);
    setCustomReason('');
  };

  const handleRemindToggle = (taskId: string) => {
    const newData = new Map(incompleteData);
    const current = newData.get(taskId);
    if (current) {
      newData.set(taskId, {
        ...current,
        remindTomorrow: !current.remindTomorrow
      });
      setIncompleteData(newData);
    }
  };

  const handleNextTask = () => {
    if (currentTaskIndex < incompleteTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      // All tasks reviewed, finish
      onConfirmEndDay(Array.from(incompleteData.values()));
    }
  };

  const handleSkipReason = () => {
    const task = incompleteTasks[currentTaskIndex];
    const newData = new Map(incompleteData);
    newData.set(task.id, {
      task,
      reason: '',
      remindTomorrow: false
    });
    setIncompleteData(newData);
    handleNextTask();
  };

  if (step === 'confirm') {
    return (
      <div className="modal-overlay">
        <div className="end-day-modal">
          <h2>🌙 End Your Day?</h2>

          {hasIncompleteTasks && (
            <div className="incomplete-warning">
              <p>⚠️ You have {incompleteTasks.length} incomplete task{incompleteTasks.length > 1 ? 's' : ''}</p>
              <ul className="incomplete-list-preview">
                {incompleteTasks.map(task => (
                  <li key={task.id}>{task.name}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="confirm-text">
            {hasIncompleteTasks
              ? "Would you like to reflect on why these weren't completed?"
              : "Ready to see your day summary?"
            }
          </p>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onCancel}>
              ← Go Back
            </button>
            <button className="btn btn-primary" onClick={handleConfirmClick}>
              {hasIncompleteTasks ? 'Yes, Continue' : 'End Day'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Incomplete tasks flow
  const currentTask = incompleteTasks[currentTaskIndex];
  const currentData = incompleteData.get(currentTask.id);
  const hasSelectedReason = !!currentData?.reason;

  return (
    <div className="modal-overlay">
      <div className="end-day-modal incomplete-modal">
        <div className="progress-indicator">
          Task {currentTaskIndex + 1} of {incompleteTasks.length}
        </div>

        <h2>Why didn't you complete this?</h2>
        <h3 className="task-name-display">{currentTask.name}</h3>

        <div className="reason-options">
          {REASON_OPTIONS.map(option => (
            <button
              key={option}
              className={`reason-btn ${currentData?.reason === option ? 'selected' : ''}`}
              onClick={() => handleReasonSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {currentData?.reason === 'Other' && (
          <div className="custom-reason-input">
            <input
              type="text"
              placeholder="Enter your reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {hasSelectedReason && (
          <label className="remind-checkbox">
            <input
              type="checkbox"
              checked={currentData?.remindTomorrow || false}
              onChange={() => handleRemindToggle(currentTask.id)}
            />
            <span>Remind me tomorrow</span>
          </label>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={handleSkipReason}>
            Skip
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNextTask}
            disabled={!hasSelectedReason}
          >
            {currentTaskIndex < incompleteTasks.length - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EndDayModal;
