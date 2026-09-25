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
import { WhiteboardModule } from './components/WhiteboardModule';
import { FocusModeModule } from './components/FocusModeModule';
import { ExamPrepModule } from './components/ExamPrepModule';
import { CounselingModule } from './components/CounselingModule';
import { CoursesModule } from './components/CoursesModule';
import { WritingDraftingModule } from './components/WritingDraftingModule';
import { PersonalitySpeakingModule } from './components/PersonalitySpeakingModule';
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

  // Cross module navigation helper: Jump to quiz with a pre-filled topic
  const handleStartQuizForTopic = (topic: string) => {
    setCurrentTopicForModule(topic);
    setActiveTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Font family class helper based on settings
  const getActiveFontClass = () => {
    switch (user.fontFamily) {
      case 'dyslexic':
        return 'font-dyslexic';
      case 'serif':
        return 'font-serif';
      case 'mono':
        return 'font-mono';
      default:
        return 'font-sans';
    }
  };

  // STEP 1: Opening Animation
  if (showAnimation) {
    const handleDismissIntro = () => {
      sessionStorage.setItem('teachbuddy_intro_seen', 'true');
      setShowAnimation(false);
    };

    return (
      <OpeningAnimation
        onComplete={handleDismissIntro}
        onFinish={handleDismissIntro}
      />
    );
  }

  // STEP 2: First-time Guest / Authentication Screen
  if (!user.isAuthenticated && !sessionStorage.getItem('teachbuddy_guest_dismissed')) {
    return (
      <AuthPortal
        darkMode={darkMode}
        onGuestContinue={(name) => {
          sessionStorage.setItem('teachbuddy_guest_dismissed', 'true');
          handleUpdateUser({
            name: name || 'Student',
            isAuthenticated: false,
          });
        }}
        onLoginSuccess={(authedUser, isAdminLogin) => {
          sessionStorage.setItem('teachbuddy_guest_dismissed', 'true');
          handleUpdateUser({
            ...authedUser,
            isAuthenticated: true,
          });
          if (isAdminLogin) {
            setIsAdminOpen(true);
          }
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
        currentTab={activeTab}
        onChangeTab={(tab) => {
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

        {activeTab === 'whiteboard' && (
          <WhiteboardModule
            user={user}
            darkMode={darkMode}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {activeTab === 'focus' && (
          <FocusModeModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {activeTab === 'exam' && (
          <ExamPrepModule
            user={user}
            darkMode={darkMode}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
            onStartQuizForTopic={handleStartQuizForTopic}
          />
        )}

        {activeTab === 'counsel' && (
          <CounselingModule
            user={user}
            darkMode={darkMode}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {activeTab === 'writing' && (
          <WritingDraftingModule
            user={user}
            darkMode={darkMode}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {activeTab === 'personality' && (
          <PersonalitySpeakingModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
          />
        )}

        {activeTab === 'courses' && (
          <CoursesModule
            user={user}
            darkMode={darkMode}
            onStartQuizForTopic={handleStartQuizForTopic}
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
        onStartSprint={() => setActiveTab('challenge')}
        onOpenVoiceCallWithTopic={(topic) => handleOpenVoiceCall(topic)}
      />

      {/* Floating Voice Call Shortcut */}
      {adminSettings?.features?.voiceCallEnabled && (
        <aside aria-label="Voice Tutor Call" className="fixed bottom-20 sm:bottom-6 right-22 sm:right-26 z-30 hidden sm:block">
          <button
            onClick={() => handleOpenVoiceCall()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/30"
            title="Start Live Voice Session"
          >
            <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <span className="font-bold text-xs tracking-tight whitespace-nowrap text-white">
              Voice Tutor
            </span>
          </button>
        </aside>
      )}

      {/* Sleek, Minimalist Bottom Footer with Rich Colors & No Dull Grey Clutter */}
      <footer className={`mt-auto border-t py-3.5 text-xs transition-colors mb-16 lg:mb-0 ${
        darkMode ? 'bg-slate-950/90 border-indigo-500/20 text-slate-300' : 'bg-white/95 border-indigo-100 text-slate-700'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-lg overflow-hidden border border-indigo-500/30 bg-slate-950 shrink-0">
              <img src="/logo.png" alt="TeachBuddy AI" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent text-xs">
              TeachBuddy AI
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          <a 
            href="tel:9455109687"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold hover:scale-105 transition cursor-pointer"
          >
            <span>📜 Certification Hotline:</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">📞 9455109687</span>
          </a>
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
