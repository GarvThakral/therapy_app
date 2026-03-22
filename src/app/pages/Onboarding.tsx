import React from 'react';
import { Navigate } from 'react-router';

import { useApp } from '../context/AppContext';

export function Onboarding() {
  const { isAuthenticated } = useApp();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Navigate to="/auth?mode=signup&next=%2Fapp" replace />;
}
