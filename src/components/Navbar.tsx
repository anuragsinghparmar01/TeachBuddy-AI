import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Calculator, 
  Gamepad2, 
  ChevronDown,
  Moon, 
  Sun, 
  Globe, 
  ShieldCheck, 
  Layers, 
  Menu, 
  X,
  PenTool,
  Zap,
  Heart,
  GraduationCap,
  Phone,
  FileText,
  UserCheck,
  CheckCircle2,
  Calendar,
  User,
  PhoneCall,
  Search,
  ExternalLink,
  Flame,
  Award,
  Settings
} from 'lucide-react';
import type { ActiveTab, UserProfile, AdminSettings, IndianLanguageCode } from '../types';
import { INDIAN_LANGUAGES } from '../types';
import { DEFAULT_ADMIN_SETTINGS } from '../firebase';
import { AiIcon } from './AiIcon';

interface NavbarProps {
  currentTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  user: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenVoiceCall: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  adminSettings?: AdminSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  user,
  darkMode,
  onToggleDarkMode,
  onOpenVoiceCall,
  onUpdateUser,
  adminSettings,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [moreSearchQuery, setMoreSearchQuery] = useState('');
  
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const safeSettings = adminSettings || DEFAULT_ADMIN_SETTINGS;
  const features = safeSettings.features || DEFAULT_ADMIN_SETTINGS.features;

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current && 
        !moreMenuRef.current.contains(event.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target as Node)
      ) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false);
        setIsLangOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ONLY 5 Top Headings on Computer: Explain, Notes, Solver, Games, More
  const primaryNavItems: { 
    id: 'explain' | 'notes' | 'solver' | 'games'; 
    label: string; 
    icon: React.FC<{ className?: string }>;
    accentColor: string;
    activeBgLight: string;
    activeTextLight: string;
    activeBgDark: string;
  }[] = [
    { 
      id: 'explain', 
      label: 'Explain', 
      icon: Sparkles,
      accentColor: 'indigo',
      activeBgLight: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25',
      activeTextLight: 'text-indigo-600',
      activeBgDark: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
    },
    { 
      id: 'notes', 
      label: 'Notes', 
      icon: BookOpen,
      accentColor: 'emerald',
      activeBgLight: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25',
      activeTextLight: 'text-emerald-600',
      activeBgDark: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
    },
    { 
      id: 'solver', 
      label: 'Solver', 
      icon: Calculator,
      accentColor: 'amber',
      activeBgLight: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25',
      activeTextLight: 'text-amber-600',
      activeBgDark: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-600/30'
    },
    { 
      id: 'games', 
      label: 'Games', 
      icon: Gamepad2,
      accentColor: 'fuchsia',
      activeBgLight: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/25',
      activeTextLight: 'text-fuchsia-600',
      activeBgDark: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-600/30'
    },
  ];

  // Secondary items cleanly arranged under "More"
  const moreCategories = [
    {
      category: 'Drafting & Skills',
      icon: FileText,
      color: 'sky',
      items: [
        {
          id: 'writing' as ActiveTab,
          label: 'Drafting & Legal',
          desc: 'Applications, Notices, Emails, Trust Deeds, Legal Notices & Letters',
          icon: FileText,
          badge: 'New',
          badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
        },
        {
          id: 'personality' as ActiveTab,
          label: 'Personality & Speech',
          desc: 'Body Language, Speaking Skills, Stage Presence & Confidence',
          icon: UserCheck,
          badge: 'Popular',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        },
      ]
    },
    {
      category: 'Focus & Visual Tools',
      icon: Zap,
      color: 'violet',
      items: [
        {
          id: 'focus' as ActiveTab,
          label: 'Focus & Zen Mode',
          desc: 'Pomodoro timer, Binaural Beats & distraction-free study',
          icon: Zap,
          badge: 'Zen',
          badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
        },
        {
          id: 'whiteboard' as ActiveTab,
          label: 'AI Whiteboard',
          desc: 'Interactive visual canvas, diagrams & formula sketches',
          icon: PenTool,
          badge: null,
          badgeColor: ''
        },
        {
          id: 'counsel' as ActiveTab,
          label: 'Mind Calm & Support',
          desc: 'Exam stress relief, breathing exercises & student wellness',
          icon: Heart,
          badge: 'Calm',
          badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
        },
      ]
    },
    {
      category: 'Exams & Learning',
      icon: GraduationCap,
      color: 'amber',
      items: [
        {
          id: 'exam' as ActiveTab,
          label: 'Exam Prep',
          desc: 'CBSE, JEE, NEET, UPSC, SSC mock tests & high-yield revision',
          icon: ShieldCheck,
          badge: 'Live',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        },
        {
          id: 'quiz' as ActiveTab,
          label: 'AI Quizzes',
          desc: 'Interactive concept quizzes, instant marks & explanations',
          icon: CheckCircle2,
          badge: null,
          badgeColor: ''
        },
        {
          id: 'courses' as ActiveTab,
          label: 'Smart Courses',
          desc: 'Step-by-step curricula, chapters & completion certificates',
          icon: GraduationCap,
          badge: 'Cert',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
        },
        {
          id: 'schedule' as ActiveTab,
          label: 'Study Schedule',
          desc: 'Weekly study planner, habit builder & milestone reminders',
          icon: Calendar,
          badge: null,
          badgeColor: ''
        },
      ]
    },
    {
      category: 'Profile & Settings',
      icon: User,
      color: 'slate',
      items: [
        {
          id: 'profile' as ActiveTab,
          label: 'Learner Profile',
          desc: 'Daily streak, XP leaderboard, grade settings & voice prefs',
          icon: User,
          badge: `${user.streakDays || 1}d Streak 🔥`,
          badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
        },
        {
          id: 'settings' as ActiveTab,
          label: 'Settings & AI Keys',
          desc: 'API keys, ambient study audio, voice pitch, fonts & theme modes',
          icon: Settings,
          badge: 'System',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
        },
      ]
    }
  ];

  // Flat list of all "More" items for quick search filtering
  const allMoreItems = moreCategories.flatMap(c => c.items);
  const filteredMoreItems = moreSearchQuery.trim()
    ? allMoreItems.filter(item => 
        item.label.toLowerCase().includes(moreSearchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(moreSearchQuery.toLowerCase())
      )
    : null;

  // Determine if active tab is inside "More"
  const isPrimaryTab = (id: ActiveTab) => {
    if (id === 'explain' || id === 'teach' || id === 'dashboard') return true;
    if (id === 'notes') return true;
    if (id === 'solver') return true;
    if (id === 'games') return true;
    return false;
  };

  const isMoreActive = !isPrimaryTab(currentTab);
  
  // Get active item title inside More if active
  const activeMoreItem = allMoreItems.find(item => item.id === currentTab);

  const currentLangObj = INDIAN_LANGUAGES.find(l => l.code === user.preferredLanguage) || INDIAN_LANGUAGES[0];

  const handleSelectLanguage = (code: IndianLanguageCode) => {
    onUpdateUser({ preferredLanguage: code });
    localStorage.setItem('teachbuddy_lang', code);
    setIsLangOpen(false);
  };

  const handleNavigate = (tab: ActiveTab) => {
    onChangeTab(tab);
    setIsMoreMenuOpen(false);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Top Navbar */}
      <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-colors duration-200 ${
        darkMode 
          ? 'bg-[#090d16]/90 border-slate-800/80 text-white shadow-xl shadow-black/40' 
          : 'bg-white/90 border-indigo-100/80 text-slate-900 shadow-sm shadow-indigo-100/50'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Brand - TeachBuddy AI */}
          <div 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0" 
            onClick={() => handleNavigate('explain')}
          >
            <AiIcon size="sm" variant="gemini" glow={true} pulse={false} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-outfit">
                  TeachBuddy<span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">AI</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <span className="hidden sm:block text-[10px] font-medium text-slate-400 dark:text-slate-400 -mt-0.5 tracking-wide">
                Smart Indian AI Study Companion
              </span>
            </div>
          </div>

          {/* COMPUTER HEADING NAVIGATION: EXACTLY 5 ITEMS (Explain, Notes, Solver, Games, More) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold backdrop-blur-md shadow-xs">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = (
                (item.id === 'explain' && (currentTab === 'explain' || currentTab === 'teach' || currentTab === 'dashboard')) ||
                currentTab === item.id
              );
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                    isActive
                      ? darkMode
                        ? item.activeBgDark
                        : item.activeBgLight
                      : darkMode
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className={isActive ? 'font-bold tracking-tight' : 'font-medium'}>{item.label}</span>
                </button>
              );
            })}

            {/* 5th ITEM: "More" DROPDOWN TRIGGER */}
            <div className="relative">
              <button
                ref={moreButtonRef}
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                  isMoreActive
                    ? darkMode
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 font-bold'
                      : 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200 shadow-xs font-bold'
                    : isMoreMenuOpen
                      ? darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 shadow-xs'
                      : darkMode
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
                title="All Additional Tools, Drafting, Personality, Exams & Tools"
              >
                <Layers className={`w-4 h-4 ${isMoreActive ? (darkMode ? 'text-white' : 'text-indigo-600') : 'text-slate-400'}`} />
                <span>
                  {isMoreActive && activeMoreItem ? `More: ${activeMoreItem.label.split(' ')[0]}` : 'More'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                {isMoreActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
                )}
              </button>

              {/* MEGA DROPDOWN MENU FOR "MORE" */}
              {isMoreMenuOpen && (
                <div 
                  ref={moreMenuRef}
                  className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-[340px] sm:w-[540px] max-h-[82vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-fadeIn space-y-4"
                >
                  {/* Dropdown Header & Search */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Explore More Modules
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Writing, Soft Skills, Visual Tools & Exams
                      </p>
                    </div>

                    <button 
                      onClick={() => setIsMoreMenuOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Search inside More */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search features (e.g. Legal Notice, Resume, Focus)..."
                      value={moreSearchQuery}
                      onChange={(e) => setMoreSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  {/* Filtered Search Results or Categorized Grid */}
                  {filteredMoreItems ? (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Matching Results ({filteredMoreItems.length})
                      </div>
                      {filteredMoreItems.map((item) => {
                        const Icon = item.icon;
                        const isItemActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-3 transition cursor-pointer ${
                              isItemActive
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{item.label}</span>
                                {item.badge && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {moreCategories.map((group) => {
                        const GroupIcon = group.icon;
                        return (
                          <div 
                            key={group.category} 
                            className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 space-y-2"
                          >
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                              <GroupIcon className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{group.category}</span>
                            </div>

                            <div className="space-y-1">
                              {group.items.map((item) => {
                                const ItemIcon = item.icon;
                                const isItemActive = currentTab === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => handleNavigate(item.id)}
                                    className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                                      isItemActive
                                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                                        : 'hover:bg-white dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <ItemIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isItemActive ? 'text-white' : 'text-indigo-500'}`} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-xs ${isItemActive ? 'font-black' : 'font-semibold'}`}>
                                          {item.label}
                                        </span>
                                        {item.badge && !isItemActive && (
                                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${item.badgeColor}`}>
                                            {item.badge}
                                          </span>
                                        )}
                                      </div>
                                      <p className={`text-[10px] leading-tight line-clamp-1 mt-0.5 ${
                                        isItemActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                                      }`}>
                                        {item.desc}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Certification Quick CTA inside More Dropdown */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                          Course Certification Helpdesk
                        </span>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Helpline: 9455109687
                        </p>
                      </div>
                    </div>
                    <a
                      href="tel:9455109687"
                      className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Actions & Utilities Right Header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-xs font-semibold hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer"
                title="Select Indian Language"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="hidden sm:inline font-medium">{currentLangObj.name}</span>
                <span className="sm:hidden text-xs">{currentLangObj.flag}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Indian Language
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {INDIAN_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                          user.preferredLanguage === lang.code ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voice Call Tutor Header Button */}
            {features?.voiceCallEnabled && (
              <button
                onClick={onOpenVoiceCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-md shadow-indigo-500/25 active:scale-95 cursor-pointer"
                title="Start Voice Session with TeachBuddy"
              >
                <PhoneCall className="w-3.5 h-3.5 fill-white/20 animate-pulse" />
                <span className="hidden sm:inline">Voice Call</span>
              </button>
            )}

            {/* Theme Toggle (Rich Light & Dark Mode) */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700/60 active:scale-90"
              title={darkMode ? "Switch to Vibrant Light Mode" : "Switch to Deep Dark Mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Direct Settings Header Action */}
            <button
              onClick={() => handleNavigate('settings')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                currentTab === 'settings'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border-slate-200/60 dark:border-slate-700/60'
              }`}
              title="Settings & Preferences (API Keys, Audio, Voice, Fonts, Themes)"
            >
              <Settings className={`w-4 h-4 ${currentTab === 'settings' ? 'rotate-90 text-white' : 'text-slate-500 dark:text-slate-400 hover:rotate-45 transition-transform duration-300'}`} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            {/* Mobile Menu Button (Hamburger) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Full Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-4 shadow-2xl animate-fadeIn space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Quick 5 Main Tabs on Top */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Primary Sections
              </div>
              <div className="grid grid-cols-2 gap-2">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = (
                    (item.id === 'explain' && (currentTab === 'explain' || currentTab === 'teach' || currentTab === 'dashboard')) ||
                    currentTab === item.id
                  );
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`flex items-center gap-2 p-3 rounded-2xl font-bold text-xs transition cursor-pointer ${
                        isActive
                          ? item.activeBgLight
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Organized Categories */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Specialized Modules & Tools
              </div>

              {moreCategories.map((group) => (
                <div key={group.category} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {group.category}
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                            <span className="text-xs font-semibold truncate">{item.label}</span>
                          </div>
                          {item.badge && !isActive && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Tutor Call Action */}
            <button
              onClick={() => {
                onOpenVoiceCall();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>Start Live AI Voice Tutor Call</span>
            </button>
          </div>
        )}
      </header>

      {/* MOBILE LEAST-HEADINGS BOTTOM DOCK: EXACTLY 5 TABS (Explain, Notes, Solver, Games, More) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 safe-area-bottom shadow-2xl">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
          {/* 1. Explain */}
          <button
            onClick={() => handleNavigate('explain')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              (currentTab === 'explain' || currentTab === 'teach' || currentTab === 'dashboard')
                ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              (currentTab === 'explain' || currentTab === 'teach' || currentTab === 'dashboard')
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30' 
                : 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-1">Explain</span>
          </button>

          {/* 2. Notes */}
          <button
            onClick={() => handleNavigate('notes')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'notes'
                ? 'text-emerald-600 dark:text-emerald-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              currentTab === 'notes'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30' 
                : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-1">Notes</span>
          </button>

          {/* 3. Solver */}
          <button
            onClick={() => handleNavigate('solver')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'solver'
                ? 'text-amber-600 dark:text-amber-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-amber-500 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              currentTab === 'solver'
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30' 
                : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400'
            }`}>
              <Calculator className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-1">Solver</span>
          </button>

          {/* 4. Games */}
          <button
            onClick={() => handleNavigate('games')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'games'
                ? 'text-fuchsia-600 dark:text-fuchsia-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-fuchsia-500 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              currentTab === 'games'
                ? 'bg-gradient-to-tr from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/30' 
                : 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20 text-fuchsia-500 dark:text-fuchsia-400'
            }`}>
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-1">Games</span>
          </button>

          {/* 5. More (Toggles Drawer with All Tools & Features) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
              isMoreActive || isMobileMenuOpen
                ? 'text-cyan-600 dark:text-cyan-400 font-black scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-cyan-500 font-semibold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              isMoreActive || isMobileMenuOpen
                ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30' 
                : 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500 dark:text-cyan-400'
            }`}>
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-1">
              {isMoreActive && activeMoreItem ? activeMoreItem.label.split(' ')[0] : 'More'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
