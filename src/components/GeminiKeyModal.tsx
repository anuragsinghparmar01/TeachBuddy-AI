import React, { useState } from 'react';
import { Key, Sparkles, CheckCircle2, ExternalLink, X, ShieldAlert, Cpu, Check } from 'lucide-react';
import type { UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { setMasterApiKey, cleanApiKey, getStoredMasterApiKey } from '../services/aiService';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [apiKey, setApiKey] = useState(user.geminiApiKey || getStoredMasterApiKey() || '');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveKey = async () => {
    const trimmed = cleanApiKey(apiKey);
    setIsTesting(true);
    setStatusMessage(null);

    try {
      if (!trimmed) {
        setMasterApiKey('');
        onUpdateUser({ geminiApiKey: undefined, customApiKey: undefined });
        setStatusMessage({ type: 'success', text: 'Reset to default built-in AI server connection.' });
        audioService.playSound('success');
        return;
      }

      // Test key with /api/ai/test
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setMasterApiKey(trimmed);
        onUpdateUser({ geminiApiKey: trimmed, customApiKey: trimmed });
        setStatusMessage({ 
          type: 'success', 
          text: `Verified & Connected to ${data.provider || 'Google Gemini'} (${data.model || 'Flash'}) successfully!` 
        });
        audioService.playSound('success');
      } else {
        // Try fallback check on /api/ai/generate
        const genRes = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Say OK',
            apiKey: trimmed,
          }),
        });
        const genData = await genRes.json().catch(() => ({}));
        if (genRes.ok && genData.text) {
          setMasterApiKey(trimmed);
          onUpdateUser({ geminiApiKey: trimmed, customApiKey: trimmed });
          setStatusMessage({ type: 'success', text: 'Gemini Free API Key connected & verified successfully!' });
          audioService.playSound('success');
        } else {
          setStatusMessage({ 
            type: 'error', 
            text: data.error || genData.error || 'Invalid API key or quota exceeded. Please check Google AI Studio.' 
          });
          audioService.playSound('pop');
        }
      }
    } catch (e: any) {
      // Direct REST fallback check
      try {
        const directRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${trimmed}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'OK' }] }] }),
          }
        );
        if (directRes.ok) {
          setMasterApiKey(trimmed);
          onUpdateUser({ geminiApiKey: trimmed, customApiKey: trimmed });
          setStatusMessage({ type: 'success', text: 'Connected & verified directly with Google Gemini API!' });
          audioService.playSound('success');
          return;
        }
      } catch {}

      setStatusMessage({ type: 'error', text: e.message || 'Verification connection error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-outfit">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              Connect Free Gemini API Key
            </h2>
            <p className="text-xs text-slate-400">
              Unlimited high-speed reasoning & voice tutor
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Google provides <strong>100% free Gemini API keys</strong> with high rate limits for learners and developers.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Paste Your Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleSaveKey}
              disabled={isTesting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isTesting ? (
                <span>Verifying with Google Gemini...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Connect API Key</span>
                </>
              )}
            </button>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-center flex items-center justify-center gap-1.5 transition"
            >
              <span>Get Free Key at Google AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
