import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'techbuddy-api-server',
        configureServer(server) {
          server.middlewares.use('/api/ai/test', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', async () => {
              try {
                const { apiKey: customKey } = JSON.parse(body || '{}');
                const rawKey = customKey ? customKey.trim() : '';
                const apiKey = rawKey || process.env.GEMINI_API_KEY;
                if (!apiKey) {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ ok: false, message: 'No API Key configured on server or in Settings' }));
                  return;
                }

                // Groq API Key check
                if (apiKey.startsWith('gsk_')) {
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
                    throw new Error(data.error.message || 'Groq connection failed');
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ 
                    ok: true, 
                    provider: 'Groq (LLaMA/GPT OSS)', 
                    model: 'openai/gpt-oss-120b', 
                    reply: data.choices?.[0]?.message?.content?.trim() || 'OK' 
                  }));
                  return;
                }

                // Google Gemini API Key
                const ai = new GoogleGenAI({ apiKey });
                try {
                  const response = await ai.models.generateContent({
                    model: 'gemini-3.6-flash',
                    contents: 'Ping',
                  });
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ ok: true, provider: 'Google Gemini', model: 'gemini-3.6-flash', reply: response.text?.trim() || 'OK' }));
                } catch {
                  const fallbackRes = await ai.models.generateContent({
                    model: 'gemini-flash-latest',
                    contents: 'Ping',
                  });
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ ok: true, provider: 'Google Gemini', model: 'gemini-flash-latest', reply: fallbackRes.text?.trim() || 'OK' }));
                }
              } catch (err: any) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ ok: false, error: err?.message || 'Connection test failed' }));
              }
            });
          });

          server.middlewares.use('/api/ai/generate', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsedBody = JSON.parse(body || '{}');
                const { prompt, systemInstruction, temperature, apiKey: customKey, model: requestedModel } = parsedBody;
                const rawKey = customKey ? customKey.trim() : '';
                const primaryKey = rawKey || process.env.GEMINI_API_KEY;

                if (!primaryKey) {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 400;
                  res.end(JSON.stringify({ text: null, error: 'No API key configured on server or in Settings' }));
                  return;
                }

                // Helper to call Gemini with robust model fallbacks
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
                          systemInstruction: systemInstruction || 'You are TeachBuddy AI, an expert, encouraging, and accurate academic tutor.',
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
                  throw new Error('Groq AI inference failed');
                };

                let text = '';
                let usedProvider = 'Gemini';

                // Route by key type
                if (primaryKey.startsWith('gsk_')) {
                  try {
                    text = await generateWithGroq(primaryKey);
                    usedProvider = 'Groq';
                  } catch (groqErr) {
                    // Fallback to server Gemini key if available
                    if (process.env.GEMINI_API_KEY) {
                      text = await generateWithGemini(process.env.GEMINI_API_KEY, requestedModel);
                      usedProvider = 'Gemini (Auto-Fallback)';
                    } else {
                      throw groqErr;
                    }
                  }
                } else {
                  // Try Gemini with primaryKey
                  try {
                    text = await generateWithGemini(primaryKey, requestedModel);
                  } catch (geminiErr: any) {
                    // If custom key failed and server key is available and different, retry with server key
                    if (process.env.GEMINI_API_KEY && primaryKey !== process.env.GEMINI_API_KEY) {
                      text = await generateWithGemini(process.env.GEMINI_API_KEY, requestedModel);
                      usedProvider = 'Gemini (Server Key Fallback)';
                    } else {
                      throw geminiErr;
                    }
                  }
                }

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ text, success: true, provider: usedProvider }));
              } catch (err: any) {
                console.error('API error in /api/ai/generate:', err?.message || err);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end(JSON.stringify({ text: null, error: err?.message || 'AI generation failed' }));
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
