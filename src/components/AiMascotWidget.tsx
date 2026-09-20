import React, { useState } from 'react';
import { Sparkles, MessageCircle, Volume2, X, Lightbulb, Smile, Zap } from 'lucide-react';
import { audioService } from '../services/audioService';
import type { UserProfile } from '../types';

interface AiMascotWidgetProps {
  user: UserProfile;
  darkMode: boolean;
  onOpenVoiceCall: () => void;
  onStartSprint: () => void;
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

export const AiMascotWidget: React.FC<AiMascotWidgetProps> = ({
  user,
  darkMode,
  onOpenVoiceCall,
  onStartSprint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [mood, setMood] = useState<'Focused' | 'Hyped' | 'Proud'>('Hyped');

  const handleMascotClick = () => {
    const nextIdx = (quoteIndex + 1) % BUDDY_QUOTES.length;
    setQuoteIndex(nextIdx);
    setIsOpen(true);
  };

  const handleSpeakQuote = () => {
    audioService.speak(
      BUDDY_QUOTES[quoteIndex],
      user.selectedVoice || 'female',
      user.voiceSpeed || 1.0,
      user.voicePitch || 1.0
    );
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30 flex flex-col items-end">
      {/* Speech Bubble Card */}
      {isOpen && (
        <div className={`mb-3 w-80 max-w-[calc(100vw-40px)] p-4 rounded-3xl border shadow-2xl transition-all animate-fadeIn ${
          darkMode 
            ? 'bg-slate-900/95 border-indigo-500/30 text-white backdrop-blur-md' 
            : 'bg-white/95 border-indigo-200 text-slate-900 backdrop-blur-md'
        }`}>
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                TeachBuddy AI
              </span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded-full">
                Mood: {mood}
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quote Text */}
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
            "{BUDDY_QUOTES[quoteIndex]}"
          </p>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSpeakQuote}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              title="Hear Buddy speak this out loud"
            >
              <Volume2 className="w-3.5 h-3.5" /> Read Aloud
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onStartSprint}
                className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold hover:bg-amber-500/25"
              >
                ⚡ Brain Sprint
              </button>
              <button
                onClick={onOpenVoiceCall}
                className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white text-[10px] font-extrabold hover:bg-indigo-500 shadow-sm"
              >
                🎙️ Call Me
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Logo Button */}
      <button
        id="teachbuddy-mascot-btn"
        onClick={handleMascotClick}
        className="group relative p-1 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-purple-600 shadow-xl shadow-indigo-500/30 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
        title="Tap to talk with TeachBuddy AI!"
      >
        <img
          src="/logo.png"
          alt="TeachBuddy AI Mascot"
          className="w-13 h-13 rounded-2xl object-cover border-2 border-white/80 dark:border-slate-900"
        />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
        </span>
      </button>
    </div>
  );
};
