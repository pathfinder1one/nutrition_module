import type { AppState, PersistenceBackendMode } from '@/types/wellness';

const SESSION_KEY = 'healthplus_app_state_v2';
const SESSION_TEMP_KEY = 'healthplus_app_session_temp_v2';
const VAULT_PREFIX = 'healthplus_vault_v1:';
const INDEX_KEY = 'healthplus_vault_index_v1';

export interface PersistenceStatusReport {
  mode: PersistenceBackendMode;
  supabaseConfigured: boolean;
  reason: string | null;
}

export function getClientPersistenceStatus(): PersistenceStatusReport {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const configured = Boolean(
    url &&
      anon &&
      !String(url).includes('your-project') &&
      !String(anon).includes('your-anon-key')
  );

  return {
    mode: configured ? 'supabase_connected' : 'local_browser_vault_only',
    supabaseConfigured: configured,
    reason: configured ? null : 'blocked_by_missing_supabase_credentials',
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function saveUserVault(state: AppState): void {
  try {
    const serialized = JSON.stringify(state);
    const rememberMe = state.auth?.rememberMe !== false;

    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, serialized);
      try {
        sessionStorage.removeItem(SESSION_TEMP_KEY);
      } catch {
        // Ignore sessionStorage restrictions
      }
    } else {
      localStorage.removeItem(SESSION_KEY);
      try {
        sessionStorage.setItem(SESSION_TEMP_KEY, serialized);
      } catch {
        localStorage.setItem(SESSION_KEY, serialized);
      }
    }

    const email = state.auth?.email ? normalizeEmail(state.auth.email) : '';
    if (email) {
      localStorage.setItem(`${VAULT_PREFIX}${email}`, serialized);
      const rawIdx = localStorage.getItem(INDEX_KEY);
      const list = rawIdx ? (JSON.parse(rawIdx) as string[]) : [];
      if (!list.includes(email)) {
        localStorage.setItem(INDEX_KEY, JSON.stringify([...list, email]));
      }
    }
  } catch {
    // Ignore restricted iframe quota exceptions safely
  }
}

export function loadActiveSessionRaw(): Partial<AppState> | null {
  try {
    localStorage.removeItem('healthplus_unified_state_v1');
    try {
      const tempRaw = sessionStorage.getItem(SESSION_TEMP_KEY);
      if (tempRaw) return JSON.parse(tempRaw) as Partial<AppState>;
    } catch {
      // Ignore sessionStorage read errors
    }
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppState>;
  } catch {
    return null;
  }
}

export function loadUserVaultByEmail(email: string): Partial<AppState> | null {
  try {
    const clean = normalizeEmail(email);
    if (!clean) return null;
    const raw = localStorage.getItem(`${VAULT_PREFIX}${clean}`);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppState>;
  } catch {
    return null;
  }
}

export function clearAllLocalPersistence(activeEmail?: string): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    try {
      sessionStorage.removeItem(SESSION_TEMP_KEY);
    } catch {
      // Ignore sessionStorage errors
    }
    if (activeEmail) {
      localStorage.removeItem(`${VAULT_PREFIX}${normalizeEmail(activeEmail)}`);
    }
  } catch {
    // Ignore storage restrictions
  }
}
