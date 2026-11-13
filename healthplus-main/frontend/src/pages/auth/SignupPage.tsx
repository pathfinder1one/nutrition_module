import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { SectionAtmosphere } from '@/components/backgrounds/SectionAtmosphere';
import { useApp } from '@/context/AppContext';
import { validateEmailFormat } from '@/services/authService';

export interface SignupPageProps {
  onNavigate?: (path: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate = () => {} }) => {
  const { registerAccount } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (name.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!validateEmailFormat(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please enter the same password twice.');
      return;
    }
    if (!acceptTerms) {
      setErrorMessage(
        'Please accept the Terms of Use & Local Privacy consent to create your account.'
      );
      return;
    }

    setLoading(true);
    const result = await registerAccount({
      name,
      email,
      password,
      confirmPassword,
      acceptTerms,
    });
    setLoading(false);

    if (!result.ok) {
      setErrorMessage(result.error || 'Could not create your account.');
      return;
    }

    setSuccessMessage('Account created! Starting your personal AI wellness interview...');
    setTimeout(() => {
      onNavigate('/onboarding');
    }, 300);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 isolate">
      <SectionAtmosphere variant="auth" />

      <div className="max-w-md w-full space-y-6 p-7 sm:p-8 rounded-3xl bg-white/95 dark:bg-[#0A1E17]/95 backdrop-blur-xl border border-forest/12 dark:border-white/12 shadow-2xl relative z-10 text-left">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest dark:bg-emerald-950 border border-emerald-500/20 text-gold font-heading font-black text-xl shadow-md">
            H+
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-forest dark:text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-forest/70 dark:text-ivory/75">
            Set up your private workspace first — our AI coach will interview you next before
            creating your plan.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-500/35 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald/15 border border-emerald/35 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSignup} noValidate className="space-y-4">
          <Input
            id="signup-fullname"
            label="Full Name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="e.g. Ananya Sharma"
            leftIcon={<User className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
            disabled={loading}
            required
          />

          <Input
            id="signup-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
            disabled={loading}
            required
          />

          <PasswordInput
            id="signup-password"
            label="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            helperText="Use at least 8 characters with letters and numbers."
            leftIcon={<Lock className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
            disabled={loading}
            required
          />

          <PasswordInput
            id="signup-confirm-password"
            label="Confirm Password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Re-enter your password"
            leftIcon={<Lock className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
            disabled={loading}
            required
          />

          <div className="p-3 rounded-xl bg-ivory dark:bg-white/5 border border-forest/10 dark:border-white/10">
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] text-forest/80 dark:text-ivory/80 leading-relaxed">
              <input
                id="signup-terms-consent"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-forest/30 text-emerald focus:ring-emerald/30 accent-emerald mt-0.5 shrink-0"
              />
              <span>
                I accept the <strong>Terms of Use &amp; Privacy Consent</strong> and understand
                HEALTH PLUS provides supportive wellness guidance, not medical diagnosis.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={loading}
            className="w-full font-bold shadow-lg shadow-emerald/20"
            rightIcon={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="p-3 rounded-xl bg-forest/5 dark:bg-white/5 border border-forest/8 dark:border-white/10 flex items-center gap-2 text-[11px] text-forest/70 dark:text-ivory/70">
          <ShieldCheck className="w-4 h-4 text-emerald shrink-0" />
          <span>Salted password verification &amp; strict personal account isolation.</span>
        </div>

        <div className="pt-3 border-t border-forest/10 dark:border-white/10 text-center text-xs text-forest/75 dark:text-ivory/75">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            disabled={loading}
            className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};
