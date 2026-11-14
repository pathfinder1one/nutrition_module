function validateAiGeneratedText({ text, unavailableIngredients = [], allergies = [], intent = '' }) {
  if (!text || typeof text !== 'string' || text.trim().length < 8) {
    return { valid: false, reason: 'empty_response' };
  }
  const lower = text.toLowerCase();
  const forbiddenDosage = /\b(take\s+\d+\s*(mg|ml|units)|insulin\s*dose\s*\d+|prescribe)\b/i;
  if (forbiddenDosage.test(lower)) {
    return { valid: false, reason: 'clinical_prescription_violation' };
  }

  // Only check food ingredients/allergens if the query is actually about food/meals
  const isFoodRelated =
    intent === 'meal_suggestion' ||
    intent === 'unavailable_ingredient' ||
    intent === 'provide_available_ingredients' ||
    intent === 'nutrition_calculation' ||
    /\b(cook|eat|recipe|meal|dinner|lunch|breakfast|khana|khao|banayein|dish)\b/i.test(lower);

  if (isFoodRelated) {
    for (const ing of unavailableIngredients) {
      const cleanIng = String(ing).replace('_', ' ');
      const recommendPattern = new RegExp(`(cook|make|eat|try|suggest|banayein|khao)[^.!\\n]{0,45}\\b${cleanIng}\\b`, 'i');
      if (recommendPattern.test(lower)) {
        return { valid: false, reason: `suggested_unavailable_ingredient:${cleanIng}` };
      }
    }

    const allergenKeywords = {
      dairy: ['paneer', 'milk', 'dahi', 'curd', 'cheese', 'ghee'],
      peanuts: ['peanut', 'peanuts', 'moongfali'],
      gluten: ['wheat', 'roti', 'atta', 'suji', 'chapati'],
      eggs: ['egg', 'eggs', 'anda'],
      soy: ['soya', 'tofu', 'soybean'],
    };
    for (const allergy of allergies) {
      for (const term of allergenKeywords[allergy] || []) {
        const recommendPattern = new RegExp(`(cook|make|eat|try|suggest|banayein|khao)[^.!\\n]{0,45}\\b${term}\\b`, 'i');
        if (recommendPattern.test(lower)) {
          return { valid: false, reason: `suggested_allergen:${allergy}` };
        }
      }
    }
  }

  return { valid: true, reason: null };
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }

  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());

  if (!hasGemini && !hasOpenAI) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        configured: false,
        provider: null,
        reason: 'missing_llm_credentials',
      })
    );
    return;
  }

  let candidateReplyHint = '';
  let intent = 'general_checkin';

  try {
    const body = await readJsonBody(req);
    const {
      message = '',
      targetLanguage = 'hinglish',
      userContext = {},
      history = [],
    } = body;
    if (body.candidateReplyHint) candidateReplyHint = String(body.candidateReplyHint);
    if (body.intent) intent = String(body.intent);

    const isGenericGreeting =
      !candidateReplyHint ||
      /Main yahan hoon|I'm right here with you|Mujhse puchiye|Ask me what to cook/i.test(candidateReplyHint);

    const systemPrompt = [
      'You are HEALTH PLUS (Team CASA Vital), an empathetic, highly intelligent Indian personal nutrition and wellness coach.',
      `Strictly respond in language code "${targetLanguage}" ("hi"=Devanagari Hindi, "hinglish"=natural conversational Hindi-English romanized, "en"=clean warm English). Speak naturally, empathetically and directly like a knowledgeable, encouraging personal health mentor. NEVER output robotic greetings or evade the user's questions.`,
      'CORE COACHING RULES:',
      '1. ALWAYS directly answer whatever the user asks or says. If the user asks "kya khayu" / "to fir me kya khayu" (what should I eat), "ab kya karu" (what should I do now), "kya karna chahiye kya nahi" (what to do vs what to avoid), or asks for nutrition/wellness advice, give an immediate, specific, thoughtful recommendation tailored to their real stats.',
      '2. REAL-TIME STATS AWARENESS: Always look at their logged calories vs target, remaining calories, and logged protein vs target from userContext.todayRecorded or realtimeBalance. State these numbers clearly and naturally (e.g. "Chirag, aaj aapne ~1621 / 2267 kcal consume kiye hain (~646 kcal remaining) aur aapka protein goal (139g / 66g) already complete ho chuka hai! ✓").',
      '3. TARGETED MEAL & SNACK SUGGESTIONS: Pick 2-3 specific Indian dishes (from authentic sabzis, dals, breads, rice bowls, light soups, or salads) that fit cleanly within their remaining calories budget and meet their dietary preferences (e.g. gluten-free exclusion, vegetarian, etc.). Give approx calories and protein for each suggestion.',
      '4. PRACTICAL DOs and DONTs: When the user asks what to do or not do, give 1-2 practical DOs (e.g. light warm dinner, hydration, light post-meal walk) and 1-2 practical DONTs (e.g. avoid heavy deep-fried snacks or late-night high-sugar desserts; if protein goal is already surpassed, do not take extra protein shakes or heavy paneer tonight).',
      '5. NEVER output repetitive canned greetings like "Main yahan hoon... Mujhse puchiye: Aaj raat dinner mein kya banau". Act as a live thinking conversational AI coach who directly addresses the user\'s prompt.',
      'STRICT GROUNDING & SAFETY RULES:',
      '6. NEVER invent meals logged, workout reps, calories consumed, blood reports, or confidence scores. Only cite numbers from userContext.',
      '7. NEVER prescribe medications, insulin doses, or medical diagnoses; advise physician consultation cleanly.',
      `8. Excluded allergens (HARD NEVER RECOMMEND): ${JSON.stringify(userContext.allergies || [])}.`,
      `9. Celiac / Gluten-free: ${userContext.celiacOrGlutenFree ? 'STRICT NO WHEAT/ROTI/ATTA/SUJI dishes' : 'Standard'}.`,
      `10. Unavailable ingredients at home right now (DO NOT RECOMMEND): ${JSON.stringify(userContext.unavailableIngredients || [])}.`,
      `User profile & real state JSON: ${JSON.stringify(userContext)}`,
      !isGenericGreeting ? `Candidate baseline ideas: ${candidateReplyHint}` : '',
    ].filter(Boolean).join('\n');

    let llmText = '';
    const preferredModel = (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) || 'gemini-3.5-flash-lite';
    let usedProvider = hasGemini ? 'gemini' : 'openai';
    let modelName = hasGemini ? preferredModel : 'gpt-4o-mini';

    if (hasGemini) {
      const apiKey = process.env.GEMINI_API_KEY.trim();
      const modelsToTry = [
        preferredModel,
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-flash-lite-latest',
      ].filter((v, i, a) => a.indexOf(v) === i);

      const contents = [
        ...history.slice(-6).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(h.content || '') }],
        })),
        { role: 'user', parts: [{ text: String(message) }] },
      ];

      let lastError = null;
      for (const m of modelsToTry) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const resp = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
            }),
          });
          if (resp.ok) {
            const json = await resp.json();
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim()) {
              llmText = text.trim();
              modelName = m;
              break;
            }
          } else {
            const errText = await resp.text();
            lastError = new Error(`Gemini ${m} HTTP ${resp.status}: ${errText}`);
          }
        } catch (mErr) {
          lastError = mErr;
        }
      }

      if (!llmText && lastError) {
        throw lastError;
      }
    } else {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          max_tokens: 450,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6).map((h) => ({
              role: h.role === 'assistant' ? 'assistant' : 'user',
              content: String(h.content || ''),
            })),
            { role: 'user', content: String(message) },
          ],
        }),
      });
      if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}`);
      const json = await resp.json();
      llmText = json?.choices?.[0]?.message?.content || '';
    }

    const validation = validateAiGeneratedText({
      text: llmText,
      unavailableIngredients: userContext.unavailableIngredients || [],
      allergies: userContext.allergies || [],
      intent,
    });

    if (!validation.valid) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          configured: true,
          provider: usedProvider,
          model: modelName,
          validated: false,
          validationReason: validation.reason,
          intent,
        })
      );
      return;
    }

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        configured: true,
        provider: usedProvider,
        model: modelName,
        validated: true,
        content: llmText.trim(),
        intent,
      })
    );
  } catch (err) {
    if (candidateReplyHint && candidateReplyHint.trim()) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          configured: true,
          provider: 'healthplus_engine',
          model: 'grounded_core',
          validated: true,
          content: candidateReplyHint.trim(),
          intent,
        })
      );
      return;
    }

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: false,
        configured: false,
        error: err instanceof Error ? err.message : 'gateway_error',
      })
    );
  }
};

module.exports.validateAiGeneratedText = validateAiGeneratedText;
