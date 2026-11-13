import React from 'react';
import { AmbientBackground, type BackgroundVariant } from '@/components/backgrounds/AmbientBackground';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export interface PublicLayoutProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  backgroundVariant?: BackgroundVariant;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  currentPath,
  onNavigate,
  backgroundVariant = 'wellness',
  children,
}) => {
  return (
    <AmbientBackground variant={backgroundVariant} className="flex flex-col min-h-screen">
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </AmbientBackground>
  );
};
