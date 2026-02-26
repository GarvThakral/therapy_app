import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { ThisWeek } from './pages/ThisWeek';
import { NextSession } from './pages/NextSession';
import { PostSession } from './pages/PostSession';
import { PastSessions } from './pages/PastSessions';
import { MyHomework } from './pages/MyHomework';
import { MyPatterns } from './pages/MyPatterns';
import { SettingsPage } from './pages/SettingsPage';
import { Onboarding } from './pages/Onboarding';
import { NotFound } from './pages/NotFound';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Terms } from './pages/Terms';
import { Contact } from './pages/Contact';
import { Discussions } from './pages/Discussions';
import { AuthPage } from './pages/AuthPage';
import { useApp } from './context/AppContext';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useApp();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-[14px]">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?mode=login&next=${next}`} replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/onboarding',
    Component: Onboarding,
  },
  {
    path: '/auth',
    Component: AuthPage,
  },
  {
    path: '/blog',
    Component: Blog,
  },
  {
    path: '/blog/:slug',
    Component: BlogPost,
  },
  {
    path: '/privacy',
    Component: PrivacyPolicy,
  },
  {
    path: '/terms',
    Component: Terms,
  },
  {
    path: '/contact',
    Component: Contact,
  },
  {
    path: '/app',
    Component: () => (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: ThisWeek },
      { path: 'next-session', Component: NextSession },
      { path: 'post-session', Component: PostSession },
      { path: 'past-sessions', Component: PastSessions },
      { path: 'homework', Component: MyHomework },
      { path: 'patterns', Component: MyPatterns },
      { path: 'discussions', Component: Discussions },
      { path: 'settings', Component: SettingsPage },
    ],
  },
  {
    path: '*',
    Component: NotFound,
  },
]);
