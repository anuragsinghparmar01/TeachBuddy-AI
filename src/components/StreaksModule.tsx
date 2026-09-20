import React, { useState } from 'react';
import { 
  Flame, 
  Shield, 
  Gift, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Sparkles, 
  Award, 
  ChevronRight, 
  Clock, 
  Download,
  Zap,
  TrendingUp,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile } from '../types';
import { exportStudentReportToPdf } from '../services/pdfService';
import { audioService } from '../services/audioService';

interface StreaksModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onNavigateTab: (tab: any) => void;
  onOpenVoiceCall: () => void;
  onClose?: () => void;
}

export const StreaksModule: React.FC<StreaksModuleProps> = ({
  user,
  darkMode,
  onUpdateUser,
  onNavigateTab,
  onOpenVoiceCall,
  onClose,
}) => {
  const [openingChest, setOpeningChest] = useState(false);
  const [chestOpened, setChestOpened] = useState(false);
  const [chestReward, setChestReward] = useState<{ xp: number; message: string } | null>(null);
  const [usingFreeze, setUsingFreeze] = useState(false);

  const streakDays = user.streakDays || 1;
  const maxStreak = user.maxStreak || Math.max(streakDays, 5);
  const streakFreezes = user.streakFreezes ?? 1;

  // Day of week status (sample active days for current week)
  const daysOfWeek = [
    { day: 'Mon', completed: true },
    { day: 'Tue', completed: true },
    { day: 'Wed', completed: true },
    { day: 'Thu', completed: streakDays >= 4 },
    { day: 'Fri', completed: streakDays >= 5 },
    { day: 'Sat', completed: streakDays >= 6 },
    { day: 'Sun', completed: streakDays >= 7 },
  ];

  // Daily Quests
  const quests = [
    {
      id: 'voice',
      title: 'Practice with AI Voice Buddy',
      desc: 'Have a 2-minute conversation or ask a concept doubt',
      xp: 50,
      icon: '🎙️',
      completed: (user.xp || 0) > 100,
      action: onOpenVoiceCall,
      actionText: 'Start Call',
    },
    {
      id: 'quiz',
      title: 'Run a Topic Quiz or 60s Brain Sprint',
      desc: 'Answer quick questions to test active recall',
      xp: 40,
      icon: '⚡',
      completed: true,
      action: () => onNavigateTab('challenge'),
      actionText: 'Play Sprint',
    },
    {
      id: 'notes',
      title: 'Generate or Review a Smart Note',
      desc: 'Revise key formulas, mindmaps, or flashcards',
      xp: 30,
      icon: '📝',
      completed: false,
      action: () => onNavigateTab('notes'),
      actionText: 'Open Notes',
    },
  ];

  const milestones = [
    { days: 3, title: 'Spark of Curiosity', xp: 100, unlocked: streakDays >= 3 },
    { days: 7, title: 'Unstoppable Flame', xp: 250, unlocked: streakDays >= 7 },
    { days: 14, title: 'Inferno Scholar', xp: 500, unlocked: streakDays >= 14 },
    { days: 30, title: 'Supernova Master', xp: 1000, unlocked: streakDays >= 30 },
  ];

  const handleOpenMysteryChest = () => {
    if (chestOpened) return;
    setOpeningChest(true);
    audioService.playDing();

    setTimeout(() => {
      setOpeningChest(false);
      setChestOpened(true);
      const bonusXp = 150;
      setChestReward({
        xp: bonusXp,
        message: 'Legendary Scholar Drop! +150 XP & 1 Streak Shield protection added.',
      });

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onUpdateUser({
        xp: (user.xp || 0) + bonusXp,
        streakFreezes: streakFreezes + 1,
        badges: Array.from(new Set([...(user.badges || []), 'Mystery Hunter'])),
      });
    }, 1200);
  };

  const handleUseFreeze = () => {
    if (streakFreezes <= 0) return;
    setUsingFreeze(true);
    audioService.playDing();
    setTimeout(() => {
      setUsingFreeze(false);
      onUpdateUser({
        streakFreezes: streakFreezes - 1,
      });
      alert('Streak Freeze activated! Your streak is protected for 24 hours even if you take a rest day.');
    }, 400);
  };

  const handleExportReport = () => {
    audioService.playDing();
    exportStudentReportToPdf(user);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
        darkMode 
          ? 'bg-gradient-to-br from-slate-900 via-orange-950/20 to-slate-900 border-slate-800 text-white' 
          : 'bg-gradient-to-br from-orange-50/80 via-amber-50/50 to-white border-orange-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Animated Flame Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white animate-pulse">
              <Flame className="w-10 h-10 sm:w-12 sm:h-12 fill-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-orange-500">
                  {streakDays}
                </span>
                <span className="text-lg sm:text-xl font-extrabold">Days Streak!</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Highest Record: <strong className="text-slate-800 dark:text-slate-200">{maxStreak} Days</strong> • You're in the top 5% of daily learners!
              </p>
            </div>
          </div>

          {/* Freeze Shield Pill & Export */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              streakFreezes > 0 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <Shield className="w-4 h-4" />
              <span>{streakFreezes} Streak Freeze{streakFreezes !== 1 ? 's' : ''}</span>
              {streakFreezes > 0 && (
                <button
                  onClick={handleUseFreeze}
                  disabled={usingFreeze}
                  className="ml-1 px-2 py-0.5 rounded bg-cyan-600 text-white text-[10px] hover:bg-cyan-500"
                >
                  Use
                </button>
              )}
            </div>

            <button
              onClick={handleExportReport}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90"
              title="Download official PDF Progress Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 7-Day Matrix Row */}
        <div className="mt-8 pt-6 border-t border-orange-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {daysOfWeek.map((item, idx) => (
              <div 
                key={item.day}
                className={`flex-1 min-w-[42px] py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 border transition-all ${
                  item.completed 
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400 font-bold' 
                    : 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-[11px] font-semibold">{item.day}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  item.completed 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>
                  {item.completed ? (
                    <Flame className="w-4 h-4 fill-white" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Quests to Keep Streak Active */}
      <div className={`p-6 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Today's Daily Quests
            </h3>
            <p className="text-xs text-slate-500">Complete any quest to lock in today's streak & earn extra XP</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            2/3 Done
          </span>
        </div>

        <div className="space-y-3">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                quest.completed 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-800 dark:text-slate-200' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{quest.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold">{quest.title}</h4>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      +{quest.xp} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{quest.desc}</p>
                </div>
              </div>

              <div>
                {quest.completed ? (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="w-4 h-4" /> Done
                  </div>
                ) : (
                  <button
                    onClick={quest.action}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition active:scale-95"
                  >
                    {quest.actionText}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Addictive Mystery Chest (Daily Loot Box) */}
      <div className={`p-6 sm:p-7 rounded-3xl border relative overflow-hidden transition-all text-center ${
        darkMode 
          ? 'bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border-purple-800/40 text-white' 
          : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-purple-200 text-slate-900'
      }`}>
        <div className="max-w-md mx-auto space-y-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
            Daily Reward Chest 🎁
          </span>

          <div className="my-3 flex justify-center">
            <button
              onClick={handleOpenMysteryChest}
              disabled={chestOpened || openingChest}
              className={`relative group transition-transform ${
                openingChest ? 'animate-bounce' : chestOpened ? '' : 'hover:scale-110 active:scale-95 cursor-pointer'
              }`}
            >
              <div className={`text-6xl sm:text-7xl filter drop-shadow-xl ${
                chestOpened ? 'opacity-80' : 'animate-pulse'
              }`}>
                {chestOpened ? '💎' : openingChest ? '✨' : '🎁'}
              </div>
              {!chestOpened && (
                <span className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  READY
                </span>
              )}
            </button>
          </div>

          {chestOpened && chestReward ? (
            <div className="p-4 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 animate-fadeIn">
              <h4 className="font-extrabold text-sm">{chestReward.message}</h4>
              <p className="text-xs text-slate-500 mt-1">Come back tomorrow for your next mystery drop!</p>
            </div>
          ) : (
            <>
              <h3 className="text-base sm:text-lg font-black">
                {openingChest ? 'Unlocking Mystery Box...' : 'Tap the Gift Box to Claim Today\'s Loot!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guaranteed bonus XP, streak shields, and surprise achievements every 24 hours.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Streak Milestones & Badges */}
      <div className={`p-6 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-orange-500" />
          Streak Milestones & Rewards
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {milestones.map((m) => (
            <div
              key={m.days}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                m.unlocked 
                  ? 'bg-amber-500/10 border-amber-500/30 text-slate-900 dark:text-white' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  m.unlocked 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}>
                  {m.days}d
                </div>
                <div>
                  <h4 className="text-xs font-bold">{m.title}</h4>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    +{m.xp} XP Reward
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                m.unlocked 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {m.unlocked ? 'CLAIMED ✓' : `${m.days - streakDays}d left`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
