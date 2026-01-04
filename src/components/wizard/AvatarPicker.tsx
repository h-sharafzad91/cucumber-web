'use client';

import { cn } from '@/lib/utils';

const avatars = [
  { id: 'chad', emoji: '😎', label: 'Chad' },
  { id: 'pepe', emoji: '🐸', label: 'Pepe' },
  { id: 'wojak', emoji: '😢', label: 'Wojak' },
  { id: 'diamond', emoji: '💎', label: 'Diamond Hands' },
  { id: 'rocket', emoji: '🚀', label: 'Moon Mission' },
  { id: 'bear', emoji: '🐻', label: 'Bear' },
  { id: 'bull', emoji: '🐂', label: 'Bull' },
  { id: 'robot', emoji: '🤖', label: 'Bot' },
];

interface AvatarPickerProps {
  value: string;
  onChange: (avatarId: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-400 mb-2">
        Choose Avatar
      </label>
      <div className="grid grid-cols-4 gap-3">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.id)}
            className={cn(
              'p-4 rounded-lg border-2 transition hover:scale-105',
              value === avatar.id
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-700 hover:border-gray-600'
            )}
          >
            <div className="text-3xl mb-1">{avatar.emoji}</div>
            <div className="text-xs text-gray-400">{avatar.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
