import type {
  AppState,
  ChatActionChip,
  ChatMessage,
  ConversationLanguage,
  ConversationMemory,
  IngredientKey,
  MealSlot,
  RecommendationBundle,
  ScoredRecipe,
  UserProfile,
} from '@/types/wellness';
import {
  INGREDIENT_CATALOG,
  NUTRITION_RECIPES,
  extractIngredientsFromText,
  getIngredientLabel,
} from './nutritionCatalog';
import {
  getDefaultMealSlotByHour,
  recommendMeals,
} from './recommendationEngine';
import { evaluateProfileSafety } from './safetyConfig';

export interface OrchestratorTurnResult {
  assistantMessage: ChatMessage;
  updatedMemory: ConversationMemory;
  newlyUnavailableIngredients: IngredientKey[];
  newlyAvailableIngredients: IngredientKey[] | null;
  newlyRejectedRecipeIds: string[];
  preferFaster?: boolean;
  preferCheaper?: boolean;
}

interface ParsedTurnUnderstanding {
  detectedLanguage: ConversationLanguage;
  intent:
    | 'ask_rejection_reason'
    | 'reject_suggestion'
    | 'unavailable_ingredient'
    | 'provide_available_ingredients'
    | 'nutrition_calculation'
    | 'meal_suggestion'
    | 'missed_gym_adaptation'
    | 'provide_movement_context'
    | 'exercise_coaching'
    | 'progress_checkin'
    | 'medical_boundary'
    | 'general_checkin';
  requestedSlot?: MealSlot;
  unavailableIngredients: IngredientKey[];
  positiveIngredients: IngredientKey[];
  explicitlyMentionedRecipeIds: string[];
  isRejection: boolean;
  wantsFaster: boolean;
  wantsCheaper: boolean;
  mentionedMinutes: number | null;
  mentionedEquipment: 'none' | 'mat' | 'dumbbells' | null;
}

const HINGLISH_MARKERS = [
  'kya',
  'hai',
  'nahi',
  'nhi',
  'mujhe',
  'ghar',
  'khana',
  'khaana',
  'khani',
  'aaj',
  'batao',
  'kaise',
  'karna',
  'karo',
  'raat',
  'subah',
  'dopahar',
  'shaam',
  'paani',
  'chahiye',
  'mera',
  'meri',
  'mere',
  'banau',
  'banao',
  'khatam',
  'pasand',
  'jaldi',
  'sasta',
  'abhi',
  'thoda',
  'aur',
  'pe',
  'mein',
  'par',
  'wala',
  'sakti',
  'sakta',
  'ja',
  'jaana',
  'jana',
  'kyunki',
  'kyonki',
  'sirf',
  'bhi',
  'kitna',
  'kitni',
  'bacha',
  'bachi',
  'baaki',
];

function detectLanguage(
  text: string,
  profilePreference: UserProfile['lifestyle']['preferredLanguage'],
  memory: ConversationMemory,
  hasConversationHistory: boolean
): ConversationLanguage {
  const lower = text.toLowerCase();

  // Explicit user switch request always wins
  if (/\b(in english|english please|speak english|english mein|reply in english)\b/i.test(lower)) {
    return 'en';
  }
  if (/\b(in hindi|hindi mein|shudh hindi)\b/i.test(lower)) {
    return 'hi';
  }
  if (/\b(hinglish)\b/i.test(lower)) {
    return 'hinglish';
  }

  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }

  const lowerWords = lower
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const hinglishHits = lowerWords.filter((w) => HINGLISH_MARKERS.includes(w)).length;
  if (hinglishHits >= 1) {
    return 'hinglish';
  }

  // Keep established Hinglish/Hindi thread continuity on follow-up replies or short continuations
  const inActiveFollowUp =
    Boolean(memory.awaitingMovementContext) ||
    Boolean(memory.awaitingAvailableIngredients) ||
    Boolean(memory.awaitingRejectionReasonForRecipeId);
  if (
    hasConversationHistory &&
    (memory.detectedLanguage === 'hinglish' || memory.detectedLanguage === 'hi') &&
    (inActiveFollowUp ||
      memory.activeTopic === 'move' ||
      memory.activeTopic === 'food' ||
      lowerWords.length <= 8)
  ) {
    return memory.detectedLanguage;
  }

  if (profilePreference !== 'auto') {
    return profilePreference;
  }
  return 'en';
}

function splitNegatedAndPositiveClauses(text: string): {
  negatedText: string;
  positiveText: string;
} {
  const clauses = text.split(
    /[,;.!?]|\band\b|\bbut\b|\blekin\b|\baur\b|\bbecause\b|\bkyunki\b|\bkyonki\b|\bsince\b/i
  );
  const negated: string[] = [];
  const positive: string[] = [];

  const negationPattern =
    /\b(don't have|do not have|dont have|haven't got|no |not at home|without|out of|finished|missing|unavailable|nahi hai|nhi hai|khatam|mat|bina|can't eat|cannot eat|cant eat|skip)\b/i;

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (!trimmed) continue;
    if (negationPattern.test(trimmed)) {
      negated.push(trimmed);
    } else {
      positive.push(trimmed);
    }
  }

  return {
    negatedText: negated.join(' '),
    positiveText: positive.join(' '),
  };
}

function extractExplicitRecipeIds(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  const dishKeywords: Array<{ pattern: RegExp; recipeId: string }> = [
    { pattern: /paneer bhurji/i, recipeId: 'paneer-bhurji-roti' },
    { pattern: /soya (masala|bhurji|chunks)/i, recipeId: 'soya-masala-stir' },
    { pattern: /moong dal.*(rice|chawal)/i, recipeId: 'moong-dal-rice' },
    { pattern: /khichdi/i, recipeId: 'moong-veg-khichdi' },
    { pattern: /besan.*chilla/i, recipeId: 'besan-spinach-chilla' },
    { pattern: /(egg|anda) bhurji/i, recipeId: 'egg-bhurji-roti' },
    { pattern: /curd rice|dahi chawal|thayir/i, recipeId: 'curd-rice-temper' },
    { pattern: /poha/i, recipeId: 'kanda-poha-peanuts' },
    { pattern: /oats upma/i, recipeId: 'oats-veg-upma' },
    { pattern: /moong.*chilla/i, recipeId: 'moong-dal-chilla-brek' },
    { pattern: /chana chaat|sprouts/i, recipeId: 'sprouts-chana-chaat' },
    { pattern: /ragi dosa/i, recipeId: 'ragi-vegetable-dosa' },
  ];
  for (const item of dishKeywords) {
    if (item.pattern.test(lower)) matched.push(item.recipeId);
  }
  return matched;
}

function detectMealSlot(text: string): MealSlot | undefined {
  const lower = text.toLowerCase();
  if (/\b(breakfast|nashta|subah|morning)\b/i.test(lower)) return 'breakfast';
  if (/\b(lunch|dopahar|afternoon)\b/i.test(lower)) return 'lunch';
  if (/\b(snack|shaam|evening tea|chai)\b/i.test(lower)) return 'snack';
  if (/\b(dinner|tonight|night|raat|aaj raat)\b/i.test(lower)) return 'dinner';
  return undefined;
}

function extractDurationMinutes(lower: string): number | null {
  const digitMatch = lower.match(/\b(5|8|10|12|15|20|25|30|40|45|60)\s*(?:min|mins|minutes|minute|m)\b/);
  if (digitMatch) return Number(digitMatch[1]);

  const wordMap: Array<{ pattern: RegExp; mins: number }> = [
    { pattern: /\b(twenty[- ]?five|pachees)\s*(?:min|mins|minutes|minute)\b/i, mins: 25 },
    { pattern: /\b(five|paanch|panch)\s*(?:min|mins|minutes|minute)\b/i, mins: 5 },
    { pattern: /\b(ten|das)\s*(?:min|mins|minutes|minute)\b/i, mins: 10 },
    { pattern: /\b(twelve|barah)\s*(?:min|mins|minutes|minute)\b/i, mins: 12 },
    { pattern: /\b(fifteen|pandra|pandrah)\s*(?:min|mins|minutes|minute)\b/i, mins: 15 },
    { pattern: /\b(twenty|bees)\s*(?:min|mins|minutes|minute)\b/i, mins: 20 },
    { pattern: /\b(thirty|tees)\s*(?:min|mins|minutes|minute)\b/i, mins: 30 },
  ];
  for (const item of wordMap) {
    if (item.pattern.test(lower)) return item.mins;
  }
  return null;
}

function understandMessage(userText: string, state: AppState): ParsedTurnUnderstanding {
  const prefLang = state.profile?.lifestyle.preferredLanguage ?? 'auto';
  const hasPreviousUserTurns = state.chatMessages.some((m) => m.role === 'user');
  const detectedLanguage = detectLanguage(
    userText,
    prefLang,
    state.conversationMemory,
    hasPreviousUserTurns
  );
  const lower = userText.toLowerCase();

  // Check clinical / medical diagnosis questions first
  const medicalPattern =
    /\b(chest pain|diagnose|medicine|medication|tablet|prescription|insulin dose|dosage|fever|dizzy|fainting|bleeding|chronic pain|doctor)\b/i;
  if (medicalPattern.test(lower)) {
    return {
      detectedLanguage,
      intent: 'medical_boundary',
      unavailableIngredients: [],
      positiveIngredients: [],
      explicitlyMentionedRecipeIds: [],
      isRejection: false,
      wantsFaster: false,
      wantsCheaper: false,
      mentionedMinutes: null,
      mentionedEquipment: null,
    };
  }

  const { negatedText, positiveText } = splitNegatedAndPositiveClauses(userText);
  const unavailableIngredients = extractIngredientsFromText(negatedText);
  const positiveIngredients = extractIngredientsFromText(positiveText).filter(
    (ing) => !unavailableIngredients.includes(ing)
  );
  const explicitlyMentionedRecipeIds = extractExplicitRecipeIds(userText);

  const isRejection =
    /\b(cannot eat|can't eat|cant eat|don't want|dont want|don't like|dont like|not tonight|dislike|hate|skip this|something else|not feeling|nahi khana|nhi khana|nahi khani|nhi khani|nahi khaani|nhi khaani|nahi pasand|pasand nahi|kuch aur|badal do|change this|change meal)\b/i.test(
      lower
    );

  const hasExplicitRejectionReason =
    /\b(taste|boring|bore|heavy|spicy|didn't like|dont like|don't like|mood nahi|mann nahi|time nahi|no time|busy|budget|mehenga|expensive|not available|ghar par nahi|khatam|allergy|gas|acidity|bloat|something else|aur kuch|dusra dikhao|other options)\b/i.test(
      lower
    );

  const mentionedMinutes = extractDurationMinutes(lower);
  const wantsFaster =
    /\b(faster|quick|5 min|10 min|five min|ten min|jaldi|less time|no time|busy)\b/i.test(lower) ||
    (mentionedMinutes !== null && mentionedMinutes <= 12);
  const wantsCheaper = /\b(cheap|cheaper|budget|sasta|affordable|hostel|pg)\b/i.test(lower);
  const requestedSlot = detectMealSlot(userText);

  const equipmentNegated =
    /\b(dumbbell|dumbbells|bands|weights|equipment|saman)\b/i.test(negatedText) ||
    /\b(no dumbbell|no dumbbells|without dumbbells|bina dumbbell|bina saman)\b/i.test(lower);
  const mentionedEquipment =
    equipmentNegated || /\b(bodyweight|no equipment|nothing|kuch nahi|bina saman)\b/i.test(lower)
      ? 'none'
      : /\b(dumbbell|dumbbells|bands|weights)\b/i.test(positiveText)
        ? 'dumbbells'
        : /\b(mat|yoga mat)\b/i.test(positiveText)
          ? 'mat'
          : null;

  const isGymUnavailable =
    /\b(gym nahi|gym nhi|can't go to gym|cannot go to gym|cant go to gym|skip gym|no gym|miss gym|missed gym|ghar par workout|ghar pe workout|home workout)\b/i.test(
      lower
    ) ||
    (/\bgym\b/i.test(lower) && /\b(nahi|nhi|can't|cannot|skip|miss|closed|band|rain)\b/i.test(lower));

  const isExerciseIntent =
    /\b(gym|workout|exercise|squat|pushup|push-up|glute|form|posture|rep|reps|movement|stretch|kasrat|vyayam|walk|yoga)\b/i.test(
      lower
    );
  const isNutritionCalcIntent =
    /\b(protein left|remaining protein|calories left|kcal left|remaining calories|how much protein|how many calories|kitna protein|kitni calories|calories bachi|calories baaki|protein bacha|protein baaki|macros left|macro target)\b/i.test(
      lower
    );
  const isProgressIntent =
    /\b(progress|streak|trend|weight|summary|report|how am i doing|kaise chal raha)\b/i.test(
      lower
    );
  const isFoodIntent =
    Boolean(requestedSlot) ||
    /\b(eat|meal|food|dinner|lunch|breakfast|snack|recipe|cook|hungry|protein|calorie|kcal|diet|khana|khaana|khau|khayu|khaye|khayein|khao|khani|banau|banaun|banao|pakaun|kitchen|pantry|ingredients|bhookh|bhuk|cravings?)\b/i.test(
      lower
    ) ||
    /(kya\s*kh|kya\s*ban|kya\s*le|kya\s*paka|mekya|kya\s*pakau|kya\s*khau|kya\s*khayu)/i.test(lower);

  let intent: ParsedTurnUnderstanding['intent'] = 'general_checkin';

  if (unavailableIngredients.length > 0 && positiveIngredients.length === 0) {
    intent = 'unavailable_ingredient';
  } else if (isGymUnavailable) {
    intent = 'missed_gym_adaptation';
  } else if (
    (state.conversationMemory.awaitingMovementContext ||
      state.conversationMemory.activeTopic === 'move') &&
    (mentionedMinutes !== null || mentionedEquipment !== null || isExerciseIntent)
  ) {
    intent = 'provide_movement_context';
  } else if (
    positiveIngredients.length > 0 &&
    (state.conversationMemory.awaitingAvailableIngredients ||
      Boolean(state.conversationMemory.awaitingRejectionReasonForRecipeId) ||
      /\b(i have|available|at home|fridge|kitchen|ghar pe|ghar par|mere paas|bas yehi|sirf)\b/i.test(
        lower
      ))
  ) {
    intent = 'provide_available_ingredients';
  } else if (isNutritionCalcIntent) {
    intent = 'nutrition_calculation';
  } else if (isRejection) {
    intent =
      explicitlyMentionedRecipeIds.length > 0 &&
      !hasExplicitRejectionReason &&
      !state.conversationMemory.awaitingRejectionReasonForRecipeId
        ? 'ask_rejection_reason'
        : 'reject_suggestion';
  } else if (
    state.conversationMemory.awaitingRejectionReasonForRecipeId &&
    !isExerciseIntent &&
    !isProgressIntent
  ) {
    intent = 'reject_suggestion';
  } else if (isExerciseIntent) {
    intent = 'exercise_coaching';
  } else if (isProgressIntent) {
    intent = 'progress_checkin';
  } else if (isFoodIntent || positiveIngredients.length > 0) {
    intent = 'meal_suggestion';
  }

  return {
    detectedLanguage,
    intent,
    requestedSlot,
    unavailableIngredients,
    positiveIngredients,
    explicitlyMentionedRecipeIds,
    isRejection,
    wantsFaster,
    wantsCheaper,
    mentionedMinutes,
    mentionedEquipment,
  };
}

function buildSafeIngredientPromptExamples(profile: UserProfile): string {
  const suggestions: Array<{ key: IngredientKey; label: string }> = [
    { key: 'dal', label: 'dal' },
    { key: 'curd', label: 'curd/dahi' },
    { key: 'milk', label: 'milk' },
    { key: 'eggs', label: 'eggs' },
    { key: 'soya_chunks', label: 'soya' },
    { key: 'mixed_veg', label: 'vegetables' },
    { key: 'roti_atta', label: 'roti/rice' },
  ];

  const safeList = suggestions.filter((item) => {
    const meta = INGREDIENT_CATALOG.find((c) => c.key === item.key);
    if (meta?.allergen && profile.safety.allergies.includes(meta.allergen)) return false;
    if (
      item.key === 'eggs' &&
      !['eggetarian', 'non_vegetarian'].includes(profile.foodPreferences.dietaryPattern)
    ) {
      return false;
    }
    if (
      item.key === 'roti_atta' &&
      (profile.safety.celiacOrGlutenFree || profile.safety.allergies.includes('gluten'))
    ) {
      return false;
    }
    return true;
  });

  return safeList.map((i) => i.label).join(', ');
}

function formatRecipeChoice(scored: ScoredRecipe, lang: ConversationLanguage): string {
  const r = scored.recipe;
  const title = lang === 'hi' ? r.hindiName : lang === 'hinglish' ? r.hinglishName : r.name;
  const reason = scored.matchReasons[0] ?? r.whyItFits;
  return `• **${title}** (${r.prepMins} min · ~${r.macros.calories} kcal, ~${r.macros.proteinG}g protein est.) — ${reason}`;
}

export function runAiOrchestrator(userText: string, state: AppState): OrchestratorTurnResult {
  const nowISO = new Date().toISOString();
  const profile = state.profile;
  const targets = state.targets;
  const memory = state.conversationMemory;

  if (!profile || !targets || !state.onboardingCompleted) {
    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          'Please finish your conversational wellness interview first so I know your goals, kitchen ingredients, and safety needs before guiding your meals and movement.',
        language: 'en',
        timestamp: nowISO,
      },
      updatedMemory: memory,
      newlyUnavailableIngredients: [],
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: [],
    };
  }

  const understanding = understandMessage(userText, state);
  const lang = understanding.detectedLanguage;
  const safetyEval = evaluateProfileSafety(profile);

  const todayISO = nowISO.slice(0, 10);
  const mealsToday = state.mealsLogged.filter((m) => m.dateISO === todayISO);
  const kcalConsumed = mealsToday.reduce((sum, m) => sum + m.calories, 0);
  const proteinConsumed = mealsToday.reduce((sum, m) => sum + m.proteinG, 0);
  const remainingKcal = Math.max(0, targets.calorieTarget - kcalConsumed);
  const remainingProtein = Math.max(0, targets.proteinTargetG - proteinConsumed);

  const positiveSet = new Set(understanding.positiveIngredients);
  const mergedUnavailable = Array.from(
    new Set<IngredientKey>([
      ...profile.foodAvailability.unavailableIngredients,
      ...memory.unavailableIngredients,
      ...understanding.unavailableIngredients,
    ])
  ).filter((ing) => !positiveSet.has(ing));

  const newlyRejectedIds: string[] = [...understanding.explicitlyMentionedRecipeIds];
  if (
    (understanding.isRejection || understanding.unavailableIngredients.length > 0) &&
    memory.lastSuggestedRecipeIds.length > 0
  ) {
    newlyRejectedIds.push(...memory.lastSuggestedRecipeIds);
  }

  const mergedRejected = Array.from(
    new Set<string>([
      ...state.foodFeedbackMemory.rejectedRecipeIds,
      ...memory.rejectedRecipeIds,
      ...newlyRejectedIds,
    ])
  );

  const newlyAvailableIngredients =
    understanding.positiveIngredients.length > 0
      ? Array.from(new Set<IngredientKey>(understanding.positiveIngredients))
      : null;

  const effectiveSlot: MealSlot =
    understanding.requestedSlot ?? memory.lastSuggestedMealSlot ?? getDefaultMealSlotByHour();

  const maxPrep =
    understanding.wantsFaster || state.foodFeedbackMemory.preferFaster
      ? Math.min(profile.foodPreferences.cookingTimeLimitMins, 15)
      : profile.foodPreferences.cookingTimeLimitMins;

  const budgetPriority =
    understanding.wantsCheaper ||
    state.foodFeedbackMemory.preferCheaper ||
    profile.foodPreferences.budgetTier === 'budget';

  // Medical symptom / clinical boundary check
  if (understanding.intent === 'medical_boundary') {
    const content =
      lang === 'hi'
        ? 'मैं एक पर्सनल वेलनेस साथी हूँ, डॉक्टर नहीं। सीने में दर्द, चक्कर, बुखार या दवा/इंसुलिन डोज़ जैसे मेडिकल सवालों के लिए कृपया तुरंत अपने डॉक्टर से सलाह लें।'
        : lang === 'hinglish'
          ? 'Main ek personal wellness companion hoon — medical diagnosis ya medicine/dosage advice nahi deta. Agar aapko chest pain, chakkar, ya kisi clinical symptom/medicine ke baare mein doubt hai, toh please apne doctor se turant consult karein.'
          : 'HEALTH PLUS is a personal wellness companion, not a medical diagnosis or treatment tool. For symptoms like chest pain, dizziness, medication changes, or clinical dosages, please consult a qualified physician promptly.';

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        safetyNotice:
          'Clinical Boundary: Non-diagnostic safety mode triggered. Consult your healthcare provider for medical symptoms.',
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: ['Clinical symptom boundary check'],
          safetyChecksPassed: ['Non-diagnostic medical referral enforced'],
          provenanceNote: 'Safety guardrail response (config-driven)',
        },
      },
      updatedMemory: {
        ...memory,
        activeTopic: 'safety',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: [],
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: [],
    };
  }

  // Case A0: Specific dish rejected without stating reason yet -> ask WHY before replacing
  if (understanding.intent === 'ask_rejection_reason') {
    const targetId = understanding.explicitlyMentionedRecipeIds[0] ?? null;
    const matchedRecipe = NUTRITION_RECIPES.find((r) => r.id === targetId);
    const dishTitle = matchedRecipe
      ? lang === 'hi'
        ? matchedRecipe.hindiName
        : lang === 'hinglish'
          ? matchedRecipe.hinglishName
          : matchedRecipe.name
      : lang === 'hinglish'
        ? 'woh dish'
        : 'that dish';
    const primaryIng = matchedRecipe?.requiredIngredients[0];
    const primaryLabel = primaryIng ? getIngredientLabel(primaryIng).split(' / ')[0] : null;
    const safeExamples = buildSafeIngredientPromptExamples(profile);

    const content =
      lang === 'hi'
        ? `बिल्कुल ठीक, मैंने **${dishTitle}** को आज के प्लान से हटा दिया है।\n\nयह विकल्प क्यों बदलना चाहते हैं — क्या ${primaryLabel ? `**${primaryLabel}** घर पर नहीं है` : 'कोई सामग्री उपलब्ध नहीं है'}, या आज स्वाद/समय की वजह से कुछ अलग पसंद है? साथ ही बता दें कि अभी रसोई में क्या उपलब्ध है (${safeExamples})।`
        : lang === 'hinglish'
          ? `Bilkul theek, maine **${dishTitle}** aaj ke dinner plan se hata diya hai.\n\nEk chhoti baat batayein — kya ${primaryLabel ? `**${primaryLabel}** ghar par nahi hai` : 'koi ingredient ghar par available nahi hai'}, ya bas aaj mood/taste ya kam time ki wajah se badalna hai? Yeh bhi bata dein abhi ghar par kya available hai (${safeExamples}) taaki main exact safe option suggest karoon.`
          : `Got it — I've dropped **${dishTitle}** from today's plan.\n\nQuick check so I adapt properly: **why** are we skipping it — is ${primaryLabel ? `**${primaryLabel}** out of stock at home` : 'an ingredient unavailable'}, or is it a taste/prep-time preference today? Let me know what ingredients you currently have (${safeExamples}) too.`;

    const chips: ChatActionChip[] = [
      ...(primaryIng && primaryLabel
        ? [
            {
              id: 'chip-missing-ing',
              label:
                lang === 'hinglish'
                  ? `${primaryLabel} ghar par nahi hai`
                  : `${primaryLabel} not at home`,
              promptText: `${primaryLabel} ghar par nahi hai`,
              actionType: 'ask_prompt' as const,
            },
          ]
        : []),
      {
        id: 'chip-have-dal-curd',
        label: lang === 'hinglish' ? 'Dahi aur Dal available hai' : 'I have dal and curd',
        promptText: 'Dahi aur dal available hai.',
        actionType: 'ask_prompt',
      },
      {
        id: 'chip-just-change',
        label: lang === 'hinglish' ? 'Bas taste/mood nahi hai' : 'Just want another option',
        promptText: 'Bas mood nahi hai, kuch aur option dikhao',
        actionType: 'ask_prompt',
      },
    ];

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        actionChips: chips,
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [
            `Rejected dish: ${targetId ?? 'unspecified'}`,
            'Clarifying rejection reason before substituting',
          ],
          safetyChecksPassed: ['Profile allergies & diet preserved'],
          provenanceNote: 'Contextual food adaptation clarifying reason',
        },
      },
      updatedMemory: {
        ...memory,
        rejectedRecipeIds: mergedRejected,
        awaitingRejectionReasonForRecipeId: targetId,
        awaitingAvailableIngredients: true,
        awaitingMovementContext: false,
        lastSuggestedRecipeIds: [],
        lastSuggestedMealSlot: effectiveSlot,
        activeTopic: 'food',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: [],
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: newlyRejectedIds,
    };
  }

  // Case A: Unavailable ingredient (e.g. "I cannot eat paneer bhurji tonight because paneer is not available at home")
  if (understanding.intent === 'unavailable_ingredient') {
    const removedLabels = understanding.unavailableIngredients
      .map((k) => getIngredientLabel(k).split(' / ')[0])
      .join(', ');
    const safeExamples = buildSafeIngredientPromptExamples(profile);

    const content =
      lang === 'hi'
        ? `समझ गया — **${removedLabels}** और उससे जुड़ी रेसिपी हटाकर मैंने इसे याद रख लिया है।\n\nअभी आपके घर पर क्या-क्या सामग्री उपलब्ध है? (जैसे: ${safeExamples}) — जो चीज़ें घर पर हैं बस वह बताएं, मैं उसी से सुरक्षित और स्वादिष्ट विकल्प बना दूँगा।`
        : lang === 'hinglish'
          ? `Bilkul samajh gaya — maine **${removedLabels}** aur usse judi recipes aaj ke plan se hata di hain, aur aage bhi yaad rakhunga.\n\nAapke ghar par abhi kaun-kaun si cheezein available hain? (jaise: ${safeExamples}) — batayein toh main sirf unhi ingredients se best safe option suggest karta hoon.`
          : `Understood — I've excluded **${removedLabels}** and dropped dishes requiring it, and I'll remember that constraint across our conversation.\n\nWhat ingredients do you currently have at home right now? (For example: ${safeExamples}) — let me know what's in your kitchen and I'll pick safe, practical meals strictly from that.`;

    const rawChips: ChatActionChip[] = [
      {
        id: 'chip-dal-rice',
        label:
          lang === 'hinglish'
            ? 'Dal, Chawal aur Dahi hai'
            : lang === 'hi'
              ? 'दाल, चावल और दही है'
              : 'Dal, Rice & Curd',
        promptText: 'I have dal, rice, curd and tomato onion',
        actionType: 'ask_prompt',
      },
      {
        id: 'chip-soya-veg',
        label:
          lang === 'hinglish'
            ? 'Soya Chunks aur Sabzi/Roti'
            : lang === 'hi'
              ? 'सोया चंक्स और सब्ज़ी'
              : 'Soya Chunks & Veggies',
        promptText: 'I have soya chunks, tomato onion, vegetables and roti',
        actionType: 'ask_prompt',
      },
      {
        id: 'chip-besan-curd',
        label:
          lang === 'hinglish'
            ? 'Besan, Palak aur Dahi'
            : lang === 'hi'
              ? 'बेसन, पालक और दही'
              : 'Besan, Spinach & Curd',
        promptText: 'I have besan, spinach, onion and curd',
        actionType: 'ask_prompt',
      },
    ];
    const chips: ChatActionChip[] = rawChips.filter((chip) => {
      if (profile.safety.allergies.includes('dairy') && chip.id === 'chip-dal-rice') return false;
      if (profile.safety.allergies.includes('soy') && chip.id === 'chip-soya-veg') return false;
      return true;
    });

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        actionChips: chips,
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [
            `Marked unavailable: ${removedLabels}`,
            `Excluded ${mergedRejected.length} prior/named dish(es)`,
          ],
          safetyChecksPassed: safetyEval.activeRules.length
            ? safetyEval.activeRules.map((r) => r.title)
            : ['Allergies & safety screening active'],
          provenanceNote: 'Awaiting live kitchen inventory before recommending',
        },
      },
      updatedMemory: {
        ...memory,
        unavailableIngredients: mergedUnavailable,
        rejectedRecipeIds: mergedRejected,
        awaitingAvailableIngredients: true,
        awaitingRejectionReasonForRecipeId: null,
        awaitingMovementContext: false,
        lastSuggestedRecipeIds: [],
        lastSuggestedMealSlot: effectiveSlot,
        activeTopic: 'food',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: understanding.unavailableIngredients,
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: newlyRejectedIds,
    };
  }

  // Case B: User provides available home ingredients -> strict matching
  if (understanding.intent === 'provide_available_ingredients') {
    const providedLabels = understanding.positiveIngredients
      .map((k) => getIngredientLabel(k).split(' / ')[0])
      .join(', ');

    let strictBundle: RecommendationBundle = recommendMeals(
      profile,
      {
        mealSlot: effectiveSlot,
        rejectedRecipeIds: mergedRejected,
        unavailableIngredients: mergedUnavailable,
        availableIngredients: understanding.positiveIngredients,
        maxPrepMins: maxPrep,
        budgetPriority,
        antiRepeatIds: memory.lastSuggestedRecipeIds,
        strictAvailabilityOnly: true,
      },
      state.mealsLogged,
      3
    );

    if (strictBundle.recommendations.length === 0) {
      const combinedKitchen = Array.from(
        new Set<IngredientKey>([
          ...understanding.positiveIngredients,
          ...profile.foodAvailability.availableIngredients.filter(
            (i) => !mergedUnavailable.includes(i)
          ),
        ])
      );
      const profileAssisted = recommendMeals(
        profile,
        {
          mealSlot: effectiveSlot,
          rejectedRecipeIds: mergedRejected,
          unavailableIngredients: mergedUnavailable,
          availableIngredients: combinedKitchen,
          maxPrepMins: maxPrep,
          budgetPriority,
          antiRepeatIds: memory.lastSuggestedRecipeIds,
          strictAvailabilityOnly: true,
        },
        state.mealsLogged,
        5
      );
      const matchesUserMention = profileAssisted.recommendations.filter((rec) =>
        rec.recipe.requiredIngredients.some((req) =>
          understanding.positiveIngredients.includes(req)
        )
      );
      if (matchesUserMention.length > 0) {
        strictBundle = {
          ...profileAssisted,
          recommendations: matchesUserMention.slice(0, 3),
        };
      }
    }

    if (strictBundle.recommendations.length > 0) {
      const listText = strictBundle.recommendations
        .map((rec) => formatRecipeChoice(rec, lang))
        .join('\n');

      const excludedPaneerNote = mergedUnavailable.includes('paneer')
        ? lang === 'hi'
          ? 'पनीर को अलग रखते हुए और '
          : lang === 'hinglish'
            ? 'Paneer ke bina aur '
            : 'Keeping paneer excluded and '
        : '';

      const intro =
        lang === 'hi'
          ? `${excludedPaneerNote}आपके पास मौजूद चीज़ों (**${providedLabels}**) से ये सुरक्षित घर के भोजन तुरंत बन सकते हैं:\n\n${listText}\n\nइनमें से कोई भी आप अभी बना सकते हैं — क्या किसी की आसान स्टेप्स दिखाऊँ?`
          : lang === 'hinglish'
            ? `${excludedPaneerNote}aapke paas jo hai (**${providedLabels}**), usse abhi ye safe dishes ban sakti hain:\n\n${listText}\n\nBataiye kaunsi dish lock karein, ya agar fast/lighter option chahiye toh bolein.`
            : `${excludedPaneerNote}using what you have at home (**${providedLabels}**), here are safe dishes you can prepare right now:\n\n${listText}\n\nTell me which one looks good, or ask for a quicker (<12m) option.`;

      return {
        assistantMessage: {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: intro,
          language: lang,
          timestamp: nowISO,
          safetyNotice: strictBundle.safetyAdvisory ?? undefined,
          recommendedRecipes: strictBundle.recommendations,
          actionChips: [
            {
              id: 'chip-food-page',
              label: lang === 'hinglish' ? 'Food Hub mein kholein' : 'Open in Food Hub',
              promptText: 'Open Food Hub',
              actionType: 'navigate_food',
            },
            {
              id: 'chip-faster',
              label: lang === 'hinglish' ? '12 min se jaldi banao' : 'Make it faster (<12m)',
              promptText: 'Give me something quicker under 12 minutes',
              actionType: 'ask_prompt',
            },
          ],
          pipelineTrace: {
            intent: understanding.intent,
            detectedLanguage: lang,
            constraintsApplied: [
              `Matched strictly to: ${providedLabels}`,
              mergedUnavailable.length > 0
                ? `Remembered unavailable: ${mergedUnavailable.join(', ')}`
                : 'No unavailable ingredient locks',
            ],
            safetyChecksPassed: [
              profile.safety.allergies.length > 0
                ? `Excluded allergens: ${profile.safety.allergies.join(', ')}`
                : 'Dietary & safety filters verified',
            ],
            provenanceNote:
              'Scored via Prototype Kitchen Recipe Estimate catalog + active pantry & safety constraints',
          },
        },
        updatedMemory: {
          ...memory,
          unavailableIngredients: mergedUnavailable,
          rejectedRecipeIds: mergedRejected,
          awaitingAvailableIngredients: false,
          awaitingRejectionReasonForRecipeId: null,
          awaitingMovementContext: false,
          lastSuggestedRecipeIds: strictBundle.recommendations.map((r) => r.recipe.id),
          lastSuggestedMealSlot: effectiveSlot,
          activeTopic: 'food',
          detectedLanguage: lang,
        },
        newlyUnavailableIngredients: understanding.unavailableIngredients,
        newlyAvailableIngredients,
        newlyRejectedRecipeIds: newlyRejectedIds,
      };
    }

    const closestBundle = recommendMeals(
      profile,
      {
        mealSlot: effectiveSlot,
        rejectedRecipeIds: mergedRejected,
        unavailableIngredients: mergedUnavailable,
        availableIngredients: understanding.positiveIngredients,
        maxPrepMins: maxPrep,
        budgetPriority,
        antiRepeatIds: memory.lastSuggestedRecipeIds,
        strictAvailabilityOnly: false,
      },
      state.mealsLogged,
      2
    );

    const hintMsg =
      closestBundle.recommendations.length > 0
        ? closestBundle.recommendations
            .map((rec) => {
              const missing = rec.missingIngredients
                .map((m) => getIngredientLabel(m).split(' / ')[0])
                .join(', ');
              return `• **${rec.recipe.name}** (just missing: ${missing})`;
            })
            .join('\n')
        : '';

    const fallbackContent =
      lang === 'hi'
        ? `अभी आपने जो बताया (**${providedLabels}**), उससे पूरी डिश बनाने के लिए बस एक बेसिक चीज़ (जैसे प्याज़-टमाटर, चावल या आटा) की ज़रूरत दिख रही है।\n\n${hintMsg}\n\nक्या आपके पास चावल, रोटी, या प्याज़-टमाटर उपलब्ध है?`
        : lang === 'hinglish'
          ? `Aapke paas abhi **${providedLabels}** hai — iske saath agar basic onion/tomato, rice ya roti bhi ghar par ho, toh ye options turant ban jayenge:\n\n${hintMsg}\n\nKya inmein se koi staple abhi kitchen mein hai?`
          : `With **${providedLabels}**, you're just one basic pantry staple away from a complete meal:\n\n${hintMsg}\n\nDo you also have onion/tomato, rice, or atta on hand?`;

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fallbackContent,
        language: lang,
        timestamp: nowISO,
        recommendedRecipes:
          closestBundle.recommendations.length > 0 ? closestBundle.recommendations : undefined,
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [
            `Strict pantry checked: ${providedLabels}`,
            `Excluded unavailable: ${mergedUnavailable.join(', ') || 'none'}`,
          ],
          safetyChecksPassed: ['Verified safety filters'],
          provenanceNote: 'Asked for missing pantry staple instead of guessing',
        },
      },
      updatedMemory: {
        ...memory,
        unavailableIngredients: mergedUnavailable,
        rejectedRecipeIds: mergedRejected,
        awaitingAvailableIngredients: true,
        awaitingRejectionReasonForRecipeId: null,
        activeTopic: 'food',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: understanding.unavailableIngredients,
      newlyAvailableIngredients,
      newlyRejectedRecipeIds: newlyRejectedIds,
    };
  }

  // Case N: Direct nutrition calculation (remaining protein / calories grounded in today's logs)
  if (understanding.intent === 'nutrition_calculation') {
    const loggedCountToday = mealsToday.length;
    const proteinMatches = recommendMeals(
      profile,
      {
        mealSlot: effectiveSlot,
        rejectedRecipeIds: mergedRejected,
        unavailableIngredients: mergedUnavailable,
        availableIngredients: profile.foodAvailability.availableIngredients,
        maxPrepMins: maxPrep,
        budgetPriority,
        antiRepeatIds: memory.lastSuggestedRecipeIds,
        strictAvailabilityOnly: false,
      },
      state.mealsLogged,
      2
    );

    const content =
      loggedCountToday === 0
        ? lang === 'hi'
          ? `आज आपने अभी तक कोई भोजन लॉग नहीं किया है, इसलिए अब तक **0g / ${targets.proteinTargetG}g प्रोटीन** और **0 / ${targets.calorieTarget} kcal** दर्ज हुए हैं (पूरे **${targets.proteinTargetG}g प्रोटीन** बाकी हैं)। Food Hub या यहीं चैट में पहला मील लॉग करें या बताएं घर पर क्या है।`
          : lang === 'hinglish'
            ? `Abhi aapne aaj ka koi meal log nahi kiya hai — isliye logged intake **0g / ${targets.proteinTargetG}g protein** aur **0 / ${targets.calorieTarget} kcal** hai (poore **${remainingProtein}g protein** aur **${remainingKcal} kcal** remaining hain).\n\nAgar abhi kuch khaya hai toh **Food Hub** mein log karein, ya batayein kitchen mein kya available hai taaki main high-protein safe meal suggest karoon.`
            : `You haven't logged any meals today yet, so your logged intake is **0g of ${targets.proteinTargetG}g protein** and **0 of ${targets.calorieTarget} kcal** (**${remainingProtein}g protein** and **${remainingKcal} kcal** remaining today).\n\nLog your first meal in **Food Hub**, or tell me what ingredients you have at home so I can help cover that gap.`
        : lang === 'hi'
          ? `आज के लॉग किए गए ${loggedCountToday} भोजन के आधार पर: आपने ~**${proteinConsumed}g प्रोटीन** (${remainingProtein}g शेष) और ~**${kcalConsumed} kcal** (${remainingKcal} kcal शेष) लिया है।`
          : lang === 'hinglish'
            ? `Aaj ke ${loggedCountToday} logged meal(s) ke hisaab se: aapne ~**${proteinConsumed}g / ${targets.proteinTargetG}g protein** liya hai — matlab **~${remainingProtein}g protein** aur **~${remainingKcal} kcal** remaining hain.${proteinMatches.recommendations.length > 0 && remainingProtein >= 12 ? `\n\nNext safe protein options:\n${proteinMatches.recommendations.map((r) => formatRecipeChoice(r, lang)).join('\n')}` : ''}`
            : `Based on your **${loggedCountToday} logged meal(s)** today: you've had **~${proteinConsumed}g of ${targets.proteinTargetG}g protein** (**~${remainingProtein}g protein** remaining) and **~${kcalConsumed} of ${targets.calorieTarget} kcal** (**~${remainingKcal} kcal** remaining).${proteinMatches.recommendations.length > 0 && remainingProtein >= 12 ? `\n\nHigh-protein profile-safe ideas:\n${proteinMatches.recommendations.map((r) => formatRecipeChoice(r, lang)).join('\n')}` : ''}`;

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        recommendedRecipes:
          loggedCountToday > 0 && remainingProtein >= 12
            ? proteinMatches.recommendations
            : undefined,
        actionChips: [
          {
            id: 'chip-food-log',
            label: lang === 'hinglish' ? 'Food Hub mein meal log karein' : 'Log meal in Food Hub',
            promptText: 'Open Food Hub',
            actionType: 'navigate_food',
          },
        ],
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [
            `Today meals logged: ${loggedCountToday}`,
            `Remaining protein: ${remainingProtein}g`,
            `Remaining kcal: ${remainingKcal}`,
          ],
          safetyChecksPassed: ['Computed strictly from AppState.mealsLogged & safety-adjusted targets'],
          provenanceNote: 'Computed from AppContext.mealsLogged (no fabricated intake)',
        },
      },
      updatedMemory: {
        ...memory,
        awaitingRejectionReasonForRecipeId: null,
        activeTopic: 'food',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: [],
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: [],
    };
  }

  // Case C: Rejection of previous meal ("I cannot eat that tonight" / "Something else")
  if (understanding.intent === 'reject_suggestion') {
    const altBundle = recommendMeals(
      profile,
      {
        mealSlot: effectiveSlot,
        rejectedRecipeIds: mergedRejected,
        unavailableIngredients: mergedUnavailable,
        availableIngredients: profile.foodAvailability.availableIngredients,
        maxPrepMins: maxPrep,
        budgetPriority,
        antiRepeatIds: memory.lastSuggestedRecipeIds,
        strictAvailabilityOnly: false,
      },
      state.mealsLogged,
      2
    );

    const safeExamples = buildSafeIngredientPromptExamples(profile);
    const altList = altBundle.recommendations
      .map((rec) => formatRecipeChoice(rec, lang))
      .join('\n');

    const content =
      altBundle.recommendations.length > 0
        ? lang === 'hi'
          ? `बिल्कुल ठीक, पिछला सुझाव हटा दिया है।\n\nक्या आप इनमें से कुछ बनाना चाहेंगे?\n\n${altList}\n\nया बताइए अभी घर पर क्या-क्या सामग्री है (${safeExamples}) ताकि मैं उसी से प्लान बनाऊँ।`
          : lang === 'hinglish'
            ? `Bilkul theek, maine woh option hata diya hai.\n\nAapke liye ye safe alternatives ready hain:\n\n${altList}\n\nAgar ghar par koi ingredient kam hai ya kuch alag banana ho, toh batayein kya-kya hai abhi (${safeExamples})?`
            : `Got it — I've dropped that suggestion from tonight's plan.\n\nHere are safe alternatives fitting your profile:\n\n${altList}\n\nOr tell me what ingredients you have at home right now (${safeExamples}) if you'd like me to build purely around those.`
        : lang === 'hinglish'
          ? `Maine woh hata diya. Batayein abhi kitchen mein kya-kya hai (${safeExamples}), main wahi se naya plan banata hoon.`
          : `I've cleared that option. Tell me what ingredients you have at home right now (${safeExamples}), and I'll generate fresh safe ideas.`;

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        safetyNotice: altBundle.safetyAdvisory ?? undefined,
        recommendedRecipes: altBundle.recommendations,
        actionChips: [
          {
            id: 'chip-tell-kitchen',
            label: lang === 'hinglish' ? 'Dal, Chawal & Sabzi hai' : 'Dal, Rice & Veggies at home',
            promptText: 'I have dal, rice, vegetables and tomato onion',
            actionType: 'ask_prompt',
          },
          {
            id: 'chip-food-view',
            label: lang === 'hinglish' ? 'Food Hub kholein' : 'Open Food Hub',
            promptText: 'Open Food Hub',
            actionType: 'navigate_food',
          },
        ],
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [
            `Rejected IDs remembered: ${mergedRejected.length}`,
            `Slot: ${effectiveSlot}`,
          ],
          safetyChecksPassed: ['Allergy, diet, & condition rules preserved'],
          provenanceNote: 'Re-scored alternatives via Prototype Kitchen Recommendation Engine',
        },
      },
      updatedMemory: {
        ...memory,
        rejectedRecipeIds: mergedRejected,
        unavailableIngredients: mergedUnavailable,
        lastSuggestedRecipeIds: altBundle.recommendations.map((r) => r.recipe.id),
        lastSuggestedMealSlot: effectiveSlot,
        awaitingAvailableIngredients: false,
        awaitingRejectionReasonForRecipeId: null,
        awaitingMovementContext: false,
        activeTopic: 'food',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: understanding.unavailableIngredients,
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: newlyRejectedIds,
      preferFaster: understanding.wantsFaster || undefined,
      preferCheaper: understanding.wantsCheaper || undefined,
    };
  }

  // Case D: Meal suggestion or food question
  if (understanding.intent === 'meal_suggestion') {
    const bundle = recommendMeals(
      profile,
      {
        mealSlot: effectiveSlot,
        rejectedRecipeIds: mergedRejected,
        unavailableIngredients: mergedUnavailable,
        availableIngredients: profile.foodAvailability.availableIngredients,
        maxPrepMins: maxPrep,
        budgetPriority,
        antiRepeatIds: memory.lastSuggestedRecipeIds,
        strictAvailabilityOnly: false,
      },
      state.mealsLogged,
      2
    );

    const listText = bundle.recommendations
      .map((rec) => formatRecipeChoice(rec, lang))
      .join('\n');

    const calorieContext =
      mealsToday.length > 0
        ? lang === 'hinglish'
          ? `Aaj abhi tak ~${kcalConsumed} kcal aur ${proteinConsumed}g protein log hua hai (${remainingKcal} kcal target baaki).`
          : lang === 'hi'
            ? `आज अभी तक ~${kcalConsumed} kcal और ${proteinConsumed}g प्रोटीन लॉग हुआ है (लगभग ${remainingKcal} kcal शेष)।`
            : `You've logged ~${kcalConsumed} kcal and ~${proteinConsumed}g protein today (~${remainingKcal} kcal remaining toward your ${targets.calorieTarget} kcal rhythm).`
        : lang === 'hinglish'
          ? `Aaj abhi koi meal log nahi hui hai — aapka daily target ~${targets.calorieTarget} kcal aur ${targets.proteinTargetG}g protein hai.`
          : lang === 'hi'
            ? `आज अभी तक कोई भोजन लॉग नहीं हुआ है — आपका दैनिक लक्ष्य ~${targets.calorieTarget} kcal और ${targets.proteinTargetG}g प्रोटीन है।`
            : `You haven't logged any meals yet today — your daily rhythm aims for ~${targets.calorieTarget} kcal and ${targets.proteinTargetG}g protein.`;

    const content =
      bundle.recommendations.length > 0
        ? lang === 'hi'
          ? `${calorieContext}\n\nआपके स्वाद और सुरक्षा नियमों के हिसाब से **${effectiveSlot}** के लिए विकल्प:\n\n${listText}\n\nअगर घर पर कोई सामग्री कम है, तो बस बताएं!`
          : lang === 'hinglish'
            ? `${calorieContext}\n\n**${effectiveSlot.toUpperCase()}** ke liye ye safe ghar-ke options aapke profile aur regional taste par fit baithte hain:\n\n${listText}\n\nAgar ghar par koi ingredient nahi hai ya taste badalna ho, toh bata dein.`
            : `${calorieContext}\n\nFor **${effectiveSlot}**, here are personalized options matching your taste and safety rules:\n\n${listText}\n\nIf an ingredient isn't available at home tonight or you want a swap, let me know what's in your kitchen.`
        : `Tell me what ingredients are currently in your kitchen so I only recommend safe dishes you can actually prepare today.`;

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        safetyNotice: bundle.safetyAdvisory ?? undefined,
        recommendedRecipes: bundle.recommendations,
        actionChips: [
          {
            id: 'chip-cant-eat',
            label: lang === 'hinglish' ? 'Ye nahi banana / badlo' : "Can't eat this / swap",
            promptText: 'I cannot eat that tonight',
            actionType: 'ask_prompt',
          },
          {
            id: 'chip-food-hub',
            label: lang === 'hinglish' ? 'Food Hub kholein' : 'Open in Food Hub',
            promptText: 'Open Food Hub',
            actionType: 'navigate_food',
          },
        ],
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [
            `Slot: ${effectiveSlot}`,
            `Max prep: ${maxPrep}m`,
            `Remaining budget: ${remainingKcal} kcal, ${remainingProtein}g protein`,
          ],
          safetyChecksPassed: safetyEval.activeRules.length
            ? safetyEval.activeRules.map((r) => r.title)
            : ['Dietary & allergen rules verified'],
          provenanceNote:
            'Macros shown are Prototype Kitchen Recipe Estimates adjusted to standard Indian home portions',
        },
      },
      updatedMemory: {
        ...memory,
        rejectedRecipeIds: mergedRejected,
        unavailableIngredients: mergedUnavailable,
        lastSuggestedRecipeIds: bundle.recommendations.map((r) => r.recipe.id),
        lastSuggestedMealSlot: effectiveSlot,
        awaitingAvailableIngredients: false,
        awaitingMovementContext: false,
        activeTopic: 'food',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: understanding.unavailableIngredients,
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: newlyRejectedIds,
      preferFaster: understanding.wantsFaster || undefined,
      preferCheaper: understanding.wantsCheaper || undefined,
    };
  }

  // Case E1: Missed Gym / Home Adaptation Follow-Up (e.g. "Aaj gym nahi ja sakti.")
  if (understanding.intent === 'missed_gym_adaptation') {
    const workoutsToday = state.workoutsLogged.filter((w) => w.dateISO === todayISO);
    const totalRepsToday = workoutsToday.reduce((sum, w) => sum + w.repsCompleted, 0);
    const expLevel = profile.exercisePreferences?.experienceLevel ?? 'beginner';
    const safetyCaveat = safetyEval.medicalReferralRequired
      ? lang === 'hinglish'
        ? ' (Aapki health screening ko dhyan mein rakhte hue hum gentle pace hi rakhenge.)'
        : ' (Keeping intensity gentle in line with your health precautions.)'
      : '';

    const content =
      lang === 'hi'
        ? `कोई बात नहीं ${profile.basic.name}! अगर आज जिम नहीं जा सकते तो घर पर हल्की या संतुलित मूवमेंट बिल्कुल काफी है।${safetyCaveat}\n\nआज आपके पास घर पर लगभग कितना समय है (10, 15 या 20 मिनट) और क्या सिर्फ बॉडीवेट या मैट/डंबल उपलब्ध हैं? बताएं तो मैं सही होम रूटीन सेट कर दूँ।`
        : lang === 'hinglish'
          ? `Koi baat nahi ${profile.basic.name}! Aaj gym skip karna bilkul theek hai — consistency ghar par 10–15 min gentle movement se bhi maintain rehti hai.${safetyCaveat}\n\nAbhi tak aaj **${totalRepsToday} reps** log hain. Ghar par aapke paas lagbhag kitna time hai (**10, 15 ya 20 min**) aur kya sirf **bodyweight** karna hai ya **mat / dumbbells** paas mein hain? Batayein toh main aapke ${expLevel} level ke hisaab se safe home routine bana deta hoon.`
          : `No problem at all, ${profile.basic.name} — skipping the gym today shouldn't break your rhythm.${safetyCaveat}\n\nYou have **${totalRepsToday} reps** logged today. How much time do you have at home (**10, 15, or 20 minutes**) and do you want **bodyweight only** or light equipment (mat / dumbbells)? Tell me and I'll tailor a safe home routine for your ${expLevel} level.`;

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        actionChips: [
          {
            id: 'chip-home-15-bw',
            label:
              lang === 'hinglish'
                ? '15 min sirf Bodyweight'
                : lang === 'hi'
                  ? '15 मिनट बॉडीवेट'
                  : '15 min Bodyweight only',
            promptText: '15 min bodyweight only at home',
            actionType: 'ask_prompt',
          },
          {
            id: 'chip-home-20-mat',
            label:
              lang === 'hinglish'
                ? '20 min Mat / Light Stretch'
                : lang === 'hi'
                  ? '20 मिनट मैट रूटीन'
                  : '20 min Mat routine',
            promptText: '20 min on a mat, light strength',
            actionType: 'ask_prompt',
          },
          {
            id: 'chip-open-move',
            label: lang === 'hinglish' ? 'Move Studio kholein' : 'Open Move Studio',
            promptText: 'Open Move Studio',
            actionType: 'navigate_move',
          },
        ],
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [
            'Gym venue unavailable today',
            `Experience level: ${expLevel}`,
            `Today logged reps: ${totalRepsToday}`,
          ],
          safetyChecksPassed: ['Adapted before prescribing volume; checking time & equipment'],
          provenanceNote: 'Contextual exercise adaptation from Profile + Workout Logs',
        },
      },
      updatedMemory: {
        ...memory,
        awaitingMovementContext: true,
        awaitingAvailableIngredients: false,
        unavailableMovementVenue: 'gym',
        activeTopic: 'move',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: [],
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: [],
    };
  }

  // Case E2: Follow-up when user supplies home time / equipment after missing gym
  if (understanding.intent === 'provide_movement_context') {
    const mins = understanding.mentionedMinutes ?? memory.lastMovementMinutes ?? 15;
    const expLevel = profile.exercisePreferences?.experienceLevel ?? 'beginner';
    const equip = understanding.mentionedEquipment ?? 'none';
    const setsNote =
      expLevel === 'beginner' || safetyEval.medicalReferralRequired
        ? mins <= 10
          ? '2 calm rounds × 8 controlled reps (30–40s rest)'
          : '2 calm rounds × 8–10 slow reps (45s rest)'
        : mins <= 10
          ? '2 crisp bodyweight circuits × 10 reps (30s rest)'
          : mins >= 20
            ? '3 steady rounds × 10–12 reps (40s rest)'
            : '2 brisk rounds × 10–12 controlled reps';

    const equipLine =
      equip === 'dumbbells'
        ? 'Use light dumbbells gently on squats or keep hands free if anything feels tight.'
        : 'Zero equipment needed — completely safe bodyweight-only routine on a clear floor spot.';

    const equipHinglish =
      equip === 'dumbbells'
        ? 'Light dumbbells sirf comfortable lagne par hi add karein.'
        : 'Kisi bhi gym weights ya equipment ki zaroorat nahi hai — yeh pure bodyweight safe routine hai.';

    const content =
      lang === 'hi'
        ? `बढ़िया! **${mins} मिनट** का बॉडीवेट होम रूटीन तैयार है (${setsNote}):\n• **बॉडीवेट स्क्वाट्स** — धीमी 2-सेकंड नीचे गति, घुटने पंजों की सीध में\n• **वॉल / इनक्लाइन पुश-अप्स** — कोर हल्का स्थिर, कोहनियाँ ~45° पर\n• **ग्लूट ब्रिज** — एड़ी से उठें और कमर को आराम से सीधा रखें\n\n${equipLine} मूव स्टूडियो खोलकर किसी भी एक्सरसाइज़ का 3D फॉर्म देख सकते हैं।`
        : lang === 'hinglish'
          ? `Perfect! Aapke **${mins} min** no-equipment home session ke liye ye safe bodyweight routine fit rahega (**${setsNote}**):\n• **Controlled Bodyweight Squats** — 2 sec slow descent, chest lifted\n• **Wall ya Incline Push-ups** — elbows ~45°, painless range\n• **Glute Bridges** — heel push aur gentle core stability\n\n${equipHinglish} Neeche se **Move Studio** kholkar 3D biomechanical tempo follow karein aur session log karein!`
          : `Perfect — here is a focused **${mins}-minute** bodyweight home plan built for your ${expLevel} cadence (**${setsNote}**):\n• **Controlled Bodyweight Squats** — 2s lowering count, knees aligned over toes\n• **Wall / Incline Push-ups** — elbows ~45°, spine neutral\n• **Glute Bridges** — drive softly through heels, pause 1s at top\n\n${equipLine} Open **Move Studio** anytime to follow the 3D kinematic tempo and save your set.`;

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        actionChips: [
          {
            id: 'chip-go-move',
            label: lang === 'hinglish' ? 'Move Studio mein start karein' : 'Start in Move Studio',
            promptText: 'Open Move Studio',
            actionType: 'navigate_move',
          },
        ],
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [
            `Home adaptation: ${mins} mins`,
            `Equipment: ${equip}`,
            `Experience: ${expLevel}`,
          ],
          safetyChecksPassed: ['Respects safe range & medical/recovery guardrails'],
          provenanceNote: 'Guided home routine synced with Move Studio 3D exercises',
        },
      },
      updatedMemory: {
        ...memory,
        awaitingMovementContext: false,
        awaitingRejectionReasonForRecipeId: null,
        lastMovementMinutes: mins,
        activeTopic: 'move',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: [],
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: [],
    };
  }

  // Case E3: General exercise coaching
  if (understanding.intent === 'exercise_coaching') {
    const workoutsToday = state.workoutsLogged.filter((w) => w.dateISO === todayISO);
    const totalRepsToday = workoutsToday.reduce((sum, w) => sum + w.repsCompleted, 0);

    const content =
      lang === 'hi'
        ? `आज आपने **${totalRepsToday} रेप्स** पूरे किए हैं (लक्ष्य: ~${targets.dailyMovementMinutes} मिनट मूवमेंट)।\n\nमूव स्टूडियो में आप 3D गाइडेड मॉडल के साथ **बॉडीवेट स्क्वाट, पुश-अप, या ग्लूट ब्रिज** कर सकते हैं:\n• घुटनों को पंजों की दिशा में रखें, रीढ़ सीधी रखें\n• नीचे जाते समय 2 सेकंड कंट्रोल और ऊपर आते समय साँस छोड़ें`
        : lang === 'hinglish'
          ? `Aaj aapne abhi tak **${totalRepsToday} reps** log kiye hain (daily movement rhythm: ~${targets.dailyMovementMinutes} min).\n\nMove Studio mein 3D anatomical tempo ke saath **Bodyweight Squat, Incline/Knee Push-up, ya Glute Bridge** try karein:\n• Chest up aur core gently tight rakhein\n• 2 second slow descent, aur upar aate waqt exhale karein — clean form speed se zyada important hai.`
          : `Today you have **${totalRepsToday} reps** logged so far toward your ~${targets.dailyMovementMinutes}-minute daily movement cadence.\n\nTry a focused guided set in **Move Studio** with our 3D kinematic guide (Squats, Push-ups, or Glute Bridges):\n• Keep your chest lifted and ribs stacked over pelvis\n• Lower for a steady 2-second count rather than rushing reps.`;

    return {
      assistantMessage: {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content,
        language: lang,
        timestamp: nowISO,
        actionChips: [
          {
            id: 'chip-move-studio',
            label: lang === 'hinglish' ? '3D Move Studio kholein' : 'Open 3D Move Studio',
            promptText: 'Open Move Studio',
            actionType: 'navigate_move',
          },
        ],
        pipelineTrace: {
          intent: understanding.intent,
          detectedLanguage: lang,
          constraintsApplied: [`Goal: ${profile.goals.primaryGoal}`, `Logged reps today: ${totalRepsToday}`],
          safetyChecksPassed: ['Form-first non-overexertion coaching'],
          provenanceNote: 'Live Workout Logs from AppContext',
        },
      },
      updatedMemory: {
        ...memory,
        awaitingMovementContext: false,
        activeTopic: 'move',
        detectedLanguage: lang,
      },
      newlyUnavailableIngredients: [],
      newlyAvailableIngredients: null,
      newlyRejectedRecipeIds: [],
    };
  }

  // Case F: Progress reflection / general check-in grounded in real logs
  const totalMealsCount = state.mealsLogged.length;
  const totalWorkoutsCount = state.workoutsLogged.length;
  const isPureGreeting = /^(hi|hello|hey|namaste|pranam|hola|good\s*(morning|afternoon|evening))\b/i.test(
    userText.trim()
  );

  let content = '';
  if (understanding.intent === 'progress_checkin') {
    if (totalMealsCount === 0 && totalWorkoutsCount === 0) {
      content =
        lang === 'hinglish'
          ? `Aapka profile ready hai, ${profile.basic.name}! Abhi aapne pehli meal ya movement session log nahi ki hai — aaj bas **ek meal** ya **5 minute ka Move session** complete karein, phir main aapke real patterns dikhana shuru karunga.`
          : lang === 'hi'
            ? `आपकी प्रोफ़ाइल तैयार है, ${profile.basic.name}! अभी तक कोई भोजन या एक्सरसाइज़ लॉग नहीं हुई है — आज एक छोटा मील या 5 मिनट का सत्र पूरा करें ताकि मैं वास्तविक पैटर्न दिखा सकूँ।`
            : `Your profile is ready, ${profile.basic.name}! You haven't logged a meal or workout yet — log just **one meal** or complete **one short Move session** today so I can start reflecting real trends instead of guesses.`;
    } else {
      content =
        lang === 'hinglish'
          ? `Aapka live summary, ${profile.basic.name}: abhi tak **${totalMealsCount} meals** aur **${totalWorkoutsCount} movement sessions** record hue hain. Aaj ~${kcalConsumed}/${targets.calorieTarget} kcal aur ~${proteinConsumed}/${targets.proteinTargetG}g protein par hain.`
          : `Here's where things stand right now, ${profile.basic.name}: you've recorded **${totalMealsCount} meal(s)** and **${totalWorkoutsCount} movement session(s)**. Today you're at ~${kcalConsumed} of ${targets.calorieTarget} kcal and ~${proteinConsumed}g of ${targets.proteinTargetG}g protein.`;
    }
  } else if (isPureGreeting) {
    content =
      lang === 'hi'
        ? `नमस्ते ${profile.basic.name}! मैं आपका पर्सनल वेलनेस साथी हूँ। आज का आपका लक्ष्य ~${targets.calorieTarget} kcal और ~${targets.dailyMovementMinutes} मिनट गतिविधि है। आप मुझसे भोजन सलाह, प्लेट स्कैन या एक्सरसाइज़ के बारे में पूछ सकते हैं।`
        : lang === 'hinglish'
          ? `Main yahan hoon, ${profile.basic.name}. Aaj ka rhythm ~${targets.calorieTarget} kcal (${targets.proteinTargetG}g protein) aur ~${targets.dailyMovementMinutes} min movement hai. Batayein, aaj kis cheez mein help chahiye — dinner ideas, food logging ya workout?`
          : `I'm right here with you, ${profile.basic.name}. Today's rhythm is ~${targets.calorieTarget} kcal (${targets.proteinTargetG}g protein) and ~${targets.dailyMovementMinutes} min movement. How can I guide you today?`;
  } else {
    // Dynamic real-time guidance based on actual intake
    if (lang === 'hi') {
      content =
        `${profile.basic.name}, आज आपने **~${kcalConsumed} / ${targets.calorieTarget} kcal** ग्रहण किए हैं (~${remainingKcal} kcal शेष) और **~${proteinConsumed} / ${targets.proteinTargetG}g प्रोटीन** लिया है।\n\n` +
        (remainingKcal > 100
          ? `शेष **${remainingKcal} kcal** के लिए एक हल्का और सुपाच्य भोजन चुनें (जैसे मूंग दाल खिचड़ी, तोरई/लौकी की सब्ज़ी + फुल्का, या हल्का वेज सूप)। `
          : `आपका दैनिक कैलोरी बजट लगभग पूर्ण है, अतः इस समय केवल पानी या हर्बल चाय लें। `) +
        (proteinConsumed >= targets.proteinTargetG
          ? `\n\n✓ आपका प्रोटीन लक्ष्य पूर्ण हो चुका है, इसलिए अतिरिक्त प्रोटीन सप्लीमेंट या भारी भोजन से बचें।`
          : `\n\nथोड़ा प्रोटीन जोड़ने के लिए भुना चना या थोड़ा दही ले सकते हैं।`) +
        `\n\nबताएं, आप क्या खाना पसंद करेंगे?`;
    } else if (lang === 'hinglish') {
      content =
        `${profile.basic.name}, aaj aapne **~${kcalConsumed} / ${targets.calorieTarget} kcal** consume kiye hain (~${remainingKcal} kcal remaining) aur **~${proteinConsumed} / ${targets.proteinTargetG}g protein** record hua hai.\n\n` +
        (remainingKcal > 100
          ? `Aapke bache hue **${remainingKcal} kcal** ke liye ek light aur balanced Indian meal lijiye (jaise Moong Dal Khichdi, Lauki Sabzi + Phulke, ya Veg Soup). `
          : `Aapka aaj ka calorie budget lagbhag pura ho chuka hai, isliye abhi bas paani/herbal tea lijiye aur heavy snacks avoid karein. `) +
        (proteinConsumed >= targets.proteinTargetG
          ? `\n\n✓ **Protein Target Achieved:** Aapka protein goal complete ho chuka hai (${proteinConsumed}g / ${targets.proteinTargetG}g), isliye abhi extra protein shake ya heavy paneer lene ki zaroorat nahi hai.`
          : `\n\nThoda protein add karne ke liye roasted chana ya thoda dahi add kar sakte hain.`) +
        `\n\nBataiye kitchen mein kya available hai ya aap kya banana chahenge?`;
    } else {
      content =
        `${profile.basic.name}, today you've logged **~${kcalConsumed} of ${targets.calorieTarget} kcal** (~${remainingKcal} kcal remaining) and **~${proteinConsumed} of ${targets.proteinTargetG}g protein**.\n\n` +
        (remainingKcal > 100
          ? `For your remaining **${remainingKcal} kcal**, a light and balanced Indian meal fits best (such as Moong Dal Khichdi, Lauki Sabzi with Phulkas, or a warm vegetable soup). `
          : `Your daily calorie budget is essentially complete; opt for water or herbal tea and avoid heavy night snacks. `) +
        (proteinConsumed >= targets.proteinTargetG
          ? `\n\n✓ **Protein Target Achieved:** You have met your protein goal (${proteinConsumed}g / ${targets.proteinTargetG}g), so extra protein shakes or heavy dishes are not needed tonight.`
          : `\n\nTo round out protein, a small serving of roasted chana or yogurt works well.`) +
        `\n\nLet me know what you have at home or what you'd like to prepare!`;
    }
  }

  return {
    assistantMessage: {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content,
      language: lang,
      timestamp: nowISO,
      actionChips: [
        {
          id: 'chip-ask-dinner',
          label: lang === 'hinglish' ? 'Next meal suggest karo' : 'Suggest my next meal',
          promptText: 'What should I eat for my next meal?',
          actionType: 'ask_prompt',
        },
        {
          id: 'chip-ask-move',
          label: lang === 'hinglish' ? 'Aaj gym nahi ja sakti' : "Can't go to gym today",
          promptText:
            lang === 'hinglish' ? 'Aaj gym nahi ja sakti.' : "I can't go to the gym today.",
          actionType: 'ask_prompt',
        },
      ],
      pipelineTrace: {
        intent: understanding.intent,
        detectedLanguage: lang,
        constraintsApplied: [`Real logs: ${totalMealsCount} meals, ${totalWorkoutsCount} workouts`],
        safetyChecksPassed: ['Profile context grounded'],
        provenanceNote: 'Direct AppContext state',
      },
    },
    updatedMemory: {
      ...memory,
      awaitingMovementContext: false,
      activeTopic: understanding.intent === 'progress_checkin' ? 'progress' : 'general',
      detectedLanguage: lang,
    },
    newlyUnavailableIngredients: [],
    newlyAvailableIngredients: null,
    newlyRejectedRecipeIds: [],
  };
}
