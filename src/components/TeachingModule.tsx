import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Bookmark, 
  RefreshCw,
  PhoneCall,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  Layers,
  ChevronRight,
  Zap,
  Flame
} from 'lucide-react';
import { AiIcon } from './AiIcon';
import type { UserProfile, AgeGroup } from '../types';
import { ALL_SUBJECTS } from '../types';
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
  onStartQuizForTopic = (_topic: string) => {},
  onSaveAsNote = (_topic: string, _content: string) => {},
  onOpenVoiceCallWithTopic = (_topic: string) => {},
  initialTopic,
}) => {
  const [topicInput, setTopicInput] = useState(initialTopic || '');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [selectedAge, setSelectedAge] = useState<AgeGroup>(user.ageGroup || 'high_school');
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lesson, setLesson] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'formulas' | 'quiz'>('overview');

  useEffect(() => {
    if (initialTopic && initialTopic.trim()) {
      setTopicInput(initialTopic);
      handleTeach(initialTopic);
    }
  }, [initialTopic]);

  // Curated multi-subject quick prompts
  const sampleTopicsBySubject: Record<string, { label: string; subject: string }[]> = {
    Mathematics: [
      { label: "Calculus: Product & Chain Rules", subject: "Mathematics" },
      { label: "Matrix Determinants & Inverses", subject: "Mathematics" },
      { label: "Pythagorean Theorem & Trigonometry", subject: "Mathematics" },
    ],
    Physics: [
      { label: "Newton's Laws of Motion & Friction", subject: "Physics" },
      { label: "Electromagnetic Induction & Faraday's Law", subject: "Physics" },
      { label: "Quantum Photoelectric Effect", subject: "Physics" },
    ],
    Chemistry: [
      { label: "Balancing Redox Reactions", subject: "Chemistry" },
      { label: "Periodic Table Periodic Trends", subject: "Chemistry" },
      { label: "Chemical Thermodynamics & Enthalpy", subject: "Chemistry" },
    ],
    Biology: [
      { label: "Photosynthesis & Calvin Cycle", subject: "Biology" },
      { label: "DNA Replication & Transcription", subject: "Biology" },
      { label: "Human Circulatory & Heart System", subject: "Biology" },
    ],
    'Computer Science & AI': [
      { label: "How Neural Networks Learn with Backprop", subject: "Computer Science & AI" },
      { label: "Time Complexity & Big-O Notation", subject: "Computer Science & AI" },
      { label: "Binary Search Trees & Recursion", subject: "Computer Science & AI" },
    ],
    'Economics & Commerce': [
      { label: "Supply, Demand & Elasticity", subject: "Economics & Commerce" },
      { label: "Fiscal Policy vs Monetary Policy", subject: "Economics & Commerce" },
    ],
  };

  const currentSampleTopics = sampleTopicsBySubject[selectedSubject] || [
    { label: `Core Principles of ${selectedSubject}`, subject: selectedSubject },
    { label: `Practical Breakthrough Examples in ${selectedSubject}`, subject: selectedSubject },
  ];

  const handleTeach = async (topicToTeach?: string, overrideSubject?: string) => {
    const topic = (topicToTeach || topicInput).trim();
    if (!topic) return;

    const subjectToUse = overrideSubject || selectedSubject;

    setIsLoading(true);
    setShowAnswer(false);
    setSavedSuccess(false);
    setErrorMessage(null);
    audioService.stopSpeaking();
    setIsReadingAloud(false);
    setActiveTab('overview');

    try {
      const data = await aiService.teachTopic(
        topic, 
        selectedAge, 
        user.institution, 
        undefined, 
        user.preferredLanguage,
        subjectToUse
      );
      if (data && (data.title || data.explanation)) {
        setLesson(data);
      } else {
        throw new Error("Unable to parse lesson response. Please try again.");
      }
    } catch (err: any) {
      console.error("TeachTopic error:", err);
      setErrorMessage(err?.message || "Failed to generate lesson. Please check your connection and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadAloud = () => {
    if (isReadingAloud) {
      audioService.stopSpeaking();
      setIsReadingAloud(false);
      return;
    }

    if (!lesson) return;

    const textParts = [
      `Lesson on ${lesson.title || topicInput}.`,
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
    const content = [
      `# ${lesson.title || topicInput}`,
      `**Subject**: ${selectedSubject} | **Level**: ${selectedAge}`,
      lesson.analogy ? `\n### Everyday Analogy\n${lesson.analogy}` : '',
      `\n### Core Explanation\n${lesson.explanation}`,
      lesson.howToSteps && lesson.howToSteps.length > 0 ? `\n### Step-by-Step Procedure\n${lesson.howToSteps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}` : '',
      lesson.rulesOrFormulas && lesson.rulesOrFormulas.length > 0 ? `\n### Formulas & Laws\n${lesson.rulesOrFormulas.map((r: string) => `- ${r}`).join('\n')}` : '',
      lesson.proTip ? `\n### Pro Tip\n${lesson.proTip}` : '',
    ].filter(Boolean).join('\n');

    const noteToSave: any = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic: lesson.title || topicInput,
      subject: selectedSubject,
      chapter: 'AI Concept Lesson',
      unit: 'Mastery',
      ageGroup: selectedAge,
      summary: lesson.analogy || lesson.explanation?.slice(0, 160) || '',
      bulletPoints: lesson.howToSteps && lesson.howToSteps.length > 0 ? lesson.howToSteps : [lesson.explanation?.slice(0, 200)],
      formulasAndKeyTerms: (lesson.rulesOrFormulas || []).map((r: string) => ({ term: 'Rule / Formula', definition: r })),
      mindmapOutline: [
        { main: lesson.title || topicInput, subtopics: lesson.howToSteps?.slice(0, 3) || ['Concepts', 'Examples', 'Formulas'] }
      ],
      practiceQuestions: lesson.quickCheck ? [lesson.quickCheck.question] : [],
      tags: [selectedSubject, 'Explain Lesson', 'TeachBuddy AI'],
      createdAt: new Date().toISOString(),
    };

    saveNoteToFirestore(user.uid || 'guest', noteToSave);

    onSaveAsNote(lesson.title || topicInput, content);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. CREATIVE HERO & COMMAND CENTER */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-[#0e1422] via-[#0b101c] to-[#080c14] border-slate-800/80 shadow-xl shadow-black/30' 
          : 'bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/40 border-slate-200/90 shadow-lg shadow-indigo-500/5'
      }`}>
        {/* Subtle Ambient Background Orbs */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Dynamic Headings & Badges */}
            <div className="space-y-3 max-w-2xl">
              {/* Status Eyebrow Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/25 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini 3.6 Flash Active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Zero-Lag Engine
                </span>
                {user.streakCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    {user.streakCount} Day Streak
                  </span>
                )}
              </div>

              {/* Master Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Master Any Concept with <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">Deep Intuition</span>
              </h1>

              {/* Inspiring Subtitle */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Break down complex topics into everyday analogies, visual step-by-step procedures, key formulas, and exam tips designed for your exact curriculum.
              </p>
            </div>

            {/* Right: Bespoke AI Icon + Quick Call Buddy Launcher */}
            <div className="flex sm:flex-col items-center lg:items-end gap-3 shrink-0">
              <div className="hidden sm:block">
                <AiIcon size="lg" variant="gemini" glow={true} pulse={isLoading} />
              </div>
              
              <button
                onClick={() => onOpenVoiceCallWithTopic(topicInput || 'General Study Discussion')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 fill-white/20" />
                <span>Call Voice Buddy</span>
              </button>
            </div>
          </div>

          {/* Academic Level & Configuration Controls Strip */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            {/* Level Selector */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 shadow-xs text-xs font-semibold">
              <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Target Level:</span>
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value as AgeGroup)}
                className="bg-transparent border-0 font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer text-xs"
              >
                <option value="child">Kids (Ages 6-10)</option>
                <option value="middle_school">Middle School (11-13)</option>
                <option value="high_school">High School (14-17)</option>
                <option value="college">College / University</option>
                <option value="competitive_exam">Competitive Exams (JEE / NEET / SAT)</option>
                <option value="professional">Professional & Advanced</option>
              </select>
            </div>

            {/* Language Pill */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Language:</span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 font-bold">
                {user.preferredLanguage || 'en-IN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBJECT SELECTION STRIP */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        darkMode ? 'bg-[#0e1422] border-slate-800/80' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Curriculum Subject:
          </span>
          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
            {selectedSubject}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ALL_SUBJECTS.map((sub) => {
            const isSelected = selectedSubject === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-md shadow-indigo-600/25 scale-[1.02]'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MASTER OMNIBOX & SEARCH BAR */}
      <div className={`p-4 sm:p-6 rounded-3xl border transition-all ${
        darkMode ? 'bg-[#0e1422] border-slate-800/80' : 'bg-white border-slate-200/80 shadow-md shadow-slate-200/40'
      }`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTeach();
              }}
              placeholder={`Ask any question in ${selectedSubject}, e.g. "How does CRISPR gene editing work?" or "Derive Quadratic Formula"...`}
              className="w-full px-4 py-3.5 pl-11 pr-24 rounded-2xl border text-xs sm:text-sm font-medium bg-slate-50/90 dark:bg-slate-950/70 border-slate-300/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            <Sparkles className="w-5 h-5 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <span className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ↵ Enter
            </span>
          </div>

          <button
            onClick={() => handleTeach()}
            disabled={isLoading || !topicInput.trim()}
            className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Explaining with AI...</span>
              </>
            ) : (
              <>
                <span>Explain Concept</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Curated Recommendations */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold shrink-0 text-[11px] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quick Prompts:
          </span>
          {currentSampleTopics.map((t, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedSubject(t.subject);
                handleTeach(t.label, t.subject);
              }}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-transparent hover:border-indigo-300/80 dark:hover:border-indigo-700/80 transition cursor-pointer"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleTeach()}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. STRUCTURED LESSON WORKSPACE */}
      {lesson && (
        <div className={`rounded-3xl border shadow-xl overflow-hidden animate-fadeIn transition-all ${
          darkMode ? 'bg-[#0e1422] border-slate-800/80 text-white' : 'bg-white border-slate-200/90 text-slate-900'
        }`}>
          {/* Lesson Header Banner */}
          <div className="p-6 sm:p-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">
                    {selectedSubject} Mastery
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {user.preferredLanguage || 'English'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {lesson.title}
                </h2>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Voice Read Aloud with Animated Equalizer waves */}
                <button
                  onClick={handleReadAloud}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isReadingAloud
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isReadingAloud ? (
                    <>
                      <div className="flex items-end gap-0.5 h-4">
                        <span className="w-1 bg-white rounded-full animate-soundwave-1" />
                        <span className="w-1 bg-white rounded-full animate-soundwave-2" />
                        <span className="w-1 bg-white rounded-full animate-soundwave-3" />
                      </div>
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-indigo-500" />
                      <span>Listen Aloud</span>
                    </>
                  )}
                </button>

                {/* Call Voice Tutor */}
                <button
                  onClick={() => onOpenVoiceCallWithTopic(lesson.title || topicInput)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-xs cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Tutor</span>
                </button>

                {/* Save Note */}
                <button
                  onClick={handleSaveNote}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    savedSuccess
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{savedSuccess ? 'Saved to Notes!' : 'Save Note'}</span>
                </button>

                {/* Take Quiz */}
                <button
                  onClick={() => onStartQuizForTopic(lesson.title || topicInput)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quiz Me</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none -mb-6 sm:-mb-8">
              {[
                { id: 'overview', label: '1. Analogy & Intuition', icon: Lightbulb },
                { id: 'steps', label: '2. Step-by-Step Procedure', icon: Layers },
                { id: 'formulas', label: '3. Rules & Equations', icon: BookOpen },
                { id: 'quiz', label: '4. Quick Check & Practice', icon: HelpCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                const isTabActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                      isTabActive
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#0e1422] rounded-t-xl shadow-xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Real World Analogy Box */}
                {lesson.analogy && (
                  <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-base font-bold shadow-md shadow-indigo-600/30">
                      💡
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                        Everyday Intuition & Analogy
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed font-medium">
                        {lesson.analogy}
                      </p>
                    </div>
                  </div>
                )}

                {/* Core Deep Explanation */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Comprehensive Conceptual Breakdown
                  </h3>
                  <div className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-normal">
                    {lesson.explanation}
                  </div>
                </div>

                {/* Pro Tip */}
                {lesson.proTip && (
                  <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3.5">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                        Exam Pro Tip & Mnemonic
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                        {lesson.proTip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    How-To Step-by-Step Procedure
                  </h3>
                </div>

                {lesson.howToSteps && lesson.howToSteps.length > 0 ? (
                  <div className="grid gap-3">
                    {lesson.howToSteps.map((step: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3.5"
                      >
                        <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          {idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No procedural steps provided for this topic.</p>
                )}
              </div>
            )}

            {activeTab === 'formulas' && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Governing Laws, Equations & Definitions
                </h3>

                {lesson.rulesOrFormulas && lesson.rulesOrFormulas.length > 0 ? (
                  <div className="grid gap-2.5">
                    {lesson.rulesOrFormulas.map((rule: string, i: number) => (
                      <div 
                        key={i}
                        className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3 text-xs sm:text-sm font-mono text-indigo-900 dark:text-indigo-200"
                      >
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No specific mathematical equations or laws for this topic.</p>
                )}
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="space-y-4 animate-fadeIn">
                {lesson.quickCheck ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" /> Concept Check
                      </span>
                      <button
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 underline cursor-pointer"
                      >
                        {showAnswer ? 'Hide Solution' : 'Reveal Solution'}
                      </button>
                    </div>

                    <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                      {lesson.quickCheck.question}
                    </p>

                    {showAnswer && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 animate-fadeIn">
                        <span className="font-bold mr-1.5">Verified Answer:</span>
                        {lesson.quickCheck.answer}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No quick check question available.</p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onStartQuizForTopic(lesson.title || topicInput)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <span>Launch 5-Question Quiz on This Topic</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
