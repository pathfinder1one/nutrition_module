const {
  normalizeEmail,
  requestLocalPasswordReset,
  completeLocalPasswordReset,
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
  const action = String(body.action || 'request');
  const email = normalizeEmail(body.email);

  const supa = getSupabaseServerConfig();
  if (supa.configured) {
    if (action === 'request') {
      try {
        const recoverRes = await fetch(`${supa.url}/auth/v1/recover`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supa.anonKey,
          },
          body: JSON.stringify({ email }),
        });
        if (!recoverRes.ok) {
          sendJson(res, 400, { error: 'Unable to initiate password recovery for this email.' });
          return;
        }
        sendJson(res, 200, {
          accepted: true,
          authProvider: 'supabase_auth',
          previewResetCode: null,
        });
        return;
      } catch {
        sendJson(res, 502, { error: 'Password recovery service unavailable.' });
        return;
      }
    }

    sendJson(res, 400, {
      error: 'Please use the Supabase email recovery link dispatched to your inbox.',
    });
    return;
  }

  if (action === 'request') {
    const result = requestLocalPasswordReset(email);
    if (result.error) {
      sendJson(res, result.status, { error: result.error });
      return;
    }
    sendJson(res, 200, {
      accepted: result.accepted,
      isDemoProtected: result.isDemoProtected,
      previewResetCode: result.previewResetCode,
      authProvider: 'salted_server_store',
    });
    return;
  }

  const result = completeLocalPasswordReset({
    email,
    token: body.token,
    newPassword: body.newPassword,
  });
  if (result.error) {
    sendJson(res, result.status, { error: result.error });
    return;
  }

  sendJson(res, 200, {
    updated: true,
    authProvider: 'salted_server_store',
  });
};
