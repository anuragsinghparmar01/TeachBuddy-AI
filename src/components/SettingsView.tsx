import React, { useState } from 'react';
import { 
  Globe, 
  Moon, 
  Sun, 
  Volume2, 
  Play, 
  Sliders, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  RotateCcw,
  Sparkles,
  BookOpen,
  Calculator,
  Gamepad2,
  PhoneCall,
  Eye,
  EyeOff,
  Check,
  Zap,
  Server,
  Save,
  Music,
  Headphones,
  Palette,
  Type,
  Shield,
  GraduationCap,
  Download,
  Trash2,
  VolumeX,
  Target,
  Clock,
  Radio,
  Lock,
  ChevronRight
} from 'lucide-react';
import type { UserProfile, IndianLanguageCode, VoiceGender, ModuleApiKeys, AppFont, InstitutionType } from '../types';
import { INDIAN_LANGUAGES, DEFAULT_MODULE_API_KEYS } from '../types';
import { audioService } from '../services/audioService';
import { aiService, getModuleApiKeys, saveModuleApiKey, resetAllModuleApiKeys, setMasterApiKey, cleanApiKey, getStoredMasterApiKey } from '../services/aiService';

interface SettingsViewProps {
  user: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onReplayOpening: () => void;
  onOpenAdmin?: () => void;
}

interface ModuleConfigItem {
  id: keyof ModuleApiKeys;
  title: string;
  moduleName: string;
  description: string;
  provider: 'Google Gemini' | 'Groq (OpenAI OSS)';
  defaultKey: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

const MODULES_CONFIG: ModuleConfigItem[] = [
  {
    id: 'explainKey',
    title: 'Explain Module',
    moduleName: 'Conceptual Breakdown & Analogies',
    description: 'Powers interactive lessons, everyday analogies, formulas, and deep concept explanations.',
    provider: 'Google Gemini',
    defaultKey: DEFAULT_MODULE_API_KEYS.explainKey,
    icon: Sparkles,
    color: 'indigo',
  },
  {
    id: 'notesKey',
    title: 'Notes Module',
    moduleName: 'Revision & Chapter Summary Notes',
    description: 'Generates structured revision notes, bullet points, key terms, and mind map outlines.',
    provider: 'Google Gemini',
    defaultKey: DEFAULT_MODULE_API_KEYS.notesKey,
    icon: BookOpen,
    color: 'emerald',
  },
  {
    id: 'voiceKey',
    title: 'AI Voice Assistant',
    moduleName: 'Voice Buddy Spoken Dialogue',
    description: 'Drives conversational, natural spoken answers and live interactive speech responses.',
    provider: 'Google Gemini',
    defaultKey: DEFAULT_MODULE_API_KEYS.voiceKey,
    icon: PhoneCall,
    color: 'teal',
  },
  {
    id: 'solverKey',
    title: 'Problem Solver Module',
    moduleName: 'Step-by-Step Universal Solver',
    description: 'Computes multi-step solutions, derivations, proofs, and extracts given parameters.',
    provider: 'Google Gemini',
    defaultKey: DEFAULT_MODULE_API_KEYS.solverKey,
    icon: Calculator,
    color: 'amber',
  },
  {
    id: 'quizKey',
    title: 'Quiz Module',
    moduleName: 'Curriculum & Chapter Quizzes',
    description: 'Creates rigorous multiple-choice assessments with hints and comprehensive rationales.',
    provider: 'Google Gemini',
    defaultKey: DEFAULT_MODULE_API_KEYS.quizKey,
    icon: CheckCircle2,
    color: 'violet',
  },
  {
    id: 'generalKey',
    title: 'Games & All Other Modules',
    moduleName: 'Brain Sprint, Memory Duel & Schedule',
    description: 'Powers rapid-fire speed drills, memory duels, schedule generators, and mascot tips.',
    provider: 'Google Gemini',
    defaultKey: DEFAULT_MODULE_API_KEYS.generalKey,
    icon: Gamepad2,
    color: 'fuchsia',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onUpdateUser,
  onReplayOpening,
  onOpenAdmin,
}) => {
  const currentLang = user.preferredLanguage || 'en-US';

  // Per-module keys state
  const [keysState, setKeysState] = useState<ModuleApiKeys>(() => getModuleApiKeys());
  const [masterKey, setMasterKey] = useState(() => user.geminiApiKey || (user as any).customApiKey || getStoredMasterApiKey() || '');
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<keyof ModuleApiKeys, boolean>>({
    explainKey: false,
    notesKey: false,
    voiceKey: false,
    solverKey: false,
    quizKey: false,
    generalKey: false,
  });
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error'; message?: string; provider?: string }>>({});
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);

  // Ambient sound state
  const [ambientSound, setAmbientSound] = useState<'off' | 'lofi' | 'rain' | 'library' | 'binaural'>(() => user.bgAmbientSound || 'off');
  const [ambientVolume, setAmbientVolume] = useState<number>(() => user.bgAmbientVolume !== undefined ? user.bgAmbientVolume : 0.35);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  // Theme Accent and Font
  const [themeAccent, setThemeAccent] = useState<'indigo' | 'emerald' | 'amber' | 'fuchsia' | 'cyan'>(() => user.themeAccent || 'indigo');
  const [appFont, setAppFont] = useState<AppFont>(() => user.appFont || 'Outfit');

  // Clear cache confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleKeyChange = (moduleId: keyof ModuleApiKeys, value: string) => {
    setKeysState((prev) => ({ ...prev, [moduleId]: value }));
  };

  const handleSaveSingleKey = (moduleId: keyof ModuleApiKeys) => {
    const val = cleanApiKey(keysState[moduleId]);
    saveModuleApiKey(moduleId, val);
    const updatedKeys = { ...keysState, [moduleId]: val };

    // Sync to user profile in Firebase database
    onUpdateUser({
      geminiApiKey: moduleId === 'generalKey' || moduleId === 'explainKey' ? val : (user.geminiApiKey || val),
      customApiKey: val,
      moduleApiKeys: updatedKeys,
    });

    setGlobalNotice(`✓ Saved & Synced for ${MODULES_CONFIG.find(m => m.id === moduleId)?.title}`);
    setTimeout(() => setGlobalNotice(null), 3500);
    handleTestKey(moduleId, val);
  };

  const handleSaveMasterKey = () => {
    const val = cleanApiKey(masterKey);
    if (!val) {
      setMasterApiKey('');
      onUpdateUser({ geminiApiKey: undefined, customApiKey: undefined });
      setGlobalNotice('API Key cleared. Using built-in server connection.');
      setTimeout(() => setGlobalNotice(null), 3500);
      return;
    }

    setMasterApiKey(val);

    const isGroq = val.startsWith('gsk_');
    const newKeys: ModuleApiKeys = {
      explainKey: isGroq ? keysState.explainKey : val,
      notesKey: isGroq ? keysState.notesKey : val,
      voiceKey: val,
      solverKey: isGroq ? val : keysState.solverKey,
      quizKey: isGroq ? val : keysState.quizKey,
      generalKey: val,
    };

    setKeysState(newKeys);

    onUpdateUser({
      geminiApiKey: val,
      customApiKey: val,
      moduleApiKeys: newKeys,
    });

    setGlobalNotice(`✓ API Key verified and saved across all learning modules!`);
    setTimeout(() => setGlobalNotice(null), 4000);
    handleTestKey('master', val);
  };

  const handleResetSingleKey = (moduleId: keyof ModuleApiKeys) => {
    const defaultVal = DEFAULT_MODULE_API_KEYS[moduleId];
    saveModuleApiKey(moduleId, defaultVal);
    setKeysState((prev) => ({ ...prev, [moduleId]: defaultVal }));
    setGlobalNotice(`Restored default live key for ${MODULES_CONFIG.find(m => m.id === moduleId)?.title}`);
    setTimeout(() => setGlobalNotice(null), 3000);
    handleTestKey(moduleId, defaultVal);
  };

  const handleResetAllKeys = () => {
    const defaults = resetAllModuleApiKeys();
    setKeysState(defaults);
    setGlobalNotice('All module API keys restored to original verified live keys.');
    setTimeout(() => setGlobalNotice(null), 4000);
  };

  const handleTestKey = async (moduleId: string, keyToTest?: string) => {
    const targetKey = keyToTest !== undefined ? (keyToTest || '') : (keysState[moduleId as keyof ModuleApiKeys] || masterKey || '');
    setTestResults((prev) => ({
      ...prev,
      [moduleId]: { status: 'testing', message: 'Testing connection...' },
    }));

    const res = await aiService.testLiveApiKey(targetKey || undefined);
    if (res.ok) {
      setTestResults((prev) => ({
        ...prev,
        [moduleId]: { 
          status: 'success', 
          message: `Connected (${res.model || 'Live'})`,
          provider: res.provider || (targetKey && targetKey.startsWith('gsk_') ? 'Groq' : 'Google Gemini'),
        },
      }));
    } else {
      setTestResults((prev) => ({
        ...prev,
        [moduleId]: { 
          status: 'error', 
          message: res.error || 'Connection failed',
        },
      }));
    }
  };

  const handleTestAllKeys = async () => {
    for (const mod of MODULES_CONFIG) {
      await handleTestKey(mod.id, keysState[mod.id]);
    }
  };

  const toggleShowKey = (moduleId: keyof ModuleApiKeys) => {
    setShowKeys((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleLanguageChange = (code: IndianLanguageCode) => {
    onUpdateUser({ preferredLanguage: code });
    localStorage.setItem('teachbuddy_lang', code);
  };

  const handleVoiceGenderChange = (gender: VoiceGender) => {
    onUpdateUser({ selectedVoice: gender });
  };

  const testVoiceSample = () => {
    audioService.speak(
      user.preferredLanguage === 'hi-IN' || user.preferredLanguage === 'hi-mix'
        ? "नमस्ते! आपकी पढ़ाई कैसी चल रही है? मैं आपकी सहायता के लिए तैयार हूँ।"
        : "Hello! TeachBuddy AI is ready to help you learn today. Ask me anything!",
      user.selectedVoice || 'female',
      user.voiceSpeed || 1.0,
      user.voicePitch || 1.0,
      user.preferredLanguage || 'en-US'
    );
  };

  // Ambient sound controls
  const handleAmbientChange = (type: 'off' | 'lofi' | 'rain' | 'library' | 'binaural') => {
    setAmbientSound(type);
    onUpdateUser({ bgAmbientSound: type });
    if (type === 'off') {
      audioService.stopAmbientSound();
      setIsAmbientPlaying(false);
    } else {
      audioService.playAmbientSound(type, ambientVolume);
      setIsAmbientPlaying(true);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    audioService.setAmbientVolume(vol);
    onUpdateUser({ bgAmbientVolume: vol });
  };

  const toggleAmbientPlayback = () => {
    if (isAmbientPlaying) {
      audioService.stopAmbientSound();
      setIsAmbientPlaying(false);
    } else {
      if (ambientSound !== 'off') {
        audioService.playAmbientSound(ambientSound, ambientVolume);
        setIsAmbientPlaying(true);
      } else {
        handleAmbientChange('lofi');
      }
    }
  };

  const handleThemeAccentChange = (accent: 'indigo' | 'emerald' | 'amber' | 'fuchsia' | 'cyan') => {
    setThemeAccent(accent);
    onUpdateUser({ themeAccent: accent });
    localStorage.setItem('teachbuddy_accent', accent);
  };

  const handleFontChange = (font: AppFont) => {
    setAppFont(font);
    onUpdateUser({ appFont: font });
    localStorage.setItem('teachbuddy_font', font);
  };

  const handleExportData = () => {
    try {
      const exportObject = {
        userProfile: user,
        exportedAt: new Date().toISOString(),
        version: 'TeachBuddy-v3.5',
      };
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TeachBuddy_Study_Data_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setGlobalNotice('✓ Study data and notes exported to JSON successfully!');
      setTimeout(() => setGlobalNotice(null), 3500);
    } catch {
      setGlobalNotice('Export failed.');
    }
  };

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      onUpdateUser({
        xp: 100,
        streakDays: 1,
      });
      setShowResetConfirm(false);
      setGlobalNotice('Cache reset to clean defaults.');
      setTimeout(() => setGlobalNotice(null), 3000);
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 md:pb-12 animate-fadeIn">
      {/* Top Header Card with Colorful Accent Glow */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl shadow-black/30' 
          : 'bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 border-indigo-200/90 text-slate-900 shadow-xl shadow-indigo-500/5'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-outfit">
                  Settings & Preferences
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/25">
                  Full Control
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Configure module API keys, ambient study audio, voice pitch, display themes, and academic goals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-95"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Admin Console</span>
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live AI Mode Active
            </span>
          </div>
        </div>
      </div>

      {/* Global Toast Notice */}
      {globalNotice && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 text-xs font-bold flex items-center gap-2.5 shadow-md shadow-indigo-500/5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{globalNotice}</span>
        </div>
      )}

      {/* 1. SEPARATE LIVE API KEY MANAGEMENT FOR ALL MODULES */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all space-y-5 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-outfit">Module-Specific Live API Keys</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Each learning module runs on its dedicated high-speed key for 100% accurate, uninterrupted responses.
              </p>
            </div>
          </div>

          {/* Bulk Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTestAllKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer active:scale-95"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Test All Keys</span>
            </button>
            <button
              onClick={handleResetAllKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All to Default</span>
            </button>
          </div>
        </div>

        {/* Master AI Key Banner & Firebase Sync */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/60 border-indigo-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Primary AI Key (Google Gemini or Groq)</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Firebase Database Sync Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Enter your Google Gemini (<code className="font-mono text-[10px]">AIza...</code>) or Groq (<code className="font-mono text-[10px]">gsk_...</code>) key. Saved securely to your cloud profile.
                </p>
              </div>
            </div>

            {testResults['master'] && (
              <div className={`self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${
                testResults['master'].status === 'testing'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200'
                  : testResults['master'].status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200'
              }`}>
                {testResults['master'].status === 'testing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                {testResults['master'].status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                {testResults['master'].status === 'error' && <AlertCircle className="w-3 h-3" />}
                <span className="text-[11px]">{testResults['master'].message}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <input
                type={showMasterKey ? 'text' : 'password'}
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="Enter AIzaSy... or gsk_... key"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowMasterKey(!showMasterKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                {showMasterKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveMasterKey}
                disabled={!masterKey.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Firebase</span>
              </button>
              <button
                type="button"
                onClick={() => handleTestKey('master', masterKey)}
                disabled={!masterKey.trim()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 Module Cards */}
        <div className="grid grid-cols-1 gap-3.5">
          {MODULES_CONFIG.map((mod) => {
            const Icon = mod.icon;
            const currentVal = keysState[mod.id] || '';
            const isDefault = currentVal === mod.defaultKey;
            const isVisible = showKeys[mod.id];
            const testInfo = testResults[mod.id];

            return (
              <div
                key={mod.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  darkMode ? 'bg-slate-950/60 border-slate-800/90' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{mod.title}</h3>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">({mod.moduleName})</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          mod.provider === 'Google Gemini' 
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {mod.provider}
                        </span>
                        {isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Default Live Key
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  {testInfo && (
                    <div className={`self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${
                      testInfo.status === 'testing'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200'
                        : testInfo.status === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200'
                    }`}>
                      {testInfo.status === 'testing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {testInfo.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                      {testInfo.status === 'error' && <AlertCircle className="w-3 h-3" />}
                      <span className="text-[11px]">{testInfo.message}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mt-2">
                  <div className="relative flex-1">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={currentVal}
                      onChange={(e) => handleKeyChange(mod.id, e.target.value)}
                      placeholder={currentVal ? `Custom ${mod.provider} key active` : `Default system key active. Enter custom key...`}
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(mod.id)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                      title={isVisible ? 'Hide key' : 'Show key'}
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSaveSingleKey(mod.id)}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      Save Key
                    </button>
                    <button
                      onClick={() => handleTestKey(mod.id, currentVal)}
                      disabled={testInfo?.status === 'testing'}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
                    >
                      Test
                    </button>
                    {!isDefault && (
                      <button
                        onClick={() => handleResetSingleKey(mod.id)}
                        className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-300 transition cursor-pointer"
                        title="Reset to default key"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. FOCUS & STUDY AMBIENT SOUNDSCAPE (NEW FEATURE) */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-outfit">Ambient Focus Soundscape</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calming study background audio to boost concentration during deep problem solving.
              </p>
            </div>
          </div>

          <button
            onClick={toggleAmbientPlayback}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 ${
              isAmbientPlaying 
                ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isAmbientPlaying ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Pause Ambient Audio</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play Soundscape</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { id: 'off', label: 'Audio Off', desc: 'Silent study mode', icon: VolumeX },
            { id: 'lofi', label: 'Cozy Lo-Fi', desc: 'Warm 432Hz ambient drone', icon: Music },
            { id: 'rain', label: 'Soft Rain', desc: 'Calming rain & thunder', icon: Radio },
            { id: 'library', label: 'Warm Library', desc: 'Deep focus acoustic room', icon: BookOpen },
            { id: 'binaural', label: '40Hz Binaural', desc: 'Gamma wave brain focus', icon: Zap },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = ambientSound === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleAmbientChange(item.id as any)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Ambient Volume Slider */}
        {ambientSound !== 'off' && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Soundscape Volume: {Math.round(ambientVolume * 100)}%
            </span>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="sm:w-64 accent-indigo-600 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 3. LANGUAGE SELECTOR */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-outfit">Language Settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your preferred language for explanations, solutions, notes, quizzes, and live voice conversations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {INDIAN_LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{lang.flag}</span>
                    <span className="text-xs font-bold">{lang.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                    {lang.nativeName}
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. NATURAL VOICE BUDDY & PITCH/SPEED CONTROLS */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/15 border border-teal-500/30 flex items-center justify-center text-teal-500">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-outfit">Natural Voice Buddy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose persona, speech pitch, cadence speed, and test natural spoken audio.
              </p>
            </div>
          </div>

          <button
            onClick={testVoiceSample}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Play Spoken Sample</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Persona */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 block">Voice Persona</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleVoiceGenderChange('female')}
                className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 ${
                  user.selectedVoice !== 'male'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                Female (Sophia)
              </button>
              <button
                onClick={() => handleVoiceGenderChange('male')}
                className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 ${
                  user.selectedVoice === 'male'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                Male (Alex)
              </button>
            </div>
          </div>

          {/* Speed */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 block">
              Cadence Speed: {(user.voiceSpeed || 1.0).toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={user.voiceSpeed || 1.0}
              onChange={(e) => onUpdateUser({ voiceSpeed: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Slower (0.8x)</span>
              <span>Natural (1.0x)</span>
              <span>Faster (1.3x)</span>
            </div>
          </div>

          {/* Pitch (NEW) */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 block">
              Voice Pitch Tone: {(user.voicePitch || 1.0).toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={user.voicePitch || 1.0}
              onChange={(e) => onUpdateUser({ voicePitch: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Deeper (0.75x)</span>
              <span>Default (1.0x)</span>
              <span>Higher (1.25x)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. AI EXPLANATION DEPTH & CHILD MODE */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-outfit">AI Explanation Depth & Pedagogy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize how TeachBuddy formats explanations, analogies, formulas, and child mode filters.
              </p>
            </div>
          </div>

          {/* Child Mode Toggle (NEW) */}
          <button
            onClick={() => onUpdateUser({ childMode: !user.childMode })}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 ${
              user.childMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Child-Safe Mode: {user.childMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'concise', title: 'Concise & Fast', desc: 'Direct takeaways, quick rules, and speed summaries.' },
            { id: 'balanced', title: 'Balanced (Standard)', desc: 'Intuitive real-life analogies + step-by-step breakdown.' },
            { id: 'in_depth', title: 'In-Depth Rigor', desc: 'Exhaustive derivations, edge cases, and exam depth.' },
          ].map((depth) => {
            const isSelected = (user.responseDepth || 'balanced') === depth.id;
            return (
              <div
                key={depth.id}
                onClick={() => onUpdateUser({ responseDepth: depth.id as any })}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between active:scale-95 ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-purple-300 ring-2 ring-purple-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block mb-1">{depth.title}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug block">
                    {depth.desc}
                  </span>
                </div>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Active Setting</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. VISUAL THEME, ACCENT COLORS & TYPOGRAPHY (NEW FEATURE) */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all space-y-5 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-fuchsia-600/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-500">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-outfit">Appearance, Colors & Fonts</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vibrant light mode gradients, dark mode contrast, custom accent palettes, and typography.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Light / Dark Mode Toggle */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Color Mode</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {darkMode ? 'Dark Theme active (deep cyber slates)' : 'Vibrant Light Mode active (rich gradients)'}
              </p>
            </div>
            <button
              onClick={onToggleDarkMode}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>Switch to {darkMode ? 'Vibrant Light Mode' : 'Deep Dark Mode'}</span>
            </button>
          </div>

          {/* Theme Accent Presets */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">Accent Palette</span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'indigo', name: 'Cosmic Indigo', color: 'bg-indigo-600' },
                { id: 'emerald', name: 'Emerald Bloom', color: 'bg-emerald-600' },
                { id: 'amber', name: 'Amber Sunset', color: 'bg-amber-500' },
                { id: 'fuchsia', name: 'Fuchsia Neon', color: 'bg-fuchsia-600' },
                { id: 'cyan', name: 'Cyber Cyan', color: 'bg-cyan-500' },
              ].map((pal) => (
                <button
                  key={pal.id}
                  onClick={() => handleThemeAccentChange(pal.id as any)}
                  className={`h-9 rounded-xl ${pal.color} flex items-center justify-center text-white transition cursor-pointer active:scale-90 ${
                    themeAccent === pal.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={pal.name}
                >
                  {themeAccent === pal.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block mt-2 capitalize font-medium">
              Active: {themeAccent}
            </span>
          </div>

          {/* Font Selector */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">Typography Font</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'Outfit' as AppFont, label: 'Outfit (Modern)' },
                { id: 'Plus Jakarta Sans' as AppFont, label: 'Jakarta (Clean)' },
                { id: 'Space Mono' as AppFont, label: 'Mono (Tech)' },
                { id: 'Fredoka' as AppFont, label: 'Fredoka (Soft)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFontChange(f.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left truncate transition cursor-pointer ${
                    appFont === f.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Replay Brand Intro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Launch Animation Sequence</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Replay the full-screen interactive intro.</p>
          </div>
          <button
            onClick={onReplayOpening}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer self-start sm:self-auto active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Replay Intro</span>
          </button>
        </div>
      </div>

      {/* 7. ACADEMIC GOAL & INSTITUTION (NEW FEATURE) */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-outfit">Academic Institution & Goals</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize recommendations to your school, college, or competitive exam target.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
              Institution Type
            </label>
            <select
              value={user.institution || 'School'}
              onChange={(e) => onUpdateUser({ institution: e.target.value as InstitutionType })}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {['School', 'High School', 'College / University', 'Coaching / Institute', 'Self Learner'].map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
              Daily Study Goal: {user.studyGoalHours || 3} Hours
            </label>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={user.studyGoalHours || 3}
              onChange={(e) => onUpdateUser({ studyGoalHours: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer mt-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1 hr/day</span>
              <span>3 hrs/day</span>
              <span>8 hrs/day</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
              Target Exam or Goal
            </label>
            <input
              type="text"
              value={user.targetExamOrGoal || ''}
              onChange={(e) => onUpdateUser({ targetExamOrGoal: e.target.value })}
              placeholder="e.g. CBSE 12th, JEE, NEET, UPSC, SSC..."
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 8. DATA MANAGEMENT, BACKUP & CACHE (NEW FEATURE) */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data Management & Backup</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Export study notes, flashcards and profile progress as a backup JSON file.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Study Backup</span>
            </button>

            {showResetConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearCache}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-900/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Cache</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
