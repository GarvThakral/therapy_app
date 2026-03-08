import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

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
  const { run } = useActionRateLimit(800);

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
        </div>

        <p className="text-center text-[13px] text-muted-foreground mt-4">
          <Link to="/" className="text-terracotta hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
