'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Theme } from 'emoji-picker-react';

const Picker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <div className="relative">
      <div className="absolute bottom-0 right-0 z-50">
        <div className="rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
          <Picker
            onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
            width={320}
            height={400}
            theme={Theme.DARK}
            lazyLoadEmojis
            searchPlaceholder="Search emoji..."
          />
        </div>
        <div className="fixed inset-0 -z-10" onClick={onClose} />
      </div>
    </div>
  );
}
