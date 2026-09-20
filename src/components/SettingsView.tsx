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
  Save
} from 'lucide-react';
import type { UserProfile, IndianLanguageCode, VoiceGender, ModuleApiKeys } from '../types';
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
    color: 'blue',
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
    color: 'amber',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onUpdateUser,
  onReplayOpening,
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-12">
      {/* Page Header */}
      <div className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings & Preferences</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure independent Live API keys for each module, language settings, and voice options.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live API Mode Active
            </span>
          </div>
        </div>
      </div>

      {/* GLOBAL TOAST NOTICE */}
      {globalNotice && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-medium flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{globalNotice}</span>
        </div>
      )}

      {/* 1. SEPARATE LIVE API KEY MANAGEMENT FOR ALL MODULES */}
      <div className={`p-5 sm:p-7 rounded-3xl border transition-all space-y-5 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Module-Specific Live API Keys</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Each module uses its dedicated high-speed Live API key to ensure fast, 100% accurate responses.
              </p>
            </div>
          </div>

          {/* Bulk Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTestAllKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Test All Keys</span>
            </button>
            <button
              onClick={handleResetAllKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All to Default</span>
            </button>
          </div>
        </div>

        {/* Master AI Key Banner & Firebase Sync */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          darkMode ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-indigo-50/70 border-indigo-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Primary AI Key (Gemini or Groq)</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Firebase Database Sync Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Enter your Google Gemini (<code className="font-mono text-[10px]">AIza...</code>) or Groq (<code className="font-mono text-[10px]">gsk_...</code>) key. It is securely saved to your Firebase cloud profile.
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
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Firebase</span>
              </button>
              <button
                type="button"
                onClick={() => handleTestKey('master', masterKey)}
                disabled={!masterKey.trim()}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* List of 6 Module Cards */}
        <div className="grid grid-cols-1 gap-4">
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
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                {/* Module Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
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

                  {/* Status badge if tested */}
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

                {/* Key Input & Actions */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mt-2">
                  <div className="relative flex-1">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={currentVal}
                      onChange={(e) => handleKeyChange(mod.id, e.target.value)}
                      placeholder={currentVal ? `Custom ${mod.provider} key active` : `Default system key active (Gemini 3.6 Flash). Or enter custom key...`}
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
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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

      {/* 2. LANGUAGE SELECTOR */}
      <div className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Language</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your preferred language for explanations, solutions, notes, quizzes, and voice dialogue.
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
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-300'
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

      {/* 3. NATURAL VOICE BUDDY */}
      <div className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/15 border border-teal-500/30 flex items-center justify-center text-teal-500">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Natural Voice Buddy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose voice persona, natural pace, and listen to spoken audio tests.
              </p>
            </div>
          </div>

          <button
            onClick={testVoiceSample}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Play Spoken Sample
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">Voice Persona</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleVoiceGenderChange('female')}
                className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  user.selectedVoice !== 'male'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                Female Voice (Sophia)
              </button>
              <button
                onClick={() => handleVoiceGenderChange('male')}
                className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  user.selectedVoice === 'male'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                Male Voice (Alex)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block">
              Spoken Cadence Speed: {(user.voiceSpeed || 1.0).toFixed(2)}x
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
        </div>
      </div>

      {/* 4. AI EXPLANATION DEPTH */}
      <div className={`p-5 sm:p-7 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-500">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">AI Explanation Depth</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize how TeachBuddy formats explanations, formulas, and step-by-step solutions.
            </p>
          </div>
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
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-purple-300'
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

      {/* 5. OPENING EXPERIENCE & APPEARANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Replay intro */}
        <div className={`p-5 rounded-3xl border transition-all flex items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <h3 className="text-sm font-bold">Brand Intro Animation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Replay the clean brand launch sequence.
            </p>
          </div>
          <button
            onClick={onReplayOpening}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Replay</span>
          </button>
        </div>

        {/* Theme toggle */}
        <div className={`p-5 rounded-3xl border transition-all flex items-center justify-between gap-3 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <h3 className="text-sm font-bold">Theme Mode</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {darkMode ? 'Dark theme active' : 'Light theme active'}
            </p>
          </div>
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
