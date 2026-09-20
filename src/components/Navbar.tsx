import React, { useState } from 'react';
import { 
  Sparkles, 
  PhoneCall, 
  Moon, 
  Sun, 
  BookOpen, 
  CheckCircle2, 
  Calculator, 
  Calendar, 
  User, 
  Settings, 
  ShieldCheck, 
  Globe, 
  ChevronDown, 
  Gamepad2,
  Menu,
  X,
  Layers,
  Zap
} from 'lucide-react';
import { AiIcon } from './AiIcon';
import type { UserProfile, AdminSettings, ActiveTab, IndianLanguageCode } from '../types';
import { INDIAN_LANGUAGES } from '../types';
import { DEFAULT_ADMIN_SETTINGS } from '../firebase';

interface NavbarProps {
  user: UserProfile;
  adminSettings?: AdminSettings;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleChildMode?: () => void;
  onOpenVoiceCall: () => void;
  onOpenAuthModal?: () => void;
  onOpenAuth?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
  currentTab?: string;
  activeTab?: string;
  onChangeTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  adminSettings,
  darkMode,
  onToggleDarkMode,
  onOpenVoiceCall,
  onOpenAuthModal,
  onOpenAuth,
  onOpenAdminPanel,
  onOpenAdmin,
  currentTab: propCurrentTab,
  activeTab: propActiveTab,
  onChangeTab: propOnChangeTab,
  onNavigate: propOnNavigate,
  onUpdateUser = (_updated: Partial<UserProfile>) => {},
}) => {
  const currentTab = propActiveTab || propCurrentTab || 'explain';
  const onChangeTab = propOnNavigate || propOnChangeTab || (() => {});
  const handleOpenAuth = onOpenAuthModal || onOpenAuth || (() => {});
  const handleOpenAdmin = onOpenAdminPanel || onOpenAdmin || (() => {});

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const safeSettings = adminSettings || DEFAULT_ADMIN_SETTINGS;
  const features = safeSettings.features || DEFAULT_ADMIN_SETTINGS.features;
  const isAdmin = user.email?.toLowerCase() === 'anuragsinghparmar95@gmail.com' || user.role === 'admin';

  // Desktop Navigation Items
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'explain', label: 'Explain', icon: Sparkles },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'solver', label: 'Solver', icon: Calculator },
    { id: 'quiz', label: 'Quiz', icon: CheckCircle2 },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentLangObj = INDIAN_LANGUAGES.find(l => l.code === user.preferredLanguage) || INDIAN_LANGUAGES[0];

  const handleSelectLanguage = (code: IndianLanguageCode) => {
    onUpdateUser({ preferredLanguage: code });
    localStorage.setItem('teachbuddy_lang', code);
    setIsLangOpen(false);
  };

  const isTabActive = (id: ActiveTab) => {
    if (id === 'explain') return currentTab === 'explain' || currentTab === 'teach' || currentTab === 'dashboard';
    if (id === 'quiz') return currentTab === 'quiz' || currentTab === 'quizzes';
    return currentTab === id;
  };

  const handleMobileNavigate = (id: ActiveTab) => {
    onChangeTab(id);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Top Navbar */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-200 ${
        darkMode 
          ? 'bg-[#090d16]/90 border-slate-800/80 text-white shadow-lg shadow-black/30' 
          : 'bg-white/90 border-slate-200/80 text-slate-900 shadow-sm shadow-slate-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand - TeachBuddy AI */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group" 
            onClick={() => onChangeTab('explain')}
          >
            <AiIcon size="sm" variant="gemini" glow={true} pulse={false} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-outfit">
                  TeachBuddy<span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">AI</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <span className="hidden sm:block text-[10px] font-medium text-slate-400 -mt-0.5 tracking-wide">
                Smart Indian AI Study Companion
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isTabActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer select-none ${
                    active
                      ? darkMode
                        ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                        : 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
                      : darkMode
                        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? (darkMode ? 'text-white' : 'text-indigo-600') : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold hover:border-slate-300 transition cursor-pointer"
                title="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="hidden sm:inline">{currentLangObj.name}</span>
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

            {/* Voice Call Quick Trigger */}
            {features?.voiceCallEnabled && (
              <button
                onClick={onOpenVoiceCall}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer"
                title="Start Voice Session with TeachBuddy"
              >
                <PhoneCall className="w-3.5 h-3.5 fill-white/20" />
                <span className="hidden sm:inline">Voice Call</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Admin Panel Icon */}
            {isAdmin && (
              <button
                onClick={handleOpenAdmin}
                className="hidden sm:flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-xs cursor-pointer"
                title="Admin Panel"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

            {/* User Avatar / Sign In */}
            {user.email ? (
              <button
                onClick={() => onChangeTab('profile')}
                className="flex items-center p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="View Profile"
              >
                {user.avatarImage ? (
                  <img 
                    src={user.avatarImage} 
                    alt="Avatar" 
                    className="w-7 h-7 rounded-full object-cover border border-indigo-400" 
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.avatarPreset || (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={handleOpenAuth}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Mobile Drawer Toggle (Tablet/Mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Expandable Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl animate-fadeIn">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              All Study Features
            </div>
            <div className="grid grid-cols-2 gap-2 pb-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isTabActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileNavigate(item.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  onOpenVoiceCall();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Start Live Voice Call Tutor</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => { handleOpenAdmin(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Admin Portal</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR (Ergonomic 5-Action Dock with Prominent Voice Call Orb) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/90 safe-area-bottom shadow-2xl">
        <div className="flex items-center justify-between px-3 py-1 max-w-md mx-auto">
          {/* Explain Tab */}
          <button
            onClick={() => handleMobileNavigate('explain')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              isTabActive('explain')
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${isTabActive('explain') ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-0.5">Explain</span>
          </button>

          {/* Notes Tab */}
          <button
            onClick={() => handleMobileNavigate('notes')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              isTabActive('notes')
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${isTabActive('notes') ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-0.5">Notes</span>
          </button>

          {/* Centerpiece: Prominent Voice Call Button */}
          <button
            onClick={onOpenVoiceCall}
            className="flex flex-col items-center justify-center -mt-4 cursor-pointer group"
            title="Start Live AI Tutor Call"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 group-active:scale-95 transition-all border-2 border-white dark:border-[#090d16]">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">Call Tutor</span>
          </button>

          {/* Solver Tab */}
          <button
            onClick={() => handleMobileNavigate('solver')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              isTabActive('solver')
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${isTabActive('solver') ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
              <Calculator className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-0.5">Solver</span>
          </button>

          {/* More Drawer Tab */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              isMobileMenuOpen
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${isMobileMenuOpen ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight leading-none mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
