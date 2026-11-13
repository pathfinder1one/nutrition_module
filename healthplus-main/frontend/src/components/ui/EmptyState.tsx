import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-white/70 border border-forest/8 shadow-subtle',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-sage/60 text-emerald flex items-center justify-center mb-4 border border-forest/10 shadow-subtle">
        {icon || <Sparkles className="w-8 h-8" />}
      </div>
      <h3 className="font-heading font-bold text-xl text-forest mb-2">{title}</h3>
      <p className="text-sm text-forest/70 max-w-sm mb-6 leading-relaxed font-sans">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
