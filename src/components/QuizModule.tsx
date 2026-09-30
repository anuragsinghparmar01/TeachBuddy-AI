import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  Award, 
  RotateCcw, 
  ArrowRight, 
  Timer, 
  Share2, 
  Trophy, 
  Download, 
  AlertCircle,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { QuizQuestion, QuizResult, UserProfile } from '../types';
import { aiService } from '../services/aiService';
import { saveQuizResultToFirestore, getLocalQuizzes } from '../firebase';
import { exportQuizResultToPdf } from '../services/pdfService';

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
  onOpenVoiceCallWithTopic = (_t?: string) => {},
}) => {
  const [topic, setTopic] = useState(initialTopic || 'Calculus & Derivatives');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);

  // Active Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-loaded popular basic quizzes for 1-click start
  const preloadedQuizzes = [
    { label: 'Calculus & Derivatives', icon: '📐', subject: 'Mathematics' },
    { label: "Newton's Laws of Motion", icon: '⚛️', subject: 'Physics' },
    { label: 'Mitosis vs Meiosis', icon: '🧬', subject: 'Biology' },
    { label: 'Periodic Table & Bonding', icon: '🧪', subject: 'Chemistry' },
    { label: 'Indian Constitution & Rights', icon: '📜', subject: 'Civics' },
    { label: 'Python & Binary Logic', icon: '💻', subject: 'Computer' },
  ];

  // Timer while quiz is active
  useEffect(() => {
    let interval: any;
    if (questions.length > 0 && !isQuizCompleted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [questions, isQuizCompleted]);

  useEffect(() => {
    if (initialTopic && initialTopic.trim()) {
      setTopic(initialTopic);
      handleGenerateQuiz(initialTopic);
    }
  }, [initialTopic]);

  const handleGenerateQuiz = async (topicToUse?: string) => {
    const finalTopic = topicToUse || topic;
    if (!finalTopic.trim()) return;

    setTopic(finalTopic);
    setIsLoading(true);
    setErrorMessage(null);
    setIsQuizCompleted(false);
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswers([]);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setTimerSeconds(0);
    setShowHint(false);

    try {
      const generated = await aiService.generateQuiz(
        finalTopic, 
        'General', 
        difficulty, 
        5, 
        user.preferredLanguage
      );

      if (generated && generated.length > 0) {
        setQuestions(generated);
      } else {
        throw new Error('No questions returned');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Failed to generate quiz. Please retry.');
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

    setIsAnswerSubmitted(true);
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctIndex;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setUserAnswers((prev) => [...prev, selectedOption]);
  };

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      // Quiz Finished
      setIsQuizCompleted(true);
      const finalScore = score + (selectedOption === questions[currentIndex].correctIndex ? 1 : 0);
      const percentage = Math.round((finalScore / questions.length) * 100);

      // Trigger Confetti for passing score
      if (percentage >= 60) {
        try {
          confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }

      // Award XP
      const earnedXp = finalScore * 25 + 50;
      onUpdateUser({
        xp: (user.xp || 0) + earnedXp,
      });

      // Save to Firebase
      if (user.uid) {
        const result: QuizResult = {
          id: `quiz-${Date.now()}`,
          topic,
          score: finalScore,
          totalQuestions: questions.length,
          percentage,
          xpEarned: earnedXp,
          timestamp: new Date().toISOString(),
          timeSpentSeconds: timerSeconds,
          userAnswers: [...userAnswers, selectedOption || 0],
        };
        await saveQuizResultToFirestore(user.uid, result);
      }
    }
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
      {/* Top Banner: Single Clean Search & Preloaded Chips */}
      <div className={`p-2.5 sm:p-5 rounded-2xl border transition-all ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl shadow-black/20' 
          : 'bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-pink-50/70 border-indigo-100 text-slate-900 shadow-md shadow-indigo-100/50'
      }`}>
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-lg font-black tracking-tight font-outfit truncate">
                  Instant Practice Quiz
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px]">
                  Adaptive MCQs
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                5 multiple choice questions with instant explanations
              </p>
            </div>
          </div>

          {/* Difficulty Chips */}
          <div className="flex items-center gap-1 shrink-0">
            {['Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer ${
                  difficulty === diff
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Single Topic Input (Single row on mobile & desktop) */}
        <div className="flex flex-row gap-1.5 sm:gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
            placeholder="e.g. Calculus, Indian Constitution..."
            className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs text-slate-900 dark:text-white"
          />
          <button
            onClick={() => handleGenerateQuiz()}
            disabled={isLoading || !topic.trim()}
            className="px-3.5 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/25 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Creating 5 Questions...' : 'Start Quiz'}</span>
            <span className="sm:hidden">{isLoading ? '...' : 'Start'}</span>
          </button>
        </div>

        {/* Preloaded Quiz Chips */}
        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Quizzes:
            </span>
            {preloadedQuizzes.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => handleGenerateQuiz(pq.label)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  topic === pq.label && questions.length > 0
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                }`}
              >
                <span>{pq.icon}</span>
                <span>{pq.label}</span>
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
            onClick={() => handleGenerateQuiz()}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Question Card */}
      {questions.length > 0 && !isQuizCompleted && currentQ && (
        <div className={`p-5 sm:p-6 rounded-2xl border transition-all animate-fadeIn ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}>
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-500">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span className="text-purple-600 dark:text-purple-400 font-mono">
                Score: {score}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-400">
              <Timer className="w-3.5 h-3.5 text-purple-500" />
              <span>{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          {/* Question Text */}
          <h2 className="text-sm sm:text-base font-bold font-outfit mb-5 leading-relaxed text-slate-900 dark:text-white">
            {currentQ.question}
          </h2>

          {/* 4 Options */}
          <div className="space-y-2.5 mb-5">
            {currentQ.options.map((opt, idx) => {
              let optionStyle = 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-purple-300';
              if (selectedOption === idx) {
                optionStyle = 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20';
              }
              if (isAnswerSubmitted) {
                if (idx === currentQ.correctAnswer) {
                  optionStyle = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                } else if (selectedOption === idx) {
                  optionStyle = 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-200 font-bold';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-between gap-3 ${optionStyle}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isAnswerSubmitted && idx === currentQ.correctAnswer && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  {isAnswerSubmitted && selectedOption === idx && idx !== currentQ.correctAnswer && (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if Submitted */}
          {isAnswerSubmitted && currentQ.explanation && (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-200/60 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-4 animate-fadeIn">
              💡 <strong className="text-indigo-600 dark:text-indigo-400">Why this is correct:</strong> {currentQ.explanation}
            </div>
          )}

          {/* Action Button: Check Answer or Next Question */}
          <div className="flex items-center justify-between pt-2">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-500/25 cursor-pointer ml-auto"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-500/25 cursor-pointer flex items-center justify-center gap-1.5 ml-auto"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Final Score'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Completed Summary */}
      {isQuizCompleted && (
        <div className={`p-6 sm:p-8 rounded-2xl border text-center transition-all animate-fadeIn ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}>
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black font-outfit">
              Quiz Completed!
            </h2>
            <div className="text-4xl font-black font-mono text-purple-600 dark:text-purple-400">
              {score} / {questions.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {score === questions.length 
                ? '🌟 Flawless Mastery! You nailed every concept.' 
                : score >= 3 
                ? '👍 Strong grasp of fundamentals! Review missed questions to score 100%.' 
                : '💡 Keep going! Review the notes or chat with Voice Tutor to solidify this topic.'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => handleGenerateQuiz(topic)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => onOpenVoiceCallWithTopic(`Discussing quiz results for ${topic}`)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Review with Tutor</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
