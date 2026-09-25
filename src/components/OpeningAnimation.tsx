import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, ArrowRight, Shield, Zap, Activity } from 'lucide-react';

interface OpeningAnimationProps {
  onComplete?: () => void;
  onFinish?: () => void;
}

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ onComplete, onFinish }) => {
  const [brandStage, setBrandStage] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(3);

  const handleFinish = useCallback(() => {
    if (typeof onComplete === 'function') {
      onComplete();
    } else if (typeof onFinish === 'function') {
      onFinish();
    }
  }, [onComplete, onFinish]);

  useEffect(() => {
    if (countdownSeconds <= 0) {
      handleFinish();
    }
  }, [countdownSeconds, handleFinish]);

  useEffect(() => {
    const t1 = setTimeout(() => setBrandStage(1), 150);
    const t2 = setTimeout(() => setBrandStage(2), 600);
    const t3 = setTimeout(() => setBrandStage(3), 1100);

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 bg-slate-950 text-slate-100 select-none overflow-hidden animate-fadeIn">
      {/* Subtle Background Glow Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between relative z-20 pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>TEACHBUDDY AI ONLINE</span>
        </div>

        <button
          onClick={handleFinish}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition active:scale-95 cursor-pointer"
        >
          <span>Skip</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Center Brand Reveal */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-md my-auto space-y-6 px-4">
        {/* Logo Emblem */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-2.5 shadow-2xl shadow-indigo-500/25 transition-all duration-700 transform ${
              brandStage >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
            }`}
          >
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-900/50 to-slate-950 flex items-center justify-center overflow-hidden border border-indigo-500/20">
              <img
                src="/logo.png"
                alt="TeachBuddy AI"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Brand Title & Tagline */}
        <div className="space-y-2">
          <h1
            className={`text-3xl sm:text-4xl font-bold tracking-tight text-white transition-all duration-700 delay-100 transform ${
              brandStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            TeachBuddy AI
          </h1>
          <p
            className={`text-sm text-slate-400 transition-all duration-700 delay-150 transform ${
              brandStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            Your Intelligent Academic Study & Learning Companion
          </p>
        </div>

        {/* Status Indicators */}
        <div
          className={`flex flex-wrap items-center justify-center gap-2 transition-all duration-700 delay-200 transform ${
            brandStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>Live AI Engine Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Curriculum-Aligned</span>
          </div>
        </div>

        {/* Quick Start Action */}
        <div
          className={`pt-2 flex flex-col items-center gap-2.5 w-full transition-all duration-700 delay-300 transform ${
            brandStage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <button
            onClick={handleFinish}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-slate-400 font-mono">
            Entering study suite in {countdownSeconds}s
          </span>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="w-full max-w-4xl flex items-center justify-between text-[11px] text-slate-500 relative z-20 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Private & Secure Learning Environment</span>
        </div>
        <span>TeachBuddy AI</span>
      </footer>
    </div>
  );
};
