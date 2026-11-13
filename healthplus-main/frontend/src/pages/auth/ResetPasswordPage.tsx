import React, { useState } from 'react';
import { Lock, Mail, CheckCircle2, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { SectionAtmosphere } from '@/components/backgrounds/SectionAtmosphere';
import {
  completePasswordResetWithToken,
  validateEmailFormat,
} from '@/services/authService';

export interface ResetPasswordPageProps {
  onNavigate?: (path: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onNavigate = () => {},
}) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateEmailFormat(email)) {
      setErrorMessage('Please enter your account email address.');
      return;
    }
    if (!token.trim()) {
      setErrorMessage('Please enter the reset verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await completePasswordResetWithToken({
      email,
      token,
      newPassword,
      confirmPassword,
    });
    setLoading(false);

    if (!res.ok) {
      setErrorMessage(res.error || 'Could not update your password.');
      return;
    }

    setSuccess(true);
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
            Create New Password
          </h1>
          <p className="text-xs text-forest/70 dark:text-ivory/75">
            Verify your email and code, then choose a new password of at least 8 characters.
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

        {success ? (
          <div className="p-4 rounded-2xl bg-emerald/15 border border-emerald/30 text-xs text-forest dark:text-ivory space-y-3">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>Password Successfully Updated</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your credentials for <strong>{email}</strong> have been updated. You can now log in
              with your new password.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full font-bold"
                onClick={() => onNavigate('/login')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Login with New Password
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} noValidate className="space-y-4">
            <Input
              id="reset-email"
              label="Account Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
              disabled={loading}
              required
            />

            <Input
              id="reset-token"
              label="Reset Verification Code"
              type="text"
              value={token}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToken(e.target.value)}
              placeholder="e.g. HP-123456"
              leftIcon={<KeyRound className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
              disabled={loading}
              required
            />

            <PasswordInput
              id="reset-new-password"
              label="New Password"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              leftIcon={<Lock className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
              disabled={loading}
              required
            />

            <PasswordInput
              id="reset-confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Re-enter new password"
              leftIcon={<Lock className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
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
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
