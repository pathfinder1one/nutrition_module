import React, { useState } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HeartPulse,
  Dumbbell,
  Salad,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { SectionAtmosphere } from '@/components/backgrounds/SectionAtmosphere';
import { useApp } from '@/context/AppContext';
import { validateEmailFormat } from '@/services/authService';
import { DEMO_ACCOUNT_PRESETS, type DemoAccountPreset } from '@/services/demoAccounts';

export interface LoginPageProps {
  onNavigate?: (path: string) => void;
  authNotice?: string | null;
}

const DEMO_ICONS: Record<DemoAccountPreset['demoCategory'], React.ReactNode> = {
  general_wellness: <HeartPulse className="w-4 h-4 text-emerald dark:text-emerald-300" />,
  fitness_goal: <Dumbbell className="w-4 h-4 text-emerald dark:text-emerald-300" />,
  dietary_restrictions: <Salad className="w-4 h-4 text-emerald dark:text-emerald-300" />,
};

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate = () => {},
  authNotice = null,
}) => {
  const { state, loginWithPassword } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoadingEmail, setDemoLoadingEmail] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateEmailFormat(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password to sign in.');
      return;
    }

    setLoading(true);
    const result = await loginWithPassword({
      email,
      password,
      rememberMe,
    });
    setLoading(false);

    if (!result.ok) {
      setErrorMessage(
        result.error || 'Invalid email or password. Please check your details and try again.'
      );
      return;
    }

    const nextRoute = result.needsOnboarding ? '/onboarding' : '/today';
    setSuccessMessage(
      result.needsOnboarding
        ? 'Signed in! Continuing to your personal onboarding...'
        : 'Welcome back! Opening your Today briefing...'
    );

    setTimeout(() => {
      onNavigate(nextRoute);
    }, 280);
  };

  const handleDemoLogin = async (preset: DemoAccountPreset) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setDemoLoadingEmail(preset.email);
    setEmail(preset.email);
    setPassword(preset.password);

    const result = await loginWithPassword({
      email: preset.email,
      password: preset.password,
      rememberMe: true,
    });
    setDemoLoadingEmail(null);

    if (!result.ok) {
      setErrorMessage(result.error || 'Unable to authenticate demo account.');
      return;
    }

    setSuccessMessage(`Authenticated ${preset.displayName}. Loading demonstration workspace...`);
    setTimeout(() => {
      onNavigate('/today');
    }, 250);
  };

  const isBusy = loading || Boolean(demoLoadingEmail);

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 isolate">
      <SectionAtmosphere variant="auth" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10 text-left">
        {/* Primary Login Form Card */}
        <div className="lg:col-span-6 p-7 sm:p-8 rounded-3xl bg-white/95 dark:bg-[#0A1E17]/95 backdrop-blur-xl border border-forest/12 dark:border-white/12 shadow-2xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-forest dark:bg-emerald-950 border border-emerald-500/20 text-gold font-heading font-black text-lg flex items-center justify-center shadow-md shrink-0">
                H+
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-2xl text-forest dark:text-white tracking-tight leading-tight">
                  Login to HEALTH PLUS
                </h1>
                <p className="text-xs text-forest/65 dark:text-ivory/70">
                  Access your personalized companion, meal diary &amp; progress history.
                </p>
              </div>
            </div>
          </div>

          {authNotice && !errorMessage && !successMessage && (
            <div
              role="status"
              className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-500/30 text-xs text-forest dark:text-amber-100 flex items-start gap-2"
            >
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{authNotice}</span>
            </div>
          )}

          {state.auth && (
            <div className="p-3.5 rounded-2xl bg-emerald/10 border border-emerald/25 text-xs text-forest dark:text-ivory flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold truncate">Currently signed in as {state.auth.name}</p>
                <p className="text-[11px] opacity-75 truncate">{state.auth.email}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 dark:border-white/20 dark:text-ivory"
                onClick={() =>
                  onNavigate(state.onboardingCompleted && state.profile ? '/today' : '/onboarding')
                }
              >
                Continue
              </Button>
            </div>
          )}

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

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <Input
              id="login-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
              disabled={isBusy}
              required
            />

            <PasswordInput
              id="login-password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4 text-forest/50 dark:text-ivory/50" />}
              disabled={isBusy}
              required
            />

            <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-forest/80 dark:text-ivory/80 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isBusy}
                  className="w-4 h-4 rounded border-forest/30 text-emerald focus:ring-emerald/30 accent-emerald"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                disabled={isBusy}
                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={isBusy}
              className="w-full font-bold shadow-lg shadow-emerald/20"
              rightIcon={!loading ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              {loading ? 'Verifying credentials...' : 'Login'}
            </Button>
          </form>

          <div className="pt-4 border-t border-forest/10 dark:border-white/10 text-center text-xs text-forest/75 dark:text-ivory/75">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              disabled={isBusy}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Explore HEALTH PLUS — Pre-Created Real Demo Accounts */}
        <div className="lg:col-span-6 p-7 sm:p-8 rounded-3xl bg-white/90 dark:bg-[#081913]/95 backdrop-blur-xl border border-forest/12 dark:border-white/12 shadow-xl space-y-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/10 border border-emerald/25 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3 h-3" />
              <span>Explore HEALTH PLUS</span>
            </div>
            <h2 className="font-heading font-extrabold text-lg text-forest dark:text-white tracking-tight">
              Pre-Created Demo Accounts
            </h2>
            <p className="text-xs text-forest/70 dark:text-ivory/75 leading-relaxed">
              Test HEALTH PLUS immediately without registering. Each demo logs in through real
              password verification with clearly labeled sample profile, meal diary &amp; activity data.
            </p>
          </div>

          <div className="space-y-3">
            {DEMO_ACCOUNT_PRESETS.map((preset) => {
              const isPresetLoading = demoLoadingEmail === preset.email;
              return (
                <div
                  key={preset.id}
                  className="p-4 rounded-2xl bg-ivory/80 dark:bg-white/5 border border-forest/10 dark:border-white/10 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald/15 border border-emerald/25 flex items-center justify-center shrink-0 mt-0.5">
                        {DEMO_ICONS[preset.demoCategory]}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-forest dark:text-white">
                            {preset.badgeLabel}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/25">
                            Sample Data
                          </span>
                        </div>
                        <p className="text-[11px] text-forest/70 dark:text-ivory/70 mt-0.5 leading-snug">
                          {preset.goalSummary}
                        </p>
                        <p className="text-[10px] font-mono text-forest/60 dark:text-ivory/60 mt-1">
                          {preset.email} / {preset.passwordHint}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isPresetLoading}
                    disabled={isBusy}
                    onClick={() => handleDemoLogin(preset)}
                    className="w-full justify-between font-bold text-xs border-forest/20 dark:border-white/20 text-forest dark:text-ivory hover:bg-emerald/10"
                    rightIcon={!isPresetLoading ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
                  >
                    {isPresetLoading ? 'Authenticating Demo...' : preset.buttonLabel}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
