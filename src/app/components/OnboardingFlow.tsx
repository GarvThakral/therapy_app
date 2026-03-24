import React from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useApp, type UserSettings } from '../context/AppContext';
import { getErrorMessage } from '../lib/api';

const TOTAL_STEPS = 6;
const FINAL_STEP_INDEX = 6;

const REFERRAL_OPTIONS = [
  'Word of mouth',
  'Instagram',
  'Google',
  'Therapist recommended',
  'App Store',
  'Other',
] as const;

const FREQUENCY_OPTIONS: Array<{
  value: UserSettings['sessionFrequency'];
  label: string;
  description: string;
}> = [
  { value: 'weekly', label: 'Every week', description: 'Best if therapy is part of your fixed weekly rhythm.' },
  { value: 'biweekly', label: 'Every 2 weeks', description: 'For a steadier cadence without weekly appointments.' },
  { value: 'monthly', label: 'Once a month', description: 'A lighter check-in schedule with more time between sessions.' },
  { value: 'custom', label: 'Irregularly', description: 'For flexible or changing schedules that do not repeat cleanly.' },
] as const;

const USAGE_OPTIONS = [
  'Log sessions after therapy',
  'Track emotional patterns',
  'Share progress with my therapist',
  'Journal between sessions',
  'Monitor medications or exercises',
] as const;

type OnboardingDraft = {
  referralSource: string;
  therapistName: string;
  sessionFrequency: UserSettings['sessionFrequency'];
  usageIntentions: string[];
  nextSessionDate: string;
  nextSessionTime: string;
  step: number;
  profilePrepared: boolean;
};

function getDraftStorageKey(userId: string) {
  return `sessionly_onboarding_draft:${userId}`;
}

function getCompletedStorageKey(userId: string) {
  return `sessionly_has_completed_onboarding:${userId}`;
}

function toLocalDateValue(value: Date | null | undefined) {
  if (!value) return '';
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

function toLocalTimeValue(value: Date | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value.toTimeString().slice(0, 5);
}

function clampStep(value: number) {
  return Math.min(Math.max(value, 0), FINAL_STEP_INDEX);
}

function getFirstName(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0] || 'there';
}

function buildDraft(settings: UserSettings): OnboardingDraft {
  return {
    referralSource: settings.referralSource || '',
    therapistName: settings.therapistName || '',
    sessionFrequency: settings.sessionFrequency,
    usageIntentions: settings.usageIntentions || [],
    nextSessionDate: toLocalDateValue(settings.nextSessionDate),
    nextSessionTime: toLocalTimeValue(settings.nextSessionDate, settings.sessionTime),
    step: 0,
    profilePrepared: false,
  };
}

function parseStoredDraft(raw: string | null, fallback: OnboardingDraft) {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;
    return {
      referralSource: typeof parsed.referralSource === 'string' ? parsed.referralSource : fallback.referralSource,
      therapistName: typeof parsed.therapistName === 'string' ? parsed.therapistName : fallback.therapistName,
      sessionFrequency: parsed.sessionFrequency && ['weekly', 'biweekly', 'monthly', 'custom'].includes(parsed.sessionFrequency)
        ? parsed.sessionFrequency
        : fallback.sessionFrequency,
      usageIntentions: Array.isArray(parsed.usageIntentions)
        ? parsed.usageIntentions.filter((value): value is string => typeof value === 'string')
        : fallback.usageIntentions,
      nextSessionDate: typeof parsed.nextSessionDate === 'string' ? parsed.nextSessionDate : fallback.nextSessionDate,
      nextSessionTime: typeof parsed.nextSessionTime === 'string' ? parsed.nextSessionTime : fallback.nextSessionTime,
      step: typeof parsed.step === 'number' ? clampStep(parsed.step) : fallback.step,
      profilePrepared: parsed.profilePrepared === true,
    };
  } catch {
    return fallback;
  }
}

function getValidationMessage(step: number, draft: OnboardingDraft) {
  switch (step) {
    case 1:
      return draft.referralSource ? '' : 'Choose where you heard about Sessionly.';
    case 2:
      return draft.therapistName.trim().length >= 2 ? '' : 'Enter your therapist’s name.';
    case 3:
      return draft.sessionFrequency ? '' : 'Choose how often you attend therapy.';
    case 4:
      return draft.usageIntentions.length > 0 ? '' : 'Select at least one way you plan to use Sessionly.';
    case 5: {
      const hasDate = Boolean(draft.nextSessionDate);
      const hasTime = Boolean(draft.nextSessionTime);
      return hasDate === hasTime ? '' : 'Choose both a date and time, or skip for now.';
    }
    default:
      return '';
  }
}

function TileButton({
  label,
  description,
  selected,
  onClick,
  multi = false,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-h-[92px] rounded-[22px] border px-5 py-4 text-left transition-all duration-300 ${
        selected
          ? 'border-terracotta/60 bg-terracotta/10 text-foreground shadow-[0_0_0_1px_rgba(193,122,90,0.18),0_16px_40px_rgba(0,0,0,0.18)]'
          : 'border-border bg-card/70 text-foreground hover:border-terracotta/35 hover:bg-secondary/35'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[17px] leading-tight">{label}</p>
          {description ? (
            <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <span
          className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
            selected
              ? 'border-terracotta bg-terracotta text-white'
              : 'border-border bg-transparent text-transparent group-hover:border-terracotta/40'
          }`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.3} />
        </span>
      </div>
      {multi ? (
        <span
          className="mt-4 inline-flex text-[11px] uppercase tracking-[0.24em] text-muted-foreground"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Multi-select
        </span>
      ) : null}
    </button>
  );
}

export function OnboardingFlow() {
  const { authUser, settings, isProfileLoaded, saveSettings } = useApp();
  const navigate = useNavigate();
  const hydratedUserRef = React.useRef<string | null>(null);
  const [draft, setDraft] = React.useState<OnboardingDraft | null>(null);
  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [showValidation, setShowValidation] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const userId = authUser?.id ?? null;
  const isOpen = Boolean(userId && isProfileLoaded && !settings.onboarded && draft);
  const firstName = getFirstName(settings.displayName || authUser?.name);

  React.useEffect(() => {
    if (!userId || !isProfileLoaded || settings.onboarded) {
      hydratedUserRef.current = null;
      setDraft(null);
      setStep(0);
      setShowValidation(false);
      return;
    }

    if (hydratedUserRef.current === userId) return;
    hydratedUserRef.current = userId;

    const fallback = buildDraft(settings);
    const stored = parseStoredDraft(window.localStorage.getItem(getDraftStorageKey(userId)), fallback);
    setDraft(stored);
    setStep(stored.step);
  }, [userId, isProfileLoaded, settings]);

  React.useEffect(() => {
    if (!userId) return;

    if (settings.onboarded) {
      window.localStorage.setItem(getCompletedStorageKey(userId), 'true');
      window.localStorage.removeItem(getDraftStorageKey(userId));
    }
  }, [settings.onboarded, userId]);

  React.useEffect(() => {
    if (!userId || !draft || settings.onboarded) return;

    window.localStorage.setItem(
      getDraftStorageKey(userId),
      JSON.stringify({
        ...draft,
        step,
      }),
    );
  }, [draft, settings.onboarded, step, userId]);

  React.useEffect(() => {
    if (!isOpen) {
      document.documentElement.removeAttribute('data-onboarding-open');
      return;
    }

    document.documentElement.setAttribute('data-onboarding-open', 'true');
    return () => {
      document.documentElement.removeAttribute('data-onboarding-open');
    };
  }, [isOpen]);

  const progress = React.useMemo(() => {
    if (step >= FINAL_STEP_INDEX) return 100;
    return ((step + 1) / TOTAL_STEPS) * 100;
  }, [step]);

  const validationMessage = draft ? getValidationMessage(step, draft) : '';

  const updateDraft = React.useCallback((updates: Partial<OnboardingDraft>) => {
    setDraft(prev => (prev ? { ...prev, ...updates } : prev));
    setShowValidation(false);
  }, []);

  const goNext = React.useCallback(() => {
    if (!draft) return;
    if (step >= FINAL_STEP_INDEX) return;

    if (validationMessage) {
      setShowValidation(true);
      return;
    }

    setDirection(1);
    setStep(current => Math.min(current + 1, TOTAL_STEPS - 1));
  }, [draft, step, validationMessage]);

  const goBack = React.useCallback(() => {
    setShowValidation(false);
    setDirection(-1);
    setStep(current => Math.max(0, current - 1));
  }, []);

  const prepareProfile = React.useCallback(async (skipSession: boolean) => {
    if (!draft) return;

    const nextDate = !skipSession && draft.nextSessionDate && draft.nextSessionTime
      ? new Date(`${draft.nextSessionDate}T${draft.nextSessionTime}:00`)
      : settings.nextSessionDate;

    const nextSessionDate = Number.isNaN(nextDate.getTime()) ? settings.nextSessionDate : nextDate;

    setIsSaving(true);
    try {
      await saveSettings({
        displayName: settings.displayName || authUser?.name || 'Alex',
        referralSource: draft.referralSource,
        therapistName: draft.therapistName.trim(),
        sessionFrequency: draft.sessionFrequency,
        usageIntentions: draft.usageIntentions,
        nextSessionDate,
        sessionTime: !skipSession && draft.nextSessionTime ? draft.nextSessionTime : settings.sessionTime,
        sessionDay: !skipSession && draft.nextSessionDate
          ? format(new Date(`${draft.nextSessionDate}T12:00:00`), 'EEEE')
          : settings.sessionDay,
      });

      setDraft(prev => (prev ? { ...prev, profilePrepared: true, step: FINAL_STEP_INDEX } : prev));
      setDirection(1);
      setStep(FINAL_STEP_INDEX);
      setShowValidation(false);
    } catch (error) {
      toast(getErrorMessage(error, 'Unable to save your setup right now.'), { duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  }, [authUser?.name, draft, saveSettings, settings]);

  const completeOnboarding = React.useCallback(async (destination: 'log' | 'later') => {
    if (!userId || !draft?.profilePrepared) return;

    setIsSaving(true);
    try {
      await saveSettings({ onboarded: true });
      window.localStorage.setItem(getCompletedStorageKey(userId), 'true');
      window.localStorage.removeItem(getDraftStorageKey(userId));

      if (destination === 'log') {
        navigate('/app', { replace: true });
        window.requestAnimationFrame(() => {
          const target = document.querySelector('[data-tour-target="log-entry"] textarea') as HTMLTextAreaElement | null;
          target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.setTimeout(() => target?.focus(), 220);
        });
      }
    } catch (error) {
      toast(getErrorMessage(error, 'Unable to finish onboarding right now.'), { duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  }, [draft?.profilePrepared, navigate, saveSettings, userId]);

  const handleSkipSession = React.useCallback(() => {
    if (!draft) return;
    updateDraft({ nextSessionDate: '', nextSessionTime: '' });
    void prepareProfile(true);
  }, [draft, prepareProfile, updateDraft]);

  const handlePrimaryAction = React.useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      goNext();
      return;
    }

    if (!draft) return;
    const stepValidation = getValidationMessage(step, draft);
    if (stepValidation) {
      setShowValidation(true);
      return;
    }

    void prepareProfile(false);
  }, [draft, goNext, prepareProfile, step]);

  const toggleUsage = React.useCallback((value: string) => {
    setDraft(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        usageIntentions: prev.usageIntentions.includes(value)
          ? prev.usageIntentions.filter(item => item !== value)
          : [...prev.usageIntentions, value],
      };
    });
    setShowValidation(false);
  }, []);

  if (!isOpen || !draft) return null;

  return (
    <div
      className="fixed inset-0 z-[150] overflow-y-auto bg-background text-foreground"
    >
      <div className="absolute inset-0 bg-background" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 14% 18%, rgba(193,122,90,0.14), transparent 30%), radial-gradient(circle at 82% 12%, rgba(212,168,83,0.1), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 40%)',
        }}
      />

      <div className="relative flex min-h-screen flex-col">
        <div className="h-[3px] w-full bg-border/50">
          <motion.div
            className="h-full bg-terracotta"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 sm:py-10">
          <div className="w-full max-w-[760px]">
            <div className="mb-6 flex min-h-[32px] items-center justify-between gap-4 sm:mb-8">
              {step > 0 && step < FINAL_STEP_INDEX ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/80 text-foreground transition-colors hover:border-terracotta/35 hover:bg-secondary"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.1} />
                </button>
              ) : (
                <div className="h-12 w-12" />
              )}

              {step < FINAL_STEP_INDEX ? (
                <div
                  className="text-right text-[12px] tracking-[0.18em] text-muted-foreground uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Step {step + 1} of {TOTAL_STEPS}
                </div>
              ) : (
                <div className="h-5" />
              )}
            </div>

            <div className="rounded-[32px] border border-border bg-card/92 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                  {step === 0 ? (
                    <div className="flex min-h-[540px] flex-col items-center justify-center text-center sm:min-h-[560px]">
                      <div
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-[12px] uppercase tracking-[0.26em] text-muted-foreground"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-terracotta" strokeWidth={2} />
                        Sessionly setup
                      </div>
                      <h1 className="max-w-[11ch] text-[42px] leading-[0.94] text-foreground sm:text-[64px]">
                        Let&apos;s set up your space.
                      </h1>
                      <p className="mt-6 max-w-[560px] text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
                        A few quick questions so Sessionly works the way you think.
                      </p>
                      <button
                        type="button"
                        onClick={goNext}
                        className="mt-12 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-terracotta px-7 text-[15px] font-medium text-white transition-colors hover:bg-terracotta/90"
                      >
                        Begin
                        <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="min-h-[540px]">
                      <p
                        className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Getting context
                      </p>
                      <h2 className="mt-5 text-[34px] leading-tight sm:text-[46px]">Where did you hear about us?</h2>
                      <p className="mt-3 max-w-[520px] text-[16px] leading-7 text-muted-foreground">
                        This helps us understand which channels are actually bringing the right users in.
                      </p>

                      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {REFERRAL_OPTIONS.map(option => (
                          <TileButton
                            key={option}
                            label={option}
                            selected={draft.referralSource === option}
                            onClick={() => updateDraft({ referralSource: option })}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="min-h-[540px]">
                      <p
                        className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Personalization
                      </p>
                      <h2 className="mt-5 text-[34px] leading-tight sm:text-[46px]">Who are you working with?</h2>
                      <p className="mt-3 max-w-[520px] text-[16px] leading-7 text-muted-foreground">
                        This helps us personalize your session logs.
                      </p>

                      <div className="mt-12 max-w-[520px]">
                        <label
                          htmlFor="therapist-name"
                          className="mb-3 block text-[13px] uppercase tracking-[0.22em] text-muted-foreground"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          Therapist&apos;s name
                        </label>
                        <input
                          id="therapist-name"
                          type="text"
                          value={draft.therapistName}
                          onChange={event => updateDraft({ therapistName: event.target.value })}
                          autoFocus
                          className="min-h-[56px] w-full rounded-[20px] border border-border bg-input-background px-5 text-[18px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-terracotta/60"
                          placeholder="Dr. Rivera"
                        />
                      </div>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="min-h-[540px]">
                      <p
                        className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Your cadence
                      </p>
                      <h2 className="mt-5 text-[34px] leading-tight sm:text-[46px]">How often do you attend therapy?</h2>
                      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {FREQUENCY_OPTIONS.map(option => (
                          <TileButton
                            key={option.value}
                            label={option.label}
                            description={option.description}
                            selected={draft.sessionFrequency === option.value}
                            onClick={() => updateDraft({ sessionFrequency: option.value })}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="min-h-[540px]">
                      <p
                        className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        What matters most
                      </p>
                      <h2 className="mt-5 text-[34px] leading-tight sm:text-[46px]">How do you plan on using Sessionly?</h2>
                      <p className="mt-3 max-w-[520px] text-[16px] leading-7 text-muted-foreground">
                        Pick the jobs you want this space to do for you. You can change these later.
                      </p>

                      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {USAGE_OPTIONS.map(option => (
                          <TileButton
                            key={option}
                            label={option}
                            selected={draft.usageIntentions.includes(option)}
                            onClick={() => toggleUsage(option)}
                            multi
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {step === 5 ? (
                    <div className="min-h-[540px]">
                      <p
                        className="text-[12px] uppercase tracking-[0.24em] text-muted-foreground"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        One useful nudge
                      </p>
                      <h2 className="mt-5 text-[34px] leading-tight sm:text-[46px]">When&apos;s your next session?</h2>
                      <p className="mt-3 max-w-[560px] text-[16px] leading-7 text-muted-foreground">
                        Optional, but worth it. We&apos;ll use this to anchor the next session context and reminders.
                      </p>

                      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-[1.2fr,0.8fr]">
                        <label className="rounded-[22px] border border-border bg-card/70 p-5">
                          <span
                            className="mb-3 flex items-center gap-2 text-[13px] uppercase tracking-[0.22em] text-muted-foreground"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            <CalendarDays className="h-4 w-4 text-terracotta" strokeWidth={1.8} />
                            Date
                          </span>
                          <input
                            type="date"
                            value={draft.nextSessionDate}
                            onChange={event => updateDraft({ nextSessionDate: event.target.value })}
                            className="min-h-[52px] w-full rounded-[16px] border border-border bg-input-background px-4 text-[17px] text-foreground outline-none focus:border-terracotta/60"
                          />
                        </label>

                        <label className="rounded-[22px] border border-border bg-card/70 p-5">
                          <span
                            className="mb-3 block text-[13px] uppercase tracking-[0.22em] text-muted-foreground"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            Time
                          </span>
                          <input
                            type="time"
                            value={draft.nextSessionTime}
                            onChange={event => updateDraft({ nextSessionTime: event.target.value })}
                            className="min-h-[52px] w-full rounded-[16px] border border-border bg-input-background px-4 text-[17px] text-foreground outline-none focus:border-terracotta/60"
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}

                  {step === FINAL_STEP_INDEX ? (
                    <div className="flex min-h-[540px] flex-col items-center justify-center text-center sm:min-h-[560px]">
                      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-terracotta/25 bg-terracotta/10 text-terracotta">
                        <Sparkles className="h-7 w-7" strokeWidth={1.9} />
                      </div>
                      <p
                        className="text-[12px] uppercase tracking-[0.26em] text-muted-foreground"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        Ready
                      </p>
                      <h2 className="mt-4 text-[38px] leading-tight sm:text-[58px]">
                        You&apos;re all set, {firstName}.
                      </h2>
                      <p className="mt-5 max-w-[560px] text-[16px] leading-7 text-muted-foreground sm:text-[18px]">
                        Your space is ready. Start by logging today&apos;s session or wait until after your next one.
                      </p>

                      <div className="mt-10 flex w-full max-w-[440px] flex-col gap-3">
                        <button
                          type="button"
                          onClick={() => { void completeOnboarding('log'); }}
                          disabled={isSaving}
                          className="min-h-[54px] rounded-full bg-terracotta px-6 text-[15px] font-medium text-white transition-colors hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          {isSaving ? 'Finishing...' : 'Log a session now'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { void completeOnboarding('later'); }}
                          disabled={isSaving}
                          className="min-h-[54px] rounded-full border border-border bg-secondary/30 px-6 text-[15px] text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          I&apos;ll come back later
                        </button>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              {step < FINAL_STEP_INDEX ? (
                <div className="mt-6 border-t border-border pt-5">
                  {showValidation && validationMessage ? (
                    <p className="mb-4 text-[13px] text-destructive">
                      {validationMessage}
                    </p>
                  ) : (
                    <div className="mb-4 min-h-[20px]" />
                  )}

                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[12px] text-muted-foreground">
                      {step === 5 ? 'Optional step. You can always schedule this later.' : 'Required to continue.'}
                    </div>

                    <div className="flex w-full flex-col items-end gap-3 sm:w-auto">
                      <button
                        type="button"
                        onClick={handlePrimaryAction}
                        aria-disabled={Boolean(validationMessage)}
                        disabled={isSaving}
                        className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-all sm:w-auto ${
                          validationMessage
                            ? 'bg-secondary text-muted-foreground'
                            : 'bg-terracotta text-white hover:bg-terracotta/90'
                        } ${isSaving ? 'cursor-not-allowed opacity-55' : ''}`}
                      >
                        {isSaving ? 'Saving...' : step === 5 ? 'Finish setup' : 'Continue'}
                        {!isSaving ? <ArrowRight className="h-4 w-4" strokeWidth={2.2} /> : null}
                      </button>

                      {step === 5 ? (
                        <button
                          type="button"
                          onClick={handleSkipSession}
                          disabled={isSaving}
                          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                        >
                          Skip for now
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
