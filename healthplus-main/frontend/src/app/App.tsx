import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LandingPage } from '@/features/landing/LandingPage';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useApp } from '@/context/AppContext';

// Auth & Onboarding Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';

// 5 Consolidated Pillars
import { DashboardPage } from '@/pages/app/DashboardPage'; // Pillar 1: Today
import { FoodHubPage } from '@/pages/app/FoodHubPage'; // Pillar 2: Food & Recipes
import { MoveStudioPage } from '@/pages/app/MoveStudioPage'; // Pillar 3: Move & Kinematics
import { AiCoachPage } from '@/pages/app/AiCoachPage'; // Pillar 4: AI Coach
import { ProgressReportsPage } from '@/pages/app/ProgressReportsPage'; // Pillar 5: Progress & Baseline
import { ProfileSettingsPage } from '@/pages/app/ProfileSettingsPage'; // Profile & Safety Controls

// Code-split the design system showcase
const DesignSystemShowcase = lazy(() =>
  import('@/components/showcase/DesignSystemShowcase').then((m) => ({
    default: m.DesignSystemShowcase,
  }))
);

const PROTECTED_APP_ROUTES = new Set([
  '/today',
  '/dashboard',
  '/food',
  '/food-scanner',
  '/scanner',
  '/nutrition-diary',
  '/diary',
  '/diet-planner',
  '/grocery-list',
  '/move',
  '/exercise-studio',
  '/exercise',
  '/voice-coach',
  '/coach',
  '/ai-coach',
  '/progress',
  '/health-patterns',
  '/insights',
  '/profile',
  '/settings',
]);

const AUTH_REQUIRED_NOTICE = 'Please sign in to access your personal HEALTH PLUS workspace.';

function readRawWindowRoute(): string {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('/')) return hash;
  if (window.location.pathname && window.location.pathname !== '/') {
    return window.location.pathname;
  }
  return '/';
}

export function App() {
  const { state } = useApp();
  const isAuthenticatedRef = useRef(Boolean(state.auth));

  useEffect(() => {
    isAuthenticatedRef.current = Boolean(state.auth);
  }, [state.auth]);

  const [authNotice, setAuthNotice] = useState<string | null>(() => {
    const initial = readRawWindowRoute();
    const needsAuth = PROTECTED_APP_ROUTES.has(initial) || initial === '/onboarding';
    return needsAuth && !state.auth ? AUTH_REQUIRED_NOTICE : null;
  });

  const [currentPath, setCurrentPath] = useState<string>(() => {
    const initial = readRawWindowRoute();
    const needsAuth = PROTECTED_APP_ROUTES.has(initial) || initial === '/onboarding';
    if (needsAuth && !state.auth) {
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '#/login');
      }
      return '/login';
    }
    return initial;
  });

  const navigate = (path: string) => {
    const needsAuth = PROTECTED_APP_ROUTES.has(path) || path === '/onboarding';
    if (needsAuth && !isAuthenticatedRef.current) {
      setAuthNotice(AUTH_REQUIRED_NOTICE);
      setCurrentPath('/login');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '#/login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setAuthNotice(null);
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.location.hash = path;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const resolveAndSetRoute = (candidate: string) => {
      const needsAuth = PROTECTED_APP_ROUTES.has(candidate) || candidate === '/onboarding';
      if (needsAuth && !isAuthenticatedRef.current) {
        setAuthNotice(AUTH_REQUIRED_NOTICE);
        setCurrentPath('/login');
        window.history.replaceState(null, '', '#/login');
        return;
      }
      if (candidate !== '/login') {
        setAuthNotice(null);
      }
      setCurrentPath(candidate);
    };

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/')) {
        resolveAndSetRoute(hash);
      } else if (!hash) {
        resolveAndSetRoute('/');
      }
    };

    const handlePopState = () => {
      if (window.location.hash) {
        handleHashChange();
      } else if (window.location.pathname) {
        resolveAndSetRoute(window.location.pathname);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const isProtectedAppRoute = PROTECTED_APP_ROUTES.has(currentPath);
  const requiresAuthentication = isProtectedAppRoute || currentPath === '/onboarding';

  if (requiresAuthentication && !state.auth) {
    return (
      <PublicLayout currentPath="/login" onNavigate={navigate} backgroundVariant="wellness">
        <LoginPage
          onNavigate={navigate}
          authNotice={authNotice || AUTH_REQUIRED_NOTICE}
        />
      </PublicLayout>
    );
  }

  // 1. PUBLIC WEBSITE & ONBOARDING ROUTES
  if (currentPath === '/login') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate} backgroundVariant="wellness">
        <LoginPage onNavigate={navigate} authNotice={authNotice} />
      </PublicLayout>
    );
  }

  if (currentPath === '/signup') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate} backgroundVariant="wellness">
        <SignupPage onNavigate={navigate} />
      </PublicLayout>
    );
  }

  if (currentPath === '/forgot-password') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate} backgroundVariant="wellness">
        <ForgotPasswordPage onNavigate={navigate} />
      </PublicLayout>
    );
  }

  if (currentPath === '/reset-password') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate} backgroundVariant="wellness">
        <ResetPasswordPage onNavigate={navigate} />
      </PublicLayout>
    );
  }

  if (currentPath === '/onboarding') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate} backgroundVariant="wellness">
        <OnboardingPage onNavigate={navigate} />
      </PublicLayout>
    );
  }

  if (currentPath === '/design-system') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center p-8">
              <LoadingSkeleton className="h-64 w-full max-w-xl" />
            </div>
          }
        >
          <DesignSystemShowcase />
        </Suspense>
      </PublicLayout>
    );
  }

  // ONBOARDING GATE: never show app surfaces before personal profile & interview complete
  if (isProtectedAppRoute && (!state.onboardingCompleted || !state.profile)) {
    return (
      <PublicLayout currentPath="/onboarding" onNavigate={navigate} backgroundVariant="wellness">
        <OnboardingPage onNavigate={navigate} />
      </PublicLayout>
    );
  }

  // 2. PILLAR 1: TODAY / DAILY BRIEFING
  if (currentPath === '/today' || currentPath === '/dashboard') {
    return (
      <DashboardLayout currentPath="/today" onNavigate={navigate}>
        <DashboardPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  // 3. PILLAR 2: FOOD & NUTRITION (Unified Journal, Scanner, Recipes, Grocery)
  if (
    currentPath === '/food' ||
    currentPath === '/food-scanner' ||
    currentPath === '/scanner' ||
    currentPath === '/nutrition-diary' ||
    currentPath === '/diary' ||
    currentPath === '/diet-planner' ||
    currentPath === '/grocery-list'
  ) {
    let initialTab: 'diary' | 'scanner' | 'plan' | 'grocery' = 'plan';
    if (currentPath.includes('scanner')) initialTab = 'scanner';
    else if (currentPath.includes('diet') || currentPath.includes('planner')) initialTab = 'plan';
    else if (currentPath.includes('grocery')) initialTab = 'grocery';

    return (
      <DashboardLayout currentPath="/food" onNavigate={navigate}>
        <FoodHubPage onNavigate={navigate} initialTab={initialTab} />
      </DashboardLayout>
    );
  }

  // 4. PILLAR 3: MOVE & KINEMATICS (Pose Detection, Human Demonstration, Voice Coach)
  if (
    currentPath === '/move' ||
    currentPath === '/exercise-studio' ||
    currentPath === '/exercise' ||
    currentPath === '/voice-coach'
  ) {
    return (
      <DashboardLayout currentPath="/move" onNavigate={navigate}>
        <MoveStudioPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  // 5. PILLAR 4: AI COACH (Conversational Living Companion)
  if (currentPath === '/coach' || currentPath === '/ai-coach') {
    return (
      <DashboardLayout currentPath="/coach" onNavigate={navigate}>
        <AiCoachPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  // 6. PILLAR 5: PROGRESS & BASELINE (Corridor, Health Story, Trends, Sovereignty)
  if (
    currentPath === '/progress' ||
    currentPath === '/health-patterns' ||
    currentPath === '/insights'
  ) {
    return (
      <DashboardLayout currentPath="/progress" onNavigate={navigate}>
        <ProgressReportsPage onNavigate={navigate} />
      </DashboardLayout>
    );
  }

  // 7. USER PROFILE & SETTINGS
  if (currentPath === '/profile') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <ProfileSettingsPage onNavigate={navigate} initialTab="profile" />
      </DashboardLayout>
    );
  }

  if (currentPath === '/settings') {
    return (
      <DashboardLayout currentPath={currentPath} onNavigate={navigate}>
        <ProfileSettingsPage onNavigate={navigate} initialTab="settings" />
      </DashboardLayout>
    );
  }

  // 8. DEFAULT: Public Official Home Page ('/')
  return (
    <PublicLayout currentPath={currentPath} onNavigate={navigate} backgroundVariant="wellness">
      <LandingPage onNavigate={navigate} />
    </PublicLayout>
  );
}

export default App;
