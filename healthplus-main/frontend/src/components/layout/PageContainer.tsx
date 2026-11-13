import React from 'react';
import { cn } from '@/utils/cn';

export interface PageContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  children: React.ReactNode;
}

const maxWidthMap = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1440px]',
  full: 'max-w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  maxWidth = 'xl',
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
        maxWidthMap[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
};
