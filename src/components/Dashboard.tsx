import React from 'react';
import { 
  Sparkles, 
  PhoneCall, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Calendar, 
  Flame, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  Target,
  Crown,
  Smile,
  ShieldCheck,
  Download
} from 'lucide-react';
import type { UserProfile, AdminSettings, ActiveTab } from '../types';
import { exportStudentReportToPdf } from '../services/pdfService';
import { audioService } from '../services/audioService';

interface DashboardProps {
  user: UserProfile;
  darkMode: boolean;
  adminSettings: AdminSettings;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenVoiceCall: () => void;
  onOpenPremium: () => void;
  onOpenAdmin: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  darkMode,
  adminSettings,
  onNavigateTab,
  onOpenVoiceCall,
  onOpenPremium,
  onOpenAdmin,
}) => {
  const currentXp = user.xp || 0;
  const currentLevel = user.level || 1;
  const xpForNextLevel = currentLevel * 200;
  const levelProgress = Math.min(100, Math.round(((currentXp % 200) / 200) * 100));

  const handleExportDataPdf = () => {
    audioService.playDing();
    exportStudentReportToPdf(user);
  };

  const quickActions = [
    {
      id: 'voice',
      title: 'Talk to AI Friend',
      tagline: 'Real Voice Call (Male/Female)',
      desc: 'Discuss any concept or solve doubts over interactive voice like talking to a real study buddy.',
      icon: PhoneCall,
      color: 'from-emerald-500 to-teal-600',
      action: onOpenVoiceCall,
      badge: user.isPremium ? 'PRO' : 'Popular',
    },
    {
      id: 'challenge',
      title: '60s Brain Sprint',
      tagline: 'Rapid-Fire Multiplier Drill',
      desc: 'Answer fast academic and logic questions in 60 seconds, build 5x combos, and earn massive XP.',
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
      action: () => onNavigateTab('challenge'),
      badge: 'Addictive 🔥',
    },
    {
      id: 'streaks',
      title: 'Daily Streaks & Quests',
      tagline: 'Mystery Chest & Habit Tracker',
      desc: 'Track daily study streaks, unlock today\'s mystery loot box, and protect streaks with shields.',
      icon: Flame,
      color: 'from-orange-500 to-red-600',
      action: () => onNavigateTab('streaks'),
      badge: `${user.streakDays || 1}d Streak`,
    },
    {
      id: 'teach',
      title: 'Teach Me Anything',
      tagline: 'Deep Concepts & How-To Guides',
      desc: 'Ask any subject or topic from basics to mastery with intuitive real-world analogies and code.',
      icon: BookOpen,
      color: 'from-blue-600 to-indigo-600',
      action: () => onNavigateTab('teach'),
    },
    {
      id: 'solve',
      title: 'Universal Problem Solver',
      tagline: 'Math, Science, Code & Logic',
      desc: 'Paste tricky equations or word problems and get step-by-step breakdown with scratchpad.',
      icon: HelpCircle,
      color: 'from-violet-600 to-purple-600',
      action: () => onNavigateTab('solver'),
    },
    {
      id: 'quiz',
      title: 'Topic & Chapter Quizzes',
      tagline: 'Gamified Active Recall',
      desc: 'Test your knowledge with instant AI question drills, scorecards, and answer explanations.',
      icon: Zap,
      color: 'from-fuchsia-600 to-pink-600',
      action: () => onNavigateTab('quiz'),
    },
    {
      id: 'notes',
      title: 'Smart Notes & Flashcards',
      tagline: 'Summaries & Formula Sheets',
      desc: 'Generate printable high-yield notes per Unit, Chapter, or Topic with flippable flashcards.',
      icon: FileText,
      color: 'from-cyan-600 to-blue-600',
      action: () => onNavigateTab('notes'),
    },
    {
      id: 'schedule',
      title: 'Personalized Study Plan',
      tagline: 'Timetable & Pomodoro Timer',
      desc: 'Get an AI schedule mapped to your exam date with an interactive focus study timer.',
      icon: Calendar,
      color: 'from-rose-500 to-pink-600',
      action: () => onNavigateTab('schedule'),
    },
  ];

  const badges = [
    { name: 'Curious Mind', icon: '🌱', desc: 'Started learning journey', unlocked: true },
    { name: 'Quiz Whiz', icon: '⚡', desc: 'Completed topic quiz', unlocked: (user.xp || 0) >= 25 },
    { name: 'Voice Pioneer', icon: '🎙️', desc: 'Connected on voice call', unlocked: (user.xp || 0) >= 50 },
    { name: 'Problem Master', icon: '🧩', desc: 'Solved difficult problems', unlocked: (user.xp || 0) >= 100 },
    { name: 'Streak Master', icon: '🔥', desc: 'Maintained 3+ days streak', unlocked: (user.streakDays || 1) >= 3 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl border transition-all ${
        darkMode 
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800 text-white shadow-xl' 
          : 'bg-gradient-to-br from-white via-indigo-50/50 to-blue-50/40 border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="hidden sm:block w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-indigo-500/30 bg-slate-950 shadow-md">
              <img src="/logo.png" alt="TeachBuddy Logo" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  user.childMode 
                    ? 'bg-amber-400 text-amber-950 font-black' 
                    : 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                }`}>
                  {user.childMode ? '🎈 Child Mode Active' : `🎓 ${user.institution || 'TeachBuddy AI'}`}
                </span>

                {user.isPremium ? (
                  <span className="text-xs bg-amber-400/20 text-amber-500 border border-amber-400/30 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> PRO Member
                  </span>
                ) : (
                  <button
                    onClick={onOpenPremium}
                    className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-3 py-1 rounded-full shadow-sm hover:opacity-90 flex items-center gap-1"
                  >
                    <Crown className="w-3.5 h-3.5" /> Upgrade to Pro (₹499/mo)
                  </button>
                )}

                {user.role === 'admin' && (
                  <button
                    onClick={onOpenAdmin}
                    className="text-xs bg-purple-600 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-500"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Open Admin Panel
                  </button>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Hello, {user.name}! What do you want to learn today?
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                TeachBuddy AI is your 24/7 tutor, rapid reflex coach, and real-voice companion. Learn • Grow • Together.
              </p>
            </div>
          </div>

          {/* Quick Voice Call & PDF Export Buttons */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            <button
              onClick={onOpenVoiceCall}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2.5 active:scale-95"
            >
              <div className="relative flex items-center justify-center">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-semibold text-emerald-100 uppercase tracking-wider leading-none">
                  Instant Voice Call
                </span>
                <span className="font-extrabold text-sm">Talk to AI Friend</span>
              </div>
            </button>

            <button
              onClick={handleExportDataPdf}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              title="Export complete student progress and stats as PDF"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export Report (PDF)</span>
            </button>
          </div>
        </div>

        {/* Floating Mascot for Child Mode */}
        {user.childMode && (
          <div className="absolute right-4 bottom-2 text-5xl pointer-events-none opacity-80 animate-bounce">
            🧸
          </div>
        )}
      </div>

      {/* Gamification Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Streak (Clickable) */}
        <div 
          onClick={() => onNavigateTab('streaks')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 group ${
            darkMode ? 'bg-slate-900 border-slate-800 hover:border-orange-500/50' : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
          title="Open Daily Streaks & Quests"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-orange-500 transition-colors">
              Daily Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4 fill-orange-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {user.streakDays || 1}
            </span>
            <span className="text-xs text-orange-500 font-bold">Days on Fire 🔥</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>View Quests & Loot</span>
            <span className="text-orange-500 font-bold">→</span>
          </p>
        </div>

        {/* Level & XP */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Scholar Level
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              Lvl {currentLevel}
            </span>
            <span className="text-xs text-slate-400 font-medium">({currentXp} XP)</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* Study Time */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Time Studied
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              4.5
            </span>
            <span className="text-xs text-slate-500">Hours this week</span>
          </div>
          <p className="text-[11px] text-emerald-500 font-medium mt-1">On track with goal</p>
        </div>

        {/* Accuracy */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quiz Accuracy
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              88%
            </span>
            <span className="text-xs text-slate-500">Mastery avg.</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Calculated across all drills</p>
        </div>
      </div>

      {/* Feature Navigation Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Core Learning Modules
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Everything you need to master your syllabus, exams, and projects.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={action.action}
                className={`group p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 ${
                  darkMode 
                    ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50' 
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {action.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                        {action.badge}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                    {action.tagline}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                    {action.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Launch Module</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & Achievements Carousel */}
      <div className={`p-6 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Badges & Trophies
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Earn XP to unlock special perks
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition-all ${
                badge.unlocked
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-100/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl">{badge.icon}</div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {badge.name}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {badge.desc}
              </p>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                badge.unlocked 
                  ? 'bg-amber-400 text-amber-950 font-extrabold' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {badge.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
