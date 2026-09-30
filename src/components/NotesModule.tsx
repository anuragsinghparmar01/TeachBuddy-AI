import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  BookOpen, 
  RotateCw, 
  Volume2, 
  VolumeX,
  Download,
  AlertCircle,
  Lightbulb,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { StudyNote, UserProfile } from '../types';
import { aiService } from '../services/aiService';
import { audioService } from '../services/audioService';
import { saveNoteToFirestore, getLocalNotes } from '../firebase';
import { exportStudyNoteToPdf } from '../services/pdfService';

interface NotesModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onOpenVoiceCallWithTopic: (topic: string) => void;
}

export const NotesModule: React.FC<NotesModuleProps> = ({
  user,
  darkMode,
  onOpenVoiceCallWithTopic,
}) => {
  const [topic, setTopic] = useState('Cell Division: Mitosis & Meiosis');
  const [isLoading, setIsLoading] = useState(false);
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAudioReading, setIsAudioReading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-loaded popular basic questions & topics for 1-click study
  const preloadedTopics = [
    { label: 'Mitosis & Meiosis', icon: '🧬', subject: 'Biology', desc: 'Cell division cycle and phases' },
    { label: "Newton's 3 Laws of Motion", icon: '⚛️', subject: 'Physics', desc: 'Inertia, F=ma, and reaction pairs' },
    { label: 'Quadratic Equations & Roots', icon: '📐', subject: 'Mathematics', desc: 'Factoring and quadratic formula' },
    { label: 'Photosynthesis & Light Reactions', icon: '🌿', subject: 'Biology', desc: 'Chloroplasts, ATP and Calvin Cycle' },
    { label: "Ohm's Law & Electric Circuits", icon: '⚡', subject: 'Physics', desc: 'Voltage, current and resistance' },
    { label: 'Fundamental Rights of India', icon: '📜', subject: 'Civics', desc: 'Articles 14 to 32 breakdown' },
    { label: 'Binary Search Algorithm', icon: '💻', subject: 'Computer', desc: 'Divide and conquer search in O(log n)' },
    { label: 'Periodic Table Trends', icon: '🧪', subject: 'Chemistry', desc: 'Electronegativity and atomic radii' }
  ];

  // Auto-generate default note on first view if none loaded
  useEffect(() => {
    if (!activeNote) {
      handleGenerateNotes('Cell Division: Mitosis & Meiosis', 'Biology');
    }
  }, []);

  const handleGenerateNotes = async (topicToUse?: string, subjectHint?: string) => {
    const finalTopic = topicToUse || topic;
    if (!finalTopic.trim()) return;

    setTopic(finalTopic);
    setIsLoading(true);
    setCopied(false);
    setErrorMessage(null);
    audioService.stopSpeaking();
    setIsAudioReading(false);

    try {
      const note = await aiService.generateNotes(
        finalTopic, 
        'Core Revision', 
        'Summary Unit', 
        subjectHint || 'General Science', 
        user.ageGroup, 
        user.preferredLanguage
      );
      setActiveNote(note);
      if (user.uid) {
        await saveNoteToFirestore(user.uid, note);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Failed to generate notes. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyNote = () => {
    if (!activeNote) return;
    const text = `TITLE: ${activeNote.topic}\nSubject: ${activeNote.subject}\n\nSUMMARY:\n${activeNote.summary}\n\nKEY PRINCIPLES:\n${activeNote.bulletPoints.map(p => `• ${p}`).join('\n')}\n\nFORMULAS & DEFINITIONS:\n${activeNote.formulasAndKeyTerms.map(f => `${f.term}: ${f.definition}`).join('\n')}\n\nPRACTICE QUESTIONS:\n${activeNote.practiceQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAudioListen = () => {
    if (!activeNote) return;
    if (isAudioReading) {
      audioService.stopSpeaking();
      setIsAudioReading(false);
      return;
    }

    const textToSpeak = `Study notes for ${activeNote.topic}. Summary: ${activeNote.summary}. Key points: ${activeNote.bulletPoints.join('. ')}. Key formulas: ${activeNote.formulasAndKeyTerms.map(f => `${f.term}: ${f.definition}`).join('. ')}`;
    setIsAudioReading(true);
    audioService.speak(
      textToSpeak,
      user.selectedVoice || 'female',
      user.voiceSpeed || 1.0,
      user.voicePitch || 1.0,
      user.preferredLanguage || 'hi-IN',
      () => setIsAudioReading(true),
      () => setIsAudioReading(false)
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">
      {/* Top Banner: Single Clean Search & Preloaded Chips */}
      <div className={`p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl shadow-black/20' 
          : 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 border-emerald-200/90 text-slate-900 shadow-xl shadow-emerald-500/5'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-lg font-black tracking-tight font-outfit truncate">
                  Smart Revision Notes
                </h1>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-[9px] border border-emerald-500/20">
                  1-Click Ready
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                Type any topic or tap a concept below for structured notes
              </p>
            </div>
          </div>
        </div>

        {/* Single Simple Topic Input (Single row on mobile & desktop) */}
        <div className="flex flex-row gap-1.5 sm:gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateNotes()}
              placeholder="e.g. Newton's Laws, Cell Structure..."
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 border border-emerald-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => handleGenerateNotes()}
            disabled={isLoading || !topic.trim()}
            className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
          >
            <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Generating Notes...' : 'Get Notes'}</span>
            <span className="sm:hidden">{isLoading ? '...' : 'Notes'}</span>
          </button>
        </div>

        {/* Preloaded 1-Click Topic Chips */}
        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Topics:
            </span>
            {preloadedTopics.map((pt, idx) => (
              <button
                key={idx}
                onClick={() => handleGenerateNotes(pt.label, pt.subject)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  topic === pt.label
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                }`}
              >
                <span>{pt.icon}</span>
                <span>{pt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleGenerateNotes()}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Note Content */}
      {activeNote && (
        <div className="space-y-4 animate-fadeIn">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                Subject: <strong className="text-indigo-600 dark:text-indigo-400">{activeNote.subject}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAudioListen}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                  isAudioReading
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {isAudioReading ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{isAudioReading ? 'Stop Voice' : 'Listen'}</span>
              </button>

              <button
                onClick={handleCopyNote}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => exportStudyNoteToPdf(activeNote)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>PDF</span>
              </button>

              <button
                onClick={() => onOpenVoiceCallWithTopic(activeNote.topic)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Voice Tutor</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Clean 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Summary & Key Principles */}
            <div className="lg:col-span-2 space-y-4">
              {/* Concept Summary Card */}
              <div className={`p-5 rounded-2xl border ${
                darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
              }`}>
                <h2 className="text-base sm:text-lg font-black font-outfit text-indigo-600 dark:text-indigo-400 mb-2">
                  {activeNote.topic}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {activeNote.summary}
                </p>
              </div>

              {/* Core Key Points */}
              <div className={`p-5 rounded-2xl border ${
                darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
              }`}>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Key Principles & Exam Highlights</span>
                </div>
                <ul className="space-y-2.5">
                  {activeNote.bulletPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Col: Formulas & Interactive Flashcard */}
            <div className="space-y-4">
              {/* Key Formulas / Definitions */}
              {activeNote.formulasAndKeyTerms && activeNote.formulasAndKeyTerms.length > 0 && (
                <div className={`p-4 rounded-2xl border ${
                  darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Essential Terms & Formulas
                  </div>
                  <div className="space-y-2">
                    {activeNote.formulasAndKeyTerms.slice(0, 4).map((f, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                        <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {f.term}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {f.definition}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Flashcard */}
              {activeNote.flashcards && activeNote.flashcards.length > 0 && (
                <div className={`p-4 rounded-2xl border text-center ${
                  darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>Flashcard</span>
                    <span>{flashcardIndex + 1} / {activeNote.flashcards.length}</span>
                  </div>

                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="p-5 rounded-xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-sky-500/10 border border-indigo-200 dark:border-indigo-900/60 min-h-[140px] flex flex-col items-center justify-center cursor-pointer transition hover:scale-[1.01]"
                  >
                    <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider mb-1">
                      {isFlipped ? 'Answer' : 'Question (Tap to Flip)'}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isFlipped 
                        ? activeNote.flashcards[flashcardIndex]?.answer 
                        : activeNote.flashcards[flashcardIndex]?.question}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setFlashcardIndex((prev) => (prev > 0 ? prev - 1 : activeNote.flashcards.length - 1));
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Flip Card
                    </button>
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setFlashcardIndex((prev) => (prev < activeNote.flashcards.length - 1 ? prev + 1 : 0));
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
