import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { openTaskModal, closeTaskModal, taskModalState, detailModalState, closeDetailModal } = useTasks();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger shortcuts when user is typing inside an input, textarea, or contentEditable
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openTaskModal();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        navigate('/today');
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        navigate('/calendar');
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        navigate('/analytics');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        navigate('/');
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
      } else if (e.key === 'Escape') {
        if (showShortcutsHelp) setShowShortcutsHelp(false);
        if (taskModalState.isOpen) closeTaskModal();
        if (detailModalState.isOpen) closeDetailModal();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, openTaskModal, closeTaskModal, taskModalState, detailModalState, closeDetailModal, showShortcutsHelp]);

  return {
    showShortcutsHelp,
    setShowShortcutsHelp
  };
}
