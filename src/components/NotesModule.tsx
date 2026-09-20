import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Bookmark, 
  Copy, 
  Check, 
  Printer, 
  Search, 
  Layers, 
  BookOpen, 
  RotateCw, 
  Trash2, 
  PhoneCall, 
  Volume2, 
  VolumeX,
  Tag,
  RefreshCw,
  Download,
  Lightbulb,
  Zap,
  Calculator,
  Network,
  Target,
  Library,
  Folder,
  ListTree,
  AlertCircle
} from 'lucide-react';
import type { StudyNote, UserProfile } from '../types';
import { ALL_SUBJECTS } from '../types';
import { aiService } from '../services/aiService';
import { audioService } from '../services/audioService';
import { saveNoteToFirestore, getLocalNotes, deleteNoteFromFirestore } from '../firebase';
import { exportStudyNoteToPdf } from '../services/pdfService';
import { AiIcon } from './AiIcon';

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
  const [chapter, setChapter] = useState('Chapter 3: Genetics & Cell Biology');
  const [unit, setUnit] = useState('Unit 1');
  const [subject, setSubject] = useState('Biology');
  const [isLoading, setIsLoading] = useState(false);
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);
  const [savedNotes, setSavedNotes] = useState<StudyNote[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAudioReading, setIsAudioReading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSavedNotes(getLocalNotes());
  }, []);

  const handleGenerateNotes = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setCopied(false);
    setErrorMessage(null);
    audioService.stopSpeaking();
    setIsAudioReading(false);

    try {
      const note = await aiService.generateNotes(topic, chapter, unit, subject, user.ageGroup, user.preferredLanguage);
      setActiveNote(note);
      if (user.uid) {
        await saveNoteToFirestore(user.uid, note);
        setSavedNotes(getLocalNotes());
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Live Gemini API note generator failed. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSavedNote = async (noteId: string) => {
    if (user.uid) {
      await deleteNoteFromFirestore(user.uid, noteId);
      setSavedNotes(getLocalNotes());
    }
  };

  const handleCopyNote = () => {
    if (!activeNote) return;
    const text = `TITLE: ${activeNote.topic} (${activeNote.chapter} - ${activeNote.unit})\nSubject: ${activeNote.subject}\n\nSUMMARY:\n${activeNote.summary}\n\nKEY PRINCIPLES:\n${activeNote.bulletPoints.map(p => `• ${p}`).join('\n')}\n\nFORMULAS & DEFINITIONS:\n${activeNote.formulasAndKeyTerms.map(f => `${f.term}: ${f.definition}`).join('\n')}\n\nPRACTICE QUESTIONS:\n${activeNote.practiceQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Print not supported in embedded view:', e);
    }
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

  const filteredSavedNotes = savedNotes.filter(n => 
    n.topic.toLowerCase().includes(searchFilter.toLowerCase()) || 
    n.subject.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner & Generation Form */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
        darkMode ? 'bg-[#0e1422] border-slate-800/80 text-white shadow-xl shadow-black/20' : 'bg-white border-slate-200/90 text-slate-900 shadow-md shadow-slate-200/50'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          <div className="flex items-center gap-4">
            <AiIcon size="md" variant="gemini" glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Structured Revision Notes</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/25">
                  Exam-Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Chapter summaries, formula cheatsheets, visual mind maps, and interactive flashcards.
              </p>
            </div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-500" /> Subject
            </label>
            <input
              type="text"
              list="notes-subjects-list"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics, History, Math"
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <datalist id="notes-subjects-list">
              {ALL_SUBJECTS.map((sub) => (
                <option key={sub} value={sub} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-500" /> Unit / Module
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Unit 2: Electromagnetism"
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ListTree className="w-3.5 h-3.5 text-indigo-500" /> Chapter
            </label>
            <input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. Chapter 5: Magnetic Induction"
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Topic / Concept
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Faraday's Law & Lenz's Law"
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleGenerateNotes}
                disabled={isLoading || !topic.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Generate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleGenerateNotes()}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Note View */}
      {activeNote && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 animate-fadeIn ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Note Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <span>{activeNote.subject}</span>
                <span>•</span>
                <span>{activeNote.unit}</span>
                <span>•</span>
                <span>{activeNote.chapter}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                {activeNote.topic}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Audio Listen */}
              <button
                onClick={handleAudioListen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  isAudioReading
                    ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isAudioReading ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{isAudioReading ? 'Stop' : 'Listen'}</span>
              </button>

              {/* Copy */}
              <button
                onClick={handleCopyNote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition hover:bg-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* Export PDF */}
              <button
                onClick={() => exportStudyNoteToPdf(activeNote, user.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                title="Download formatted PDF notes"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              {/* Print / Export */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition hover:bg-slate-200"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              {/* Voice call with topic */}
              <button
                onClick={() => onOpenVoiceCallWithTopic(activeNote.topic)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Discuss with Buddy</span>
              </button>
            </div>
          </div>

          {/* High-Yield Executive Summary */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Core Essence & Quick Summary</span>
            </h4>
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {activeNote.summary}
            </p>
          </div>

          {/* Core Bullet Points */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>High-Impact Principles & Exam Rules</span>
            </h3>
            <div className="grid gap-2">
              {activeNote.bulletPoints.map((bp, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                    {bp}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Formulas and Key Terms Glossary */}
          {activeNote.formulasAndKeyTerms && activeNote.formulasAndKeyTerms.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>Formula & Key Terminology Vault</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeNote.formulasAndKeyTerms.map((f, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1"
                  >
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono block">
                      {f.term}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {f.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Flashcard Preview */}
          {activeNote.formulasAndKeyTerms && activeNote.formulasAndKeyTerms.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Active Recall Flashcard Deck</span>
                </span>
                <span className="text-xs text-slate-400">
                  Card {flashcardIndex + 1} of {activeNote.formulasAndKeyTerms.length}
                </span>
              </div>

              {/* Flippable card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-32 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-400/40 p-5 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:border-indigo-500 transition-all select-none"
              >
                {!isFlipped ? (
                  <>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">
                      Term (Tap to Flip)
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {activeNote.formulasAndKeyTerms[flashcardIndex]?.term}
                    </h4>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-emerald-500 uppercase font-bold tracking-wider mb-1">
                      Definition
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {activeNote.formulasAndKeyTerms[flashcardIndex]?.definition}
                    </p>
                  </>
                )}
              </div>

              {/* Flashcard nav */}
              <div className="flex justify-between items-center text-xs">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setFlashcardIndex((prev) => (prev > 0 ? prev - 1 : activeNote.formulasAndKeyTerms.length - 1));
                  }}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setFlashcardIndex((prev) => (prev + 1 < activeNote.formulasAndKeyTerms.length ? prev + 1 : 0));
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 cursor-pointer"
                >
                  Next Card
                </button>
              </div>
            </div>
          )}

          {/* Mindmap Hierarchical Outline */}
          {activeNote.mindmapOutline && activeNote.mindmapOutline.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Network className="w-4 h-4 text-purple-500" />
                <span>Mindmap Concept Blueprint</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeNote.mindmapOutline.map((node, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      {node.main}
                    </span>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      {node.subtopics?.map((sub, j) => (
                        <li key={j}>{sub}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice Questions */}
          {activeNote.practiceQuestions && activeNote.practiceQuestions.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-500" />
                <span>Targeted Exam Questions</span>
              </h4>
              <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-medium">
                {activeNote.practiceQuestions.map((pq, i) => (
                  <li key={i}>{pq}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Saved Notes Library */}
      {savedNotes.length > 0 && (
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Saved Notes Library ({savedNotes.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search saved notes..."
                className="w-full px-3 py-1.5 pl-8 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSavedNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition cursor-pointer flex flex-col justify-between"
                onClick={() => setActiveNote(note)}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                    <span>{note.subject}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSavedNote(note.id);
                      }}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {note.topic}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {note.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Open Note →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
