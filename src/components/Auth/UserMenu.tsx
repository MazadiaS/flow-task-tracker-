import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import AuthModal from './AuthModal';
import './UserMenu.css';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const { isSyncing, lastSyncTime } = useAppContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!user) {
    return (
      <>
        <button className="user-menu-btn sign-in" onClick={() => setShowAuthModal(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
          </svg>
          Sign In
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <div className="user-menu">
      <button
        className="user-menu-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {isSyncing ? (
          <span className="sync-indicator syncing" title="Syncing...">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-9-9"/>
            </svg>
          </span>
        ) : (
          <span className="sync-indicator synced" title={`Last sync: ${formatLastSync(lastSyncTime)}`}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </span>
        )}
        <span className="user-email">{user.email?.split('@')[0]}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {showDropdown && (
        <>
          <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
          <div className="user-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-email">{user.email}</span>
              <span className="dropdown-sync">
                {isSyncing ? 'Syncing...' : `Synced ${formatLastSync(lastSyncTime)}`}
              </span>
            </div>
            <button className="dropdown-item sign-out" onClick={() => { signOut(); setShowDropdown(false); }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
