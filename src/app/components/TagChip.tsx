import React from 'react';
import type { EntryType } from '../context/AppContext';

const typeConfig: Record<EntryType, { label: string; bg: string; text: string; dot: string }> = {
  trigger: { label: 'TRIGGER', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500' },
  event: { label: 'EVENT', bg: 'bg-yellow-500/15', text: 'text-yellow-500', dot: 'bg-yellow-500' },
  thought: { label: 'THOUGHT', bg: 'bg-blue-400/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  win: { label: 'WIN', bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-500' },
};

export function TagChip({ type, size = 'sm' }: { type: EntryType; size?: 'sm' | 'md' }) {
  const config = typeConfig[type];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ${config.bg} ${config.text} ${size === 'sm' ? 'text-[11px]' : 'text-[12px]'}`}
      style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function TopicChip({ topic, selected, onClick }: { topic: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] transition-all duration-150 border ${
        selected
          ? 'bg-terracotta/20 border-terracotta/40 text-terracotta'
          : 'bg-secondary border-border text-muted-foreground hover:border-muted-foreground/40'
      }`}
    >
      {topic}
    </button>
  );
}
