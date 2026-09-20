import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Timer, 
  Flame, 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Download,
  Volume2,
  VolumeX,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { exportQuizResultToPdf } from '../services/pdfService';

interface BrainSprintModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenVoiceCall: () => void;
}

interface SprintQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const SAMPLE_SPRINT_QUESTIONS: SprintQuestion[] = [
  {
    question: "What is 15 × 12?",
    options: ["180", "160", "190", "175"],
    correctIndex: 0,
    explanation: "15 × 10 = 150, 15 × 2 = 30; 150 + 30 = 180."
  },
  {
    question: "Which gas do plants absorb most during photosynthesis?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Methane"],
    correctIndex: 1,
    explanation: "Plants absorb Carbon Dioxide (CO2) and release Oxygen."
  },
  {
    question: "In physics, what is the unit of electric current?",
    options: ["Volt", "Ampere", "Ohm", "Watt"],
    correctIndex: 1,
    explanation: "Ampere (A) is the SI unit of electric current."
  },
  {
    question: "What is the square root of 256?",
    options: ["14", "16", "18", "12"],
    correctIndex: 1,
    explanation: "16 × 16 = 256."
  },
  {
    question: "Which data structure uses LIFO (Last In First Out)?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctIndex: 1,
    explanation: "Stack uses LIFO; Queues use FIFO (First In First Out)."
  },
  {
    question: "What is the chemical symbol for Gold?",
    options: ["Ag", "Au", "Fe", "Gd"],
    correctIndex: 1,
    explanation: "Au comes from the Latin word 'Aurum' meaning shining dawn."
  },
  {
    question: "Derivative of sin(x) with respect to x is:",
    options: ["-cos(x)", "cos(x)", "-sin(x)", "tan(x)"],
    correctIndex: 1,
    explanation: "d/dx [sin(x)] = cos(x)."
  },
  {
    question: "Who proposed the Theory of General Relativity?",
    options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Galileo"],
    correctIndex: 1,
    explanation: "Albert Einstein published General Relativity in 1915."
  },
  {
    question: "What is 2 to the power of 8 (2^8)?",
    options: ["128", "256", "512", "64"],
    correctIndex: 1,
    explanation: "2^8 = 256."
  },
  {
    question: "Which organ produces insulin in the human body?",
    options: ["Liver", "Pancreas", "Kidney", "Stomach"],
    correctIndex: 1,
    explanation: "The islets of Langerhans in the pancreas produce insulin."
  },
];

export const BrainSprintModule: React.FC<BrainSprintModuleProps> = ({
  user,
  darkMode,
  onUpdateUser,
}) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'game_over'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<any>(null);

  // Sound triggers
  const playDing = () => {
    if (soundEnabled) audioService.playDing();
  };

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(60);
    setCurrentIdx(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setUserAnswers([]);
    setSelectedOption(null);
    playDing();
  };

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const endGame = () => {
    setGameState('game_over');
    if (timerRef.current) clearInterval(timerRef.current);

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    const earnedXp = Math.max(50, score * 20);
    onUpdateUser({
      xp: (user.xp || 0) + earnedXp,
      streakDays: Math.max(user.streakDays || 1, 1),
    });
  };

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null || gameState !== 'playing') return;
    
    setSelectedOption(index);
    const q = SAMPLE_SPRINT_QUESTIONS[currentIdx % SAMPLE_SPRINT_QUESTIONS.length];
    const isCorrect = index === q.correctIndex;

    const nextAnswers = [...userAnswers, index];
    setUserAnswers(nextAnswers);

    if (isCorrect) {
      playDing();
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      const points = 10 * Math.min(newCombo, 5);
      setScore((s) => s + points);
    } else {
      setCombo(0);
    }

    setTimeout(() => {
      setSelectedOption(null);
      if (currentIdx + 1 >= SAMPLE_SPRINT_QUESTIONS.length) {
        endGame();
      } else {
        setCurrentIdx((prev) => prev + 1);
      }
    }, 400);
  };

  const handleExportPdf = () => {
    playDing();
    const resultObj = {
      id: `sprint_${Date.now()}`,
      topic: '60-Second Rapid Brain Sprint',
      score: Math.round(score / 10),
      totalQuestions: userAnswers.length || 5,
      percentage: Math.min(100, Math.round(((score / 10) / Math.max(1, userAnswers.length)) * 100)),
      xpEarned: score * 2,
      timestamp: new Date().toISOString(),
      timeSpentSeconds: 60 - timeLeft,
      userAnswers: userAnswers,
    };

    const formattedQuestions = SAMPLE_SPRINT_QUESTIONS.slice(0, userAnswers.length).map((q, idx) => ({
      id: `q_${idx}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    }));

    exportQuizResultToPdf(resultObj, formattedQuestions, user.name);
  };

  const currentQ = SAMPLE_SPRINT_QUESTIONS[currentIdx % SAMPLE_SPRINT_QUESTIONS.length];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Title & Sound toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              60-Second Brain Sprint
            </h2>
            <p className="text-xs text-slate-500">Fast-paced rapid recall. Build combo multipliers & top the leaderboard!</p>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2.5 rounded-xl border transition ${
            soundEnabled 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
          title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* IDLE SCREEN */}
      {gameState === 'idle' && (
        <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-6 transition-all ${
          darkMode 
            ? 'bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 border-slate-800 text-white' 
            : 'bg-gradient-to-b from-amber-50/70 via-white to-orange-50/50 border-amber-200 text-slate-900'
        }`}>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 animate-pulse">
            <Timer className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-black">Ready to test your reflex speed?</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Answer as many academic and logic questions as you can in 60 seconds. Each consecutive correct answer ramps up your streak multiplier (up to 5x points!).
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-500">
            <span>⏱️ 60 Seconds</span>
            <span>🔥 Multiplier Combos</span>
            <span>⚡ +200 XP Potential</span>
          </div>

          <div>
            <button
              onClick={startGame}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-lg shadow-orange-500/25 transition active:scale-95 flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              START SPRINT DRILL
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE PLAYING SCREEN */}
      {gameState === 'playing' && (
        <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Top Bar: Timer & Combo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono">
              <div className={`px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-1.5 ${
                timeLeft <= 10 
                  ? 'bg-red-500 text-white animate-bounce' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                <Timer className="w-4 h-4" />
                {timeLeft}s
              </div>
            </div>

            {/* Combo Meter */}
            {combo > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black animate-pulse shadow-md">
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>{combo}x COMBO!</span>
              </div>
            )}

            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block">Score</span>
              <span className="text-xl font-black text-amber-500 font-mono">{score}</span>
            </div>
          </div>

          {/* Time Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 10 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>

          {/* Question Box */}
          <div className="py-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Question {currentIdx + 1}
            </span>
            <h3 className="text-lg sm:text-xl font-black leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;
              let btnClass = darkMode 
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';

              if (selectedOption !== null) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-300';
                } else if (isSelected) {
                  btnClass = 'bg-red-500 text-white border-red-500';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={selectedOption !== null}
                  className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all active:scale-95 ${btnClass}`}
                >
                  <span className="opacity-60 text-xs mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'game_over' && (
        <div className={`p-8 sm:p-10 rounded-3xl border text-center space-y-6 transition-all ${
          darkMode 
            ? 'bg-slate-900 border-slate-800 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
            <Trophy className="w-8 h-8 fill-amber-500" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black">Sprint Complete!</h3>
            <p className="text-xs sm:text-sm text-slate-500">Brilliant focus and reflex speed!</p>
          </div>

          {/* Results Metric Grid */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">Points</span>
              <span className="text-2xl font-black text-amber-500 font-mono">{score}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">Max Combo</span>
              <span className="text-2xl font-black text-orange-500 font-mono">{maxCombo}x 🔥</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              <span className="text-[11px] text-slate-400 font-bold uppercase block">XP Gained</span>
              <span className="text-2xl font-black text-emerald-500 font-mono">+{Math.max(50, score * 2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={startGame}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>

            <button
              onClick={handleExportPdf}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Download className="w-4 h-4" /> Export Scorecard (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
