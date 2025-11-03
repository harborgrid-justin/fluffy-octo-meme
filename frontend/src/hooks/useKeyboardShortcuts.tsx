import { useEffect } from 'react';
import Mousetrap from 'mousetrap';
import { KeyboardShortcut } from '@/types';

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    shortcuts.forEach(({ key, action }) => {
      Mousetrap.bind(key, (e) => {
        e.preventDefault();
        action();
        return false;
      });
    });

    return () => {
      shortcuts.forEach(({ key }) => {
        Mousetrap.unbind(key);
      });
    };
  }, [shortcuts]);
}

// Global keyboard shortcuts for the PPBE application
export const globalShortcuts: KeyboardShortcut[] = [
  {
    key: 'g d',
    description: 'Go to Dashboard',
    action: () => {
      window.location.href = '/dashboard';
    },
    category: 'navigation'
  },
  {
    key: 'g b',
    description: 'Go to Budgets',
    action: () => {
      window.location.href = '/budgets';
    },
    category: 'navigation'
  },
  {
    key: 'g p',
    description: 'Go to Programs',
    action: () => {
      window.location.href = '/programs';
    },
    category: 'navigation'
  },
  {
    key: 'g e',
    description: 'Go to Execution',
    action: () => {
      window.location.href = '/execution';
    },
    category: 'navigation'
  },
  {
    key: 'n b',
    description: 'New Budget',
    action: () => {
      console.log('Create new budget');
    },
    category: 'actions'
  },
  {
    key: '/',
    description: 'Focus Search',
    action: () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    category: 'actions'
  },
  {
    key: '?',
    description: 'Show Keyboard Shortcuts',
    action: () => {
      console.log('Show shortcuts modal');
    },
    category: 'view'
  },
];
