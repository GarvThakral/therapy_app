import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SessionlyLogo } from '../components/SessionlyLogo';

const goals = [
  'Remembering what to say',
  'Doing my homework',
  'Understanding my patterns',
  'Capturing how I actually feel',
  'All of it',
];

export function Onboarding() {
  const { updateSettings } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('10:00');
  const [noSession, setNoSession] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [preReminder, setPreReminder] = useState(2);
  const [postReminder, setPostReminder] = useState(1);
  const [enablePre, setEnablePre] = useState(true);
  const [enablePost, setEnablePost] = useState(true);

  const toggleGoal = (goal: string) => {
    if (goal === 'All of it') {
      setSelectedGoals(selectedGoals.includes('All of it') ? [] : ['All of it']);
    } else {
      setSelectedGoals(prev =>
        prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev.filter(g => g !== 'All of it'), goal]
      );
    }
  };

  const goForward = () => {
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleComplete = () => {
    updateSettings({
      onboarded: true,
      nextSessionDate: sessionDate ? new Date(sessionDate + 'T' + sessionTime) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionTime,
      preSessionReminder: preReminder,
      postSessionReminder: postReminder,
      enablePreReminder: enablePre,
      enablePostReminder: enablePost,
    });
    navigate('/app');
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <SessionlyLogo size={36} showWordmark wordmarkSize={22} />
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-terracotta w-6' : i < step ? 'bg-terracotta w-2' : 'bg-border w-2'
              }`}
            />
          ))}
        </div>

        {/* Steps with animation */}
        <div className="relative overflow-hidden" style={{ minHeight: '380px' }}>
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: When's your next session? */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="text-center"
              >
                <h2 className="text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  When's your next session?
                </h2>
                <p className="text-muted-foreground text-[14px] mb-8">
                  We'll remind you to prep beforehand.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={e => { setSessionDate(e.target.value); setNoSession(false); }}
                      disabled={noSession}
                      className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground text-center outline-none focus:border-terracotta/40 disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={sessionTime}
                      onChange={e => setSessionTime(e.target.value)}
                      disabled={noSession}
                      className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground text-center outline-none focus:border-terracotta/40 disabled:opacity-40"
                    />
                  </div>
                  <button
                    onClick={() => { setNoSession(!noSession); setSessionDate(''); }}
                    className={`text-[14px] transition-colors ${
                      noSession ? 'text-terracotta' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {noSession ? '✓ ' : ''}I don't have one scheduled yet
                  </button>
                </div>

                <button
                  onClick={goForward}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-terracotta text-white rounded-lg text-[15px] hover:bg-terracotta/90 transition-all active:translate-y-px"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Goals */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="text-center"
              >
                <h2 className="text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  What are you hoping to get better at?
                </h2>
                <p className="text-muted-foreground text-[14px] mb-8">
                  Between sessions, that is.
                </p>

                <div className="space-y-2 mb-8">
                  {goals.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-[14px] transition-all ${
                        selectedGoals.includes(goal)
                          ? 'border-terracotta/40 bg-terracotta/10 text-terracotta'
                          : 'border-border text-foreground hover:border-muted-foreground/40'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedGoals.includes(goal) ? 'border-terracotta bg-terracotta' : 'border-muted-foreground/30'
                        }`}>
                          {selectedGoals.includes(goal) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {goal}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-4 py-3 border border-border text-muted-foreground rounded-lg text-[14px] hover:text-foreground hover:border-muted-foreground/40 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={goForward}
                    className="flex items-center gap-2 px-6 py-3 bg-terracotta text-white rounded-lg text-[15px] hover:bg-terracotta/90 transition-all active:translate-y-px"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Reminders */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="text-center"
              >
                <h2 className="text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Set up your reminders
                </h2>
                <p className="text-muted-foreground text-[14px] mb-8">
                  So you never walk in unprepared.
                </p>

                <div className="space-y-4 mb-8 text-left">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-foreground text-[14px]">Pre-session reminder</p>
                      <button
                        onClick={() => setEnablePre(!enablePre)}
                        className={`relative rounded-full transition-colors duration-200 ${
                          enablePre ? 'bg-terracotta' : 'bg-switch-background'
                        }`}
                        style={{ minWidth: '40px', width: '40px', height: '22px' }}
                        role="switch"
                        aria-checked={enablePre}
                        aria-label="Pre-session reminder"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200 shadow-sm ${
                          enablePre ? 'translate-x-[18px]' : ''
                        }`} />
                      </button>
                    </div>
                    {enablePre && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[13px]">Remind me</span>
                        <select
                          value={preReminder}
                          onChange={e => setPreReminder(Number(e.target.value))}
                          className="bg-input-background border-none rounded px-2 py-1 text-[13px] text-foreground outline-none"
                        >
                          {[1, 2, 4, 8, 24].map(h => (
                            <option key={h} value={h}>{h} hour{h !== 1 ? 's' : ''}</option>
                          ))}
                        </select>
                        <span className="text-muted-foreground text-[13px]">before</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-foreground text-[14px]">Post-session reminder</p>
                      <button
                        onClick={() => setEnablePost(!enablePost)}
                        className={`relative rounded-full transition-colors duration-200 ${
                          enablePost ? 'bg-terracotta' : 'bg-switch-background'
                        }`}
                        style={{ minWidth: '40px', width: '40px', height: '22px' }}
                        role="switch"
                        aria-checked={enablePost}
                        aria-label="Post-session reminder"
                      >
                        <div className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200 shadow-sm ${
                          enablePost ? 'translate-x-[18px]' : ''
                        }`} />
                      </button>
                    </div>
                    {enablePost && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[13px]">Remind me</span>
                        <select
                          value={postReminder}
                          onChange={e => setPostReminder(Number(e.target.value))}
                          className="bg-input-background border-none rounded px-2 py-1 text-[13px] text-foreground outline-none"
                        >
                          {[0.5, 1, 2, 4].map(h => (
                            <option key={h} value={h}>{h === 0.5 ? '30 minutes' : `${h} hour${h !== 1 ? 's' : ''}`}</option>
                          ))}
                        </select>
                        <span className="text-muted-foreground text-[13px]">after</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-4 py-3 border border-border text-muted-foreground rounded-lg text-[14px] hover:text-foreground hover:border-muted-foreground/40 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-terracotta text-white rounded-lg text-[15px] hover:bg-terracotta/90 transition-all active:translate-y-px"
                  >
                    Let's get started
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link to="/" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}