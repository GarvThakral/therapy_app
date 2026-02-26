import React from 'react';

export function MoodSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const moodLabel = (val: number) => {
    if (val <= 2) return 'Drained';
    if (val <= 4) return 'Low';
    if (val <= 6) return 'Okay';
    if (val <= 8) return 'Good';
    return 'Energized';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-muted-foreground">Drained</span>
        <span className="text-[13px] text-terracotta" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {value}/10 · {moodLabel(value)}
        </span>
        <span className="text-[12px] text-muted-foreground">Energized</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #C17A5A ${((value - 1) / 9) * 100}%, var(--border) ${((value - 1) / 9) * 100}%)`,
          WebkitAppearance: 'none',
        }}
      />
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #C17A5A;
          border: 2px solid var(--card);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #C17A5A;
          border: 2px solid var(--card);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}