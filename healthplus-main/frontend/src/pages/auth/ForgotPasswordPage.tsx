import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SectionAtmosphere } from '@/components/backgrounds/SectionAtmosphere';
import { requestPasswordResetCode, validateEmailFormat } from '@/services/authService';

export interface ForgotPasswordPageProps {
  onNavigate?: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigate = () => {},
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isDemoProtected, setIsDemoProtected] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateEmailFormat(email)) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    const res = await requestPasswordResetCode(email);
    setLoading(false);

    if (!res.ok) {
      setErrorMessage(res.error || 'Could not start password recovery.');
      return;
    }

    setPreviewCode(res.previewResetCode ?? null);
    setIsDemoProtected(Boolean(res.isDemoProtected));
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 isolate">
      <SectionAtmosphere variant="auth" />

      <div className="max-w-md w-full space-y-6 p-8 rounded-3xl bg-white/95 dark:bg-[#0A1E17]/95 backdrop-blur-xl border border-forest/12 dark:border-white/12 shadow-2xl relative z-10 text-left">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest dark:bg-emerald-950 border border-emerald-500/20 text-gold font-heading font-black text-xl shadow-md">
            H+
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-forest dark:text-white tracking-tight">
            Reset Your Password
          </h1>
          <p className="text-xs text-forest/70 dark:text-ivory/75">
            Enter your registered email address to request a secure verification code.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-500/35 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald/10 border border-emerald/25 text-xs text-forest dark:text-ivory space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>Recovery Request Processed</span>
            </div>
            {isDemoProtected ? (
              <p className="text-[11px] leading-relaxed">
                <strong>{email}</strong> is a pre-configured demonstration account whose fixed test
                credentials remain locked for judges. Sign in from the Login page.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed">
                If an account exists for <strong>{email}</strong>, a verification code has been
                prepared.
              </p>
            )}
            {previewCode && (
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/25 border border-forest/10 dark:border-white/10 font-mono text-xs text-center font-bold">
                Verification Code: {previewCode}
              </div>
            )}
            {!isDemoProtected && (
              <div className="pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold"
                  onClick={() => onNavigate('/reset-password')}
                >
                  Enter Code &amp; New Password
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              id="forgot-email"
              label="Registered Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={loading}
              className="w-full font-bold"
            >
              {loading ? 'Sending...' : 'Request Reset Code'}
            </Button>
          </form>
        )}

        <div className="pt-3 text-center border-t border-forest/10 dark:border-white/10">
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
