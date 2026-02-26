import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { SessionlyLogo } from '../components/SessionlyLogo';
import { useApp } from '../context/AppContext';
import { useActionRateLimit } from '../hooks/useActionRateLimit';
import type { PlanType } from '../lib/api';

function getPlanFromSearch(search: string): PlanType {
  const params = new URLSearchParams(search);
  return params.get('plan')?.toUpperCase() === 'PRO' ? 'PRO' : 'FREE';
}

function getModeFromSearch(search: string): 'login' | 'signup' {
  const params = new URLSearchParams(search);
  return params.get('mode') === 'login' ? 'login' : 'signup';
}

export function AuthPage() {
  const { signUp, login, selectPlan, isAuthenticated, isAuthLoading, authUser } = useApp();
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
  const { run } = useActionRateLimit(800);

  const params = new URLSearchParams(location.search);
  const nextPath = params.get('next') || '/app';

  const requiresPlanStep = mode === 'signup' || selectedPlan === 'PRO';

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
        toast('Account ready. Complete fake payment to apply your plan.', { duration: 2500 });
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Authentication failed.', { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFakePayment = async () => {
    const gate = await run(async () => true);
    if (gate.blocked) return;
    setProcessingPayment(true);
    try {
      await selectPlan(selectedPlan);
      toast(selectedPlan === 'PRO' ? 'Fake Pro payment complete.' : 'Free plan activated.', { duration: 2500 });
      navigate(nextPath, { replace: true });
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to process fake payment.', { duration: 3000 });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center mb-8">
          <SessionlyLogo size={36} showWordmark wordmarkSize={22} />
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => setMode('signup')}
              className={`px-3 py-1.5 rounded-md text-[13px] ${mode === 'signup' ? 'bg-terracotta text-white' : 'bg-secondary text-muted-foreground'}`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode('login')}
              className={`px-3 py-1.5 rounded-md text-[13px] ${mode === 'login' ? 'bg-terracotta text-white' : 'bg-secondary text-muted-foreground'}`}
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

          {isAuthenticated && requiresPlanStep && (
            <div className="mt-5 border border-border rounded-lg p-4 bg-secondary/30">
              <p className="text-[14px] mb-2">
                Fake payment step: <strong>{selectedPlan === 'PRO' ? 'Pro' : 'Free'}</strong>
              </p>
              <p className="text-[12px] text-muted-foreground mb-3">
                Signed in as {authUser?.email}. Click below to apply your selected plan.
              </p>
              <button
                onClick={handleFakePayment}
                disabled={processingPayment}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terracotta text-white rounded-lg text-[14px] hover:bg-terracotta/90 transition-all disabled:opacity-50"
              >
                {processingPayment ? 'Processing...' : `Pay (Fake) for ${selectedPlan === 'PRO' ? 'Pro' : 'Free'} `}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[13px] text-muted-foreground mt-4">
          <Link to="/" className="text-terracotta hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
