import { useState } from 'react';
import type { CompletionStatus } from '../../types';
import './CompletionStatusModal.css';

interface Props {
  taskName: string;
  onClose: () => void;
  onComplete: (status: CompletionStatus, percentage?: number, notes?: string) => void;
}

function CompletionStatusModal({ taskName, onClose, onComplete }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<CompletionStatus>('done');
  const [percentage, setPercentage] = useState(50);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onComplete(
      selectedStatus,
      selectedStatus === 'partial' ? percentage : undefined,
      notes || undefined
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="completion-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Mark Task Status</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="task-name-display">{taskName}</p>

          <div className="status-options">
            <button
              className={`status-option ${selectedStatus === 'done' ? 'selected' : ''}`}
              onClick={() => setSelectedStatus('done')}
            >
              <span className="status-icon done">✓</span>
              <div className="status-info">
                <h3>Done</h3>
                <p>Completed as planned</p>
              </div>
            </button>

            <button
              className={`status-option ${selectedStatus === 'partial' ? 'selected' : ''}`}
              onClick={() => setSelectedStatus('partial')}
            >
              <span className="status-icon partial">◐</span>
              <div className="status-info">
                <h3>Partial</h3>
                <p>Made some progress</p>
              </div>
            </button>

            <button
              className={`status-option ${selectedStatus === 'skipped' ? 'selected' : ''}`}
              onClick={() => setSelectedStatus('skipped')}
            >
              <span className="status-icon skipped">⊘</span>
              <div className="status-info">
                <h3>Skipped</h3>
                <p>Didn't get to it today</p>
              </div>
            </button>
          </div>

          {selectedStatus === 'partial' && (
            <div className="percentage-input">
              <label>
                Completion Percentage: <strong>{percentage}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="percentage-slider"
              />
              <div className="percentage-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          <div className="notes-section">
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                selectedStatus === 'done'
                  ? "How did it go? Any insights?"
                  : selectedStatus === 'partial'
                  ? "What did you accomplish?"
                  : "Why did you skip this task?"
              }
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Save Status
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletionStatusModal;
