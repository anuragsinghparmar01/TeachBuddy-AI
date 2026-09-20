import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  Award, 
  RotateCcw, 
  ArrowRight, 
  Flame, 
  Timer, 
  ChevronRight,
  Bookmark,
  Share2,
  Trophy,
  RefreshCw,
  Download,
  Zap,
  BookOpen,
  Folder,
  Gauge,
  Hash,
  Target,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { QuizQuestion, QuizResult, UserProfile } from '../types';
import { ALL_SUBJECTS } from '../types';
import { aiService } from '../services/aiService';
import { audioService } from '../services/audioService';
import { saveQuizResultToFirestore, getLocalQuizzes } from '../firebase';
import { exportQuizResultToPdf } from '../services/pdfService';
import { AiIcon } from './AiIcon';

interface QuizModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  initialTopic?: string;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

export const QuizModule: React.FC<QuizModuleProps> = ({
  user,
  darkMode,
  onUpdateUser,
  initialTopic,
  onOpenVoiceCallWithTopic,
}) => {
  const [topic, setTopic] = useState(initialTopic || 'Calculus & Derivatives');
  const [chapter, setChapter] = useState('Unit 1: Fundamentals');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getLocalQuizzes());
  }, []);

  // Timer while active
  useEffect(() => {
    let interval: any;
    if (questions.length > 0 && !isQuizCompleted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [questions, isQuizCompleted]);

  // If initialTopic changes
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setIsQuizCompleted(false);
    setErrorMessage(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setUserAnswers([]);
    setScore(0);
    setTimerSeconds(0);
    setReviewMode(false);

    try {
      const generated = await aiService.generateQuiz(topic, chapter, difficulty, questionCount, user.preferredLanguage);
      setQuestions(generated);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Live Gemini API quiz generator failed. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;

    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctIndex;

    setIsAnswerSubmitted(true);
    const updatedAnswers = [...userAnswers, selectedOption];
    setUserAnswers(updatedAnswers);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsQuizCompleted(true);
    const finalScore = score + (selectedOption === questions[currentIndex]?.correctIndex ? 1 : 0);
    const percentage = Math.round((finalScore / questions.length) * 100);
    const xpReward = finalScore * 25 + (percentage >= 80 ? 50 : 20);

    // Gamification celebrations
    if (percentage >= 60) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const newXp = (user.xp || 0) + xpReward;
    const newLevel = Math.floor(newXp / 200) + 1;
    const newStreak = user.streakDays || 1;

    onUpdateUser({
      xp: newXp,
      level: newLevel,
      streakDays: newStreak,
    });

    const result: QuizResult = {
      id: `quiz_${Date.now()}`,
      topic,
      chapter,
      score: finalScore,
      totalQuestions: questions.length,
      percentage,
      xpEarned: xpReward,
      timestamp: new Date().toISOString(),
      timeSpentSeconds: timerSeconds,
      userAnswers: [...userAnswers, selectedOption ?? -1],
    };

    if (user.uid) {
      await saveQuizResultToFirestore(user.uid, result);
    }
    setHistory(getLocalQuizzes());
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Config Panel */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
        darkMode ? 'bg-[#0e1422] border-slate-800/80 text-white shadow-xl shadow-black/20' : 'bg-white border-slate-200/90 text-slate-900 shadow-md shadow-slate-200/50'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          <div className="flex items-center gap-4">
            <AiIcon size="md" variant="mascot" glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Interactive Adaptive Quizzes</h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-500/25">
                  Live AI Evaluator
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Instant rationales, audio feedback, streak counters, and performance XP rewards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5 shadow-xs">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              +25 XP per correct
            </span>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Subject / Topic
            </label>
            <input
              type="text"
              list="quiz-subjects-list"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Thermodynamics, Python, WWII"
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <datalist id="quiz-subjects-list">
              {ALL_SUBJECTS.map((sub) => (
                <option key={sub} value={sub} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-500" /> Chapter / Unit
            </label>
            <input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g. Chapter 4: Chemical Bonding"
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-500" /> Difficulty Standard
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Easy">Easy (Basics & Concepts)</option>
              <option value="Medium">Medium (Exam Standard)</option>
              <option value="Hard">Hard (Deep Challenge)</option>
              <option value="Competitive Exam">Competitive Exam Level</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-indigo-500" /> Question Count
            </label>
            <div className="flex gap-2">
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={3}>3 Questions (Quick Drill)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={10}>10 Questions (Deep Test)</option>
              </select>

              <button
                onClick={handleGenerateQuiz}
                disabled={isLoading || !topic.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Start</span>
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
            onClick={() => handleGenerateQuiz()}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Quiz Card */}
      {questions.length > 0 && !isQuizCompleted && currentQ && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 animate-fadeIn ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Progress Bar & Counter */}
          <div className="flex items-center justify-between gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-mono">
                Q {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">Topic: {topic}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-slate-500 font-mono">
                <Timer className="w-3.5 h-3.5" />
                {formatTimer(timerSeconds)}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Score: {score}
              </span>
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let optionStyle = darkMode
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-indigo-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-400';

              if (isAnswerSubmitted) {
                if (isCorrect) {
                  optionStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30';
                } else if (isSelected && !isCorrect) {
                  optionStyle = 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30';
                } else {
                  optionStyle = 'opacity-40 border-transparent bg-slate-100 dark:bg-slate-800/40 text-slate-400';
                }
              } else if (isSelected) {
                optionStyle = 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl font-mono text-xs flex items-center justify-center shrink-0 border ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isAnswerSubmitted && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hint Drawer */}
          {currentQ.hint && (
            <div className="pt-1">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
              </button>
              {showHint && (
                <div className="mt-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 font-medium animate-fadeIn">
                  💡 {currentQ.hint}
                </div>
              )}
            </div>
          )}

          {/* Explanation Box on Submit */}
          {isAnswerSubmitted && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 animate-fadeIn">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Detailed Explanation
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            {onOpenVoiceCallWithTopic && (
              <button
                onClick={() => onOpenVoiceCallWithTopic(topic)}
                className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
              >
                Discuss this question on Voice Call
              </button>
            )}

            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="ml-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-md transition"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-1.5"
              >
                <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completed Quiz Scorecard */}
      {isQuizCompleted && (
        <div className={`p-8 rounded-3xl border shadow-2xl text-center space-y-6 animate-fadeIn ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-lg text-4xl">
            🏆
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Quiz Completed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Great effort on {topic} · Chapter: {chapter}
            </p>
          </div>

          {/* Big Score Card */}
          <div className="max-w-md mx-auto grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {score}/{questions.length}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {Math.round((score / questions.length) * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">XP Earned</span>
              <span className="text-2xl font-black text-amber-500">
                +{score * 25 + 20}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleGenerateQuiz}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry / New Quiz</span>
            </button>

            <button
              onClick={() => {
                const resObj: QuizResult = {
                  id: `quiz_${Date.now()}`,
                  topic: topic,
                  score: score,
                  totalQuestions: questions.length,
                  percentage: Math.round((score / questions.length) * 100),
                  xpEarned: score * 25 + 20,
                  timestamp: new Date().toISOString(),
                  timeSpentSeconds: 120,
                  userAnswers: userAnswers,
                };
                exportQuizResultToPdf(resObj, questions, user.name);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow transition flex items-center gap-2"
              title="Download official quiz result certificate as PDF"
            >
              <Download className="w-4 h-4" />
              <span>Export Result (PDF)</span>
            </button>

            <button
              onClick={() => setReviewMode(!reviewMode)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition"
            >
              {reviewMode ? 'Hide Review' : 'Review All Questions'}
            </button>
          </div>

          {/* Review Mode Display */}
          {reviewMode && (
            <div className="text-left space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                <span>Detailed Explanations & Concept Review</span>
              </h3>
              {questions.map((q, i) => {
                const uAns = userAnswers[i];
                const wasCorrect = uAns === q.correctIndex;
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border ${
                      wasCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-xs mt-0.5">#{i + 1}</span>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-semibold">{q.question}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-bold">Correct:</span> {q.options[q.correctIndex]}
                        </p>
                        {uAns !== undefined && !wasCorrect && (
                          <p className="text-xs text-rose-600 dark:text-rose-400">
                            <span className="font-bold">Your answer:</span> {q.options[uAns] || 'Skipped'}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Quiz History */}
      {history.length > 0 && !isQuizCompleted && questions.length === 0 && (
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Recent Quiz Drills & XP History</span>
          </h3>
          <div className="space-y-2">
            {history.slice(0, 4).map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{h.topic}</h4>
                  <p className="text-slate-400 text-[11px]">{new Date(h.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {h.score}/{h.totalQuestions} ({h.percentage}%)
                  </span>
                  <span className="text-amber-500 font-bold">+{h.xpEarned} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
