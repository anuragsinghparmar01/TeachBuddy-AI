import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Zap, Clock, Brain, Trophy, Sparkles, RefreshCw, 
  CheckCircle2, XCircle, Flame, Volume2, VolumeX, Play, Pause, 
  RotateCcw, Gift, Award, Headphones, ArrowRight, BookOpen, AlertCircle
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

export const GamesModule: React.FC<GamesModuleProps> = ({
  user,
  darkMode,
  onUpdateUser,
}) => {
  const [activeGame, setActiveGame] = useState<'drill' | 'memory' | 'pomodoro' | 'quest'>('drill');
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
      const newStreak = drillStreak + 1;
      setDrillStreak(newStreak);
      const points = 10 + Math.min(newStreak * 2, 20);
      setDrillScore((prev) => prev + points);
    } else {
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
    // Award XP
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

      // Create 12 cards (6 terms + 6 matches)
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

      // Shuffle deck
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
        // Matched!
        setTimeout(() => {
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
        }, 500);
      } else {
        // Not matched - flip back
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setMemoryCards([...newCards]);
          setFlippedCards([]);
        }, 1100);
      }
    }
  };

  // ================= 3. POMODORO FOCUS ROOM & AMBIENT SYNTH =================
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
              // Timer finished
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

  // Cleanup ambient audio on unmount
  useEffect(() => {
    return () => {
      audioService.stopAmbientSound();
    };
  }, []);

  // ================= 4. DAILY STUDY QUESTS & MYSTERY BOX =================
  const [mysteryOpened, setMysteryOpened] = useState(false);
  const [mysteryReward, setMysteryReward] = useState<string | null>(null);

  const openMysteryBox = () => {
    if (mysteryOpened) return;
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    setMysteryOpened(true);
    const bonusXp = 75;
    setMysteryReward(`+${bonusXp} XP & "Golden Focus" Mystery Gem!`);
    onUpdateUser({
      xp: (user.xp || 0) + bonusXp,
      badges: [...(user.badges || []), 'Mystery Pioneer'],
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7 text-indigo-500" />
            <span>Games & Interactive Learning Hub</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build rapid recall, master formulas, and stay in deep study flow.
          </p>
        </div>

        {/* Global XP & Streak Badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span>{user.xp || 0} Total XP</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
            <Flame className="w-4 h-4 fill-rose-500" />
            <span>{user.streakDays || 1} Day Streak</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <button
          onClick={() => { audioService.playSound('click'); setActiveGame('drill'); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeGame === 'drill' 
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>60s Brain Sprint</span>
        </button>

        <button
          onClick={() => { audioService.playSound('click'); setActiveGame('memory'); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeGame === 'memory' 
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Formula Match</span>
        </button>

        <button
          onClick={() => { audioService.playSound('click'); setActiveGame('pomodoro'); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeGame === 'pomodoro' 
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Focus & Ambient</span>
        </button>

        <button
          onClick={() => { audioService.playSound('click'); setActiveGame('quest'); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeGame === 'quest' 
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Daily Quests</span>
        </button>
      </div>

      {/* Subject Selector (Shared across games) */}
      {(activeGame === 'drill' || activeGame === 'memory') && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap pl-1">Subject:</span>
          {ALL_SUBJECTS.map((sub) => (
            <button
              key={sub}
              onClick={() => { audioService.playSound('click'); setSelectedSubject(sub); }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* ================= 1. 60S BRAIN SPRINT VIEW ================= */}
      {activeGame === 'drill' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {drillState === 'idle' && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  60-Second Brain Sprint Drill
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  How many rapid conceptual True/False questions can you conquer in 1 minute on <strong className="text-indigo-600 dark:text-indigo-400">{selectedSubject}</strong>?
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
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 mx-auto transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Sprint (60s)</span>
              </button>
            </div>
          )}

          {drillState === 'loading' && (
            <div className="text-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono">
                Live Gemini 3.8 Generating Speed Drill...
              </p>
            </div>
          )}

          {drillState === 'playing' && drillQuestions[drillIndex] && (
            <div className="space-y-6 max-w-xl mx-auto">
              {/* Drill HUD */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">Question {drillIndex + 1}/{drillQuestions.length}</span>
                  {drillStreak > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold font-mono animate-pulse">
                      🔥 {drillStreak}x COMBO
                    </span>
                  )}
                </div>

                {/* Circular Timer */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{drillTimeLeft}s</span>
                </div>

                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Score: {drillScore}
                </div>
              </div>

              {/* Question Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center space-y-4">
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  {selectedSubject}
                </span>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  "{drillQuestions[drillIndex].question}"
                </p>
              </div>

              {/* True / False Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDrillAnswer(true)}
                  className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>TRUE</span>
                </button>

                <button
                  onClick={() => handleDrillAnswer(false)}
                  className="py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer"
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
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Sprint Complete!
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  You scored <strong className="text-emerald-500">{drillScore} points</strong> and earned <strong className="text-amber-500">+{Math.max(25, drillScore)} XP</strong>!
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={startBrainSprint}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={() => setDrillState('idle')}
                  className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {memoryState === 'idle' && (
            <div className="text-center py-8 space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Formula & Concept Memory Duel
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
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
                className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 mx-auto transition hover:scale-105 active:scale-95 cursor-pointer"
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
                Live Gemini 3.8 Generating Concept Pairs...
              </p>
            </div>
          )}

          {(memoryState === 'playing' || memoryState === 'won') && (
            <div className="space-y-6">
              {/* Game HUD */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="text-xs font-mono text-slate-500">
                  Matches: <strong className="text-indigo-600 dark:text-indigo-400">{memoryMatches}/6</strong>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Moves: <strong className="text-slate-900 dark:text-white">{memoryMoves}</strong>
                </div>
                <button
                  onClick={startMemoryDuel}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New Deck</span>
                </button>
              </div>

              {/* 12-Card Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {memoryCards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className={`h-28 sm:h-32 rounded-2xl p-3 sm:p-4 flex items-center justify-center text-center cursor-pointer transition-all duration-300 border select-none ${
                      card.isMatched
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 scale-95 opacity-80'
                        : card.isFlipped
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 shadow-md scale-100'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-transparent hover:bg-slate-200 dark:hover:bg-slate-700/80 shadow-sm'
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? (
                      <span className="text-xs sm:text-sm font-bold leading-snug line-clamp-4">
                        {card.text}
                      </span>
                    ) : (
                      <Brain className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                ))}
              </div>

              {memoryState === 'won' && (
                <div className="text-center p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
                  <h4 className="text-lg font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>Memory Duel Solved!</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    You matched all pairs in {memoryMoves} moves and claimed <strong className="text-amber-500">+50 XP</strong>!
                  </p>
                  <button
                    onClick={startMemoryDuel}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition cursor-pointer"
                  >
                    Play Another Set
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= 3. POMODORO FOCUS ROOM & AMBIENT SYNTH ================= */}
      {activeGame === 'pomodoro' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              pomoMode === 'study'
                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}>
              {pomoMode === 'study' ? 'Deep Focus Session' : 'Relaxing Break'}
            </span>

            {/* Giant Clock Display */}
            <div className="text-6xl sm:text-7xl font-mono font-bold text-slate-900 dark:text-white tracking-tight py-4">
              {String(pomoMinutes).padStart(2, '0')}:{String(pomoSeconds).padStart(2, '0')}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={togglePomo}
                className={`px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer ${
                  pomoRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                {pomoRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{pomoRunning ? 'Pause Session' : 'Start Focus'}</span>
              </button>

              <button
                onClick={resetPomo}
                className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ambient Study Audio Synthesizer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Synthesized Ambient Background Sound
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {ambientSound === 'off' ? 'Muted' : 'Playing Live'}
              </span>
            </div>

            {/* Audio Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'off', label: 'Off' },
                { id: 'lofi', label: 'Lo-Fi Drone' },
                { id: 'rain', label: 'Cozy Rain' },
                { id: 'library', label: 'Quiet Library' },
                { id: 'binaural', label: '40Hz Gamma' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAmbientChange(item.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer ${
                    ambientSound === item.id
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            {ambientSound !== 'off' && (
              <div className="flex items-center gap-3 pt-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-500 w-10 text-right">
                  {Math.round(ambientVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 4. DAILY QUESTS & MYSTERY BOX ================= */}
      {activeGame === 'quest' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Quests List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Today's Study Quests</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">Resets Daily</span>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Explain 1 new concept in any subject', xp: 20, done: true },
                { title: 'Complete a 60-second Brain Sprint drill', xp: 30, done: drillScore > 0 },
                { title: 'Generate high-yield revision notes', xp: 25, done: false },
                { title: 'Score 80%+ on any chapter quiz', xp: 40, done: false },
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
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-800/50 shadow-xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-amber-400 shadow-2xl">
              <Gift className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h3 className="text-xl font-bold">Daily Scholar Mystery Chest</h3>
              <p className="text-xs text-indigo-200 mt-1 max-w-xs">
                Unlock secret XP boosts, badges, and study energy every 24 hours.
              </p>
            </div>

            {mysteryOpened ? (
              <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-xs font-mono text-amber-300">
                🎉 {mysteryReward}
              </div>
            ) : (
              <button
                onClick={openMysteryBox}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 transition hover:scale-105 active:scale-95 cursor-pointer"
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
