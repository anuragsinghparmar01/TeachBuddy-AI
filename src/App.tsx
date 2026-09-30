import React, { useState, useEffect } from 'react';
import type { UserProfile, AdminSettings, ActiveTab } from './types';
import { 
  DEFAULT_USER, 
  DEFAULT_ADMIN_SETTINGS, 
  getLocalUser, 
  saveLocalUser, 
  getLocalAdminSettings,
  getAdminSettings,
  listenToUserProfile,
  auth,
  getUserProfile,
  logoutUser
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

import { 
  PhoneCall, 
  Sparkles, 
  Zap, 
  BookOpen, 
  Calculator, 
  PenTool, 
  CheckCircle2, 
  Gamepad2 
} from 'lucide-react';

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

  // Listen for Firebase Auth state changes
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          const isAdminUser = Boolean(firebaseUser.email?.toLowerCase() === 'anuragsinghparmar95@gmail.com' || firebaseUser.email?.includes('admin'));
          if (profile) {
            setUser((prev) => ({
              ...prev,
              ...profile,
              uid: firebaseUser.uid,
              email: firebaseUser.email || profile.email,
              role: isAdminUser ? 'admin' : (profile.role || 'student'),
              isAuthenticated: true,
            }));
          } else {
            handleUpdateUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Student Scholar',
              role: isAdminUser ? 'admin' : 'student',
              isAuthenticated: true,
            });
          }
        } catch (e) {
          console.warn('onAuthStateChanged load notice:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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

  // Cross module navigation helper: Jump to 3D Pomodoro Focus Timer with a pre-filled goal
  const handleStartFocusForTopic = (topic: string) => {
    setCurrentTopicForModule(topic);
    setActiveTab('focus');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Font family class helper based on settings
  const getActiveFontClass = () => {
    switch ((user as any).fontFamily) {
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

  const quickStudioModules: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'explain', label: 'AI Concept Tutor', icon: Sparkles },
    { id: 'focus', label: 'Pomodoro Focus', icon: Zap },
    { id: 'notes', label: 'Smart Notes', icon: BookOpen },
    { id: 'solver', label: 'Problem Solver', icon: Calculator },
    { id: 'whiteboard', label: 'Visual Canvas', icon: PenTool },
    { id: 'quiz', label: 'Practice Quiz', icon: CheckCircle2 },
    { id: 'games', label: 'Brain Games', icon: Gamepad2 },
  ];

  // STEP 3: Main Website Application
  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col relative ${getActiveFontClass()} ${
      darkMode ? 'bg-[#060913] text-slate-100' : 'bg-slate-50/40 text-slate-800'
    }`}>
      {/* Subtle Ambient Aurora Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-indigo-500/8 dark:bg-indigo-500/12 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-sky-500/8 dark:bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-violet-500/8 dark:bg-violet-500/10 blur-3xl" />
      </div>

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
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 sm:pb-28 lg:pb-12 overflow-x-hidden">
        
        {/* Modern Studio Switcher Bar */}
        <div className="max-w-4xl mx-auto mb-4 sm:mb-5">
          <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs scrollbar-none">
            {quickStudioModules.map((mod) => {
              const Icon = mod.icon;
              const isCurrent =
                (mod.id === 'explain' && (activeTab === 'explain' || activeTab === 'teach' || activeTab === 'dashboard')) ||
                (mod.id === 'quiz' && (activeTab === 'quiz' || activeTab === 'quizzes')) ||
                activeTab === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setActiveTab(mod.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'btn-premium-indigo text-white font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {(activeTab === 'explain' || activeTab === 'teach' || activeTab === 'dashboard') && (
          <TeachingModule
            user={user}
            darkMode={darkMode}
            onUpdateUser={handleUpdateUser}
            onOpenVoiceCallWithTopic={handleOpenVoiceCall}
            onStartQuizForTopic={handleStartQuizForTopic}
            onStartFocusForTopic={handleStartFocusForTopic}
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
            initialGoal={currentTopicForModule}
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
            onLogout={async () => {
              await logoutUser();
              handleUpdateUser({ isAuthenticated: false, email: '', uid: '' });
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl btn-premium-indigo text-white cursor-pointer"
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
        user={user}
        onAuthenticateAdmin={() => setIsAuthOpen(true)}
      />
    </div>
  );
}
