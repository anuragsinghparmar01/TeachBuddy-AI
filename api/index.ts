import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

function cleanKey(k?: string): string {
  if (!k || typeof k !== 'string') return '';
  return k.replace(/[\r\n\t'"]/g, '').trim();
}

// Serverless handler for Vercel
export default async function handler(req: IncomingMessage & { body?: any; query?: any; method?: string; url?: string }, res: ServerResponse & { status?: (code: number) => any; json?: (data: any) => any }) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = req.url || '';

  // Read request body if needed
  let body: any = req.body;
  if (!body && (req.method === 'POST' || req.method === 'PUT')) {
    const buffers: Buffer[] = [];
    for await (const chunk of req) {
      buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
  }

  // Health check
  if (url.includes('/api/health') || url === '/api') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok', server: 'TeachBuddy Vercel Serverless', timestamp: new Date().toISOString() }));
    return;
  }

  // API Test endpoint
  if (url.includes('/api/ai/test')) {
    try {
      const apiKey = cleanKey(body?.apiKey || (req as any).query?.apiKey) || cleanKey(process.env.GEMINI_API_KEY);
      if (!apiKey) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'GEMINI_API_KEY is not set.' }));
        return;
      }

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

      res.setHeader('Content-Type', 'application/json');
      if (testedModel) {
        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true, provider: 'Google Gemini', model: testedModel, reply: testReply }));
      } else {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: testErr?.message || 'Unable to connect to Google Gemini' }));
      }
      return;
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: err?.message || 'API connection failed' }));
      return;
    }
  }

  // AI Generate endpoint
  if (url.includes('/api/ai/generate')) {
    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ready', endpoint: '/api/ai/generate', method: 'POST' }));
      return;
    }

    try {
      const { prompt, systemInstruction, temperature, apiKey: customKey, model: requestedModel } = body || {};
      const primaryKey = cleanKey(customKey) || cleanKey(process.env.GEMINI_API_KEY);

      if (!primaryKey) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ text: null, error: 'No live API key is configured. Please set GEMINI_API_KEY.' }));
        return;
      }

      const ai = new GoogleGenAI({ apiKey: primaryKey });
      const candidateModels = Array.from(new Set([
        requestedModel,
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
      ])).filter(Boolean) as string[];

      let generatedText = '';
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
          if (response.text) {
            generatedText = response.text;
            break;
          }
        } catch (e: any) {
          lastErr = e;
          continue;
        }
      }

      res.setHeader('Content-Type', 'application/json');
      if (generatedText) {
        res.statusCode = 200;
        res.end(JSON.stringify({ text: generatedText }));
      } else {
        res.statusCode = 500;
        res.end(JSON.stringify({ text: null, error: lastErr?.message || 'All Gemini model attempts failed.' }));
      }
      return;
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ text: null, error: err?.message || 'Internal server error.' }));
      return;
    }
  }

  // Fallback 404
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
}
