import React from 'react';

export function IntensityDots({ value, onChange, max = 5 }: { value: number; onChange?: (v: number) => void; max?: number }) {
  return (
    <div
      className="flex items-center gap-1.5"
      role={onChange ? 'group' : undefined}
      aria-label={onChange ? `Intensity: ${value} of ${max}` : `Intensity ${value} of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          aria-label={`Intensity ${i + 1}`}
          aria-pressed={i < value}
          tabIndex={onChange ? 0 : -1}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
            i < value
              ? 'bg-terracotta'
              : 'bg-border hover:bg-muted-foreground/40'
          } ${onChange ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
        />
      ))}
    </div>
  );
}
