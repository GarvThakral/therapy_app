import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import { AppSidebar, MobileNav } from './AppSidebar';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { SessionlyLogo } from './SessionlyLogo';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { settings } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-secondary"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-foreground" strokeWidth={1.5} />
          </button>
          <SessionlyLogo size={26} showWordmark wordmarkSize={16} />
          <div className="w-8 h-8 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta text-[13px]">
            {settings.displayName ? settings.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
        </header>

        {/* Main content with page transitions */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileNav />
      </div>
    </div>
  );
}