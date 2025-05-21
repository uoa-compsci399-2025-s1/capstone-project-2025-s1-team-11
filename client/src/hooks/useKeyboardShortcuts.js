import { useEffect } from 'react';

export const useKeyboardShortcuts = ({ onUndo, onRedo }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if Ctrl/Cmd is pressed
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            // If shift is also pressed, it's redo (Ctrl+Shift+Z)
            if (event.shiftKey) {
              event.preventDefault();
              onRedo();
            } else {
              event.preventDefault();
              onUndo();
            }
            break;
          case 'y':
            // Ctrl+Y is also redo
            event.preventDefault();
            onRedo();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);
}; 