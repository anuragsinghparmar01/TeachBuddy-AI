import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Zap, Clock, Brain, Trophy, Sparkles, RefreshCw, 
  CheckCircle2, XCircle, Flame, Volume2, VolumeX, Play, Pause, 
  RotateCcw, Gift, Award, Headphones, ArrowRight, BookOpen, AlertCircle,
  Calculator, FileText, Check, Star, Sparkle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ALL_SUBJECTS, type SubjectName, type UserProfile } from '../types';
import { aiService } from '../services/aiService';
import { audioService } from '../services/audioService';

interface GamesModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onNavigateTab?: (tab: any) => void;
}

interface MemoryCard {
  id: string;
  pairId: string;
  text: string;
  type: 'term' | 'match';
  isFlipped: boolean;
  isMatched: boolean;
}

// Blitz Math & Science Question Type
interface BlitzQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

// Vocab Clash Question Type
interface VocabQuestion {
  word: string;
  pronunciation?: string;
  hindiMeaning: string;
  contextSentence: string;
  options: string[];
  correctIndex: number;
  category: 'Legal' | 'Academic' | 'Presentation' | 'Science';
}

export const GamesModule: React.FC<GamesModuleProps> = ({
  user,
  darkMode,
  onUpdateUser,
}) => {
  const [activeGame, setActiveGame] = useState<'drill' | 'memory' | 'blitz' | 'vocab' | 'pomodoro' | 'quest'>('drill');
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>('Mathematics');

  // ================= 1. BRAIN SPRINT (60s SPEED DRILL) =================
  const [drillState, setDrillState] = useState<'idle' | 'loading' | 'playing' | 'ended'>('idle');
  const [drillQuestions, setDrillQuestions] = useState<{ id: string; question: string; isTrue: boolean; explanation: string }[]>([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [drillScore, setDrillScore] = useState(0);
  const [drillStreak, setDrillStreak] = useState(0);
  const [drillTimeLeft, setDrillTimeLeft] = useState(60);
  const [drillError, setDrillError] = useState<string | null>(null);

  // Drill Timer
  useEffect(() => {
    let timer: any;
    if (drillState === 'playing' && drillTimeLeft > 0) {
      timer = setInterval(() => {
        setDrillTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            finishDrill();
            return 0;
          }
          if (prev <= 5) {
            audioService.playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [drillState, drillTimeLeft]);

  const startBrainSprint = async () => {
    setDrillState('loading');
    setDrillError(null);
    setDrillScore(0);
    setDrillStreak(0);
    setDrillIndex(0);
    setDrillTimeLeft(60);

    try {
      audioService.playSound('whoosh');
      const questions = await aiService.generateBrainSprintQuestions(
        selectedSubject, 
        8, 
        user.preferredLanguage || 'en-US'
      );
      if (questions && questions.length > 0) {
        setDrillQuestions(questions);
        setDrillState('playing');
      } else {
        throw new Error('No drill questions returned from Live Gemini API.');
      }
    } catch (err: any) {
      console.error('Brain sprint error:', err);
      setDrillError(err?.message || 'Failed to start drill with Live Gemini API.');
      setDrillState('idle');
    }
  };

  const handleDrillAnswer = (userChoice: boolean) => {
    if (drillState !== 'playing' || !drillQuestions[drillIndex]) return;

    const currentQ = drillQuestions[drillIndex];
    const isCorrect = userChoice === currentQ.isTrue;

    if (isCorrect) {
      audioService.playSound('correct');
      const newStreak = drillStreak + 1;
      setDrillStreak(newStreak);
      const points = 10 + Math.min(newStreak * 2, 20);
      setDrillScore((prev) => prev + points);
    } else {
      audioService.playSound('wrong');
      setDrillStreak(0);
    }

    if (drillIndex + 1 < drillQuestions.length) {
      setDrillIndex((prev) => prev + 1);
    } else {
      finishDrill();
    }
  };

  const finishDrill = () => {
    setDrillState('ended');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    const xpGained = Math.max(25, drillScore);
    onUpdateUser({
      xp: (user.xp || 0) + xpGained,
    });
  };

  // ================= 2. FORMULA & MEMORY DUEL =================
  const [memoryState, setMemoryState] = useState<'idle' | 'loading' | 'playing' | 'won'>('idle');
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const startMemoryDuel = async () => {
    setMemoryState('loading');
    setMemoryError(null);
    setMemoryMoves(0);
    setMemoryMatches(0);
    setFlippedCards([]);

    try {
      audioService.playSound('whoosh');
      const pairs = await aiService.generateMemoryDuelCards(
        selectedSubject, 
        6, 
        user.preferredLanguage || 'en-US'
      );

      if (!pairs || pairs.length === 0) {
        throw new Error('No pairs generated from Live Gemini API.');
      }

      const deck: MemoryCard[] = [];
      pairs.forEach((p, idx) => {
        deck.push({
          id: `card_${idx}_term`,
          pairId: `pair_${idx}`,
          text: p.term,
          type: 'term',
          isFlipped: false,
          isMatched: false,
        });
        deck.push({
          id: `card_${idx}_match`,
          pairId: `pair_${idx}`,
          text: p.match,
          type: 'match',
          isFlipped: false,
          isMatched: false,
        });
      });

      const shuffled = [...deck].sort(() => Math.random() - 0.5);
      setMemoryCards(shuffled);
      setMemoryState('playing');
    } catch (err: any) {
      console.error('Memory duel error:', err);
      setMemoryError(err?.message || 'Failed to generate cards from Live Gemini API.');
      setMemoryState('idle');
    }
  };

  const handleCardClick = (index: number) => {
    if (memoryState !== 'playing') return;
    if (flippedCards.length >= 2) return;
    if (memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

    audioService.playSound('click');
    const newCards = [...memoryCards];
    newCards[index].isFlipped = true;
    setMemoryCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        setTimeout(() => {
          audioService.playSound('correct');
          newCards[firstIdx].isMatched = true;
          newCards[secondIdx].isMatched = true;
          setMemoryCards([...newCards]);
          setFlippedCards([]);
          const newMatches = memoryMatches + 1;
          setMemoryMatches(newMatches);

          if (newMatches >= 6) {
            setMemoryState('won');
            confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
            onUpdateUser({
              xp: (user.xp || 0) + 50,
            });
          }
        }, 400);
      } else {
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setMemoryCards([...newCards]);
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  // ================= 3. FORMULA BLITZ & SPEED MATH RUSH =================
  const [blitzState, setBlitzState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [blitzDifficulty, setBlitzDifficulty] = useState<'standard' | 'genius'>('standard');
  const [blitzScore, setBlitzScore] = useState(0);
  const [blitzStreak, setBlitzStreak] = useState(0);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(45);
  const [blitzIndex, setBlitzIndex] = useState(0);
  const [blitzAnsweredFeedback, setBlitzAnsweredFeedback] = useState<'correct' | 'wrong' | null>(null);

  // High-yield formula blitz question bank
  const blitzBank: BlitzQuestion[] = [
    {
      question: "If mass m = 4 kg and acceleration a = 5 m/s², what is Force (F = ma)?",
      options: ["9 N", "20 N", "1.25 N", "40 N"],
      correctIndex: 1,
      explanation: "F = m × a = 4 × 5 = 20 N.",
      category: "Physics"
    },
    {
      question: "Solve mentally: 14 × 15 = ?",
      options: ["200", "210", "225", "195"],
      correctIndex: 1,
      explanation: "14 × 15 = 14 × 10 (140) + 14 × 5 (70) = 210.",
      category: "Mental Math"
    },
    {
      question: "In a right triangle with legs a = 6 and b = 8, what is hypotenuse c?",
      options: ["10", "12", "14", "100"],
      correctIndex: 0,
      explanation: "c = √(6² + 8²) = √(36 + 64) = √100 = 10.",
      category: "Geometry"
    },
    {
      question: "What is the slope of the line: y = 4x - 9?",
      options: ["-9", "4", "4/9", "-4"],
      correctIndex: 1,
      explanation: "In y = mx + c, the slope m is the coefficient of x, which is 4.",
      category: "Algebra"
    },
    {
      question: "Ohm's Law: If Voltage V = 36V and Current I = 4A, what is Resistance R (V = IR)?",
      options: ["144 Ω", "9 Ω", "32 Ω", "40 Ω"],
      correctIndex: 1,
      explanation: "R = V / I = 36 / 4 = 9 Ω.",
      category: "Physics"
    },
    {
      question: "Value of: √169 + √64 = ?",
      options: ["21", "25", "19", "23"],
      correctIndex: 0,
      explanation: "√169 = 13 and √64 = 8. 13 + 8 = 21.",
      category: "Mental Math"
    },
    {
      question: "What is the derivative d/dx (3x² + 5x)?",
      options: ["6x + 5", "3x + 5", "6x²", "5x"],
      correctIndex: 0,
      explanation: "d/dx(3x²) = 6x and d/dx(5x) = 5. Result: 6x + 5.",
      category: "Calculus"
    },
    {
      question: "Kinetic Energy: KE = ½mv². If m = 2 kg and v = 6 m/s, what is KE?",
      options: ["12 J", "36 J", "72 J", "18 J"],
      correctIndex: 1,
      explanation: "KE = 0.5 × 2 × (6²) = 1 × 36 = 36 Joules.",
      category: "Physics"
    },
    {
      question: "Solve for x: 3x - 7 = 20",
      options: ["7", "9", "8", "6"],
      correctIndex: 1,
      explanation: "3x = 27 => x = 9.",
      category: "Algebra"
    },
    {
      question: "What is 25% of 320?",
      options: ["70", "80", "90", "75"],
      correctIndex: 1,
      explanation: "25% is 1/4th. 320 / 4 = 80.",
      category: "Mental Math"
    },
  ];

  // Blitz Timer
  useEffect(() => {
    let timer: any;
    if (blitzState === 'playing' && blitzTimeLeft > 0) {
      timer = setInterval(() => {
        setBlitzTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            finishBlitz();
            return 0;
          }
          if (prev <= 5) {
            audioService.playSound('tick');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [blitzState, blitzTimeLeft]);

  const startBlitz = () => {
    setBlitzScore(0);
    setBlitzStreak(0);
    setBlitzIndex(0);
    setBlitzTimeLeft(45);
    setBlitzAnsweredFeedback(null);
    setBlitzState('playing');
    audioService.playSound('whoosh');
  };

  const handleBlitzChoice = (choiceIndex: number) => {
    if (blitzState !== 'playing') return;
    const currentQ = blitzBank[blitzIndex % blitzBank.length];
    const isCorrect = choiceIndex === currentQ.correctIndex;

    if (isCorrect) {
      audioService.playSound('correct');
      setBlitzAnsweredFeedback('correct');
      const nextStreak = blitzStreak + 1;
      setBlitzStreak(nextStreak);
      const multiplier = nextStreak >= 4 ? 3 : nextStreak >= 2 ? 2 : 1;
      const points = 15 * multiplier;
      setBlitzScore((prev) => prev + points);
    } else {
      audioService.playSound('wrong');
      setBlitzAnsweredFeedback('wrong');
      setBlitzStreak(0);
    }

    setTimeout(() => {
      setBlitzAnsweredFeedback(null);
      if (blitzIndex + 1 < blitzBank.length) {
        setBlitzIndex((prev) => prev + 1);
      } else {
        finishBlitz();
      }
    }, 450);
  };

  const finishBlitz = () => {
    setBlitzState('ended');
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    const earnedXp = Math.max(30, Math.floor(blitzScore / 2));
    onUpdateUser({
      xp: (user.xp || 0) + earnedXp,
    });
  };

  // ================= 4. VOCAB CLASH & ROOT WORDS =================
  const [vocabState, setVocabState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [vocabScore, setVocabScore] = useState(0);
  const [vocabStreak, setVocabStreak] = useState(0);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabFeedback, setVocabFeedback] = useState<'correct' | 'wrong' | null>(null);

  const vocabBank: VocabQuestion[] = [
    {
      word: "Affidavit",
      pronunciation: "af-i-DAY-vit",
      hindiMeaning: "शपथ पत्र / हलफनामा",
      contextSentence: "The witness submitted a sworn affidavit before the court.",
      options: [
        "A written statement confirmed by oath or affirmation",
        "A final property agreement between landlords",
        "A temporary loan contract with banks",
        "A verbal public announcement in parliament"
      ],
      correctIndex: 0,
      category: "Legal"
    },
    {
      word: "Articulate",
      pronunciation: "ar-TIK-yuh-lit",
      hindiMeaning: "सुस्पष्ट बोलना / विचार व्यक्त करना",
      contextSentence: "A great leader can articulate complex ideas into simple action points.",
      options: [
        "To speak vaguely to hide true intentions",
        "To express ideas clearly and effectively in speech",
        "To memorize notes without understanding",
        "To speak at high volume in arguments"
      ],
      correctIndex: 1,
      category: "Presentation"
    },
    {
      word: "Indemnity",
      pronunciation: "in-DEM-ni-tee",
      hindiMeaning: "क्षतिपूर्ति / नुकसान की भरपाई",
      contextSentence: "The trust deed included an indemnity clause protecting trustee assets.",
      options: [
        "A criminal punishment for breaking office rules",
        "Security or protection against a loss or financial burden",
        "A license to conduct government research",
        "A non-disclosure stamp on private documents"
      ],
      correctIndex: 1,
      category: "Legal"
    },
    {
      word: "Cadence",
      pronunciation: "KAY-duhns",
      hindiMeaning: "आवाज़ का लयबद्ध उतार-चढ़ाव",
      contextSentence: "His calm cadence kept the audience hooked throughout the keynote.",
      options: [
        "Rhythmic flow and inflection of a speaker's voice",
        "The speed of typing slides on a laptop",
        "The number of slides used in a pitch deck",
        "The volume of ambient background noise"
      ],
      correctIndex: 0,
      category: "Presentation"
    },
    {
      word: "Empirical",
      pronunciation: "em-PEER-i-kuhl",
      hindiMeaning: "प्रयोगसिद्ध / वास्तविक अनुभव आधारित",
      contextSentence: "The thesis was backed by strong empirical evidence and clinical trials.",
      options: [
        "Based on observation and experiment rather than theory alone",
        "Belonging to an ancient imperial royal dynasty",
        "Guessed without factual data verification",
        "Derived solely from mathematical imagination"
      ],
      correctIndex: 0,
      category: "Academic"
    },
    {
      word: "Catalyst",
      pronunciation: "KAT-uh-list",
      hindiMeaning: "उत्प्रेरक / बदलाव की गति बढ़ाने वाला",
      contextSentence: "Her inspiring presentation became the catalyst for major policy changes.",
      options: [
        "A substance or person that precipitates an event or accelerates change",
        "An inert stone that slows down chemical reactions",
        "A written decree issued by civil authorities",
        "A legal dispute pending settlement"
      ],
      correctIndex: 0,
      category: "Science"
    }
  ];

  const startVocabClash = () => {
    setVocabScore(0);
    setVocabStreak(0);
    setVocabIndex(0);
    setVocabFeedback(null);
    setVocabState('playing');
    audioService.playSound('whoosh');
  };

  const handleVocabChoice = (chosenIdx: number) => {
    if (vocabState !== 'playing') return;
    const currentV = vocabBank[vocabIndex % vocabBank.length];
    const isCorrect = chosenIdx === currentV.correctIndex;

    if (isCorrect) {
      audioService.playSound('correct');
      setVocabFeedback('correct');
      const nextStreak = vocabStreak + 1;
      setVocabStreak(nextStreak);
      setVocabScore((prev) => prev + 20 + nextStreak * 5);
    } else {
      audioService.playSound('wrong');
      setVocabFeedback('wrong');
      setVocabStreak(0);
    }

    setTimeout(() => {
      setVocabFeedback(null);
      if (vocabIndex + 1 < vocabBank.length) {
        setVocabIndex((prev) => prev + 1);
      } else {
        setVocabState('ended');
        confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });
        onUpdateUser({
          xp: (user.xp || 0) + Math.max(30, vocabScore),
        });
      }
    }, 600);
  };

  // ================= 5. POMODORO FOCUS ROOM & AMBIENT SYNTH =================
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSeconds, setPomoSeconds] = useState(0);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState<'study' | 'break'>('study');
  const [ambientSound, setAmbientSound] = useState<'off' | 'lofi' | 'rain' | 'library' | 'binaural'>('off');
  const [ambientVolume, setAmbientVolume] = useState(0.25);

  useEffect(() => {
    let interval: any;
    if (pomoRunning) {
      interval = setInterval(() => {
        setPomoSeconds((sec) => {
          if (sec === 0) {
            if (pomoMinutes === 0) {
              clearInterval(interval);
              setPomoRunning(false);
              confetti({ particleCount: 40 });
              if (pomoMode === 'study') {
                onUpdateUser({ xp: (user.xp || 0) + 35 });
                setPomoMode('break');
                setPomoMinutes(5);
              } else {
                setPomoMode('study');
                setPomoMinutes(25);
              }
              return 0;
            }
            setPomoMinutes((m) => m - 1);
            return 59;
          }
          return sec - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomoRunning, pomoMinutes, pomoMode, onUpdateUser, user.xp]);

  const togglePomo = () => {
    setPomoRunning(!pomoRunning);
  };

  const resetPomo = () => {
    setPomoRunning(false);
    setPomoMinutes(pomoMode === 'study' ? 25 : 5);
    setPomoSeconds(0);
  };

  const handleAmbientChange = (type: 'off' | 'lofi' | 'rain' | 'library' | 'binaural') => {
    setAmbientSound(type);
    if (type === 'off') {
      audioService.stopAmbientSound();
    } else {
      audioService.startAmbientSound(type, ambientVolume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    audioService.setAmbientVolume(newVol);
  };

  useEffect(() => {
    return () => {
      audioService.stopAmbientSound();
    };
  }, []);

  // ================= 6. DAILY STUDY QUESTS & MYSTERY BOX =================
  const [mysteryOpened, setMysteryOpened] = useState(false);
  const [mysteryReward, setMysteryReward] = useState<string | null>(null);

  const openMysteryBox = () => {
    if (mysteryOpened) return;
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    setMysteryOpened(true);
    const bonusXp = 75;
    setMysteryReward(`+${bonusXp} XP & "Golden Scholar" Mystery Gem!`);
    onUpdateUser({
      xp: (user.xp || 0) + bonusXp,
      badges: [...(user.badges || []), 'Mystery Pioneer'],
    });
  };

  // Nav games definitions with rich colorful light/dark styling
  const gameTabs = [
    {
      id: 'drill' as const,
      label: '60s Brain Sprint',
      icon: Zap,
      badge: 'Speed',
      activeColorLight: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30',
      activeColorDark: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-600/40',
      borderTintLight: 'border-amber-200 bg-amber-50/40 text-amber-700'
    },
    {
      id: 'memory' as const,
      label: 'Formula Match',
      icon: Brain,
      badge: 'Cards',
      activeColorLight: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30',
      activeColorDark: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/40',
      borderTintLight: 'border-indigo-200 bg-indigo-50/40 text-indigo-700'
    },
    {
      id: 'blitz' as const,
      label: 'Formula Blitz Rush',
      icon: Calculator,
      badge: 'Math',
      activeColorLight: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30',
      activeColorDark: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/40',
      borderTintLight: 'border-emerald-200 bg-emerald-50/40 text-emerald-700'
    },
    {
      id: 'vocab' as const,
      label: 'Vocab & Speech Clash',
      icon: FileText,
      badge: 'Speech',
      activeColorLight: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/30',
      activeColorDark: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-600/40',
      borderTintLight: 'border-fuchsia-200 bg-fuchsia-50/40 text-fuchsia-700'
    },
    {
      id: 'pomodoro' as const,
      label: 'Zen Focus Beats',
      icon: Headphones,
      badge: 'Audio',
      activeColorLight: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/30',
      activeColorDark: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/40',
      borderTintLight: 'border-sky-200 bg-sky-50/40 text-sky-700'
    },
    {
      id: 'quest' as const,
      label: 'Daily Quests',
      icon: Gift,
      badge: 'Chest',
      activeColorLight: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-500/30',
      activeColorDark: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/40',
      borderTintLight: 'border-rose-200 bg-rose-50/40 text-rose-700'
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-fuchsia-50/60 dark:from-slate-900/90 dark:via-slate-900 dark:to-indigo-950/40 border border-indigo-100 dark:border-slate-800 shadow-md shadow-indigo-100/30 dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-500/20 border border-fuchsia-500/20 text-[10px] font-black uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Brain Arcade & Gamified Learning
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              6 Modes Ready
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 font-outfit">
            <Gamepad2 className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
            <span>Interactive Game Arcade</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Sharpen speed calculations, recall physics & math formulas, power-up speech vocabulary, and earn XP badges.
          </p>
        </div>

        {/* Global XP & Streak Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black shadow-xs">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span>{user.xp || 0} Total XP</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-black shadow-xs">
            <Flame className="w-4 h-4 fill-rose-500 animate-pulse" />
            <span>{user.streakDays || 1} Day Streak</span>
          </div>
        </div>
      </div>

      {/* GAME MODE SELECTOR NAVIGATION: 6 VIBRANT MODES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100/90 dark:bg-slate-900/80 p-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-xs">
        {gameTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeGame === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                audioService.playSound('click');
                setActiveGame(tab.id);
              }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                isActive
                  ? darkMode ? tab.activeColorDark : tab.activeColorLight
                  : darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subject Selector (Shared across drill & memory) */}
      {(activeGame === 'drill' || activeGame === 'memory') && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap pl-1 uppercase tracking-wider text-[10px]">
            Target Subject:
          </span>
          {ALL_SUBJECTS.map((sub) => (
            <button
              key={sub}
              onClick={() => { audioService.playSound('click'); setSelectedSubject(sub); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                selectedSubject === sub
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* ================= 1. 60S BRAIN SPRINT VIEW ================= */}
      {activeGame === 'drill' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-amber-200/80 dark:border-slate-800 shadow-xl shadow-amber-500/5 space-y-6">
          {drillState === 'idle' && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-500/10">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  60-Second Rapid Sprint Drill
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  How many rapid conceptual True/False questions can you crack in 60 seconds on <strong className="text-indigo-600 dark:text-indigo-400">{selectedSubject}</strong>?
                </p>
              </div>

              {drillError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{drillError}</span>
                </div>
              )}

              <button
                onClick={startBrainSprint}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 mx-auto transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start 60s Sprint</span>
              </button>
            </div>
          )}

          {drillState === 'loading' && (
            <div className="text-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono">
                Live AI Generating Subject Sprint Questions...
              </p>
            </div>
          )}

          {drillState === 'playing' && drillQuestions[drillIndex] && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Question {drillIndex + 1}/{drillQuestions.length}
                  </span>
                  {drillStreak > 1 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-black font-mono animate-pulse">
                      🔥 {drillStreak}x STREAK
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-slate-800 text-xs font-mono font-black text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{drillTimeLeft}s</span>
                </div>

                <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                  Score: {drillScore}
                </div>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-amber-50/30 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center space-y-4">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                  {selectedSubject}
                </span>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  "{drillQuestions[drillIndex].question}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDrillAnswer(true)}
                  className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>TRUE</span>
                </button>

                <button
                  onClick={() => handleDrillAnswer(false)}
                  className="py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                  <span>FALSE</span>
                </button>
              </div>
            </div>
          )}

          {drillState === 'ended' && (
            <div className="text-center py-8 space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-500">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  Sprint Complete!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  You scored <strong className="text-emerald-600 font-black">{drillScore} points</strong> and earned <strong className="text-amber-600 font-black">+{Math.max(25, drillScore)} XP</strong>!
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={startBrainSprint}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md shadow-amber-500/25"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={() => setDrillState('idle')}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Back to Hub
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. FORMULA MATCH VIEW ================= */}
      {activeGame === 'memory' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-indigo-200/80 dark:border-slate-800 shadow-xl shadow-indigo-500/5 space-y-6">
          {memoryState === 'idle' && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  Formula & Concept Memory Duel
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Flip and match terms with their exact formulas or definitions on <strong className="text-indigo-600 dark:text-indigo-400">{selectedSubject}</strong>.
                </p>
              </div>

              {memoryError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{memoryError}</span>
                </div>
              )}

              <button
                onClick={startMemoryDuel}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 mx-auto transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Deal Cards</span>
              </button>
            </div>
          )}

          {memoryState === 'loading' && (
            <div className="text-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono">
                Live AI Generating Formula & Concept Pairs...
              </p>
            </div>
          )}

          {(memoryState === 'playing' || memoryState === 'won') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-xs font-mono font-bold text-slate-500">
                  Matches: <strong className="text-indigo-600 dark:text-indigo-400">{memoryMatches}/6</strong>
                </div>
                <div className="text-xs font-mono font-bold text-slate-500">
                  Moves: <strong className="text-slate-800 dark:text-white">{memoryMoves}</strong>
                </div>
                <button
                  onClick={startMemoryDuel}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Reshuffle
                </button>
              </div>

              {memoryState === 'won' && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-fadeIn">
                  <p className="text-base font-black text-emerald-700 dark:text-emerald-400">
                    🎉 Outstanding! All 6 Pairs Matched in {memoryMoves} moves!
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    You earned <strong className="text-amber-500">+50 XP</strong> for sharp recall.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
                {memoryCards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className={`h-24 sm:h-28 rounded-2xl p-2.5 flex items-center justify-center text-center cursor-pointer transition-all duration-300 select-none ${
                      card.isMatched
                        ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 scale-95 opacity-80'
                        : card.isFlipped
                          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-transparent border border-slate-200 dark:border-slate-700 hover:scale-105'
                    }`}
                  >
                    {(card.isFlipped || card.isMatched) ? (
                      <span className="text-xs sm:text-sm font-semibold line-clamp-3 leading-snug">
                        {card.text}
                      </span>
                    ) : (
                      <Sparkles className="w-5 h-5 text-indigo-400 opacity-40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. FORMULA BLITZ & SPEED MATH RUSH ================= */}
      {activeGame === 'blitz' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-200/80 dark:border-slate-800 shadow-xl shadow-emerald-500/5 space-y-6">
          {blitzState === 'idle' && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
                <Calculator className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  Formula Blitz & Rapid Math Rush
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Solve mental calculations, physics formulas, and algebra equations against a 45-second clock. Chain correct answers for up to 3x multiplier!
                </p>
              </div>

              <button
                onClick={startBlitz}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 mx-auto transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Formula Blitz (45s)</span>
              </button>
            </div>
          )}

          {blitzState === 'playing' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Problem {blitzIndex + 1}/{blitzBank.length}
                  </span>
                  {blitzStreak > 1 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-black font-mono animate-pulse">
                      ⚡ {blitzStreak >= 4 ? '3x' : '2x'} MULTIPLIER
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-slate-800 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{blitzTimeLeft}s</span>
                </div>

                <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                  Score: {blitzScore}
                </div>
              </div>

              {/* Question Card */}
              {blitzBank[blitzIndex % blitzBank.length] && (
                <div className="space-y-4">
                  <div className={`p-6 sm:p-8 rounded-3xl border transition-all text-center space-y-3 ${
                    blitzAnsweredFeedback === 'correct'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-100'
                      : blitzAnsweredFeedback === 'wrong'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-900 dark:text-rose-100'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                  }`}>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                      {blitzBank[blitzIndex % blitzBank.length].category}
                    </span>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                      {blitzBank[blitzIndex % blitzBank.length].question}
                    </p>
                  </div>

                  {/* 4 Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {blitzBank[blitzIndex % blitzBank.length].options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => handleBlitzChoice(optIdx)}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 transition active:scale-95 text-left flex items-center justify-between cursor-pointer"
                      >
                        <span>{option}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {blitzState === 'ended' && (
            <div className="text-center py-8 space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-500">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  Formula Blitz Completed!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  You scored <strong className="text-emerald-600 font-black">{blitzScore} points</strong> and earned <strong className="text-amber-600 font-black">+{Math.max(30, Math.floor(blitzScore / 2))} XP</strong>!
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={startBlitz}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md shadow-emerald-600/25"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Play Blitz Again</span>
                </button>
                <button
                  onClick={() => setBlitzState('idle')}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Back to Hub
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 4. VOCAB & SPEECH CLASH ================= */}
      {activeGame === 'vocab' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-fuchsia-200/80 dark:border-slate-800 shadow-xl shadow-fuchsia-500/5 space-y-6">
          {vocabState === 'idle' && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-200 dark:border-fuchsia-800 flex items-center justify-center mx-auto text-fuchsia-600 dark:text-fuchsia-400 shadow-lg shadow-fuchsia-500/10">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  Vocab & Speech Clash
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Master high-impact legal terminology, presentation power words, and academic rhetoric with pronunciation and Hindi context.
                </p>
              </div>

              <button
                onClick={startVocabClash}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-fuchsia-600/25 flex items-center justify-center gap-2 mx-auto transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Vocab Clash</span>
              </button>
            </div>
          )}

          {vocabState === 'playing' && vocabBank[vocabIndex % vocabBank.length] && (
            <div className="space-y-6 max-w-xl mx-auto">
              {/* HUD */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-slate-500">
                  Word {vocabIndex + 1}/{vocabBank.length}
                </div>
                {vocabStreak > 1 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-400 text-[11px] font-black font-mono animate-pulse">
                    🔥 {vocabStreak}x COMBO
                  </span>
                )}
                <div className="text-xs font-mono font-black text-fuchsia-600 dark:text-fuchsia-400">
                  Score: {vocabScore}
                </div>
              </div>

              {/* Word Display Card */}
              {(() => {
                const currentV = vocabBank[vocabIndex % vocabBank.length];
                return (
                  <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-fuchsia-50/50 via-white to-pink-50/30 dark:bg-slate-800/60 border border-fuchsia-200 dark:border-slate-700/60 space-y-3 text-center">
                    <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 text-xs font-black uppercase tracking-wider">
                      {currentV.category} Vocabulary
                    </span>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white font-outfit">
                      {currentV.word}
                    </h3>
                    {currentV.pronunciation && (
                      <p className="text-xs font-mono text-slate-500">
                        /{currentV.pronunciation}/ • <span className="text-slate-800 dark:text-slate-200 font-bold">{currentV.hindiMeaning}</span>
                      </p>
                    )}
                    <p className="text-xs italic text-slate-600 dark:text-slate-400 border-t border-fuchsia-100 dark:border-slate-700/60 pt-3">
                      "{currentV.contextSentence}"
                    </p>
                  </div>
                );
              })()}

              {/* Options */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                  Select the exact definition:
                </div>
                {vocabBank[vocabIndex % vocabBank.length].options.map((option, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleVocabChoice(optIdx)}
                    className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-fuchsia-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 transition active:scale-95 text-left flex items-start gap-3 cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded-full bg-fuchsia-500/10 text-fuchsia-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {vocabState === 'ended' && (
            <div className="text-center py-8 space-y-5 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-200 dark:border-fuchsia-800 flex items-center justify-center mx-auto text-fuchsia-500">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">
                  Vocab Clash Conquered!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  You scored <strong className="text-fuchsia-600 font-black">{vocabScore} points</strong> and earned <strong className="text-amber-600 font-black">+{Math.max(30, vocabScore)} XP</strong>!
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={startVocabClash}
                  className="px-6 py-3 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md shadow-fuchsia-600/25"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Play Vocab Again</span>
                </button>
                <button
                  onClick={() => setVocabState('idle')}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Back to Hub
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 5. POMODORO FOCUS ROOM & AMBIENT SYNTH ================= */}
      {activeGame === 'pomodoro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pomodoro Timer */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-sky-200/80 dark:border-slate-800 shadow-xl shadow-sky-500/5 space-y-6 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                pomoMode === 'study'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}>
                {pomoMode === 'study' ? 'Deep Study Session' : 'Quick Recharge Break'}
              </span>
            </div>

            {/* Giant Circular Clock */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-slate-50 dark:bg-slate-800/40 border-4 border-indigo-500/20 dark:border-indigo-500/30 flex flex-col items-center justify-center shadow-inner">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
                {String(pomoMinutes).padStart(2, '0')}:{String(pomoSeconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-400 font-medium mt-1">
                {pomoRunning ? 'Focusing...' : 'Ready to start'}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePomo}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
              >
                {pomoRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{pomoRunning ? 'Pause' : 'Start Focus'}</span>
              </button>

              <button
                onClick={resetPomo}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ambient Synth Audio Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-outfit">
                <Headphones className="w-5 h-5 text-indigo-500" />
                <span>Ambient Study Synthesizer</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Built-in synthetic audio streams to mask room noise and induce alpha focus waves.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'off' as const, label: 'Mute Audio', desc: 'Silence' },
                { id: 'binaural' as const, label: 'Alpha Waves', desc: '14Hz Focus' },
                { id: 'lofi' as const, label: 'Lo-Fi Chill', desc: 'Soft chords' },
                { id: 'rain' as const, label: 'Rain Shower', desc: 'Nature drops' },
                { id: 'library' as const, label: 'Quiet Library', desc: 'Pages & hush' },
              ].map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleAmbientChange(sound.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    ambientSound === sound.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold">{sound.label}</p>
                  <p className="text-[10px] text-slate-400">{sound.desc}</p>
                </button>
              ))}
            </div>

            {ambientSound !== 'off' && (
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Volume2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="text-xs font-mono text-slate-500 w-10 text-right">
                  {Math.round(ambientVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 6. DAILY QUESTS & MYSTERY CHEST ================= */}
      {activeGame === 'quest' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-rose-200/80 dark:border-slate-800 shadow-xl shadow-rose-500/5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-outfit">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Today's Study Quests</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">Resets Daily</span>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Explain 1 new concept in any subject', xp: 20, done: true },
                { title: 'Complete a 60-second Brain Sprint drill', xp: 30, done: drillScore > 0 },
                { title: 'Score points in Formula Blitz Rush', xp: 35, done: blitzScore > 0 },
                { title: 'Master 2 words in Vocab & Speech Clash', xp: 25, done: vocabScore > 0 },
                { title: 'Generate high-yield revision notes', xp: 25, done: false },
              ].map((quest, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    quest.done
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {quest.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                    )}
                    <div>
                      <p className={`text-xs sm:text-sm font-semibold ${
                        quest.done ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {quest.title}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    +{quest.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mystery Chest */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-800/50 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-amber-400 shadow-2xl">
              <Gift className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-outfit">Daily Scholar Mystery Chest</h3>
              <p className="text-xs text-indigo-200 mt-1 max-w-xs">
                Unlock secret XP boosts, badges, and study energy every 24 hours.
              </p>
            </div>

            {mysteryOpened ? (
              <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-xs font-mono text-amber-300 animate-fadeIn">
                🎉 {mysteryReward}
              </div>
            ) : (
              <button
                onClick={openMysteryBox}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                Claim Daily Mystery Gift
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
