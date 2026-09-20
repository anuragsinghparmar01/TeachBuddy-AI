import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  app.use(express.json());

  // Global CORS & preflight middleware for AI Studio iframe & cross-origin previews
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check endpoints
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.json({ 
      status: 'ok', 
      service: 'TeachBuddy AI Studio',
      geminiServerKeyConfigured: !!process.env.GEMINI_API_KEY,
      supportedModels: ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
      timestamp: new Date().toISOString() 
    });
  };
  app.get('/api/health', healthHandler);
  app.get('/api/ai/health', healthHandler);

  const cleanKey = (key: unknown): string => {
    if (!key || typeof key !== 'string') return '';
    return key.trim().replace(/^["'`]|["'`]$/g, '').trim();
  };

  // Connection test route (GET & POST)
  const testHandler = async (req: express.Request, res: express.Response) => {
    try {
      const customKey = req.method === 'POST' ? req.body?.apiKey : (req.query?.apiKey as string);
      const rawKey = cleanKey(customKey);
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

      // Google Gemini Live API test with resilient model candidates
      const ai = new GoogleGenAI({ apiKey });
      const testModels = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let testReply = '';
      let testedModel = '';
      let testErr: any = null;

      for (const m of testModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: 'Ping',
          });
          testReply = response.text?.trim() || 'OK';
          testedModel = m;
          break;
        } catch (e: any) {
          testErr = e;
        }
      }

      if (testedModel) {
        res.json({ ok: true, provider: 'Google Gemini', model: testedModel, reply: testReply });
      } else {
        throw testErr || new Error('Unable to connect to Google Gemini with this key');
      }
    } catch (err: any) {
      res.json({ ok: false, error: err?.message || 'API connection failed' });
    }
  };
  app.post('/api/ai/test', testHandler);
  app.get('/api/ai/test', testHandler);

  // Status/info for GET requests on /api/ai/generate to prevent 404
  app.get('/api/ai/generate', (_req, res) => {
    res.json({ 
      status: 'ready', 
      endpoint: '/api/ai/generate',
      method: 'POST',
      message: 'TeachBuddy AI Generation Endpoint is Active'
    });
  });

  // API AI proxy route
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, systemInstruction, temperature, apiKey: customKey, model: requestedModel } = req.body || {};
      const rawKey = cleanKey(customKey);
      const primaryKey = rawKey || process.env.GEMINI_API_KEY;

      if (!primaryKey) {
        res.status(400).json({ text: null, error: 'No live API key is configured. Please verify your keys in Settings.' });
        return;
      }

      // Helper to call Gemini with resilient fallback
      const generateWithGemini = async (key: string, modelChoice?: string): Promise<string> => {
        const ai = new GoogleGenAI({ apiKey: key });
        const candidateModels = [
          modelChoice,
          'gemini-2.5-flash',
          'gemini-3.6-flash',
          'gemini-flash-latest',
          'gemini-3.1-flash-lite',
        ].filter(Boolean) as string[];

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

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TeachBuddy AI full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
