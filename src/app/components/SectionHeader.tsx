import React from 'react';

export function SectionHeader({ title, action, subtitle }: { title: string; action?: React.ReactNode; subtitle?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <div>
        <h3>{title}</h3>
        {subtitle && <p className="text-muted-foreground text-[13px] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
