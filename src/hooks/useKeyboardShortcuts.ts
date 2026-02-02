import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const matchedShortcut = shortcuts.find((shortcut) => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = (shortcut.ctrlKey ?? false) === (event.ctrlKey || event.metaKey);
      const shiftMatches = (shortcut.shiftKey ?? false) === event.shiftKey;
      const altMatches = (shortcut.altKey ?? false) === event.altKey;

      return keyMatches && ctrlMatches && shiftMatches && altMatches;
    });

    if (matchedShortcut) {
      if (matchedShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchedShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Common shortcuts preset for motion viewer
export const useMotionViewerShortcuts = (controls: {
  onPlayPause: () => void;
  onNextFrame: () => void;
  onPrevFrame: () => void;
  onSpeedUp: () => void;
  onSpeedDown: () => void;
  onToggleGrid: () => void;
  onReset: () => void;
}) => {
  useKeyboardShortcuts([
    {
      key: ' ',
      action: controls.onPlayPause,
      description: 'Play/Pause',
    },
    {
      key: 'ArrowRight',
      action: controls.onNextFrame,
      description: 'Next frame',
    },
    {
      key: 'ArrowLeft',
      action: controls.onPrevFrame,
      description: 'Previous frame',
    },
    {
      key: 'ArrowUp',
      action: controls.onSpeedUp,
      description: 'Speed up',
    },
    {
      key: 'ArrowDown',
      action: controls.onSpeedDown,
      description: 'Slow down',
    },
    {
      key: 'g',
      action: controls.onToggleGrid,
      description: 'Toggle grid',
    },
    {
      key: 'r',
      action: controls.onReset,
      description: 'Reset view',
    },
  ]);
};

// Dashboard navigation shortcuts
export const useDashboardShortcuts = (navigate: (path: string) => void) => {
  useKeyboardShortcuts([
    {
      key: 'd',
      ctrlKey: true,
      action: () => navigate('/app'),
      description: 'Go to Dashboard',
    },
    {
      key: 'm',
      ctrlKey: true,
      action: () => navigate('/app/match'),
      description: 'Go to Match Analysis',
    },
    {
      key: 'l',
      ctrlKey: true,
      action: () => navigate('/app/live'),
      description: 'Go to Live Coach',
    },
    {
      key: 'p',
      ctrlKey: true,
      action: () => navigate('/app/player'),
      description: 'Go to Player Development',
    },
  ]);
};
