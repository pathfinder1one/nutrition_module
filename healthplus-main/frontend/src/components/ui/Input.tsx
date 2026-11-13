import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BaseInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

// 1. TextInput
export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseInputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id,
      className,
      disabled,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-forest/80 dark:text-ivory/85 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-3.5 text-forest/50 pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-11 px-4 py-2.5 rounded-xl text-sm transition-all text-forest bg-white dark:bg-forest-light/60 dark:text-ivory dark:border-forest-surface',
              'border border-forest/15 placeholder:text-forest/40 dark:placeholder:text-ivory/40',
              'focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20',
              'disabled:bg-forest/5 disabled:opacity-60 disabled:cursor-not-allowed',
              error && 'border-status-danger focus:border-status-danger focus:ring-status-danger/20',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 text-forest/50 dark:text-ivory/50 flex items-center">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-xs text-status-danger flex items-center gap-1 mt-0.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        ) : (
          helperText && <p className="text-xs text-forest/60 dark:text-ivory/60 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);
TextInput.displayName = 'TextInput';

export const Input = TextInput;
export type InputProps = TextInputProps;

// 2. PasswordInput
export type PasswordInputProps = Omit<TextInputProps, 'type' | 'rightIcon'>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <TextInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-forest/50 hover:text-forest dark:text-ivory/60 dark:hover:text-ivory transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
        {...props}
      />
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

// 3. TextArea
export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseInputProps {}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, helperText, error, id, className, disabled, containerClassName, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-forest/80 dark:text-ivory/85 select-none"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full min-h-[96px] px-4 py-2.5 rounded-xl text-sm transition-all text-forest bg-white',
            'border border-forest/15 placeholder:text-forest/40 resize-y',
            'focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20',
            'disabled:bg-forest/5 disabled:opacity-60 disabled:cursor-not-allowed',
            error && 'border-status-danger focus:border-status-danger focus:ring-status-danger/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-danger flex items-center gap-1 mt-0.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        ) : (
          helperText && <p className="text-xs text-forest/60 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';

// 4. SelectInput
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectInputProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseInputProps {
  options: SelectOption[];
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  (
    { label, helperText, error, options, id, className, disabled, containerClassName, ...props },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-forest/80 dark:text-ivory/85 select-none"
          >
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-11 px-4 py-2.5 rounded-xl text-sm transition-all text-forest bg-white',
            'border border-forest/15 cursor-pointer appearance-none',
            'focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20',
            'disabled:bg-forest/5 disabled:opacity-60 disabled:cursor-not-allowed',
            error && 'border-status-danger focus:border-status-danger',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs text-status-danger mt-0.5 font-medium">{error}</p>
        ) : (
          helperText && <p className="text-xs text-forest/60 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);
SelectInput.displayName = 'SelectInput';

// 5. Checkbox
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className, disabled, ...props }, ref) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-start gap-3 select-none cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input
          id={inputId}
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className="w-4 h-4 mt-0.5 rounded border-forest/20 text-emerald focus:ring-emerald/20 focus:ring-offset-0 cursor-pointer"
          {...props}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-forest leading-snug">{label}</span>
          {description && <span className="text-xs text-forest/60">{description}</span>}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// 6. Toggle
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'flex items-center justify-between gap-4 select-none cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-semibold text-forest">{label}</span>}
          {description && <span className="text-xs text-forest/60">{description}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:ring-offset-2',
          checked ? 'bg-emerald' : 'bg-forest/20'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
};
