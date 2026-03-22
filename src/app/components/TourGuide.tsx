import React from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TOUR_FLAG_KEY = 'sessionly_has_seen_tour';
const VIEWPORT_PADDING = 16;
const TOOLTIP_GAP = 18;
const DEFAULT_TOOLTIP_HEIGHT = 220;
const MOBILE_BREAKPOINT = 768;

type TourStep = {
  id: string;
  selector: string;
  title: string;
  description: string;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

type TooltipPosition = {
  top: number;
  left: number;
  width: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTooltipPosition(rect: SpotlightRect, tooltipHeight: number, viewportWidth: number, viewportHeight: number): TooltipPosition {
  const width = Math.min(340, viewportWidth - VIEWPORT_PADDING * 2);

  if (viewportWidth < MOBILE_BREAKPOINT) {
    const left = clamp(
      rect.left + rect.width / 2 - width / 2,
      VIEWPORT_PADDING,
      viewportWidth - width - VIEWPORT_PADDING,
    );

    let top = rect.top + rect.height + TOOLTIP_GAP;
    if (top + tooltipHeight > viewportHeight - VIEWPORT_PADDING) {
      top = Math.max(VIEWPORT_PADDING, rect.top - tooltipHeight - TOOLTIP_GAP);
    }

    return { top, left, width };
  }

  let left = rect.left + rect.width + TOOLTIP_GAP;
  let top = rect.top + rect.height / 2 - tooltipHeight / 2;

  if (left + width > viewportWidth - VIEWPORT_PADDING) {
    left = rect.left - width - TOOLTIP_GAP;
  }

  if (left < VIEWPORT_PADDING) {
    left = clamp(
      rect.left + rect.width / 2 - width / 2,
      VIEWPORT_PADDING,
      viewportWidth - width - VIEWPORT_PADDING,
    );
  }

  if (top < VIEWPORT_PADDING || top + tooltipHeight > viewportHeight - VIEWPORT_PADDING) {
    top = rect.top + rect.height + TOOLTIP_GAP;
  }

  if (top + tooltipHeight > viewportHeight - VIEWPORT_PADDING) {
    top = Math.max(VIEWPORT_PADDING, rect.top - tooltipHeight - TOOLTIP_GAP);
  }

  return { top, left, width };
}

export function TourGuide() {
  const location = useLocation();
  const { authUser, plan, settings, isProfileLoaded } = useApp();
  const tooltipRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [spotlightRect, setSpotlightRect] = React.useState<SpotlightRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState<TooltipPosition | null>(null);

  const steps = React.useMemo<TourStep[]>(() => [
    {
      id: 'manage-sessions',
      selector: '[data-tour-target="manage-sessions"]',
      title: 'Manage Sessions',
      description: 'Use this session area to review prep, jump into your next session flow, and keep the right session context active while you work.',
    },
    {
      id: 'log-entry',
      selector: '[data-tour-target="log-entry"]',
      title: 'Log Entries',
      description: 'Capture what happened, how intense it felt, and whether you want it added to session prep. This is the fastest way to keep your therapy notes current.',
    },
    {
      id: 'logs-history',
      selector: '[data-tour-target="logs-history"]',
      title: 'See Past Logs',
      description: 'Browse this week’s entries here and open the archive to revisit older logs when you want context before a session.',
    },
    {
      id: 'upgrade-pro',
      selector: '[data-tour-target="upgrade-pro"]',
      title: 'Subscribe to Pro',
      description: plan === 'PRO'
        ? 'This is where your Pro access lives. Pattern recognition, deeper trends, and insight views are already unlocked on your account.'
        : 'Upgrade here to unlock pattern recognition, longer-term insights, and richer summaries built from your logs and sessions.',
    },
  ], [plan]);

  const seenFlagKey = authUser ? `${TOUR_FLAG_KEY}:${authUser.id}` : TOUR_FLAG_KEY;

  React.useEffect(() => {
    if (!authUser || !isProfileLoaded || !settings.onboarded || location.pathname !== '/app') return;
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(seenFlagKey) === 'true') return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
      setStepIndex(0);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [authUser, isProfileLoaded, location.pathname, seenFlagKey, settings.onboarded]);

  React.useEffect(() => {
    if (!isOpen || location.pathname !== '/app') return;

    let cancelled = false;
    let measureTimeout = 0;

    const measureTarget = (shouldScroll: boolean, retriesRemaining = 24) => {
      const target = document.querySelector(steps[stepIndex].selector) as HTMLElement | null;
      if (!target) {
        if (retriesRemaining > 0) {
          window.clearTimeout(measureTimeout);
          measureTimeout = window.setTimeout(() => {
            if (!cancelled) {
              measureTarget(false, retriesRemaining - 1);
            }
          }, 120);
        }
        return;
      }

      if (shouldScroll) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: window.innerWidth < MOBILE_BREAKPOINT ? 'start' : 'center',
          inline: 'nearest',
        });
      }

      window.clearTimeout(measureTimeout);
      measureTimeout = window.setTimeout(() => {
        if (cancelled) return;

        const rect = target.getBoundingClientRect();
        const computedRadius = Number.parseFloat(window.getComputedStyle(target).borderRadius) || 18;
        const spotlight = {
          top: clamp(rect.top - 6, VIEWPORT_PADDING, window.innerHeight - VIEWPORT_PADDING),
          left: clamp(rect.left - 6, VIEWPORT_PADDING, window.innerWidth - VIEWPORT_PADDING),
          width: Math.min(rect.width + 12, window.innerWidth - VIEWPORT_PADDING * 2),
          height: Math.min(rect.height + 12, window.innerHeight - VIEWPORT_PADDING * 2),
          radius: computedRadius + 6,
        };

        const tooltipHeight = tooltipRef.current?.offsetHeight ?? DEFAULT_TOOLTIP_HEIGHT;

        setSpotlightRect(spotlight);
        setTooltipPosition(
          getTooltipPosition(spotlight, tooltipHeight, window.innerWidth, window.innerHeight),
        );
      }, shouldScroll ? 220 : 0);
    };

    measureTarget(true);

    const handleViewportChange = () => {
      measureTarget(false);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      cancelled = true;
      window.clearTimeout(measureTimeout);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, location.pathname, stepIndex, steps]);

  React.useEffect(() => {
    if (!isOpen || !spotlightRect) return;

    const tooltipHeight = tooltipRef.current?.offsetHeight ?? DEFAULT_TOOLTIP_HEIGHT;
    setTooltipPosition(
      getTooltipPosition(spotlightRect, tooltipHeight, window.innerWidth, window.innerHeight),
    );
  }, [isOpen, spotlightRect, stepIndex]);

  if (!isOpen || !isProfileLoaded || !settings.onboarded || location.pathname !== '/app' || !spotlightRect || !tooltipPosition) {
    return null;
  }

  const closeTour = () => {
    window.localStorage.setItem(seenFlagKey, 'true');
    setIsOpen(false);
  };

  const goPrev = () => {
    setStepIndex(current => Math.max(0, current - 1));
  };

  const goNext = () => {
    if (stepIndex === steps.length - 1) {
      closeTour();
      return;
    }
    setStepIndex(current => Math.min(steps.length - 1, current + 1));
  };

  const currentStep = steps[stepIndex];

  return createPortal(
    <div className="fixed inset-0 z-[140]">
      <div className="fixed inset-0" />

      <button
        type="button"
        onClick={closeTour}
        className="fixed right-4 top-4 inline-flex items-center gap-2 rounded-full border border-[#00c8ff]/35 bg-[#07141c]/92 px-4 py-2 text-[12px] font-medium text-[#9beeff] shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-colors hover:bg-[#0d1f2a]"
        style={{ fontFamily: "'Syne', 'Inter', sans-serif" }}
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.8} />
        Skip Tour
      </button>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed"
        style={{
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
          borderRadius: spotlightRect.radius,
          boxShadow: '0 0 0 9999px rgba(3, 10, 15, 0.82)',
          border: '1px solid rgba(0, 200, 255, 0.55)',
          background: 'transparent',
          transition: 'top 300ms ease, left 300ms ease, width 300ms ease, height 300ms ease, border-radius 300ms ease',
        }}
      />

      <div
        ref={tooltipRef}
        className="fixed rounded-[22px] border border-[#00c8ff]/25 bg-[#07141c]/96 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: tooltipPosition.width,
          transition: 'top 300ms ease, left 300ms ease, opacity 300ms ease, transform 300ms ease',
          fontFamily: "'Syne', 'Inter', sans-serif",
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-[#00c8ff]/25 bg-[#00c8ff]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8be9ff]">
            Step {stepIndex + 1} / {steps.length}
          </span>
          <span className="text-[11px] text-[#78b9ca]">
            Onboarding tour
          </span>
        </div>

        <h3 className="mb-2 text-[22px] font-semibold leading-tight text-white">
          {currentStep.title}
        </h3>
        <p className="text-[14px] leading-6 text-[#d2ecf4]">
          {currentStep.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[13px] text-[#d2ecf4] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            Prev
          </button>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#00c8ff] px-4 py-2 text-[13px] font-semibold text-[#04131b] transition-colors hover:bg-[#56daff]"
          >
            {stepIndex === steps.length - 1 ? 'Done' : 'Next'}
            {stepIndex !== steps.length - 1 && <ChevronRight className="h-4 w-4" strokeWidth={1.8} />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
