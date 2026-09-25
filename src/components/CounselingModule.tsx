import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Wind, 
  Smile, 
  ShieldAlert, 
  Sparkles, 
  MessageCircle, 
  Send, 
  Play, 
  Pause, 
  RefreshCw, 
  HelpCircle,
  Volume2,
  CheckCircle,
  ThumbsUp,
  Sun
} from 'lucide-react';
import type { UserProfile } from '../types';
import { aiService } from '../services/aiService';

interface CounselingModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

export const CounselingModule: React.FC<CounselingModuleProps> = ({
  user,
  darkMode,
  onOpenVoiceCallWithTopic = (_t?: string) => {}
}) => {
  const [activeTab, setActiveTab] = useState<'breathing' | 'counselor' | 'panic' | 'affirmations'>('breathing');
  
  // 4-7-8 Breathing State
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathCount, setBreathCount] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // AI Counselor Chat State
  const [counselorInput, setCounselorInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'counselor'; text: string; time: string }[]>([
    {
      role: 'counselor',
      text: `Hello ${user.name || 'friend'}! 🌸 I am your TeachBuddy Mind Counselor. Studying for exams or handling expectations can feel heavy sometimes. You are never alone. How are you feeling today?`,
      time: 'Just now'
    }
  ]);
  const [isCounselorLoading, setIsCounselorLoading] = useState(false);

  // Breathing interval timer
  useEffect(() => {
    let timer: any;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setBreathCount((prev) => {
          if (prev <= 1) {
            if (breathPhase === 'Inhale') {
              setBreathPhase('Hold');
              return 7;
            } else if (breathPhase === 'Hold') {
              setBreathPhase('Exhale');
              return 8;
            } else {
              setBreathPhase('Inhale');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive, breathPhase]);

  const handleSendToCounselor = async (messageText?: string) => {
    const textToSend = messageText || counselorInput;
    if (!textToSend.trim() || isCounselorLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user' as const, text: textToSend, time: timeStr };
    setChatMessages((prev) => [...prev, userMsg]);
    setCounselorInput('');
    setIsCounselorLoading(true);

    try {
      const prompt = `You are a warm, compassionate, highly qualified student counselor and mentor named "TeachBuddy Mind Counselor".
The student says: "${textToSend}"
Provide a soothing, deeply supportive, and practical 3-4 sentence response. Validate their emotions, reduce their exam anxiety or pressure, and give one simple, actionable step they can take right now. Avoid clinical jargon, sound like a loving, supportive mentor.`;

      const res = await aiService.generateContent({
        prompt,
        temperature: 0.7
      });

      const reply = res.text || "Take a deep breath, dear student. Remember: One exam or test never defines your entire future. You have survived difficult days before, and you are capable of handling this one step at a time. What is one small thing you can review for just 10 minutes right now?";

      setChatMessages((prev) => [
        ...prev,
        { role: 'counselor', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'counselor', text: "I'm right here with you. Drink a warm glass of water, step away from your books for 5 minutes, and know that your best effort is always enough.", time: 'Just now' }
      ]);
    } finally {
      setIsCounselorLoading(false);
    }
  };

  // Instant Prompt Chips for Anxious Students
  const quickWorries = [
    "I feel like I forgot everything I studied",
    "Family expectations are making me stressed",
    "I have exam tomorrow and my heart is beating fast",
    "I can't focus and keep procrastinating",
    "I feel overwhelmed by the huge syllabus"
  ];

  const affirmations = [
    { quote: "An exam only grades your memory on one day. It does not measure your intelligence, creativity, or your worth.", author: "Dr. APJ Abdul Kalam Principle" },
    { quote: "Focus on the step in front of you, not the whole staircase.", author: "Mindful Study Rule" },
    { quote: "Calm minds remember twice as much as panicked minds. Rest is also part of your preparation.", author: "Cognitive Science" },
    { quote: "You don't have to be perfect; you just have to show up and give your honest effort.", author: "TeachBuddy Wisdom" },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl shadow-black/20' 
          : 'bg-gradient-to-r from-teal-50/80 via-emerald-50/60 to-sky-50/80 border-emerald-200/80 text-slate-800 shadow-md shadow-emerald-100/50'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
              <Heart className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight font-outfit">
                  Mind Calm & Pressure Relief
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                  Safe Sanctuary
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breathing exercises, exam panic relief, and empathetic AI counselor support
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenVoiceCallWithTopic('Overcoming Study Anxiety & Staying Calm')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice Talk with Counselor</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('breathing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'breathing'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>4-7-8 Breathing Calm</span>
          </button>

          <button
            onClick={() => setActiveTab('counselor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'counselor'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>AI Counselor Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('panic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'panic'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Exam Panic Button</span>
          </button>

          <button
            onClick={() => setActiveTab('affirmations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'affirmations'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Affirmations</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 4-7-8 GUIDED BREATHING */}
      {activeTab === 'breathing' && (
        <div className={`p-6 sm:p-8 rounded-2xl border text-center transition-all ${
          darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Scientific Cortisol Reducer
              </span>
              <h2 className="text-lg font-black font-outfit mt-0.5">
                4-7-8 Breathing Visualizer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inhale gently through nose for 4s, hold for 7s, exhale slowly through mouth for 8s
              </p>
            </div>

            {/* Animated Breathing Circle */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-6">
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                  breathPhase === 'Inhale' 
                    ? 'scale-110 bg-emerald-500/20 dark:bg-emerald-500/30' 
                    : breathPhase === 'Hold' 
                    ? 'scale-100 bg-amber-500/20 dark:bg-amber-500/30 ring-4 ring-amber-400/40' 
                    : 'scale-75 bg-sky-500/20 dark:bg-sky-500/30'
                }`}
              />
              <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-700 shadow-xl ${
                breathPhase === 'Inhale'
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white'
                  : breathPhase === 'Hold'
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white'
                  : 'bg-gradient-to-tr from-sky-500 to-indigo-500 text-white'
              }`}>
                <span className="text-xs uppercase font-black tracking-wider opacity-90">
                  {breathPhase}
                </span>
                <span className="text-4xl font-black font-mono mt-0.5">
                  {breathCount}s
                </span>
              </div>
            </div>

            {/* Toggle Button */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setIsBreathingActive(!isBreathingActive);
                  if (!isBreathingActive) {
                    setBreathPhase('Inhale');
                    setBreathCount(4);
                  }
                }}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer flex items-center gap-1.5 ${
                  isBreathingActive
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                }`}
              >
                {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isBreathingActive ? 'Pause Exercise' : 'Start 4-7-8 Breathing'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI COUNSELOR CHAT */}
      {activeTab === 'counselor' && (
        <div className={`rounded-2xl border flex flex-col h-[480px] overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {msg.role === 'user' ? 'You' : '🌸'}
                </div>
                <div>
                  <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : darkMode
                      ? 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                      : 'bg-emerald-50/80 text-slate-800 border border-emerald-200/60 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block px-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {isCounselorLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Counselor is typing thoughtful words of encouragement...</span>
              </div>
            )}
          </div>

          {/* Quick Worries Chips */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
            {quickWorries.map((w, idx) => (
              <button
                key={idx}
                onClick={() => handleSendToCounselor(w)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 whitespace-nowrap cursor-pointer transition shadow-2xs"
              >
                {w}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={counselorInput}
              onChange={(e) => setCounselorInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendToCounselor()}
              placeholder="Tell me what is troubling you, I am listening..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => handleSendToCounselor()}
              disabled={isCounselorLoading || !counselorInput.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: EXAM PANIC BUTTON (5-4-3-2-1 GROUNDING) */}
      {activeTab === 'panic' && (
        <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <div className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <div>
                <h2 className="text-base font-bold font-outfit">
                  Immediate 60-Second Exam Panic Reset
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follow this physical grounding sequence to stop anxiety hormones immediately
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">5</span>
                <span>Look around: Name <strong>5 things you can see</strong> right now (pen, wall, desk, clock, chair).</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
                <span>Touch <strong>4 different textures</strong> (your notebook paper, table wood, fabric of shirt, cold metal).</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <span>Listen closely: Name <strong>3 distinct sounds</strong> you can hear (fan humming, birds, distant cars).</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-slate-800/80 border border-purple-200 dark:border-slate-700 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <span>Identify <strong>2 scents or smells</strong> in the air.</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-slate-800/80 border border-rose-200 dark:border-slate-700 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <span>Take a sip of water and identify <strong>1 taste</strong>.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center">
              ✅ Your brain is now grounded in reality. You are safe. You are in control.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AFFIRMATIONS */}
      {activeTab === 'affirmations' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {affirmations.map((aff, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-amber-200/80 text-slate-800 shadow-xs'
              }`}
            >
              <div className="text-2xl text-amber-500 mb-2">“</div>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed mb-3">
                {aff.quote}
              </p>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                — {aff.author}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
