import type { AuthUser, DemoCategory } from '@/types/wellness';
import { DEMO_ACCOUNT_PRESETS as DEMO_ACCOUNT_SEEDS } from './demoAccounts';

export interface AuthSuccessResult {
  ok: true;
  user: AuthUser;
  authProvider: string;
}

export interface AuthErrorResult {
  ok: false;
  error: string;
  statusCode?: number;
}

export type AuthOperationResult = AuthSuccessResult | AuthErrorResult;

export interface PasswordResetRequestResult {
  ok: boolean;
  error?: string;
  previewResetCode?: string | null;
  isDemoProtected?: boolean;
}

const LOCAL_CREDENTIAL_REGISTRY_KEY = 'healthplus_local_auth_registry_v1';

interface LocalCredentialEntry {
  id: string;
  email: string;
  name: string;
  saltHex: string;
  hashHex: string;
  isDemoAccount: boolean;
  demoCategory?: DemoCategory;
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeAuthEmail(email));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function derivePbkdf2Hex(password: string, saltHex: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(saltHex),
        iterations: 10000,
        hash: 'SHA-256',
      },
      key,
      256
    );
    return bytesToHex(new Uint8Array(bits));
  }
  return `plain:${saltHex}:${password}`;
}

async function readOrSeedLocalRegistry(): Promise<Record<string, LocalCredentialEntry>> {
  let parsed: Record<string, LocalCredentialEntry> = {};
  try {
    const raw = localStorage.getItem(LOCAL_CREDENTIAL_REGISTRY_KEY);
    if (raw) {
      parsed = JSON.parse(raw) as Record<string, LocalCredentialEntry>;
    }
  } catch {
    parsed = {};
  }

  let updated = false;
  for (const seed of DEMO_ACCOUNT_SEEDS) {
    const email = normalizeAuthEmail(seed.email);
    if (!parsed[email]) {
      const saltHex = bytesToHex(
        crypto?.getRandomValues ? crypto.getRandomValues(new Uint8Array(12)) : new Uint8Array([1, 2, 3, 4])
      );
      const hashHex = await derivePbkdf2Hex(seed.password, saltHex);
      parsed[email] = {
        id: seed.id,
        email,
        name: seed.displayName,
        saltHex,
        hashHex,
        isDemoAccount: true,
        demoCategory: seed.demoCategory,
      };
      updated = true;
    }
  }

  if (updated) {
    try {
      localStorage.setItem(LOCAL_CREDENTIAL_REGISTRY_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore storage quota restrictions
    }
  }

  return parsed;
}

async function syncUserIntoLocalRegistry(params: {
  id: string;
  email: string;
  name: string;
  password: string;
  isDemoAccount?: boolean;
  demoCategory?: DemoCategory;
}): Promise<void> {
  const registry = await readOrSeedLocalRegistry();
  const email = normalizeAuthEmail(params.email);
  const saltHex = bytesToHex(
    crypto?.getRandomValues ? crypto.getRandomValues(new Uint8Array(12)) : new Uint8Array([5, 6, 7, 8])
  );
  const hashHex = await derivePbkdf2Hex(params.password, saltHex);
  registry[email] = {
    id: params.id,
    email,
    name: params.name,
    saltHex,
    hashHex,
    isDemoAccount: Boolean(params.isDemoAccount),
    demoCategory: params.demoCategory,
  };
  try {
    localStorage.setItem(LOCAL_CREDENTIAL_REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage quota restrictions
  }
}

export async function loginWithBackendOrLocalAuth(params: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<AuthOperationResult> {
  const cleanEmail = normalizeAuthEmail(params.email);
  if (!validateEmailFormat(cleanEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (!params.password) {
    return { ok: false, error: 'Please enter your password.' };
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: params.password }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        user?: {
          id: string;
          email: string;
          name: string;
          isDemoAccount?: boolean;
          demoCategory?: DemoCategory;
        };
        authProvider?: string;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        return {
          ok: false,
          statusCode: response.status,
          error:
            payload.error ||
            'Invalid email or password. Please verify your credentials and try again.',
        };
      }

      await syncUserIntoLocalRegistry({
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
        password: params.password,
        isDemoAccount: payload.user.isDemoAccount,
        demoCategory: payload.user.demoCategory,
      });

      return {
        ok: true,
        authProvider: payload.authProvider || 'salted_server_store',
        user: {
          id: payload.user.id,
          email: payload.user.email,
          name: payload.user.name,
          signedInAt: new Date().toISOString(),
          isDemoAccount: Boolean(payload.user.isDemoAccount),
          demoCategory: payload.user.demoCategory,
          rememberMe: params.rememberMe,
        },
      };
    }
  } catch {
    // Offline static bundle fallback below
  }

  // Fallback for static offline SPA builds without /api middleware
  const registry = await readOrSeedLocalRegistry();
  const entry = registry[cleanEmail];
  if (!entry) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Invalid email or password. Please verify your credentials and try again.',
    };
  }

  const candidateHash = await derivePbkdf2Hex(params.password, entry.saltHex);
  if (candidateHash !== entry.hashHex) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Invalid email or password. Please verify your credentials and try again.',
    };
  }

  return {
    ok: true,
    authProvider: 'browser_pbkdf2_fallback',
    user: {
      id: entry.id,
      email: entry.email,
      name: entry.name,
      signedInAt: new Date().toISOString(),
      isDemoAccount: entry.isDemoAccount,
      demoCategory: entry.demoCategory,
      rememberMe: params.rememberMe,
    },
  };
}

export async function signupWithBackendOrLocalAuth(params: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}): Promise<AuthOperationResult> {
  const cleanName = params.name.trim();
  const cleanEmail = normalizeAuthEmail(params.email);

  if (cleanName.length < 2) {
    return { ok: false, error: 'Please enter your full name (at least 2 characters).' };
  }
  if (!validateEmailFormat(cleanEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (params.password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters long.' };
  }
  if (params.password !== params.confirmPassword) {
    return { ok: false, error: 'Passwords do not match. Please re-enter them carefully.' };
  }
  if (!params.acceptTerms) {
    return {
      ok: false,
      error: 'Please review and accept the Terms & Local Privacy consent before creating your account.',
    };
  }

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        password: params.password,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        user?: { id: string; email: string; name: string };
        authProvider?: string;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        return {
          ok: false,
          statusCode: response.status,
          error: payload.error || 'Could not create your account.',
        };
      }

      await syncUserIntoLocalRegistry({
        id: payload.user.id,
        email: payload.user.email,
        name: payload.user.name,
        password: params.password,
        isDemoAccount: false,
      });

      return {
        ok: true,
        authProvider: payload.authProvider || 'salted_server_store',
        user: {
          id: payload.user.id,
          email: payload.user.email,
          name: payload.user.name,
          signedInAt: new Date().toISOString(),
          isDemoAccount: false,
          rememberMe: true,
        },
      };
    }
  } catch {
    // Offline static bundle fallback below
  }

  const registry = await readOrSeedLocalRegistry();
  if (registry[cleanEmail]) {
    return {
      ok: false,
      statusCode: 409,
      error: 'An account with this email already exists. Please sign in instead.',
    };
  }

  const id = `usr-${Date.now()}`;
  await syncUserIntoLocalRegistry({
    id,
    email: cleanEmail,
    name: cleanName,
    password: params.password,
    isDemoAccount: false,
  });

  return {
    ok: true,
    authProvider: 'browser_pbkdf2_fallback',
    user: {
      id,
      email: cleanEmail,
      name: cleanName,
      signedInAt: new Date().toISOString(),
      isDemoAccount: false,
      rememberMe: true,
    },
  };
}

export async function requestPasswordResetCode(
  email: string
): Promise<PasswordResetRequestResult> {
  const cleanEmail = normalizeAuthEmail(email);
  if (!validateEmailFormat(cleanEmail)) {
    return { ok: false, error: 'Please enter a valid registered email address.' };
  }

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', email: cleanEmail }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = (await res.json()) as {
        accepted?: boolean;
        previewResetCode?: string | null;
        isDemoProtected?: boolean;
        error?: string;
      };
      if (!res.ok) {
        return { ok: false, error: json.error || 'Could not initiate password reset.' };
      }
      return {
        ok: true,
        previewResetCode: json.previewResetCode ?? null,
        isDemoProtected: Boolean(json.isDemoProtected),
      };
    }
  } catch {
    // Fallback below
  }

  return { ok: true, previewResetCode: 'HP-LOCAL-RESET' };
}

export async function completePasswordResetWithToken(params: {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanEmail = normalizeAuthEmail(params.email);
  if (!validateEmailFormat(cleanEmail)) {
    return { ok: false, error: 'Please enter your registered email address.' };
  }
  if (params.newPassword.length < 8) {
    return { ok: false, error: 'New password must be at least 8 characters long.' };
  }
  if (params.newPassword !== params.confirmPassword) {
    return { ok: false, error: 'New passwords do not match.' };
  }

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        email: cleanEmail,
        token: params.token,
        newPassword: params.newPassword,
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = (await res.json()) as { updated?: boolean; error?: string };
      if (!res.ok) {
        return { ok: false, error: json.error || 'Could not update password.' };
      }
      const registry = await readOrSeedLocalRegistry();
      const existing = registry[cleanEmail];
      if (existing) {
        await syncUserIntoLocalRegistry({
          id: existing.id,
          email: cleanEmail,
          name: existing.name,
          password: params.newPassword,
          isDemoAccount: false,
        });
      }
      return { ok: true };
    }
  } catch {
    // Fallback below
  }

  const registry = await readOrSeedLocalRegistry();
  const existing = registry[cleanEmail];
  if (!existing) {
    return { ok: false, error: 'No account found for that email address.' };
  }
  if (existing.isDemoAccount) {
    return { ok: false, error: 'Demonstration account passwords cannot be modified.' };
  }
  await syncUserIntoLocalRegistry({
    id: existing.id,
    email: cleanEmail,
    name: existing.name,
    password: params.newPassword,
    isDemoAccount: false,
  });
  return { ok: true };
}
