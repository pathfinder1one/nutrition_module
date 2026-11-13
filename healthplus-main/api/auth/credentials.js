const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const STORE_PATH =
  process.env.HEALTHPLUS_AUTH_STORE_PATH ||
  path.join(os.tmpdir(), 'healthplus-auth-store-v1.json');

const DEMO_ACCOUNT_SEEDS = [
  {
    id: 'demo-wellness-001',
    email: 'demo@healthplus.app',
    name: 'Meera Nair (Demo)',
    password: process.env.HEALTHPLUS_DEMO_WELLNESS_PASSWORD || 'Demo@12345',
    isDemoAccount: true,
    demoCategory: 'general_wellness',
  },
  {
    id: 'demo-fitness-002',
    email: 'fitness@healthplus.app',
    name: 'Rohan Verma (Demo)',
    password: process.env.HEALTHPLUS_DEMO_FITNESS_PASSWORD || 'Fitness@123',
    isDemoAccount: true,
    demoCategory: 'fitness_goal',
  },
  {
    id: 'demo-diet-003',
    email: 'diet@healthplus.app',
    name: 'Diya Kulkarni (Demo)',
    password: process.env.HEALTHPLUS_DEMO_DIET_PASSWORD || 'Diet@12345',
    isDemoAccount: true,
    demoCategory: 'dietary_restrictions',
  },
];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
}

function hashPasswordScrypt(password, existingSalt) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPasswordScrypt(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;
  const candidate = crypto.scryptSync(String(password), salt, 64);
  const target = Buffer.from(expectedHash, 'hex');
  if (candidate.length !== target.length) return false;
  return crypto.timingSafeEqual(candidate, target);
}

function buildSeededStore() {
  const users = {};
  for (const seed of DEMO_ACCOUNT_SEEDS) {
    const cleanEmail = normalizeEmail(seed.email);
    const { salt, hash } = hashPasswordScrypt(seed.password);
    users[cleanEmail] = {
      id: seed.id,
      email: cleanEmail,
      name: seed.name,
      passwordSalt: salt,
      passwordHash: hash,
      isDemoAccount: true,
      demoCategory: seed.demoCategory,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
  }
  return {
    version: 1,
    users,
    resetTokens: {},
  };
}

function ensureDemoSeedsPresent(store) {
  let changed = false;
  if (!store.users || typeof store.users !== 'object') {
    store.users = {};
    changed = true;
  }
  if (!store.resetTokens || typeof store.resetTokens !== 'object') {
    store.resetTokens = {};
    changed = true;
  }
  for (const seed of DEMO_ACCOUNT_SEEDS) {
    const cleanEmail = normalizeEmail(seed.email);
    const existing = store.users[cleanEmail];
    if (
      !existing ||
      !existing.passwordSalt ||
      !existing.passwordHash ||
      !verifyPasswordScrypt(seed.password, existing.passwordSalt, existing.passwordHash)
    ) {
      const { salt, hash } = hashPasswordScrypt(seed.password);
      store.users[cleanEmail] = {
        id: seed.id,
        email: cleanEmail,
        name: seed.name,
        passwordSalt: salt,
        passwordHash: hash,
        isDemoAccount: true,
        demoCategory: seed.demoCategory,
        createdAt: existing?.createdAt || '2026-01-01T00:00:00.000Z',
      };
      changed = true;
    }
  }
  return changed;
}

function readAuthStore() {
  let store;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      store = JSON.parse(raw);
    }
  } catch {
    store = null;
  }

  if (!store || typeof store !== 'object') {
    store = buildSeededStore();
    writeAuthStore(store);
    return store;
  }

  if (ensureDemoSeedsPresent(store)) {
    writeAuthStore(store);
  }
  return store;
}

function writeAuthStore(store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Ephemeral environments without writable tmp fall back cleanly to per-invocation seed
  }
}

function createSessionToken(user) {
  const secret = process.env.HEALTHPLUS_AUTH_SECRET || 'healthplus-local-session-signing-key';
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      isDemoAccount: Boolean(user.isDemoAccount),
      iat: Date.now(),
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function getSupabaseServerConfig() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = String(
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  const configured =
    Boolean(url && anonKey && serviceKey) &&
    !url.includes('your-project') &&
    !anonKey.includes('your-anon-key') &&
    !serviceKey.includes('your-service-role');
  return { configured, url, anonKey, serviceKey };
}

function sanitizePublicUser(record) {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    isDemoAccount: Boolean(record.isDemoAccount),
    demoCategory: record.demoCategory || undefined,
  };
}

function registerLocalUser({ name, email, password }) {
  const cleanName = String(name || '').trim();
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 2) {
    return { status: 400, error: 'Please enter your full name (at least 2 characters).' };
  }
  if (!isValidEmail(cleanEmail)) {
    return { status: 400, error: 'Please enter a valid email address.' };
  }
  if (typeof password !== 'string' || password.length < 8) {
    return { status: 400, error: 'Password must be at least 8 characters long.' };
  }

  const store = readAuthStore();
  if (store.users[cleanEmail]) {
    return {
      status: 409,
      error: 'An account with this email already exists. Please sign in instead.',
    };
  }

  const { salt, hash } = hashPasswordScrypt(password);
  const record = {
    id: `usr-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    email: cleanEmail,
    name: cleanName,
    passwordSalt: salt,
    passwordHash: hash,
    isDemoAccount: false,
    createdAt: new Date().toISOString(),
  };

  store.users[cleanEmail] = record;
  writeAuthStore(store);

  return {
    status: 201,
    user: sanitizePublicUser(record),
    token: createSessionToken(record),
    authProvider: 'salted_server_store',
  };
}

function authenticateLocalUser({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail) || typeof password !== 'string' || password.length === 0) {
    return { status: 400, error: 'Please enter both your email address and password.' };
  }

  const store = readAuthStore();
  const record = store.users[cleanEmail];
  if (!record || !verifyPasswordScrypt(password, record.passwordSalt, record.passwordHash)) {
    return {
      status: 401,
      error: 'Invalid email or password. Please verify your credentials and try again.',
    };
  }

  return {
    status: 200,
    user: sanitizePublicUser(record),
    token: createSessionToken(record),
    authProvider: 'salted_server_store',
  };
}

function requestLocalPasswordReset(email) {
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    return { status: 400, error: 'Please enter a valid registered email address.' };
  }

  const store = readAuthStore();
  const exists = Boolean(store.users[cleanEmail]);
  const resetCode = `HP-${crypto.randomInt(100000, 999999)}`;

  if (exists && !store.users[cleanEmail].isDemoAccount) {
    store.resetTokens[cleanEmail] = {
      token: resetCode,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };
    writeAuthStore(store);
  }

  return {
    status: 200,
    accepted: true,
    isDemoProtected: exists ? Boolean(store.users[cleanEmail].isDemoAccount) : false,
    previewResetCode: exists && !store.users[cleanEmail].isDemoAccount ? resetCode : null,
  };
}

function completeLocalPasswordReset({ email, token, newPassword }) {
  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    return { status: 400, error: 'Please enter your account email address.' };
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return { status: 400, error: 'New password must be at least 8 characters long.' };
  }

  const store = readAuthStore();
  const record = store.users[cleanEmail];
  if (!record) {
    return { status: 404, error: 'No account found with that email address.' };
  }
  if (record.isDemoAccount) {
    return {
      status: 403,
      error: 'Pre-configured demonstration account passwords cannot be modified.',
    };
  }

  const pending = store.resetTokens[cleanEmail];
  if (!pending || pending.token !== String(token || '').trim() || Date.now() > pending.expiresAt) {
    return {
      status: 400,
      error: 'Invalid or expired reset verification code. Request a new reset link first.',
    };
  }

  const { salt, hash } = hashPasswordScrypt(newPassword);
  record.passwordSalt = salt;
  record.passwordHash = hash;
  delete store.resetTokens[cleanEmail];
  writeAuthStore(store);

  return {
    status: 200,
    updated: true,
  };
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      resolve(req.body);
      return;
    }
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

module.exports = {
  DEMO_ACCOUNT_SEEDS,
  STORE_PATH,
  normalizeEmail,
  isValidEmail,
  readAuthStore,
  getSupabaseServerConfig,
  registerLocalUser,
  authenticateLocalUser,
  requestLocalPasswordReset,
  completeLocalPasswordReset,
  readJsonBody,
  sendJson,
};
