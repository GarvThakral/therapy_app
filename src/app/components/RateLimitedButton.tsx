import React from 'react';

import { useActionRateLimit } from '../hooks/useActionRateLimit';

interface RateLimitedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intervalMs?: number;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export function RateLimitedButton({
  intervalMs = 700,
  onClick,
  ...props
}: RateLimitedButtonProps) {
  const { run } = useActionRateLimit(intervalMs);

  return (
    <button
      {...props}
      onClick={async (event) => {
        if (!onClick) return;
        const result = await run(() => onClick(event));
        if (result.blocked) {
          event.preventDefault();
        }
      }}
    />
  );
}
