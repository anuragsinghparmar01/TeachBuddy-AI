import type { AgeGroup, QuizQuestion, ProblemSolution, StudyNote, StudySchedule, VoiceGender, IndianLanguageCode, ModuleApiKeys } from '../types';
import { INDIAN_LANGUAGES, DEFAULT_MODULE_API_KEYS } from '../types';

interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  apiKey?: string;
  moduleKey?: keyof ModuleApiKeys;
  model?: string;
}

export function cleanApiKey(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/^["'`]|["'`]$/g, '')
    .trim();
}

export function getStoredMasterApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    const directGemini = cleanApiKey(localStorage.getItem('teachbuddy_gemini_key'));
    if (directGemini) return directGemini;
    const master = cleanApiKey(localStorage.getItem('teachbuddy_master_key'));
    if (master) return master;
    const legacyKey = cleanApiKey(localStorage.getItem('teachbuddy_api_key'));
    if (legacyKey) return legacyKey;
  } catch {}
  return '';
}

export function getModuleApiKeys(): ModuleApiKeys {
  if (typeof window === 'undefined') return { ...DEFAULT_MODULE_API_KEYS };
  const masterKey = getStoredMasterApiKey();
  const baseDefaults: ModuleApiKeys = {
    explainKey: masterKey,
    notesKey: masterKey,
    voiceKey: masterKey,
    solverKey: masterKey,
    quizKey: masterKey,
    generalKey: masterKey,
  };

  try {
    const saved = localStorage.getItem('teachbuddy_module_keys');
    if (saved) {
      const parsed = JSON.parse(saved);
      const cleaned: Partial<ModuleApiKeys> = {};
      Object.keys(DEFAULT_MODULE_API_KEYS).forEach((k) => {
        const key = k as keyof ModuleApiKeys;
        const val = cleanApiKey(parsed[key]);
        cleaned[key] = val || masterKey;
      });
      return { ...baseDefaults, ...cleaned };
    }
  } catch {}
  return baseDefaults;
}

export function saveModuleApiKey(moduleName: keyof ModuleApiKeys, key: string) {
  const cleaned = cleanApiKey(key);
  const current = getModuleApiKeys();
  current[moduleName] = cleaned;
  localStorage.setItem('teachbuddy_module_keys', JSON.stringify(current));
  if (cleaned && (moduleName === 'generalKey' || !getStoredMasterApiKey())) {
    localStorage.setItem('teachbuddy_gemini_key', cleaned);
    localStorage.setItem('teachbuddy_master_key', cleaned);
  }
}

export function setMasterApiKey(key: string) {
  const cleaned = cleanApiKey(key);
  if (cleaned) {
    localStorage.setItem('teachbuddy_gemini_key', cleaned);
    localStorage.setItem('teachbuddy_master_key', cleaned);
  } else {
    localStorage.removeItem('teachbuddy_gemini_key');
    localStorage.removeItem('teachbuddy_master_key');
  }

  const current = getModuleApiKeys();
  (Object.keys(current) as (keyof ModuleApiKeys)[]).forEach((mod) => {
    current[mod] = cleaned;
  });
  localStorage.setItem('teachbuddy_module_keys', JSON.stringify(current));
}

export function resetAllModuleApiKeys(): ModuleApiKeys {
  localStorage.removeItem('teachbuddy_module_keys');
  localStorage.removeItem('teachbuddy_gemini_key');
  localStorage.removeItem('teachbuddy_master_key');
  return { ...DEFAULT_MODULE_API_KEYS };
}

export function resolveEffectiveApiKey(options: GenerateOptions): string {
  // 1. Explicit in options
  const explicit = cleanApiKey(options.apiKey);
  if (explicit) return explicit;

  // 2. Module-specific key
  const moduleKeys = getModuleApiKeys();
  if (options.moduleKey) {
    const modKey = cleanApiKey(moduleKeys[options.moduleKey]);
    if (modKey) return modKey;
  }

  // 3. General module key
  const generalKey = cleanApiKey(moduleKeys.generalKey);
  if (generalKey) return generalKey;

  // 4. Master key from storage
  const master = getStoredMasterApiKey();
  if (master) return master;

  return '';
}

// Extract JSON safely from Gemini / Groq responses
function extractJson<T = any>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from Live AI API.');
  }

  // Remove markdown code fences like ```json or ```
  let cleaned = rawText
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```$/m, '')
    .trim();

  // If there's surrounding text, find the outermost { ... } or [ ... ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIndex = -1;
  let isArray = false;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    isArray = false;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    isArray = true;
  }

  if (startIndex !== -1) {
    const endChar = isArray ? ']' : '}';
    const lastIndex = cleaned.lastIndexOf(endChar);
    if (lastIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, lastIndex + 1);
    }
  }

  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned) as T;
  } catch (initialErr) {
    // Attempt sanitizing raw unescaped newlines in string values
    try {
      const sanitized = cleaned.replace(/"((?:\\.|[^"\\])*)"/gs, (_, inner) => {
        return '"' + inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"';
      });
      return JSON.parse(sanitized) as T;
    } catch {
      console.error('JSON Parse Error on Live AI response:', initialErr, '\nRaw text:\n', rawText);
      throw new Error(`Failed to parse structured response from Live AI API. Please try asking again.`);
    }
  }
}

// Direct browser-level Gemini REST fallback in case /api/ai/generate is unreachable
async function directGeminiRestCall(apiKey: string, prompt: string, systemInstruction?: string, temperature?: number): Promise<string> {
  const cleanedKey = cleanApiKey(apiKey);
  if (!cleanedKey) throw new Error('Cannot make direct AI call without an API key.');

  const models = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanedKey}`;
      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: temperature ?? 0.5,
        },
      };
      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === 'string') {
        return text;
      }
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('Direct Gemini API call failed.');
}

// Low-level caller to backend /api/ai/generate (Live Gemini / Groq) with zero-404 resilience
async function callAiBackend(options: GenerateOptions): Promise<string> {
  const selectedKey = resolveEffectiveApiKey(options);

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: options.prompt,
        systemInstruction: options.systemInstruction,
        temperature: options.temperature ?? 0.5,
        apiKey: selectedKey || undefined,
        model: options.model,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.text && typeof data.text === 'string') {
      return data.text;
    }

    // If server returned an error but we have a client key, fallback to direct Gemini call
    if (selectedKey && !selectedKey.startsWith('gsk_')) {
      try {
        return await directGeminiRestCall(selectedKey, options.prompt, options.systemInstruction, options.temperature);
      } catch (directErr: any) {
        console.warn('Direct Gemini fallback failed:', directErr);
      }
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (res.status === 404 || res.status === 502) {
      throw new Error('TeachBuddy AI service is connecting. If this persists, please configure your Gemini API key in Settings.');
    }

    throw new Error(`Server responded with status ${res.status}`);
  } catch (networkErr: any) {
    // Attempt direct call if network failed or 404 occurred and client key is present
    if (selectedKey && !selectedKey.startsWith('gsk_')) {
      try {
        return await directGeminiRestCall(selectedKey, options.prompt, options.systemInstruction, options.temperature);
      } catch {}
    }

    const msg = networkErr?.message || '';
    if (msg.includes('404') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      throw new Error('TeachBuddy AI is active. Please add your Gemini API Key in Settings to connect your personal AI tutor.');
    }
    throw networkErr;
  }
}

export const aiService = {
  // Get and set module API keys
  getModuleApiKeys,
  saveModuleApiKey,
  resetAllModuleApiKeys,

  // Set legacy custom Gemini Live API Key
  setCustomApiKey(key: string) {
    if (key && key.trim()) {
      saveModuleApiKey('generalKey', key.trim());
    }
  },

  getCustomApiKey(): string {
    return getModuleApiKeys().generalKey;
  },

  // Test live API key connection
  async testLiveApiKey(customKey?: string): Promise<{ ok: boolean; provider?: string; model?: string; reply?: string; error?: string }> {
    try {
      const key = customKey || this.getCustomApiKey();
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key || undefined }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network connection failed' };
    }
  },

  // 1. TEACH ME ANYTHING & HOW-TO (Live API Key Only)
  async teachTopic(
    topic: string, 
    ageGroup: AgeGroup = 'high_school', 
    institution: string = 'School', 
    question?: string,
    languageCode: IndianLanguageCode = 'en-US',
    subject?: string
  ) {
    const langObj = INDIAN_LANGUAGES.find(l => l.code === languageCode) || INDIAN_LANGUAGES[0];
    const prompt = `You are TeachBuddy AI, an expert academic tutor powered by Gemini Live.
Topic: "${topic}"
${subject ? `Subject: "${subject}"` : ''}
Learner Stage: ${ageGroup} (Institution: ${institution})
Target Language: ${langObj.name} (${langObj.nativeName})
${question ? `Specific Question: "${question}"` : ''}

Provide a 100% factually accurate, structured, and deep pedagogical explanation in ${langObj.name}.
Include:
1. Clear conceptual explanation with an intuitive real-world analogy.
2. Step-by-step practical "How-To" breakdown (how to solve or apply this concept).
3. Core formulas, scientific laws, or mathematical rules with LaTeX/notation if applicable.
4. An expert exam tip or memory mnemonic.
5. Quick concept check question with its answer.

Output strictly valid JSON (no markdown formatting outside the JSON):
{
  "title": "${topic}",
  "analogy": "A relatable real-life analogy",
  "explanation": "Comprehensive, crystal-clear explanation structured in clear paragraphs",
  "howToSteps": ["Step 1...", "Step 2...", "Step 3..."],
  "rulesOrFormulas": ["Rule or Formula 1...", "Rule or Formula 2..."],
  "proTip": "Pro exam tip or mnemonic",
  "quickCheck": {
    "question": "Concept check question",
    "answer": "Accurate answer explanation"
  }
}`;

    const raw = await callAiBackend({
      prompt,
      systemInstruction: 'You are TeachBuddy AI. Output valid JSON only without enclosing markdown or extra commentary.',
      temperature: 0.5,
      moduleKey: 'explainKey',
    });

    return extractJson(raw);
  },

  // 2. QUIZZES PER TOPIC AND CHAPTER (Live API Key Only)
  async generateQuiz(
    topic: string, 
    chapter: string = 'General', 
    difficulty: string = 'Medium', 
    count: number = 5,
    languageCode: IndianLanguageCode = 'en-US'
  ): Promise<QuizQuestion[]> {
    const langObj = INDIAN_LANGUAGES.find(l => l.code === languageCode) || INDIAN_LANGUAGES[0];
    const prompt = `Generate an accurate, curriculum-grade ${count}-question multiple choice quiz on:
Topic: "${topic}"
Chapter: "${chapter}"
Difficulty: ${difficulty}
Language: ${langObj.name} (${langObj.nativeName})

Ensure 100% factual accuracy. All 4 options must be plausible and distinct. Include detailed explanations for the correct answer.
Output strictly a valid JSON array of objects:
[
  {
    "id": "q1",
    "question": "Clear question text in ${langObj.name}?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why this answer is correct and why the others are incorrect.",
    "hint": "Insightful hint without directly giving the answer away."
  }
]`;

    const raw = await callAiBackend({
      prompt,
      systemInstruction: 'You are an academic test designer for TeachBuddy AI. Output strictly a valid JSON array.',
      temperature: 0.4,
      moduleKey: 'quizKey',
    });

    const parsed = extractJson<QuizQuestion[]>(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Live Gemini API returned invalid quiz format. Please retry.');
    }

    return parsed.map((q, idx) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${idx}`,
    }));
  },

  // 3. UNIVERSAL PROBLEM SOLVER (Live API Key Only)
  async solveProblem(
    problemText: string, 
    subject: string = 'General', 
    ageGroup: AgeGroup = 'high_school',
    languageCode: IndianLanguageCode = 'en-US'
  ): Promise<ProblemSolution> {
    const langObj = INDIAN_LANGUAGES.find(l => l.code === languageCode) || INDIAN_LANGUAGES[0];
    const prompt = `Solve this academic problem step-by-step with 100% mathematical and scientific accuracy:
Subject: ${subject}
Level: ${ageGroup}
Language: ${langObj.name} (${langObj.nativeName})
Problem: "${problemText}"

Requirements:
- Extract all given parameters, constants, and target unknowns.
- State all governing principles, theorems, and formulas.
- Provide a clear step-by-step derivation with exact intermediate calculations.
- Conclude with the verified final answer including appropriate units.
- Add pro tips for exams and common traps to avoid.

Output strictly valid JSON:
{
  "subject": "${subject}",
  "difficulty": "Medium",
  "givenData": ["Given 1", "Given 2"],
  "conceptsUsed": ["Theorem/Formula 1", "Concept 2"],
  "stepByStep": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "explanation": "Detailed explanation of what is calculated and why",
      "formulaOrCode": "Exact formula or calculation"
    }
  ],
  "finalAnswer": "Precise final result with units and conclusion",
  "proTips": ["Speed tip or shortcut"],
  "commonMistakesToAvoid": ["Common student mistake to avoid"]
}`;

    const raw = await callAiBackend({
      prompt,
      systemInstruction: 'You are an expert academic problem solver. Output strictly valid JSON.',
      temperature: 0.3,
      moduleKey: 'solverKey',
    });

    const parsed = extractJson<any>(raw);
    return {
      id: `sol_${Date.now()}`,
      problemText,
      timestamp: new Date().toISOString(),
      ...parsed,
    };
  },

  // 4. NOTES FOR PER TOPIC, CHAPTER OR UNIT (Live API Key Only)
  async generateNotes(
    topic: string, 
    chapter: string, 
    unit: string = 'Unit 1', 
    subject: string = 'Science', 
    ageGroup: AgeGroup = 'high_school',
    languageCode: IndianLanguageCode = 'en-US'
  ): Promise<StudyNote> {
    const langObj = INDIAN_LANGUAGES.find(l => l.code === languageCode) || INDIAN_LANGUAGES[0];
    const prompt = `Create comprehensive, high-yield academic study revision notes for:
Subject: ${subject}
Unit: ${unit}
Chapter: ${chapter}
Topic: ${topic}
Target Audience: ${ageGroup}
Language: ${langObj.name} (${langObj.nativeName})

Ensure 100% factual accuracy and high academic rigor.
Output strictly valid JSON:
{
  "summary": "High-yield executive summary and core concept definition",
  "bulletPoints": ["Core concept point 1", "Core concept point 2", "Important law or experiment"],
  "formulasAndKeyTerms": [
    {"term": "Term or Symbol", "definition": "Exact definition or formula"}
  ],
  "mindmapOutline": [
    {"main": "Main Pillar", "subtopics": ["Sub-concept 1", "Sub-concept 2"]}
  ],
  "practiceQuestions": ["High-yield exam question 1", "High-yield exam question 2"],
  "tags": ["${subject}", "${chapter}", "${topic}"]
}`;

    const raw = await callAiBackend({
      prompt,
      systemInstruction: 'You are a master syllabus author. Output strictly valid JSON without extra text.',
      temperature: 0.4,
      moduleKey: 'notesKey',
    });

    const parsed = extractJson<any>(raw);
    return {
      id: `note_${Date.now()}`,
      topic,
      chapter,
      unit,
      subject,
      ageGroup,
      createdAt: new Date().toISOString(),
      ...parsed,
    };
  },

  // 5. PERSONALIZED STUDY SCHEDULE (Live API Key Only)
  async generateSchedule(
    targetGoal: string, 
    hoursPerDay: number = 3, 
    totalDays: number = 7, 
    examDate?: string
  ): Promise<StudySchedule> {
    const prompt = `Create an optimized, realistic day-by-day study schedule for:
Goal: "${targetGoal}"
Daily Study Commitment: ${hoursPerDay} hours per day
Duration: ${totalDays} days
${examDate ? `Target Exam/Deadline: ${examDate}` : ''}

Balance deep conceptual study, quiz drills, revision notes, and problem-solving sessions.
Output strictly valid JSON:
{
  "title": "Strategic Study Plan: ${targetGoal}",
  "tasks": [
    {
      "day": "Day 1",
      "timeSlot": "05:00 PM - 06:00 PM",
      "subject": "Subject Name",
      "topic": "Topic Name",
      "activityType": "Concept",
      "durationMinutes": 60,
      "completed": false
    }
  ]
}`;

    const raw = await callAiBackend({
      prompt,
      systemInstruction: 'You are an academic schedule planner. Output strictly valid JSON.',
      temperature: 0.5,
      moduleKey: 'generalKey',
    });

    const parsed = extractJson<any>(raw);
    return {
      id: `sched_${Date.now()}`,
      title: parsed.title || `Plan for ${targetGoal}`,
      targetGoal,
      examDate,
      hoursPerDay,
      totalDays,
      tasks: (parsed.tasks || []).map((t: any, idx: number) => ({
        ...t,
        id: `task_${Date.now()}_${idx}`,
        completed: false,
      })),
      createdAt: new Date().toISOString(),
    };
  },

  // 6. VOICE FRIEND CALL (Live API Key Only)
  async voiceCallResponse(
    userMessage: string, 
    conversationHistory: { sender: 'user' | 'buddy'; text: string }[],
    gender: VoiceGender = 'female',
    ageGroup: AgeGroup = 'high_school',
    studentName: string = 'Friend',
    languageCode: IndianLanguageCode = 'en-US',
    customName?: string
  ): Promise<string> {
    const langObj = INDIAN_LANGUAGES.find(l => l.code === languageCode) || INDIAN_LANGUAGES[0];
    const historyText = conversationHistory.slice(-6).map(m => `${m.sender === 'user' ? 'Student' : 'Buddy'}: ${m.text}`).join('\n');
    
    const tutorName = customName || 'TeachBuddy';
    const prompt = `You are ${tutorName}, an expert, encouraging study tutor talking live on a voice call with ${studentName}.
Language: Respond in ${langObj.name} (${langObj.nativeName}) with natural, conversational spoken clarity.
Student Level: ${ageGroup}.

Recent Conversation:
${historyText}
Student just said: "${userMessage}"

CRITICAL VOICE INSTRUCTIONS:
1. ACCURATE LIVE ANSWER: Explain the concept or solve the question with 100% factual accuracy in 2 to 3 spoken sentences.
2. INTERACTIVE ENGAGEMENT: End your answer with a friendly follow-up question checking their understanding.
3. SPOKEN-FRIENDLY: Do NOT use markdown symbols, asterisks, bullet points, or complex math notation that cannot be spoken out loud. Keep tone warm, clear, and encouraging.`;

    const raw = await callAiBackend({ 
      prompt, 
      systemInstruction: 'You are a warm, articulate voice tutor. Speak naturally without formatting symbols.',
      temperature: 0.65,
      moduleKey: 'voiceKey',
    });

    return raw.replace(/[*#_`~\[\]]/g, '').trim();
  },

  // 7. BRAIN SPRINT SPEED DRILLS (Games & Learning Hub)
  async generateBrainSprintQuestions(
    subject: string = 'Mathematics',
    count: number = 8,
    languageCode: IndianLanguageCode = 'en-US'
  ): Promise<{ id: string; question: string; isTrue: boolean; explanation: string }[]> {
    const langObj = INDIAN_LANGUAGES.find(l => l.code === languageCode) || INDIAN_LANGUAGES[0];
    const prompt = `Generate ${count} rapid-fire, fast True/False drill questions for a 60-second speed test on:
Subject: ${subject}
Language: ${langObj.name} (${langObj.nativeName})

Each question must be a short, direct statement that is either definitively True or definitively False.
Output strictly a valid JSON array:
[
  {
    "id": "bs1",
    "question": "Statement to evaluate",
    "isTrue": true,
    "explanation": "Brief 1-sentence explanation why it is true or false."
  }
]`;

    const raw = await callAiBackend({
      prompt,
      systemInstruction: 'You are a speed drill generator. Output strictly a valid JSON array.',
      temperature: 0.5,
      moduleKey: 'generalKey',
    });

    return extractJson(raw);
  },

  // 8. FORMULA & TERM MEMORY DUEL (Games & Learning Hub)
  async generateMemoryDuelCards(
    subject: string = 'Physics',
    count: number = 6,
    languageCode: IndianLanguageCode = 'en-US'
  ): Promise<{ id: string; term: string; match: string }[]> {
    const langObj = INDIAN_LANGUAGES.find(l => l.code === languageCode) || INDIAN_LANGUAGES[0];
    const prompt = `Generate ${count} high-yield concept pairs for a card matching memory game on:
Subject: ${subject}
Language: ${langObj.name} (${langObj.nativeName})

Each pair must have a concise "term" (e.g. "Newton's Second Law" or "Mitochondria") and its exact corresponding "match" (e.g. "F = ma" or "Powerhouse of the Cell").
Output strictly a valid JSON array:
[
  {
    "id": "pair_1",
    "term": "Term or Concept",
    "match": "Formula or Definition"
  }
]`;

    const raw = await callAiBackend({
      prompt,
      systemInstruction: 'You are a memory game generator. Output strictly a valid JSON array.',
      temperature: 0.4,
      moduleKey: 'generalKey',
    });

    return extractJson(raw);
  },

  // 9. INSTANT AI ASSISTANT & CHAT
  async askAssistant(
    question: string,
    languageCode: IndianLanguageCode = 'en-US',
    ageGroup: AgeGroup = 'high_school'
  ): Promise<string> {
    const langObj = INDIAN_LANGUAGES.find(l => l.code === languageCode) || INDIAN_LANGUAGES[0];
    const systemInstruction = `You are TeachBuddy AI Assistant, a brilliant, friendly, and motivating personal tutor.
Provide a clear, direct, and well-structured answer in ${langObj.name} (${langObj.nativeName}).
Keep answers concise, engaging, and easy to understand for a ${ageGroup.replace('_', ' ')} student.
If formulas or steps are involved, explain them with clarity and simple analogies.`;

    const prompt = `Student Question: "${question}"
Please provide a helpful, encouraging explanation with key insights:`;

    return await callAiBackend({
      prompt,
      systemInstruction,
      temperature: 0.5,
      moduleKey: 'generalKey',
    });
  },
};

