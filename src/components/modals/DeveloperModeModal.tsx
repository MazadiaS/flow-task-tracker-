import { useState, useCallback } from 'react';
import './DeveloperModeModal.css';

interface Props {
  onClose: () => void;
  onAuthenticate: () => void;
}

function DeveloperModeModal({ onClose, onAuthenticate }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (username === 'wigger' && password === 'Thepiis31415!') {
      onAuthenticate();
      onClose();
    } else {
      setError('Invalid username or password');
      setPassword('');
    }
  }, [username, password, onAuthenticate, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="developer-mode-modal-overlay" onClick={handleCancel}>
      <div className="developer-mode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="developer-mode-header">
          <h2>👨‍💻 Developer Mode</h2>
          <button className="modal-close-btn" onClick={handleCancel}>×</button>
        </div>

        <div className="developer-mode-body">
          <p className="developer-mode-description">
            Enter your developer credentials to access advanced features.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="dev-username">Username</label>
              <input
                id="dev-username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Enter username"
                autoFocus
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dev-password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="dev-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter password"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-authenticate">
                Authenticate
              </button>
            </div>
          </form>
        </div>

        <div className="developer-mode-footer">
          <p>🔒 Session expires when browser closes</p>
        </div>
      </div>
    </div>
  );
}

export default DeveloperModeModal;
