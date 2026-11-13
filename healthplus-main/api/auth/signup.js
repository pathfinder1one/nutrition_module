const {
  normalizeEmail,
  isValidEmail,
  registerLocalUser,
  getSupabaseServerConfig,
  readJsonBody,
  sendJson,
} = require('./credentials');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const body = await readJsonBody(req);
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (name.length < 2) {
    sendJson(res, 400, { error: 'Please enter your full name (at least 2 characters).' });
    return;
  }
  if (!isValidEmail(email)) {
    sendJson(res, 400, { error: 'Please enter a valid email address.' });
    return;
  }
  if (password.length < 8) {
    sendJson(res, 400, { error: 'Password must be at least 8 characters long.' });
    return;
  }

  const supa = getSupabaseServerConfig();
  if (supa.configured) {
    try {
      const createRes = await fetch(`${supa.url}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supa.serviceKey,
          Authorization: `Bearer ${supa.serviceKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: name,
            is_demo_account: false,
          },
        }),
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        const msg = String(createJson.msg || createJson.message || createJson.error || '');
        const isDuplicate =
          createRes.status === 422 || /already.*registered|already.*exists/i.test(msg);
        sendJson(res, isDuplicate ? 409 : 400, {
          error: isDuplicate
            ? 'An account with this email already exists. Please sign in instead.'
            : msg || 'Unable to create account with those details.',
        });
        return;
      }

      const tokenRes = await fetch(`${supa.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supa.anonKey,
        },
        body: JSON.stringify({ email, password }),
      });
      const tokenJson = await tokenRes.json().catch(() => ({}));

      sendJson(res, 201, {
        user: {
          id: createJson.id,
          email,
          name,
          isDemoAccount: false,
        },
        token: tokenJson.access_token || null,
        authProvider: 'supabase_auth',
      });
      return;
    } catch {
      sendJson(res, 502, {
        error: 'Unable to reach Supabase authentication service. Please try again.',
      });
      return;
    }
  }

  const result = registerLocalUser({ name, email, password });
  if (result.error) {
    sendJson(res, result.status, { error: result.error });
    return;
  }

  sendJson(res, 201, {
    user: result.user,
    token: result.token,
    authProvider: result.authProvider,
  });
};
