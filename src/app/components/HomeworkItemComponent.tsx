import React, { useState } from 'react';
import { format, isPast } from 'date-fns';
import { useApp } from '../context/AppContext';
import type { HomeworkItem } from '../context/AppContext';

export function HomeworkItemComponent({ item }: { item: HomeworkItem }) {
  const { toggleHomework } = useApp();
  const [animating, setAnimating] = useState(false);

  const isOverdue = item.dueDate && isPast(item.dueDate) && !item.completed;

  const handleToggle = () => {
    if (!item.completed) {
      setAnimating(true);
      setTimeout(() => {
        toggleHomework(item.id);
        setAnimating(false);
      }, 400);
    } else {
      toggleHomework(item.id);
    }
  };

  return (
    <div className={`flex items-start gap-3 py-3 px-3 rounded-md transition-all duration-200 ${
      isOverdue ? 'border-l-2 border-l-destructive' : ''
    } ${item.completed ? 'opacity-60' : ''}`}>
      <button
        onClick={handleToggle}
        className={`mt-0.5 w-[18px] h-[18px] rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          item.completed || animating
            ? 'bg-sage border-sage'
            : 'border-muted-foreground/40 hover:border-terracotta'
        }`}
      >
        {(item.completed || animating) && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] text-foreground transition-all duration-300 ${
          item.completed || animating ? 'line-through text-muted-foreground' : ''
        }`}>
          {item.text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Session {format(item.sessionDate, 'MMM d')}
          </span>
          {item.dueDate && (
            <span className={`text-[11px] ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Due {format(item.dueDate, 'MMM d')}
            </span>
          )}
          {item.completedDate && (
            <span className="text-[11px] text-sage" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Done {format(item.completedDate, 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
