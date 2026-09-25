import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  Bookmark, 
  RotateCcw,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Zap,
  Target,
  FileCheck,
  Share2
} from 'lucide-react';
import type { UserProfile, AgeGroup } from '../types';
import { aiService } from '../services/aiService';
import { audioService } from '../services/audioService';
import { saveNoteToFirestore } from '../firebase';

interface TeachingModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onStartQuizForTopic?: (topic: string) => void;
  onSaveAsNote?: (topic: string, content: string) => void;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  initialTopic?: string;
}

export const TeachingModule: React.FC<TeachingModuleProps> = ({
  user,
  darkMode,
  onStartQuizForTopic = (_t?: string) => {},
  onSaveAsNote = (_t?: string, _c?: string) => {},
  onOpenVoiceCallWithTopic = (_t?: string) => {},
  initialTopic,
}) => {
  const [topicInput, setTopicInput] = useState(initialTopic || 'Newton\'s Laws of Motion');
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lesson, setLesson] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Learning Mode: Comprehensive, ELI5 / Story, Exam High-Yield, Speed Revision
  const [studyMode, setStudyMode] = useState<'standard' | 'eli5' | 'exam' | 'speed'>('standard');

  // Pre-loaded popular basic questions that students frequently ask
  const popularBasicQuestions = [
    { label: "Newton's 3 Laws of Motion", icon: '⚛️', question: "Explain Newton's 3 laws of motion with daily life examples" },
    { label: "How Photosynthesis Works", icon: '🌿', question: "How do plants convert sunlight into food and oxygen?" },
    { label: "Pythagoras Theorem", icon: '📐', question: "Explain Pythagoras Theorem with simple visual analogy and formula" },
    { label: "DNA & Genetics Basics", icon: '🧬', question: "What is DNA and how does it pass traits to children?" },
    { label: "How Electricity Flows", icon: '⚡', question: "What is voltage, current and resistance in simple terms?" },
    { label: "What is an Algorithm?", icon: '💻', question: "What is a computer algorithm and why is it like a cooking recipe?" },
  ];

  useEffect(() => {
    if (initialTopic && initialTopic.trim()) {
      setTopicInput(initialTopic);
      handleTeach(initialTopic, studyMode);
    } else if (!lesson) {
      handleTeach("Newton's 3 Laws of Motion", studyMode);
    }
  }, [initialTopic]);

  const handleTeach = async (topicToTeach?: string, modeOverride?: 'standard' | 'eli5' | 'exam' | 'speed') => {
    const topic = (topicToTeach || topicInput).trim();
    if (!topic) return;

    const currentMode = modeOverride || studyMode;
    setTopicInput(topic);
    setIsLoading(true);
    setShowAnswer(false);
    setSavedSuccess(false);
    setErrorMessage(null);
    audioService.stopSpeaking();
    setIsReadingAloud(false);

    // Format topic prefix based on mode
    let specializedPrompt = topic;
    if (currentMode === 'eli5') {
      specializedPrompt = `Explain like I am 5 years old using a bedtime story and simple everyday objects: ${topic}`;
    } else if (currentMode === 'exam') {
      specializedPrompt = `Exam high-yield focus with formulas, scoring keywords, derivations, and expected question marks: ${topic}`;
    } else if (currentMode === 'speed') {
      specializedPrompt = `Quick 30-second bullet point cheat-sheet and memory hooks: ${topic}`;
    }

    try {
      const data = await aiService.teachTopic(
        specializedPrompt, 
        user.ageGroup || 'high_school', 
        user.institution, 
        undefined, 
        user.preferredLanguage,
        'General Science & Math'
      );
      if (data && (data.title || data.explanation)) {
        setLesson(data);
      } else {
        throw new Error("Unable to parse lesson. Please try again.");
      }
    } catch (err: any) {
      console.error("TeachTopic error:", err);
      setErrorMessage(err?.message || "Failed to generate explanation. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (mode: 'standard' | 'eli5' | 'exam' | 'speed') => {
    setStudyMode(mode);
    handleTeach(topicInput, mode);
  };

  const handleReadAloud = () => {
    if (isReadingAloud) {
      audioService.stopSpeaking();
      setIsReadingAloud(false);
      return;
    }

    if (!lesson) return;

    const textParts = [
      `Explanation for ${lesson.title || topicInput}.`,
      lesson.analogy ? `Everyday analogy: ${lesson.analogy}` : '',
      lesson.explanation || '',
      lesson.proTip ? `Pro Tip: ${lesson.proTip}` : ''
    ].filter(Boolean).join('\n\n');

    setIsReadingAloud(true);
    audioService.speak(
      textParts, 
      user.selectedVoice || 'female', 
      user.voiceSpeed || 1.0, 
      user.voicePitch || 1.0, 
      user.preferredLanguage || 'hi-IN',
      () => setIsReadingAloud(true),
      () => setIsReadingAloud(false)
    );
  };

  const handleSaveNote = () => {
    if (!lesson) return;
    const noteToSave: any = {
      id: `note-${Date.now()}`,
      topic: lesson.title || topicInput,
      subject: 'Concept Mastery',
      summary: lesson.analogy || lesson.explanation?.slice(0, 160) || '',
      bulletPoints: lesson.howToSteps || [lesson.explanation?.slice(0, 200)],
      formulasAndKeyTerms: (lesson.rulesOrFormulas || []).map((r: string) => ({ term: 'Rule/Formula', definition: r })),
      practiceQuestions: lesson.quickCheck ? [lesson.quickCheck.question] : [],
      createdAt: new Date().toISOString(),
    };

    if (user.uid) {
      saveNoteToFirestore(user.uid, noteToSave);
    }
    onSaveAsNote(lesson.title || topicInput, lesson.explanation);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
      {/* Search & Topic Prompt Bar with Vibrant Light Mode Styling */}
      <div className={`p-4 sm:p-6 rounded-3xl border transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl shadow-black/20' 
          : 'bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 border-indigo-200/90 text-slate-900 shadow-xl shadow-indigo-500/5'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight font-outfit text-slate-900 dark:text-white">
                  Interactive AI Tutor
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                  Concept Mastery
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Ask any question or tap a popular concept below to learn step-by-step
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenVoiceCallWithTopic(topicInput)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-center active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5 fill-white/20 animate-pulse" />
            <span>Live Voice Tutor</span>
          </button>
        </div>

        {/* Learning Mode Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pr-1">
            Study Mode:
          </span>
          {[
            { id: 'standard' as const, label: 'Comprehensive', icon: BookOpen, color: 'indigo' },
            { id: 'eli5' as const, label: 'ELI5 & Stories', icon: Lightbulb, color: 'amber' },
            { id: 'exam' as const, label: 'Exam High-Yield', icon: Target, color: 'emerald' },
            { id: 'speed' as const, label: '30s Speed Revision', icon: Zap, color: 'fuchsia' },
          ].map((mode) => {
            const Icon = mode.icon;
            const isCurrent = studyMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                  isCurrent
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clean Search Input */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTeach()}
            placeholder="Ask anything: e.g. Why is the sky blue? How does gravity work?..."
            className="flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 border border-indigo-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs text-slate-900 dark:text-white"
          />
          <button
            onClick={() => handleTeach()}
            disabled={isLoading || !topicInput.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Explaining...' : 'Explain Concept'}</span>
          </button>
        </div>

        {/* Preloaded 1-Click Basic Questions */}
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
            Trending Study Concepts (Tap to learn):
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {popularBasicQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleTeach(q.question)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  topicInput === q.question && lesson
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-xs'
                    : 'bg-white/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 shadow-2xs'
                }`}
              >
                <span>{q.icon}</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleTeach()}
            className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Lesson View */}
      {lesson && (
        <div className="space-y-4 animate-fadeIn">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="text-sm sm:text-base font-black font-outfit text-slate-900 dark:text-white">
              {lesson.title || topicInput}
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReadAloud}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer active:scale-95 ${
                  isReadingAloud
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
              >
                {isReadingAloud ? (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-3 bg-white animate-soundwave-1 rounded-full" />
                    <span className="w-1.5 h-4 bg-white animate-soundwave-2 rounded-full" />
                    <span className="w-1.5 h-2 bg-white animate-soundwave-3 rounded-full" />
                  </div>
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span>{isReadingAloud ? 'Speaking...' : 'Listen Aloud'}</span>
              </button>

              <button
                onClick={handleSaveNote}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  savedSuccess
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
                <span>{savedSuccess ? 'Saved to Notes' : 'Save Note'}</span>
              </button>

              <button
                onClick={() => onStartQuizForTopic(lesson.title || topicInput)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20 active:scale-95"
              >
                <span>Take Quiz</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Everyday Analogy Card */}
          {lesson.analogy && (
            <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              darkMode 
                ? 'bg-slate-900/80 border-slate-800 text-white' 
                : 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border-amber-200 text-slate-900 shadow-md shadow-amber-500/5'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Real-World Analogy & Mental Model
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">
                {lesson.analogy}
              </p>
            </div>
          )}

          {/* Core Step-by-Step Breakdown */}
          <div className={`p-6 rounded-3xl border ${
            darkMode 
              ? 'bg-slate-900/80 border-slate-800 text-white' 
              : 'bg-white border-slate-200/90 text-slate-900 shadow-md shadow-slate-200/50'
          }`}>
            <div className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Step-by-Step Explanation</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line mb-4 font-normal">
              {lesson.explanation}
            </p>

            {/* How-To Steps */}
            {lesson.howToSteps && lesson.howToSteps.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Sequential Application Steps:
                </div>
                {lesson.howToSteps.map((step: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border border-indigo-200/60 dark:border-indigo-800">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulas / Rules if any */}
          {lesson.rulesOrFormulas && lesson.rulesOrFormulas.length > 0 && (
            <div className={`p-5 rounded-3xl border ${
              darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 border-indigo-200/80 text-slate-900 shadow-sm'
            }`}>
              <div className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Governing Formulas & Scientific Laws</span>
              </div>
              <div className="space-y-2">
                {lesson.rulesOrFormulas.map((rule: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white dark:bg-slate-950 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-slate-800 shadow-2xs">
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pro Tip */}
          {lesson.proTip && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              darkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-emerald-50/60 border-emerald-200 text-slate-900 shadow-2xs'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Exam Pro-Tip & High-Yield Mnemonic</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                {lesson.proTip}
              </p>
            </div>
          )}

          {/* Quick Concept Check Question */}
          {lesson.quickCheck && (
            <div className={`p-5 sm:p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-gradient-to-br from-violet-50/70 via-white to-indigo-50/50 border-violet-200 text-slate-900 shadow-md shadow-violet-500/5'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">
                  Concept Check Challenge
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                {lesson.quickCheck.question}
              </p>

              {showAnswer ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-900/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed animate-fadeIn">
                  ✅ <strong className="text-emerald-600 dark:text-emerald-400 font-black">Answer:</strong> {lesson.quickCheck.answer}
                </div>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-violet-500/20 active:scale-95"
                >
                  Reveal Solution
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
