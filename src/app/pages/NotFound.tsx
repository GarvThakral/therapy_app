import React from 'react';
import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[64px] text-terracotta mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          404
        </p>
        <h1 className="text-foreground mb-3" style={{ fontSize: '24px' }}>
          This page wandered off.
        </h1>
        <p className="text-muted-foreground text-[15px] mb-8 leading-relaxed">
          Maybe it's between sessions. Let's get you back somewhere familiar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/app"
            className="px-6 py-2.5 bg-terracotta text-white rounded-lg text-[14px] hover:bg-terracotta/90 transition-all active:translate-y-px"
          >
            Back to This Week
          </Link>
          <Link
            to="/"
            className="px-6 py-2.5 border border-border text-foreground rounded-lg text-[14px] hover:border-muted-foreground/40 transition-all"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
