import React from 'react';
import { cn } from '@/utils/cn';

export interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  title,
  subtitle,
  align = 'center',
  className,
}) => {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center mx-auto',
    right: 'text-right items-end ml-auto',
  }[align];

  return (
    <div className={cn('flex flex-col max-w-2xl mb-12', alignmentClasses, className)}>
      {badge && (
        <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-sage dark:bg-emerald-950/60 text-forest dark:text-emerald-300 mb-3 border border-forest/10 dark:border-emerald-500/30 transition-colors">
          {badge}
        </span>
      )}
      <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-forest dark:text-white tracking-tight leading-tight transition-colors">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base sm:text-lg text-forest/75 dark:text-ivory/75 leading-relaxed font-sans transition-colors">
          {subtitle}
        </p>
      )}
    </div>
  );
};
