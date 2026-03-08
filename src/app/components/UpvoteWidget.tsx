import { useEffect, useState } from 'react';

type UpvoteCleanupWindow = Window & {
  __upvote_cleanup?: () => void;
};

interface UpvoteWidgetProps {
  userId?: string | null;
  email?: string | null;
}

export function UpvoteWidget({ userId, email }: UpvoteWidgetProps) {
  const [remountKey, setRemountKey] = useState(0);

  useEffect(() => {
    setRemountKey(k => k + 1);
    (window as UpvoteCleanupWindow).__upvote_cleanup?.();
  }, [userId, email]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://upvote.entrext.com/widget.js';
    script.async = true;
    script.dataset.upvoteWidget = 'true';
    document.body.appendChild(script);

    return () => {
      script.remove();
      (window as UpvoteCleanupWindow).__upvote_cleanup?.();
    };
  }, [remountKey]);

  return (
    <div key={remountKey}>
      <div
        className="upvote-widget"
        data-application-id="69ad73a0bdabf4c809dacb82"
        data-user-id={userId || ''}
        data-email={email || ''}
        data-position="right"
      />
    </div>
  );
}
