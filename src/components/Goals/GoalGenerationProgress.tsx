import './GoalGenerationProgress.css';

interface Props {
  stage: string;
  message: string;
  onCancel: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  'year': 'Creating Year Goal',
  'quarters': 'Planning Quarters',
  'months': 'Planning Months',
  'weeks': 'Planning Weeks',
  'complete': 'Finalizing Plan'
};

const STAGE_EMOJIS: Record<string, string> = {
  'year': '🎯',
  'quarters': '📅',
  'months': '📆',
  'weeks': '🗓️',
  'complete': '✨'
};

const STAGES = ['year', 'quarters', 'months', 'weeks', 'complete'];

function GoalGenerationProgress({ stage, message, onCancel }: Props) {
  const currentStageIndex = STAGES.indexOf(stage);
  const progress = ((currentStageIndex + 1) / STAGES.length) * 100;

  return (
    <div className="modal-overlay">
      <div className="modal-content generation-progress-modal">
        <div className="generation-progress-content">
          <div className="progress-icon">
            <span className="spinning-emoji">
              {STAGE_EMOJIS[stage] || '✨'}
            </span>
          </div>

          <h2>{STAGE_LABELS[stage] || 'Generating...'}</h2>
          <p className="progress-message">{message}</p>

          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill animated"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-percentage">{Math.round(progress)}%</span>
          </div>

          <div className="progress-stages">
            {STAGES.map((s, index) => (
              <div
                key={s}
                className={`progress-stage ${
                  index <= currentStageIndex ? 'completed' : ''
                } ${s === stage ? 'active' : ''}`}
              >
                <div className="stage-icon">
                  {index < currentStageIndex ? '✓' : STAGE_EMOJIS[s]}
                </div>
                <div className="stage-label">{STAGE_LABELS[s]}</div>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>

          <p className="progress-note">
            This may take 30-60 seconds. Please don't close this window.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GoalGenerationProgress;
