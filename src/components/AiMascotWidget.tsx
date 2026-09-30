import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  X, 
  Send, 
  Loader2, 
  Copy, 
  Check, 
  PhoneCall, 
  Trash2,
  Bot,
  User as UserIcon,
  Zap
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { aiService } from '../services/aiService';
import type { UserProfile } from '../types';

interface AiMascotWidgetProps {
  user: UserProfile;
  darkMode: boolean;
  onOpenVoiceCall: () => void;
  onStartSprint: () => void;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const BUDDY_QUOTES = [
  "Hey! Did you know taking 5-minute Pomodoro breaks increases long-term memory retention by 40%? You got this!",
  "TeachBuddy tip: If you can explain a concept in simple words without jargon, you truly own it!",
  "Consistency beats talent! Every single day you open this app, your future self is thanking you. 🔥",
  "Don't worry about making mistakes in quizzes. Mistakes are just proof your brain is building new synaptic bridges!",
  "Want a quick brain workout? Jump into the 60-Second Brain Sprint and let's test your combo streak!",
  "Math is like a puzzle: once you spot the symmetry, the answer practically reveals itself.",
  "Remember to hydrate and take deep breaths. Clear mind = unstoppable focus!",
];

const SUGGESTED_QUESTIONS = [
  "Explain Photosynthesis simply",
  "Solve 3x + 15 = 45 step-by-step",
  "How does gravity work?",
  "Best revision tip for exams",
];

export const AiMascotWidget: React.FC<AiMascotWidgetProps> = ({
  user,
  darkMode,
  onOpenVoiceCall,
  onStartSprint,
  onOpenVoiceCallWithTopic,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tips'>('chat');
  const [quoteIndex, setQuoteIndex] = useState(0);
  
  // Multi-turn assistant chat state
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello ${user.name || 'friend'}! I'm your TeachBuddy AI Assistant. Ask me any question, formula, or concept you want to study!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading, isOpen]);

  const handleMascotClick = () => {
    setIsOpen(prev => !prev);
  };

  const handleAskAssistant = async (textToAsk?: string) => {
    const q = (textToAsk || question).trim();
    if (!q) return;

    const userMsg: AssistantMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);
    setErrorMsg(null);
    audioService.stopSpeaking();
    setSpeakingId(null);

    try {
      const reply = await aiService.askAssistant(q, user.preferredLanguage, user.ageGroup);
      const aiMsg: AssistantMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'AI Assistant connection interrupted. Please verify your settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakText = (id: string, text: string) => {
    if (speakingId === id) {
      audioService.stopSpeaking();
      setSpeakingId(null);
      return;
    }
    audioService.speak(
      text,
      user.selectedVoice || 'female',
      user.voiceSpeed || 1.0,
      user.voicePitch || 1.0,
      user.preferredLanguage,
      () => setSpeakingId(id),
      () => setSpeakingId(null)
    );
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setChatHistory([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Chat cleared! What shall we learn next, ${user.name || 'friend'}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMsg(null);
    audioService.stopSpeaking();
    setSpeakingId(null);
  };

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % BUDDY_QUOTES.length);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end">
      {/* Interactive Assistant Card */}
      {isOpen && (
        <div 
          id="teachbuddy-assistant-card"
          className={`mb-3 w-[calc(100vw-24px)] sm:w-96 max-w-md rounded-3xl border shadow-2xl transition-all animate-fadeIn overflow-hidden flex flex-col ${
            darkMode 
              ? 'bg-slate-900/98 border-indigo-500/30 text-white backdrop-blur-xl' 
              : 'bg-white/98 border-indigo-200 text-slate-900 backdrop-blur-xl'
          }`}
          style={{ height: 'min(520px, calc(100dvh - 140px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="TeachBuddy Avatar" 
                  className="w-7 h-7 rounded-lg object-cover border border-indigo-300 dark:border-indigo-600" 
                />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  TeachBuddy AI Assistant
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Live 24/7 Smart Study Buddy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('tips')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'tips'
                      ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tips
                </button>
              </div>

              {activeTab === 'chat' && chatHistory.length > 1 && (
                <button
                  onClick={handleClearChat}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Clear chat history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'chat' ? (
              <>
                {/* Chat Messages Stream */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-lg bg-indigo-600/20 dark:bg-indigo-600/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-xs mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        
                        <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[9px] opacity-70">
                          <span>{msg.timestamp}</span>

                          {msg.role === 'assistant' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSpeakText(msg.id, msg.text)}
                                className="hover:text-indigo-500 transition-colors cursor-pointer"
                                title={speakingId === msg.id ? 'Stop audio' : 'Listen aloud'}
                              >
                                {speakingId === msg.id ? <VolumeX className="w-3 h-3 text-rose-500" /> : <Volume2 className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => handleCopyText(msg.id, msg.text)}
                                className="hover:text-indigo-500 transition-colors cursor-pointer"
                                title="Copy answer"
                              >
                                {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 text-xs mt-0.5">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-700 dark:text-indigo-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-indigo-600" />
                      <span>TeachBuddy is typing explanation...</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                      {errorMsg}
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Quick Question Chips */}
                <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Try:</span>
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAssistant(q)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 border border-indigo-100 dark:border-indigo-800/40 cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskAssistant();
                  }}
                  className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 shrink-0"
                >
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask formula, definition, or doubt..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !question.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all shadow-xs shrink-0 cursor-pointer"
                    title="Send Question"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </>
            ) : (
              /* Tips & Motivation Tab */
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      💡 Study Wisdom
                    </span>
                    <button
                      onClick={nextQuote}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Next Tip →
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                    "{BUDDY_QUOTES[quoteIndex]}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onStartSprint();
                    }}
                    className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Brain Sprint
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenVoiceCall();
                    }}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Voice Call
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Logo Trigger Button */}
      <button
        id="teachbuddy-mascot-btn"
        onClick={handleMascotClick}
        className="group relative p-1 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-purple-600 shadow-xl shadow-indigo-500/30 transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
        title="Tap to ask TeachBuddy AI Assistant anything!"
        aria-label="TeachBuddy AI Assistant"
      >
        <img
          src="/logo.png"
          alt="TeachBuddy AI Mascot"
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl object-cover border-2 border-white/90 dark:border-slate-900"
        />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
        </span>
      </button>
    </div>
  );
};
