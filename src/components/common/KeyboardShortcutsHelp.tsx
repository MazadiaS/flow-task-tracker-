import './KeyboardShortcutsHelp.css';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const shortcuts = [
    { keys: `${modKey} + N`, description: 'Add new task' },
    { keys: `${modKey} + E`, description: 'Export all data' },
    { keys: `${modKey} + I`, description: 'Import data from file' },
    { keys: '1', description: 'Switch to Tasks view' },
    { keys: '2', description: 'Switch to Goals view' },
    { keys: '3', description: 'Switch to Timeline view' },
    { keys: '4', description: 'Switch to Statistics view' },
    { keys: '5', description: 'Switch to Archive view' },
    { keys: 'Esc', description: 'Go back / Close modal' },
    { keys: '?', description: 'Show this help' },
  ];

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button onClick={onClose} className="shortcuts-close-btn">✕</button>
        </div>

        <div className="shortcuts-list">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="shortcut-item">
              <kbd className="shortcut-keys">{shortcut.keys}</kbd>
              <span className="shortcut-description">{shortcut.description}</span>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <p>Press <kbd>?</kbd> anytime to view shortcuts</p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsHelp;
