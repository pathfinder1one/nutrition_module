import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald text-white shadow-md shadow-emerald/20 hover:bg-emerald-light hover:shadow-glow-emerald active:bg-emerald-dark focus-visible:ring-emerald',
  secondary:
    'bg-sage/50 text-forest border border-forest/10 hover:bg-sage hover:border-forest/20 focus-visible:ring-forest/30 dark:bg-white/10 dark:text-white dark:border-white/15 dark:hover:bg-white/15',
  outline:
    'bg-white/60 text-forest border border-forest/25 hover:bg-forest/5 hover:border-forest/45 focus-visible:ring-forest/30 dark:bg-transparent dark:text-white dark:border-white/25 dark:hover:bg-white/10',
  ghost:
    'bg-transparent text-forest hover:bg-forest/8 active:bg-forest/15 focus-visible:ring-forest/30 dark:text-white dark:hover:bg-white/10',
  gold:
    'bg-gold text-forest-dark font-semibold shadow-md shadow-gold/25 hover:bg-gold-hover hover:shadow-glow-gold active:bg-gold-hover/90 focus-visible:ring-gold',
  danger:
    'bg-status-danger text-white shadow-md shadow-status-danger/20 hover:bg-status-danger/90 active:bg-status-danger/80 focus-visible:ring-status-danger',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3.5 py-1.5 rounded-full gap-1.5',
  md: 'text-sm px-5 py-2.5 rounded-full gap-2',
  lg: 'text-base px-7 py-3.5 rounded-full gap-2.5 font-semibold',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? undefined : { scale: 1.02, y: -1 }}
        whileTap={isDisabled ? undefined : { scale: 0.98, y: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-transform select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory',
          'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// Semantic Shorthand Components
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  className,
  ...props
}) => {
  const iconPadding = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3.5',
  }[size];

  return (
    <Button
      size={size}
      className={cn('aspect-square rounded-full !px-0', iconPadding, className)}
      {...props}
    >
      {icon}
    </Button>
  );
};
