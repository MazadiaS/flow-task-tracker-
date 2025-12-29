import { useState } from 'react';
import './EstimatedTimeModal.css';

interface Props {
  taskName: string;
  onConfirm: (estimatedMinutes: number | null) => void;
  onSkip: () => void;
}

const QUICK_PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 }
];

function EstimatedTimeModal({ taskName, onConfirm, onSkip }: Props) {
  const [customMinutes, setCustomMinutes] = useState<number | ''>('');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetClick = (minutes: number) => {
    onConfirm(minutes);
  };

  const handleCustomSubmit = () => {
    if (customMinutes && customMinutes > 0) {
      onConfirm(Number(customMinutes));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="estimated-time-modal">
        <h2>⏱️ How long will this take?</h2>
        <p className="task-name">{taskName}</p>

        <div className="presets-grid">
          {QUICK_PRESETS.map(preset => (
            <button
              key={preset.value}
              className="btn-preset"
              onClick={() => handlePresetClick(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {!showCustom ? (
          <button
            className="btn-custom-toggle"
            onClick={() => setShowCustom(true)}
          >
            Custom time
          </button>
        ) : (
          <div className="custom-input-section">
            <input
              type="number"
              className="custom-input"
              placeholder="Minutes"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value ? parseInt(e.target.value) : '')}
              min="1"
              autoFocus
            />
            <button
              className="btn btn-primary"
              onClick={handleCustomSubmit}
              disabled={!customMinutes || customMinutes <= 0}
            >
              Set {customMinutes} min
            </button>
          </div>
        )}

        <button className="btn-skip" onClick={onSkip}>
          Skip (no estimate)
        </button>
      </div>
    </div>
  );
}

export default EstimatedTimeModal;
