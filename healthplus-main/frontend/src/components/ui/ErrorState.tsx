import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-rose-50/60 border border-status-danger/20',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-status-danger flex items-center justify-center mb-4 border border-status-danger/30">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h4 className="font-heading font-bold text-lg text-forest mb-1.5">{title}</h4>
      <p className="text-sm text-forest/70 max-w-sm mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
