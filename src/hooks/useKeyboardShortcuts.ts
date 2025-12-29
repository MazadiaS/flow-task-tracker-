import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.isContentEditable;

      if (isTyping) return;

      shortcuts.forEach((shortcut) => {
        // Check if the modifier combination matches
        const modifiersMatch =
          (shortcut.ctrl ? event.ctrlKey : !event.ctrlKey || shortcut.meta) &&
          (shortcut.meta ? event.metaKey : !event.metaKey || shortcut.ctrl) &&
          (shortcut.shift ? event.shiftKey : !event.shiftKey) &&
          (shortcut.alt ? event.altKey : !event.altKey);

        if (event.key.toLowerCase() === shortcut.key.toLowerCase() && modifiersMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
};

// Helper to get platform-specific modifier key label
export const getModifierLabel = () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? 'Cmd' : 'Ctrl';
};

// Helper to format shortcut for display
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(getModifierLabel());
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push('Alt');
  }
  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
};
