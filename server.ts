import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API AI test connection route
app.post('/api/ai/test', async (req, res) => {
  try {
    const { apiKey: customKey } = req.body || {};
    const rawKey = customKey ? customKey.trim() : '';
    const apiKey = rawKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.json({ ok: false, message: 'No API Key configured on server or in Settings' });
      return;
    }

    if (apiKey.startsWith('gsk_')) {
      // Groq Live API test
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 10,
        }),
      });
      const data = await groqRes.json();
      if (data.error) {
        throw new Error(data.error.message || 'Groq authentication error');
      }
      res.json({ ok: true, provider: 'Groq (LLaMA/GPT OSS)', model: 'openai/gpt-oss-120b', reply: data.choices?.[0]?.message?.content?.trim() || 'OK' });
      return;
    }

    // Google Gemini Live API test
    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: 'Ping',
      });
      res.json({ ok: true, provider: 'Google Gemini', model: 'gemini-3.6-flash', reply: response.text?.trim() || 'OK' });
    } catch {
      const fallbackRes = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: 'Ping',
      });
      res.json({ ok: true, provider: 'Google Gemini', model: 'gemini-flash-latest', reply: fallbackRes.text?.trim() || 'OK' });
    }
  } catch (err: any) {
    res.json({ ok: false, error: err?.message || 'API connection failed' });
  }
});

// API AI proxy route
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, temperature, apiKey: customKey, model: requestedModel } = req.body || {};
    const rawKey = customKey ? customKey.trim() : '';
    const primaryKey = rawKey || process.env.GEMINI_API_KEY;

    if (!primaryKey) {
      res.status(400).json({ text: null, error: 'No live API key is configured. Please verify your keys in Settings.' });
      return;
    }

    // Helper to call Gemini
    const generateWithGemini = async (key: string, modelChoice?: string): Promise<string> => {
      const ai = new GoogleGenAI({ apiKey: key });
      const candidateModels = [modelChoice || 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let lastErr: any = null;
      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction || 'You are TeachBuddy AI, an expert, encouraging, and accurate tutor.',
              temperature: temperature ?? 0.5,
            },
          });
          if (response.text) return response.text;
        } catch (e: any) {
          lastErr = e;
        }
      }
      throw lastErr || new Error('Gemini models unavailable');
    };

    // Helper to call Groq
    const generateWithGroq = async (key: string): Promise<string> => {
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
      for (const gModel of groqModels) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: gModel,
              messages,
              temperature: temperature ?? 0.5,
              max_tokens: 3000,
            }),
          });
          const groqData = await groqRes.json();
          if (groqData.choices?.[0]?.message?.content) {
            return groqData.choices[0].message.content;
          }
        } catch {}
      }
      throw new Error('Groq inference failed');
    };

    let text = '';
    let usedProvider = 'Gemini';

    if (primaryKey.startsWith('gsk_')) {
      try {
        text = await generateWithGroq(primaryKey);
        usedProvider = 'Groq';
      } catch (groqErr) {
        if (process.env.GEMINI_API_KEY) {
          text = await generateWithGemini(process.env.GEMINI_API_KEY, requestedModel);
          usedProvider = 'Gemini (Auto-Fallback)';
        } else {
          throw groqErr;
        }
      }
    } else {
      try {
        text = await generateWithGemini(primaryKey, requestedModel);
      } catch (geminiErr: any) {
        if (process.env.GEMINI_API_KEY && primaryKey !== process.env.GEMINI_API_KEY) {
          text = await generateWithGemini(process.env.GEMINI_API_KEY, requestedModel);
          usedProvider = 'Gemini (Server Key Fallback)';
        } else {
          throw geminiErr;
        }
      }
    }

    res.json({ text, success: true, provider: usedProvider });
  } catch (err: any) {
    console.error('Server AI generate error:', err?.message || err);
    res.status(500).json({ text: null, error: err?.message || 'Live AI API call failed' });
  }
});

// Serve Vite build output in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TeachBuddy AI server listening on port ${PORT}`);
});
