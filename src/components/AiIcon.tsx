import React from 'react';
import { Sparkles, Bot, Brain, Zap } from 'lucide-react';

interface AiIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'gemini' | 'cyber' | 'mascot' | 'minimal';
  pulse?: boolean;
  className?: string;
  glow?: boolean;
}

export const AiIcon: React.FC<AiIconProps> = ({
  size = 'md',
  variant = 'gemini',
  pulse = false,
  className = '',
  glow = true,
}) => {
  const sizeMap = {
    xs: {
      container: 'w-6 h-6 rounded-lg',
      mainIcon: 'w-3.5 h-3.5',
      spark: 'w-2 h-2',
      dot: 'w-1 h-1',
    },
    sm: {
      container: 'w-8 h-8 rounded-xl',
      mainIcon: 'w-4 h-4',
      spark: 'w-2.5 h-2.5',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      container: 'w-10 h-10 rounded-2xl',
      mainIcon: 'w-5 h-5',
      spark: 'w-3 h-3',
      dot: 'w-2 h-2',
    },
    lg: {
      container: 'w-13 h-13 rounded-2xl',
      mainIcon: 'w-7 h-7',
      spark: 'w-3.5 h-3.5',
      dot: 'w-2.5 h-2.5',
    },
    xl: {
      container: 'w-16 h-16 rounded-3xl',
      mainIcon: 'w-8 h-8',
      spark: 'w-4 h-4',
      dot: 'w-3 h-3',
    },
    '2xl': {
      container: 'w-20 h-20 rounded-3xl',
      mainIcon: 'w-10 h-10',
      spark: 'w-5 h-5',
      dot: 'w-3.5 h-3.5',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none group ${className}`}>
      {/* Ambient Outer Halo / Glow */}
      {glow && (
        <div 
          className={`absolute inset-0 rounded-[inherit] blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300 ${
            variant === 'cyber'
              ? 'bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400'
              : variant === 'mascot'
                ? 'bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500'
                : 'bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400'
          } ${pulse ? 'animate-pulse' : ''}`}
        />
      )}

      {/* Main Dimensional Gem Container */}
      <div 
        className={`relative ${currentSize.container} flex items-center justify-center overflow-hidden transition-all duration-300 transform group-hover:scale-105 ${
          variant === 'cyber'
            ? 'bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 border border-cyan-400/40 shadow-lg shadow-cyan-500/20'
            : variant === 'mascot'
              ? 'bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 border border-white/30 shadow-lg shadow-amber-500/25'
              : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 border border-indigo-400/30 shadow-lg shadow-indigo-500/25'
        }`}
      >
        {/* Top Glass Sheen Light Reflection */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

        {/* Dynamic Subtle Shimmer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Central Iconic Glyph Layer */}
        <div className="relative z-10 flex items-center justify-center text-white">
          {variant === 'cyber' ? (
            <Bot className={`${currentSize.mainIcon} text-cyan-300 drop-shadow-[0_2px_8px_rgba(6,182,212,0.6)]`} />
          ) : variant === 'mascot' ? (
            <Zap className={`${currentSize.mainIcon} text-amber-200 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]`} />
          ) : (
            <Sparkles className={`${currentSize.mainIcon} text-indigo-200 group-hover:text-white drop-shadow-[0_2px_10px_rgba(99,102,241,0.7)] transition-colors`} />
          )}

          {/* Micro Sparkle Accent in Corner */}
          <Sparkles className={`absolute -top-1 -right-1 ${currentSize.spark} text-cyan-300/80 animate-spin-slow pointer-events-none`} />
        </div>

        {/* Live Status Orb (Bottom-right) */}
        <div 
          className={`absolute bottom-1 right-1 ${currentSize.dot} rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-xs shadow-emerald-400/80 animate-pulse`}
          title="AI Live Online"
        />
      </div>
    </div>
  );
};
