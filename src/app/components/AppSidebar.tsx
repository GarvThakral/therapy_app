import React from 'react';
import { NavLink, useLocation } from 'react-router';
import { Home, ClipboardList, FileText, CheckSquare, BarChart3, Settings, Lock, X, PenLine, MoreHorizontal, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SessionlyLogo } from './SessionlyLogo';

const navItems = [
  { path: '/app', icon: Home, label: 'This Week', exact: true },
  { path: '/app/next-session', icon: ClipboardList, label: 'Next Session' },
  { path: '/app/past-sessions', icon: FileText, label: 'Past Sessions' },
  { path: '/app/homework', icon: CheckSquare, label: 'My Homework' },
  { path: '/app/patterns', icon: BarChart3, label: 'My Patterns', pro: true },
];

export function AppSidebar({ mobileOpen, onMobileToggle }: { mobileOpen: boolean; onMobileToggle: () => void }) {
  const { settings } = useApp();
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onMobileToggle} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:z-auto`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <SessionlyLogo size={32} showWordmark wordmarkSize={18} />
          <button onClick={onMobileToggle} className="lg:hidden p-1 rounded hover:bg-secondary" aria-label="Close menu">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2">
          <div className="space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => onMobileToggle()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all duration-150 group ${
                  isActive(item.path, item.exact)
                    ? 'bg-terracotta/10 text-terracotta'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="flex-1">{item.label}</span>
                {item.pro && !settings.isPro && (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                )}
              </NavLink>
            ))}
          </div>

          {/* Post-session shortcut */}
          <div className="mt-6 px-3">
            <NavLink
              to="/app/post-session"
              onClick={() => onMobileToggle()}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] border border-dashed transition-all duration-150 ${
                isActive('/app/post-session')
                  ? 'border-terracotta/40 bg-terracotta/10 text-terracotta'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
              }`}
            >
              <PenLine className="w-4 h-4" strokeWidth={1.5} />
              <span>Post-Session Notes</span>
            </NavLink>
          </div>

          {/* Community */}
          <div className="mt-3 px-3">
            <NavLink
              to="/app/discussions"
              onClick={() => onMobileToggle()}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                isActive('/app/discussions')
                  ? 'bg-terracotta/10 text-terracotta'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              <span>Community</span>
            </NavLink>
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
          <NavLink
            to="/app/settings"
            onClick={() => onMobileToggle()}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all duration-150 ${
              isActive('/app/settings')
                ? 'bg-terracotta/10 text-terracotta'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
            <span>Settings</span>
          </NavLink>
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta text-[13px]">
              {settings.displayName ? settings.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground truncate">{settings.displayName || 'User'}</p>
              <p className="text-[11px] text-muted-foreground">{settings.isPro ? 'Pro' : 'Free'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// Mobile bottom nav items — optimized for thumb reach
const mobileNavItems = [
  { path: '/app', icon: Home, label: 'Home', exact: true },
  { path: '/app/next-session', icon: ClipboardList, label: 'Prep' },
  { path: '/app/post-session', icon: PenLine, label: 'Notes' },
  { path: '/app/discussions', icon: MessageCircle, label: 'Community' },
  { path: '/app/settings', icon: Settings, label: 'More' },
];

export function MobileNav() {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 lg:hidden safe-bottom" aria-label="Mobile navigation">
      <div className="flex items-center justify-around px-1 py-1.5">
        {mobileNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors relative min-w-[56px] ${
              isActive(item.path, item.exact)
                ? 'text-terracotta'
                : 'text-muted-foreground'
            }`}
            aria-current={isActive(item.path, item.exact) ? 'page' : undefined}
          >
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}