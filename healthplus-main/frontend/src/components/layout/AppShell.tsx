import React from 'react';
import { PublicLayout } from './PublicLayout';
import { DashboardLayout } from './DashboardLayout';

export interface AppShellProps {
  layout?: 'public' | 'dashboard';
  currentPath?: string;
  onNavigate?: (path: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  layout = 'public',
  currentPath = '/',
  onNavigate,
  children,
}) => {
  if (layout === 'dashboard') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={onNavigate}>
        {children}
      </DashboardLayout>
    );
  }

  return (
    <PublicLayout currentPath={currentPath} onNavigate={onNavigate}>
      {children}
    </PublicLayout>
  );
};
