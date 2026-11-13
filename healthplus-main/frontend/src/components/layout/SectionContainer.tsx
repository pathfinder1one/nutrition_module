import React from 'react';
import { cn } from '@/utils/cn';

export interface SectionContainerProps {
  id?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

const spacingMap = {
  sm: 'py-10 sm:py-14',
  md: 'py-16 sm:py-20',
  lg: 'py-20 sm:py-28',
  xl: 'py-28 sm:py-36',
};

export const SectionContainer: React.FC<SectionContainerProps> = ({
  id,
  spacing = 'md',
  className,
  children,
}) => {
  return (
    <section
      id={id}
      className={cn('w-full relative overflow-hidden', spacingMap[spacing], className)}
    >
      {children}
    </section>
  );
};
