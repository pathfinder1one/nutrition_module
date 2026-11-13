module.exports = function handler(_req, res) {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
  const hasSupabase = Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY) &&
      !process.env.SUPABASE_URL.includes('your-project')
  );

  const preferred = (process.env.LLM_PROVIDER || '').toLowerCase();
  const activeLlmProvider =
    preferred === 'openai' && hasOpenAI
      ? 'openai'
      : preferred === 'gemini' && hasGemini
        ? 'gemini'
        : hasGemini
          ? 'gemini'
          : hasOpenAI
            ? 'openai'
            : null;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      service: 'healthplus-api',
      aiGateway: {
        configured: Boolean(activeLlmProvider),
        provider: activeLlmProvider,
        mode: activeLlmProvider ? 'live_llm_gateway' : 'grounded_fallback_unconfigured',
        reason: activeLlmProvider ? null : 'missing_llm_credentials',
      },
      persistence: {
        supabaseConfigured: hasSupabase,
        mode: hasSupabase ? 'supabase_connected' : 'local_browser_vault_only',
        reason: hasSupabase ? null : 'blocked_by_missing_supabase_credentials',
      },
      datasets: {
        ifctImported: false,
        usdaBulkImported: false,
        mode: 'reference_ingredient_computed_prototype',
      },
    })
  );
};
