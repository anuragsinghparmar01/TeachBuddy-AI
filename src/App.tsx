import React, { useState, useEffect } from 'react';
import type { UserProfile, AdminSettings, ActiveTab } from './types';
import { 
  DEFAULT_USER, 
  DEFAULT_ADMIN_SETTINGS, 
  getLocalUser, 
  saveLocalUser, 
  getLocalAdminSettings,
  getAdminSettings,
  listenToUserProfile 
} from './firebase';

import { Navbar } from './components/Navbar';
import { TeachingModule } from './components/TeachingModule';
import { QuizModule } from './components/QuizModule';
import { ProblemSolverModule } from './components/ProblemSolverModule';
import { NotesModule } from './components/NotesModule';
import { GamesModule } from './components/GamesModule';
import { ScheduleModule } from './components/ScheduleModule';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { StreaksModule } from './components/StreaksModule';
import { BrainSprintModule } from './components/BrainSprintModule';
import { AiMascotWidget } from './components/AiMascotWidget';
import { VoiceCallModal } from './components/VoiceCallModal';
import { AuthModal } from './components/AuthModal';
import { AuthPortal } from './components/AuthPortal';
import { OpeningAnimation } from './components/OpeningAnimation';
import { AdminPanel } from './components/AdminPanel';

import { PhoneCall } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => getLocalUser());
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => getLocalAdminSettings());
  const [activeTab, setActiveTab] = useState<ActiveTab>('explain');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('teachbuddy_dark') === 'true' || false;
  });

  // Flow states: Opening animation -> Authentication -> Main Website
  const [showAnimation, setShowAnimation] = useState<boolean>(() => {
    return sessionStorage.getItem('teachbuddy_intro_seen') !== 'true';
  });
  
  // Cross-module topic bridge
  const [currentTopicForModule, setCurrentTopicForModule] = useState<string>('');

  // Modals state
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [voiceCallInitialTopic, setVoiceCallInitialTopic] = useState<string | undefined>(undefined);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Load latest admin settings from Firestore
  useEffect(() => {
    getAdminSettings().then((settings) => {
      if (settings && settings.features) {
        setAdminSettings(settings);
      }
    }).catch((err) => {
      console.warn('Failed to load admin settings:', err);
    });
  }, []);

  // Sync dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('teachbuddy_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('teachbuddy_dark', 'false');
    }
  }, [darkMode]);

  // Sync user profile changes to local storage & state
  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...updated };
      saveLocalUser(next);
      return next;
    });
  };

  // If user is signed in with Firebase UID, sync real-time changes
  useEffect(() => {
    if (user.uid && user.isAuthenticated) {
      const unsubscribe = listenToUserProfile(user.uid, (data) => {
        if (data) {
          setUser((prev) => ({ ...prev, ...data }));
        }
      });
      return () => unsubscribe();
    }
  }, [user.uid, user.isAuthenticated]);

  // Voice Call Helpers
  const handleOpenVoiceCall = (topic?: string) => {
    setVoiceCallInitialTopic(topic);
    setIsVoiceCallOpen(true);
  };

  const handleStartQuizForTopic = (topic: string) => {
    setCurrentTopicForModule(topic);
    setActiveTab('quiz');
  };

  // Handle intro animation finish
  const handleAnimationComplete = () => {
    sessionStorage.setItem('teachbuddy_intro_seen', 'true');
    setShowAnimation(false);
  };

  // Determine active font class
  const getActiveFontClass = (): string => {
    if (user.childMode) return 'font-fredoka';
    switch (adminSettings?.activeFont) {
      case 'Fredoka':
        return 'font-fredoka';
      case 'Plus Jakarta Sans':
        return 'font-jakarta';
      case 'Space Mono':
        return 'font-mono-tech';
      case 'Outfit':
      default:
        return 'font-outfit';
    }
  };

  // STEP 1: Opening Animation
  if (showAnimation) {
    return (
      <OpeningAnimation 
        onComplete={handleAnimationComplete} 
        theme={user.openingTheme || 'command_center'}
      />
    );
  }

  // STEP 2: Authentication First Portal (if user not authenticated yet)
  if (!user.isAuthenticated) {
    return (
      <AuthPortal
        onLoginSuccess={(authedUser) => {
          handleUpdateUser(authedUser);
        }}
        onContinueAsGuest={() => {
          handleUpdateUser({ isAuthenticated: true });
        }}
      />
    );
  }

  // STEP 3: Main Website Application
  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col ${getActiveFontClass()} ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-800'
    }`}>
      {/* Clean, Professional Top Navbar */}
      <Navbar
        user={user}
        adminSettings={adminSettings}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenVoiceCall={() => handleOpenVoiceCall()}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onOpenAdminPanel={() => setIsAdminOpen(true)}
        onLogout={() => {
          handleUpdateUser({ isAuthenticated: false, email: '' });
        }}
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onUpdateUser={handleUpdateUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8">
        {(activeTab === 'explain' || activeTab === 'teach' || activeTab === 'dashboard') && (
          <TeachingModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
            onStartQuizForTopic={handleStartQuizForTopic}
            initialTopic={currentTopicForModule}
          />
        )}

        {activeTab === 'notes' && (
          <NotesModule
            user={user}
            darkMode={darkMode}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {activeTab === 'solver' && (
          <ProblemSolverModule
            user={user}
            darkMode={darkMode}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {(activeTab === 'quizzes' || activeTab === 'quiz') && (
          <QuizModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
            initialTopic={currentTopicForModule}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {activeTab === 'games' && (
          <GamesModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
            onStartQuizForTopic={handleStartQuizForTopic}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
            onNavigate={(tab) => {
              setActiveTab(tab as ActiveTab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={() => {
              handleUpdateUser({ isAuthenticated: false, email: '' });
            }}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            user={user}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onUpdateUser={handleUpdateUser}
            onReplayOpening={() => setShowAnimation(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
          />
        )}

        {activeTab === 'streaks' && (
          <StreaksModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {activeTab === 'challenge' && (
          <BrainSprintModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </main>

      {/* Interactive AI Mascot Floating Helper */}
      <AiMascotWidget
        user={user}
        darkMode={darkMode}
        onOpenVoiceCall={() => handleOpenVoiceCall()}
      />

      {/* Floating Voice Call Shortcut */}
      {adminSettings?.features?.voiceCallEnabled && (
        <aside aria-label="Voice Tutor Call" className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-30 hidden sm:block">
          <button
            onClick={() => handleOpenVoiceCall()}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Start Voice Session"
          >
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="text-left">
              <span className="font-bold text-xs tracking-tight whitespace-nowrap text-white">
                Voice Call
              </span>
            </div>
          </button>
        </aside>
      )}

      {/* Clean, Professional Footer */}
      <footer className={`mt-auto border-t py-4 text-xs transition-colors mb-16 lg:mb-0 ${
        darkMode ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shrink-0">
              <img src="/logo.png" alt="TeachBuddy AI" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              TeachBuddy AI
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className="hover:text-indigo-500 transition cursor-pointer"
            >
              Profile
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="hover:text-indigo-500 transition cursor-pointer"
            >
              Settings
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('streaks')}
              className="hover:text-indigo-500 transition cursor-pointer"
            >
              Streaks
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onOpenPremiumModal={() => {}}
        initialTopic={voiceCallInitialTopic}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onLoginSuccess={(updatedUser, isAdminLogin) => {
          handleUpdateUser(updatedUser);
          if (isAdminLogin) {
            setIsAdminOpen(true);
          }
        }}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        settings={adminSettings}
        onUpdateSettings={(newSettings) => setAdminSettings(newSettings)}
      />
    </div>
  );
}
