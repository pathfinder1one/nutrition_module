const {
  DEMO_ACCOUNT_SEEDS,
  normalizeEmail,
  authenticateLocalUser,
  getSupabaseServerConfig,
  readJsonBody,
  sendJson,
} = require('./credentials');

async function ensureSupabaseDemoUserIfMatching(supa, email, password) {
  const clean = normalizeEmail(email);
  const seed = DEMO_ACCOUNT_SEEDS.find(
    (item) => normalizeEmail(item.email) === clean && item.password === password
  );
  if (!seed) return false;

  const listRes = await fetch(`${supa.url}/auth/v1/admin/users?page=1&per_page=50`, {
    method: 'GET',
    headers: {
      apikey: supa.serviceKey,
      Authorization: `Bearer ${supa.serviceKey}`,
    },
  });
  if (!listRes.ok) return false;
  const listJson = await listRes.json().catch(() => ({}));
  const exists = Array.isArray(listJson.users)
    ? listJson.users.some((u) => normalizeEmail(u.email) === clean)
    : false;

  if (exists) return true;

  const createRes = await fetch(`${supa.url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supa.serviceKey,
      Authorization: `Bearer ${supa.serviceKey}`,
    },
    body: JSON.stringify({
      email: clean,
      password: seed.password,
      email_confirm: true,
      user_metadata: {
        full_name: seed.name,
        is_demo_account: true,
        demo_category: seed.demoCategory,
      },
    }),
  });
  return createRes.ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const body = await readJsonBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  const supa = getSupabaseServerConfig();
  if (supa.configured) {
    try {
      await ensureSupabaseDemoUserIfMatching(supa, email, password);
      const tokenRes = await fetch(`${supa.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supa.anonKey,
        },
        body: JSON.stringify({ email, password }),
      });
      const tokenJson = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok) {
        sendJson(res, 401, {
          error:
            tokenJson.error_description ||
            'Invalid email or password. Please verify your credentials and try again.',
        });
        return;
      }

      const supaUser = tokenJson.user || {};
      const meta = supaUser.user_metadata || {};
      const matchedSeed = DEMO_ACCOUNT_SEEDS.find((d) => normalizeEmail(d.email) === email);

      sendJson(res, 200, {
        user: {
          id: supaUser.id,
          email,
          name: meta.full_name || matchedSeed?.name || email.split('@')[0],
          isDemoAccount: Boolean(meta.is_demo_account || matchedSeed),
          demoCategory: meta.demo_category || matchedSeed?.demoCategory,
        },
        token: tokenJson.access_token,
        authProvider: 'supabase_auth',
      });
      return;
    } catch {
      sendJson(res, 502, {
        error: 'Authentication gateway unreachable. Please try again shortly.',
      });
      return;
    }
  }

  const result = authenticateLocalUser({ email, password });
  if (result.error) {
    sendJson(res, result.status, { error: result.error });
    return;
  }

  sendJson(res, 200, {
    user: result.user,
    token: result.token,
    authProvider: result.authProvider,
  });
};
