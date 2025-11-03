import React from 'react';
import { Modal, Badge } from '../ui';
import { globalShortcuts } from '@/hooks';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const groupedShortcuts = globalShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof globalShortcuts>);

  const categoryTitles: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    view: 'View'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div className="space-y-6">
        <p className="text-gray-600">
          Use these keyboard shortcuts to navigate and perform actions quickly throughout the application.
        </p>

        {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {categoryTitles[category] || category}
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-700">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            <strong>Tip:</strong> Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">?</kbd> at any time to view this help dialog.
          </p>
        </div>
      </div>
    </Modal>
  );
}
