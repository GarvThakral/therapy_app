import { useEffect, useState } from 'react';

type UpvoteCleanupWindow = Window & {
  __upvote_cleanup?: () => void;
};

interface UpvoteWidgetProps {
  userId?: string | null;
  email?: string | null;
}

const UPVOTE_FAQS = [
  {
    question: 'What is Sessionly used for?',
    answer: 'Sessionly helps you track therapy sessions, daily logs, homework, and patterns between appointments.',
  },
  {
    question: 'Do I need Pro to use Sessionly?',
    answer: 'No. Free covers core logging and session tracking, while Pro unlocks deeper pattern recognition and richer insights.',
  },
  {
    question: 'Can I use Sessionly between therapy sessions?',
    answer: 'Yes. The app is built for notes, wins, mood check-ins, homework, and prep between sessions.',
  },
];

const UPVOTE_PRODUCT_OVERVIEW = 'Sessionly is a therapy companion for capturing logs, session notes, homework, and personal patterns between appointments.';
const UPVOTE_ABOUT_TEXT = 'Built for people who want to walk into therapy prepared, keep session notes organized, and see what patterns are repeating over time.';

export function UpvoteWidget({ userId, email }: UpvoteWidgetProps) {
  const [remountKey, setRemountKey] = useState(0);

  useEffect(() => {
    setRemountKey(k => k + 1);
    (window as UpvoteCleanupWindow).__upvote_cleanup?.();
  }, [userId, email]);

  useEffect(() => {
    document.querySelectorAll('script[data-upvote-widget="true"]').forEach(node => node.remove());

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
        data-theme="light"
        data-logo-url="/logo.svg"
        data-product-overview={UPVOTE_PRODUCT_OVERVIEW}
        data-about-text={UPVOTE_ABOUT_TEXT}
        data-faqs={JSON.stringify(UPVOTE_FAQS)}
      />
    </div>
  );
}
