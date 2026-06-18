import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight, Bolt, NotebookPen, LineChart } from 'lucide-react';
import { toast } from 'sonner';

const AFFIRMATIONS = [
  'You showed up today. That counts.',
  'Small notes now, clearer sessions later.',
  'Your patterns are worth noticing.',
  'Nothing gets lost between sessions.',
];

import { SessionlyLogo } from '../components/SessionlyLogo';
import { useApp } from '../context/AppContext';
import { useActionRateLimit } from '../hooks/useActionRateLimit';
import { getErrorMessage, getGoogleLoginApi, type PlanType } from '../lib/api';

function getPlanFromSearch(search: string): PlanType {
  const params = new URLSearchParams(search);
  return params.get('plan')?.toUpperCase() === 'PRO' ? 'PRO' : 'FREE';
}

function getModeFromSearch(search: string): 'login' | 'signup' {
  const params = new URLSearchParams(search);
  return params.get('mode') === 'login' ? 'login' : 'signup';
}

export function AuthPage() {
  const { signUp, login, completeGoogleAuth, selectPlan, isAuthenticated, isAuthLoading, authUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedPlan = useMemo(() => getPlanFromSearch(location.search), [location.search]);
  const initialMode = useMemo(() => getModeFromSearch(location.search), [location.search]);

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingGoogle, setProcessingGoogle] = useState(false);
  const [affIndex, setAffIndex] = useState(0);
  const { run } = useActionRateLimit(800);

  useEffect(() => {
    const id = setInterval(() => setAffIndex(i => (i + 1) % AFFIRMATIONS.length), 4000);
    return () => clearInterval(id);
  }, []);

  const nextPath = useMemo(() => new URLSearchParams(location.search).get('next') || '/app', [location.search]);

  const requiresPlanStep = selectedPlan === 'PRO';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const provider = params.get('provider');
    if (provider !== 'google') return;

    const status = params.get('status');
    const token = params.get('token');
    const redirectNext = params.get('next') || nextPath;
    const clearGoogleParams = () => {
      const clean = new URLSearchParams(location.search);
      ['provider', 'status', 'token', 'error'].forEach(key => clean.delete(key));
      const cleanSearch = clean.toString();
      window.history.replaceState({}, '', `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}`);
    };

    if (status === 'ok' && token) {
      setProcessingGoogle(true);
      void completeGoogleAuth(token)
        .then(() => {
          clearGoogleParams();
          navigate(redirectNext, { replace: true });
        })
        .catch(error => {
          clearGoogleParams();
          toast(getErrorMessage(error, 'Google sign in failed.'), { duration: 3000 });
        })
        .finally(() => setProcessingGoogle(false));
      return;
    }

    if (status === 'error') {
      const message = params.get('error') || 'Google sign in failed.';
      clearGoogleParams();
      toast(message, { duration: 3000 });
    }
  }, [completeGoogleAuth, location.pathname, location.search, navigate, nextPath]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gate = await run(async () => true);
    if (gate.blocked) return;
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        await signUp({ name: name.trim(), email: email.trim(), password });
      } else {
        await login({ email: email.trim(), password });
      }

      if (!requiresPlanStep) {
        navigate(nextPath, { replace: true });
      } else {
        toast('Account ready. Continue to secure checkout to activate Pro.', { duration: 2500 });
      }
    } catch (error) {
      toast(getErrorMessage(error, 'Authentication failed.'), { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    const gate = await run(async () => true);
    if (gate.blocked) return;
    setProcessingPayment(true);
    try {
      await selectPlan(selectedPlan);
      if (selectedPlan !== 'PRO') {
        navigate(nextPath, { replace: true });
      }
    } catch (error) {
      toast(getErrorMessage(error, 'Failed to start checkout.'), { duration: 3000 });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleGoogleLogin = async () => {
    const gate = await run(async () => true);
    if (gate.blocked) return;
    setProcessingGoogle(true);
    try {
      const response = await getGoogleLoginApi(nextPath);
      window.location.href = response.url;
    } catch (error) {
      toast(getErrorMessage(error, 'Unable to start Google sign in.'), { duration: 3000 });
      setProcessingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-2xl overflow-hidden border border-border shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        {/* Hero panel */}
        <div
          className="relative p-8 lg:p-10 flex flex-col justify-between text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #D4926E 0%, #C17A5A 45%, #4A6741 120%)' }}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.25), transparent 55%)' }}
          />
          <div className="relative">
            <SessionlyLogo size={40} showWordmark wordmarkSize={26} wordmarkClassName="text-white" />
            <h1 className="mt-8 leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontSize: '34px' }}>
              Therapy doesn't end<br />in the room.
            </h1>
            <p key={affIndex} className="mt-4 text-[15px] text-white/90 transition-opacity duration-500 min-h-[44px]">
              {AFFIRMATIONS[affIndex]}
            </p>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-2">
            {[
              { icon: Bolt, label: 'Log in seconds' },
              { icon: NotebookPen, label: 'Walk in prepared' },
              { icon: LineChart, label: 'See your patterns' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1.5 text-[12px]">
                <Icon className="w-3.5 h-3.5" /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="bg-card p-7 lg:p-10 flex flex-col justify-center">
          <div className="flex p-1 bg-secondary rounded-lg mb-6">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all ${mode === 'signup' ? 'bg-card text-terracotta shadow-sm' : 'text-muted-foreground'}`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all ${mode === 'login' ? 'bg-card text-terracotta shadow-sm' : 'text-muted-foreground'}`}
            >
              Log in
            </button>
          </div>

          <form className="space-y-3" onSubmit={handleAuthSubmit}>
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-input-background rounded-lg px-3 py-2.5 outline-none border border-border focus:border-terracotta/40"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-input-background rounded-lg px-3 py-2.5 outline-none border border-border focus:border-terracotta/40"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-input-background rounded-lg px-3 py-2.5 outline-none border border-border focus:border-terracotta/40"
            />
            <button
              type="submit"
              disabled={submitting || isAuthLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg text-[14px] hover:bg-terracotta/90 transition-all disabled:opacity-50"
            >
              {submitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={processingGoogle}
            className="w-full mt-3 px-4 py-2.5 rounded-lg border border-border text-[14px] hover:bg-secondary/50 transition-all disabled:opacity-50"
          >
            {processingGoogle ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {isAuthenticated && requiresPlanStep && (
            <div className="mt-5 border border-border rounded-lg p-4 bg-secondary/30">
              <p className="text-[14px] mb-2">
                Checkout step: <strong>{selectedPlan === 'PRO' ? 'Pro' : 'Free'}</strong>
              </p>
              <p className="text-[12px] text-muted-foreground mb-3">
                Signed in as {authUser?.email}. Click below to continue to Dodo Payments checkout.
              </p>
              <button
                onClick={handleCheckout}
                disabled={processingPayment}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg text-[14px] hover:bg-terracotta/90 transition-all disabled:opacity-50"
              >
                {processingPayment ? 'Processing...' : `Continue to checkout for ${selectedPlan === 'PRO' ? 'Pro' : 'Free'} `}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-center text-[13px] text-muted-foreground mt-5">
            <Link to="/" className="text-terracotta hover:underline">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
