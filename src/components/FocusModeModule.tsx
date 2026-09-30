import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  Award,
  CloudRain,
  Trees,
  Coffee,
  Bell,
  Brain,
  Zap,
  Target,
  Sliders,
  Wind,
  Layers,
  History,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  Flame,
  PhoneCall,
  RefreshCw
} from 'lucide-react';
import type { UserProfile } from '../types';
import { audioService } from '../services/audioService';

interface FocusModeModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
  initialGoal?: string;
}

type TimerPhase = 'focus' | 'short_break' | 'long_break';
type AmbientSoundType = 'none' | 'rain' | 'forest' | 'cafe' | 'bowl' | 'alpha' | 'cosmos';

interface FocusSessionRecord {
  id: string;
  goal: string;
  durationMinutes: number;
  phase: TimerPhase;
  completedAt: string;
  xpEarned: number;
}

const FOCUS_FLASHCARDS = [
  {
    category: 'Memory Science',
    front: 'What is the Active Recall + Spaced Repetition effect?',
    back: 'Testing yourself from memory at increasing intervals (1d, 3d, 7d, 21d) strengthens synaptic myelination 3x faster than passive re-reading.'
  },
  {
    category: 'Physics & Nature',
    front: 'Why does Rayleigh Scattering make the sky blue and sunsets red?',
    back: 'Shorter blue wavelengths (450nm) scatter 4.4x more strongly against nitrogen/oxygen molecules than longer red wavelengths (700nm).'
  },
  {
    category: 'Mathematics',
    front: 'What is the Golden Ratio (φ) and where does it appear?',
    back: 'φ = (1 + √5) / 2 ≈ 1.61803. It governs Fibonacci spirals, phyllotaxis leaf arrangements, and classical architectural proportions.'
  },
  {
    category: 'Neuroscience',
    front: 'How do 40Hz Gamma & 10Hz Alpha frequencies assist study focus?',
    back: '10Hz Alpha waves calm prefrontal cortex noise during reading, while 40Hz Gamma oscillations synchronize cross-hemisphere working memory.'
  },
  {
    category: 'Exam Strategy',
    front: 'What is the Feynman Technique for mastering tough concepts?',
    back: '1. Explain the concept simply as if to a 10-year-old. 2. Pinpoint gaps where you get stuck. 3. Replace jargon with a vivid real-world analogy.'
  }
];

export const FocusModeModule: React.FC<FocusModeModuleProps> = ({
  user,
  onUpdateUser,
  onOpenVoiceCallWithTopic,
  initialGoal,
}) => {
  // Custom Interval Settings (in minutes)
  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15);
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState<number>(4);
  const [autoStartNext, setAutoStartNext] = useState<boolean>(false);
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(true);
  const [showCustomStudio, setShowCustomStudio] = useState<boolean>(false);

  // Active Timer State
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [totalPhaseSeconds, setTotalPhaseSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [sessionGoal, setSessionGoal] = useState<string>(
    initialGoal || 'Deep Revision & Concept Mastery'
  );
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Gentle Expiry Notification Animation State
  const [expiryNotification, setExpiryNotification] = useState<{
    visible: boolean;
    finishedPhase: TimerPhase;
    minutesCompleted: number;
    xpEarned: number;
    nextSuggestedPhase: TimerPhase;
  } | null>(null);

  // Update sessionGoal if initialGoal changes from another module
  useEffect(() => {
    if (initialGoal && initialGoal.trim()) {
      setSessionGoal(initialGoal.trim());
    }
  }, [initialGoal]);

  // 3D Breathing Pacer State
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathStage, setBreathStage] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathCount, setBreathCount] = useState<number>(4);

  // 3D Flashcard State
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  // Task List & Distraction Catcher
  const [rightTab, setRightTab] = useState<'tasks' | 'dump' | 'history'>('tasks');
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'Revise key formulas and core definitions', done: false },
    { id: '2', text: 'Solve 5 high-yield practice problems', done: false },
    { id: '3', text: 'Test active recall without looking at notes', done: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState<string>('');

  const [distractionNotes, setDistractionNotes] = useState<{ id: string; text: string; time: string }[]>([
    { id: 'd1', text: 'Check syllabus weightage for Thermodynamics later', time: 'Saved earlier' }
  ]);
  const [distractionInput, setDistractionInput] = useState<string>('');

  // Session History persisted in localStorage
  const [sessionHistory, setSessionHistory] = useState<FocusSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('teachbuddy_focus_sessions_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState<number>(120);

  // Web Audio Ambient Synthesizer
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('rain');
  const [volume, setVolume] = useState<number>(0.35);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ source?: AudioNode; gain?: GainNode; stop?: () => void }>({});

  // Play a gentle harmonic Tibetan singing bowl / zen chime when timer expires
  const playGentleExpiryChime = () => {
    if (!chimeEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Play 3 gentle harmonic notes (528Hz Solfeggio, 660Hz, 792Hz)
      [528, 660, 792].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.28);

        gain.gain.setValueAtTime(0.001, now + idx * 0.28);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.28 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.28 + 2.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.28);
        osc.stop(now + idx * 0.28 + 2.7);
      });
    } catch (e) {
      console.warn('Gentle chime notice:', e);
    }
  };

  // Stop ambient audio
  const stopAmbientAudio = () => {
    if (soundNodesRef.current.stop) {
      soundNodesRef.current.stop();
      soundNodesRef.current = {};
    }
  };

  // Play Web Audio synthesized ambient sound
  const startAmbientAudio = (type: AmbientSoundType) => {
    stopAmbientAudio();
    if (type === 'none' || isAudioMuted) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (type === 'rain') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        soundNodesRef.current = {
          source: whiteNoise,
          gain: masterGain,
          stop: () => {
            try { whiteNoise.stop(); whiteNoise.disconnect(); } catch {}
          }
        };
      } else if (type === 'bowl' || type === 'alpha' || type === 'cosmos') {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc.type = 'sine';
        osc2.type = type === 'cosmos' ? 'triangle' : 'sine';
        const baseFreq = type === 'bowl' ? 432 : type === 'cosmos' ? 528 : 216;
        const beatOffset = type === 'alpha' ? 10 : type === 'cosmos' ? 4 : 1.5;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc2.frequency.setValueAtTime(baseFreq + beatOffset, ctx.currentTime);

        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(0.14, ctx.currentTime);
        osc.connect(gain1);
        osc2.connect(gain1);
        gain1.connect(masterGain);

        osc.start();
        osc2.start();

        soundNodesRef.current = {
          gain: masterGain,
          stop: () => {
            try { osc.stop(); osc2.stop(); osc.disconnect(); osc2.disconnect(); } catch {}
          }
        };
      } else if (type === 'forest' || type === 'cafe') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const brownNoise = ctx.createBufferSource();
        brownNoise.buffer = noiseBuffer;
        brownNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'forest' ? 'bandpass' : 'lowpass';
        filter.frequency.setValueAtTime(type === 'forest' ? 1200 : 450, ctx.currentTime);

        brownNoise.connect(filter);
        filter.connect(masterGain);
        brownNoise.start();

        soundNodesRef.current = {
          source: brownNoise,
          gain: masterGain,
          stop: () => {
            try { brownNoise.stop(); brownNoise.disconnect(); } catch {}
          }
        };
      }
    } catch (e) {
      console.warn('Ambient Audio init notice:', e);
    }
  };

  // Update volume in real-time
  useEffect(() => {
    if (soundNodesRef.current.gain && audioCtxRef.current) {
      soundNodesRef.current.gain.gain.setValueAtTime(isAudioMuted ? 0 : volume, audioCtxRef.current.currentTime);
    }
  }, [volume, isAudioMuted]);

  // Handle ambient sound switch
  useEffect(() => {
    if (isRunning) {
      startAmbientAudio(activeSound);
    } else {
      stopAmbientAudio();
    }
    return () => stopAmbientAudio();
  }, [isRunning, activeSound]);

  // 4-4-4 Box Breathing Pacer Interval
  useEffect(() => {
    if (!breathingActive) return;
    const timer = setInterval(() => {
      setBreathCount((prev) => {
        if (prev > 1) return prev - 1;
        setBreathStage((stage) => {
          if (stage === 'Inhale') return 'Hold';
          if (stage === 'Hold') return 'Exhale';
          return 'Inhale';
        });
        return 4;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breathingActive]);

  // Helper to get duration in seconds for a phase
  const getPhaseSeconds = (targetPhase: TimerPhase) => {
    if (targetPhase === 'focus') return Math.max(10, Math.round(focusDuration * 60));
    if (targetPhase === 'short_break') return Math.max(10, Math.round(shortBreakDuration * 60));
    return Math.max(10, Math.round(longBreakDuration * 60));
  };

  // Switch phase manually
  const handleSwitchPhase = (newPhase: TimerPhase, autoRun = false) => {
    setIsRunning(autoRun);
    setPhase(newPhase);
    const secs = getPhaseSeconds(newPhase);
    setTimeLeft(secs);
    setTotalPhaseSeconds(secs);
    setExpiryNotification(null);
  };

  // Trigger expiry notification + reward logic
  const triggerSessionExpiry = (completedPhase: TimerPhase) => {
    playGentleExpiryChime();
    audioService.playSound('levelup');

    const minsDone =
      completedPhase === 'focus'
        ? Math.max(1, Math.round(totalPhaseSeconds / 60))
        : completedPhase === 'short_break'
        ? shortBreakDuration
        : longBreakDuration;

    let xpReward = 0;
    let nextPhase: TimerPhase = 'focus';

    if (completedPhase === 'focus') {
      xpReward = Math.max(25, minsDone * 3);
      const nextCompletedCount = completedSessions + 1;
      setCompletedSessions(nextCompletedCount);
      onUpdateUser({ xp: (user.xp || 0) + xpReward });

      // Save to session history
      const newRecord: FocusSessionRecord = {
        id: `focus-${Date.now()}`,
        goal: sessionGoal || 'Deep Focus Session',
        durationMinutes: minsDone,
        phase: 'focus',
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        xpEarned: xpReward,
      };
      setSessionHistory((prev) => {
        const updated = [newRecord, ...prev.slice(0, 19)];
        try {
          localStorage.setItem('teachbuddy_focus_sessions_v2', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (currentCycle >= cyclesBeforeLongBreak) {
        nextPhase = 'long_break';
        setCurrentCycle(1);
      } else {
        nextPhase = 'short_break';
        setCurrentCycle((c) => c + 1);
      }
    } else {
      xpReward = 15;
      nextPhase = 'focus';
    }

    setExpiryNotification({
      visible: true,
      finishedPhase: completedPhase,
      minutesCompleted: minsDone,
      xpEarned: xpReward,
      nextSuggestedPhase: nextPhase,
    });

    if (autoStartNext) {
      setPhase(nextPhase);
      const nextSecs = getPhaseSeconds(nextPhase);
      setTimeLeft(nextSecs);
      setTotalPhaseSeconds(nextSecs);
      setIsRunning(true);
    } else {
      setIsRunning(false);
      stopAmbientAudio();
    }
  };

  // Main Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      triggerSessionExpiry(phase);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, phase]);

  // Select Preset or Custom Focus Duration
  const handleSelectFocusDuration = (mins: number, isSecondsDemo = false) => {
    setIsRunning(false);
    setPhase('focus');
    setExpiryNotification(null);
    if (isSecondsDemo) {
      setTimeLeft(10);
      setTotalPhaseSeconds(10);
    } else {
      const clamped = Math.max(1, Math.min(180, mins));
      setFocusDuration(clamped);
      setTimeLeft(clamped * 60);
      setTotalPhaseSeconds(clamped * 60);
    }
  };

  const handleUpdateShortBreak = (mins: number) => {
    const clamped = Math.max(1, Math.min(45, mins));
    setShortBreakDuration(clamped);
    if (phase === 'short_break' && !isRunning) {
      setTimeLeft(clamped * 60);
      setTotalPhaseSeconds(clamped * 60);
    }
  };

  const handleUpdateLongBreak = (mins: number) => {
    const clamped = Math.max(5, Math.min(60, mins));
    setLongBreakDuration(clamped);
    if (phase === 'long_break' && !isRunning) {
      setTimeLeft(clamped * 60);
      setTotalPhaseSeconds(clamped * 60);
    }
  };

  const handleToggleTimer = () => {
    if (expiryNotification?.visible) {
      setExpiryNotification(null);
    }
    if (timeLeft === 0) {
      const secs = getPhaseSeconds(phase);
      setTimeLeft(secs);
      setTotalPhaseSeconds(secs);
    }
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setExpiryNotification(null);
    const secs = getPhaseSeconds(phase);
    setTimeLeft(secs);
    setTotalPhaseSeconds(secs);
    stopAmbientAudio();
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progress percentage & SVG ring math
  const safeTotal = Math.max(1, totalPhaseSeconds);
  const progressPercent = Math.min(100, Math.max(0, ((safeTotal - timeLeft) / safeTotal) * 100));
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  // Calculate 3D Orbiting Satellite Dot coordinates on the 260x260 SVG canvas
  const angleRad = ((progressPercent / 100) * 360 - 90) * (Math.PI / 180);
  const dotX = 130 + radius * Math.cos(angleRad);
  const dotY = 130 + radius * Math.sin(angleRad);

  // Task management
  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now().toString(), text: newTaskInput.trim(), done: false }]);
    setNewTaskInput('');
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Distraction Dump management
  const handleAddDistraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distractionInput.trim()) return;
    setDistractionNotes((prev) => [
      {
        id: `d-${Date.now()}`,
        text: distractionInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);
    setDistractionInput('');
  };

  const ambientOptions: { id: AmbientSoundType; label: string; sub: string; icon: any }[] = [
    { id: 'rain', label: 'Monsoon Rain', sub: 'Pink Noise', icon: CloudRain },
    { id: 'alpha', label: '10Hz Alpha Flow', sub: 'Deep Memory', icon: Brain },
    { id: 'cosmos', label: '528Hz Cosmos', sub: 'Solfeggio', icon: Sparkles },
    { id: 'forest', label: 'Woodland Breeze', sub: 'Nature Calm', icon: Trees },
    { id: 'cafe', label: 'Library Cafe', sub: 'Warm Murmur', icon: Coffee },
    { id: 'bowl', label: 'Zen Singing Bowl', sub: '432Hz Harmonic', icon: Bell },
  ];

  const totalMinutesToday = sessionHistory.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const dailyGoalPercent = Math.min(100, Math.round((totalMinutesToday / dailyTargetMinutes) * 100));

  const currentFlashcard = FOCUS_FLASHCARDS[cardIndex % FOCUS_FLASHCARDS.length];

  return (
    <div
      className={`w-full transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 p-4 sm:p-8 bg-slate-950 text-white overflow-y-auto'
          : 'max-w-7xl mx-auto px-1 sm:px-4 py-2 sm:py-4'
      }`}
    >
      {/* Premium Top Command Header */}
      <div className="premium-card rounded-3xl p-4 sm:p-5 mb-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-500/12 via-violet-500/12 to-sky-500/12 blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl btn-premium-indigo flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-outfit">
                  Pomodoro Focus & Zen Studio
                </h1>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  · Cycle {currentCycle} of {cyclesBeforeLongBreak} · +{completedSessions * 60} XP
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Custom study intervals, gentle harmonic completion alerts, neural soundscapes & guided breathing
              </p>
            </div>
          </div>

          {/* Right Header Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCustomStudio(!showCustomStudio)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                showCustomStudio
                  ? 'btn-3d-indigo text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Intervals</span>
            </button>

            <button
              onClick={() => triggerSessionExpiry(phase)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500/15 to-cyan-500/15 hover:from-violet-500/25 hover:to-cyan-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              title="Preview the gentle animation & harmonic chime when timer expires"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Preview Expiry Alert</span>
            </button>

            {onOpenVoiceCallWithTopic && (
              <button
                onClick={() => onOpenVoiceCallWithTopic(sessionGoal)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voice Coach</span>
              </button>
            )}

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isFullScreen ? 'Exit Zen Fullscreen' : 'Enter Zen Fullscreen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Custom Interval Configuration Studio */}
        {showCustomStudio && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Custom Focus Duration */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Focus Duration (min)
                  </span>
                  <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {focusDuration} min
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={focusDuration}
                  onChange={(e) => handleSelectFocusDuration(parseInt(e.target.value, 10) || 25)}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-2"
                />
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleSelectFocusDuration(Math.max(1, focusDuration - 5))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-indigo-400 cursor-pointer"
                  >
                    -5m
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={focusDuration}
                    onChange={(e) => handleSelectFocusDuration(parseInt(e.target.value, 10) || 1)}
                    aria-label="Custom Focus Minutes"
                    className="w-16 text-center text-xs font-bold font-mono tabular-nums py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleSelectFocusDuration(Math.min(180, focusDuration + 5))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-indigo-400 cursor-pointer"
                  >
                    +5m
                  </button>
                </div>
              </div>

              {/* Custom Short Break Duration */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Short Break (min)
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {shortBreakDuration} min
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={shortBreakDuration}
                  onChange={(e) => handleUpdateShortBreak(parseInt(e.target.value, 10) || 5)}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-2"
                />
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleUpdateShortBreak(Math.max(1, shortBreakDuration - 1))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-emerald-400 cursor-pointer"
                  >
                    -1m
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={shortBreakDuration}
                    onChange={(e) => handleUpdateShortBreak(parseInt(e.target.value, 10) || 1)}
                    aria-label="Custom Short Break Minutes"
                    className="w-16 text-center text-xs font-bold font-mono tabular-nums py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleUpdateShortBreak(Math.min(45, shortBreakDuration + 1))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-emerald-400 cursor-pointer"
                  >
                    +1m
                  </button>
                </div>
              </div>

              {/* Custom Long Break Duration */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Long Break (min)
                  </span>
                  <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums">
                    {longBreakDuration} min
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={longBreakDuration}
                  onChange={(e) => handleUpdateLongBreak(parseInt(e.target.value, 10) || 15)}
                  className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer mb-2"
                />
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleUpdateLongBreak(Math.max(5, longBreakDuration - 5))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-amber-400 cursor-pointer"
                  >
                    -5m
                  </button>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={longBreakDuration}
                    onChange={(e) => handleUpdateLongBreak(parseInt(e.target.value, 10) || 15)}
                    aria-label="Custom Long Break Minutes"
                    className="w-16 text-center text-xs font-bold font-mono tabular-nums py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleUpdateLongBreak(Math.min(60, longBreakDuration + 5))}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-amber-400 cursor-pointer"
                  >
                    +5m
                  </button>
                </div>
              </div>

              {/* Cycle & Automation Controls */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cycles to Long Break
                  </span>
                  <div className="flex items-center gap-1">
                    {[2, 3, 4, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setCyclesBeforeLongBreak(num)}
                        className={`w-6 h-6 rounded-lg text-xs font-bold cursor-pointer ${
                          cyclesBeforeLongBreak === num
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                  <span>Auto-start next interval</span>
                  <input
                    type="checkbox"
                    checked={autoStartNext}
                    onChange={(e) => setAutoStartNext(e.target.checked)}
                    className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Gentle 528Hz Expiry Chime</span>
                  <input
                    type="checkbox"
                    checked={chimeEnabled}
                    onChange={(e) => setChimeEnabled(e.target.checked)}
                    className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main 12-Column Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 7 COLUMNS: 3D Volumetric Pomodoro Timer & Breathing Pacer */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main 3D Pomodoro Clock Stage */}
          <div className="card-3d rounded-3xl p-5 sm:p-8 relative overflow-hidden">
            {/* Ambient 3D Radial Glow Behind Clock */}
            <div
              className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
                phase === 'focus'
                  ? 'bg-indigo-500/15'
                  : phase === 'short_break'
                  ? 'bg-emerald-500/15'
                  : 'bg-amber-500/15'
              }`}
            />
            <div
              className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 ${
                phase === 'focus'
                  ? 'bg-cyan-500/15'
                  : phase === 'short_break'
                  ? 'bg-teal-500/15'
                  : 'bg-fuchsia-500/15'
              }`}
            />

            {/* Phase Switcher Segmented Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                <button
                  onClick={() => handleSwitchPhase('focus')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    phase === 'focus'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Focus ({focusDuration}m)
                </button>
                <button
                  onClick={() => handleSwitchPhase('short_break')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    phase === 'short_break'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Short Break ({shortBreakDuration}m)
                </button>
                <button
                  onClick={() => handleSwitchPhase('long_break')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    phase === 'long_break'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Long Break ({longBreakDuration}m)
                </button>
              </div>

              {/* Cycle Progress Indicators */}
              <div className="flex items-center gap-1.5" title={`Cycle ${currentCycle} of ${cyclesBeforeLongBreak}`}>
                {Array.from({ length: cyclesBeforeLongBreak }).map((_, idx) => {
                  const cycleNum = idx + 1;
                  const isCompleted = cycleNum < currentCycle;
                  const isCurrent = cycleNum === currentCycle;
                  return (
                    <span
                      key={idx}
                      className={`h-2.5 rounded-full transition-all ${
                        isCurrent
                          ? 'w-6 bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-xs shadow-indigo-500/50'
                          : isCompleted
                          ? 'w-2.5 bg-emerald-500'
                          : 'w-2.5 bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Session Objective Input */}
            <div className="mb-6 relative z-10">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Current Study Objective
                </label>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {Math.round(progressPercent)}% elapsed
                </span>
              </div>
              <input
                type="text"
                value={sessionGoal}
                onChange={(e) => setSessionGoal(e.target.value)}
                placeholder="What concept or problem set are you mastering right now?"
                className="w-full text-sm font-semibold bg-white/90 dark:bg-slate-950/80 border border-indigo-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              />
            </div>

            {/* GENTLE EXPIRY NOTIFICATION ANIMATION OVERLAY (WHEN TIME EXPIRES) */}
            {expiryNotification?.visible && (
              <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-indigo-950/95 via-slate-900/95 to-violet-950/95 text-white border border-indigo-400/40 shadow-2xl relative overflow-hidden animate-fadeIn z-20">
                {/* Gentle Concentric Ripple Waves */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-44 rounded-full border-2 border-cyan-400/30 animate-gentle-ripple" />
                  <div className="w-64 h-64 rounded-full border border-violet-400/25 animate-gentle-ripple-delayed" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/30 mb-3 animate-float">
                    <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-cyan-300" />
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-cyan-300 tracking-wide">
                    {expiryNotification.finishedPhase === 'focus'
                      ? 'Focus Interval Gently Completed'
                      : 'Break Refresh Gently Completed'}
                  </span>

                  <h2 className="text-xl sm:text-2xl font-black font-outfit mt-1 text-white">
                    {expiryNotification.finishedPhase === 'focus'
                      ? `Wonderful Deep Work, ${user.name || 'Scholar'}!`
                      : 'Mind Refreshed & Recharged!'}
                  </h2>

                  <p className="text-xs sm:text-sm text-indigo-100/90 max-w-md mt-1.5">
                    You completed <strong>{expiryNotification.minutesCompleted} min</strong> on{' '}
                    <span className="underline decoration-cyan-400/60">{sessionGoal}</span> and earned{' '}
                    <strong className="text-emerald-300">+{expiryNotification.xpEarned} XP</strong>. Take a deep breath!
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                    <button
                      onClick={() => handleSwitchPhase(expiryNotification.nextSuggestedPhase, true)}
                      className="px-5 py-2.5 rounded-xl btn-3d-emerald text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>
                        {expiryNotification.nextSuggestedPhase === 'short_break'
                          ? `Start ${shortBreakDuration}m Short Break`
                          : expiryNotification.nextSuggestedPhase === 'long_break'
                          ? `Start ${longBreakDuration}m Long Break`
                          : `Start ${focusDuration}m Focus Block`}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        playGentleExpiryChime();
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-cyan-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Replay Gentle Chime</span>
                    </button>

                    <button
                      onClick={() => setExpiryNotification(null)}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3D Volumetric Circular Timer Dial */}
            <div className="flex flex-col items-center justify-center my-2 relative z-10">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full dial-3d-stage bg-gradient-to-b from-white via-indigo-50/30 to-slate-100/60 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/30 flex items-center justify-center border border-indigo-200/70 dark:border-slate-800">
                
                {/* Inner Rotating Geometric Harmonic Ring when Running */}
                <div
                  className={`absolute inset-6 rounded-full border border-dashed border-indigo-400/30 dark:border-indigo-500/25 pointer-events-none ${
                    isRunning ? 'animate-spin-slow' : ''
                  }`}
                />

                {/* SVG 60-Tick Precision Ring + Smooth Progress Arc + Orbiting 3D Satellite */}
                <svg viewBox="0 0 260 260" className="w-full h-full">
                  <defs>
                    <linearGradient id="focus3dGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={phase === 'focus' ? '#4f46e5' : phase === 'short_break' ? '#059669' : '#f59e0b'} />
                      <stop offset="50%" stopColor={phase === 'focus' ? '#8b5cf6' : phase === 'short_break' ? '#14b8a6' : '#ec4899'} />
                      <stop offset="100%" stopColor={phase === 'focus' ? '#06b6d4' : phase === 'short_break' ? '#34d399' : '#8b5cf6'} />
                    </linearGradient>
                    <filter id="glow3d" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* 60 Radial Tick Marks around the 3D Clock Bezel */}
                  {Array.from({ length: 60 }).map((_, i) => {
                    const tickAngle = (i * 6 - 90) * (Math.PI / 180);
                    const isMajor = i % 5 === 0;
                    const innerR = isMajor ? 121 : 123;
                    const outerR = 127;
                    const x1 = 130 + innerR * Math.cos(tickAngle);
                    const y1 = 130 + innerR * Math.sin(tickAngle);
                    const x2 = 130 + outerR * Math.cos(tickAngle);
                    const y2 = 130 + outerR * Math.sin(tickAngle);
                    const isLit = (i / 60) * 100 <= progressPercent;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isLit ? '#6366f1' : 'currentColor'}
                        strokeWidth={isMajor ? '2' : '1'}
                        className={
                          isLit
                            ? 'text-indigo-500 dark:text-cyan-400 transition-colors duration-300'
                            : 'text-slate-300/70 dark:text-slate-700/70'
                        }
                      />
                    );
                  })}

                  {/* Background Track Circle */}
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-200/80 dark:text-slate-800/90 fill-transparent"
                  />

                  {/* Active 3D Glowing Progress Circle */}
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    stroke="url(#focus3dGrad)"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 130 130)"
                    filter="url(#glow3d)"
                    className="fill-transparent transition-all duration-700 ease-out"
                  />

                  {/* Orbiting 3D Luminous Satellite Node */}
                  <circle
                    cx={dotX}
                    cy={dotY}
                    r="6.5"
                    className="fill-white stroke-indigo-600 dark:stroke-cyan-400 transition-all duration-700 ease-out"
                    strokeWidth="3"
                    filter="url(#glow3d)"
                  />
                </svg>

                {/* Central 3D Time Display */}
                <div className="absolute flex flex-col items-center justify-center text-center select-none px-4">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wide mb-0.5">
                    {phase === 'focus'
                      ? 'Deep Focus Block'
                      : phase === 'short_break'
                      ? 'Short Break Refresh'
                      : 'Long Restorative Break'}
                  </span>

                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-mono tabular-nums drop-shadow-xs">
                    {formatTime(timeLeft)}
                  </span>

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRunning ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {isRunning ? 'Flow State Active' : 'Paused · Ready'}
                    </span>
                  </div>

                  {/* Quick +/- 1 Minute Fine Adjusters right inside the dial */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => {
                        const next = Math.max(10, timeLeft - 60);
                        setTimeLeft(next);
                        if (next > totalPhaseSeconds) setTotalPhaseSeconds(next);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title="Subtract 1 minute"
                    >
                      -1m
                    </button>
                    <button
                      onClick={() => {
                        const next = timeLeft + 60;
                        setTimeLeft(next);
                        if (next > totalPhaseSeconds) setTotalPhaseSeconds(next);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title="Add 1 minute"
                    >
                      +1m
                    </button>
                  </div>
                </div>
              </div>

              {/* Tactile 3D Primary Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 mt-6">
                <button
                  onClick={handleResetTimer}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={handleToggleTimer}
                  className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2.5 cursor-pointer ${
                    isRunning ? 'btn-3d-amber' : phase === 'focus' ? 'btn-3d-indigo' : 'btn-3d-emerald'
                  }`}
                >
                  {isRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                  <span>
                    {isRunning
                      ? 'Pause Timer'
                      : phase === 'focus'
                      ? 'Start Focus Session'
                      : 'Start Break Timer'}
                  </span>
                </button>

                <button
                  onClick={() => setBreathingActive(!breathingActive)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                    breathingActive
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-cyan-400'
                  }`}
                  title="Toggle 3D Box-Breathing Zen Orb"
                >
                  <Wind className="w-5 h-5" />
                  <span className="hidden sm:inline">Breathe</span>
                </button>
              </div>
            </div>

            {/* Quick Interval Presets + 10s Live Demo Trigger */}
            <div className="mt-7 pt-5 border-t border-slate-200/70 dark:border-slate-800/80 relative z-10">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Quick Focus Intervals & Custom Presets
                </span>
                <button
                  onClick={() => setShowCustomStudio(!showCustomStudio)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {showCustomStudio ? 'Hide Custom Sliders' : 'Customize Any Interval →'}
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { mins: 0.16, label: '⚡ 10s Demo', isDemo: true },
                  { mins: 15, label: '15m Sprint', isDemo: false },
                  { mins: 25, label: '25m Classic', isDemo: false },
                  { mins: 45, label: '45m Deep', isDemo: false },
                  { mins: 60, label: '60m Master', isDemo: false },
                  { mins: 90, label: '90m Ultra', isDemo: false },
                ].map((p) => {
                  const isActive =
                    phase === 'focus' &&
                    ((p.isDemo && totalPhaseSeconds === 10) ||
                      (!p.isDemo && focusDuration === p.mins && totalPhaseSeconds === p.mins * 60));
                  return (
                    <button
                      key={p.label}
                      onClick={() => handleSelectFocusDuration(p.mins, p.isDemo)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer text-center whitespace-nowrap ${
                        isActive
                          ? 'btn-3d-indigo text-white'
                          : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Box-Breathing Zen Pacer & Active Recall Concept Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Breathing Pacer Card */}
            <div className="premium-card rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-outfit">
                    Guided Box-Breathing Pacer
                  </h3>
                </div>
                <button
                  onClick={() => setBreathingActive(!breathingActive)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    breathingActive
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {breathingActive ? 'Active' : 'Start 4-4-4'}
                </button>
              </div>

              <div className="flex flex-col items-center justify-center py-4 my-auto">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 flex flex-col items-center justify-center text-white shadow-xl transition-all duration-1000 ${
                      breathingActive
                        ? breathStage === 'Inhale'
                          ? 'scale-115 shadow-cyan-500/50'
                          : breathStage === 'Hold'
                          ? 'scale-115 shadow-violet-500/50'
                          : 'scale-85 opacity-85'
                        : 'animate-breathe-orb'
                    }`}
                  >
                    <span className="text-xs font-black tracking-wide">
                      {breathingActive ? breathStage : 'Zen Calm'}
                    </span>
                    <span className="text-lg font-mono font-black tabular-nums">
                      {breathingActive ? `${breathCount}s` : '4-4-4'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
                  Synchronize your breath with the harmonic sphere to calm focus and boost recall.
                </p>
              </div>
            </div>

            {/* Interactive Flip Concept Flashcard */}
            <div className="premium-card rounded-3xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white font-outfit">
                    Active Recall Flashcards
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsCardFlipped(false);
                      setCardIndex((prev) => (prev - 1 + FOCUS_FLASHCARDS.length) % FOCUS_FLASHCARDS.length);
                    }}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 cursor-pointer"
                    title="Previous Card"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-400 tabular-nums px-1">
                    {(cardIndex % FOCUS_FLASHCARDS.length) + 1}/{FOCUS_FLASHCARDS.length}
                  </span>
                  <button
                    onClick={() => {
                      setIsCardFlipped(false);
                      setCardIndex((prev) => (prev + 1) % FOCUS_FLASHCARDS.length);
                    }}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 cursor-pointer"
                    title="Next Card"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Flip Stage */}
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="flip-card-3d h-36 w-full cursor-pointer select-none my-1"
              >
                <div className={`flip-card-inner rounded-2xl ${isCardFlipped ? 'is-flipped' : ''}`}>
                  {/* Front Side */}
                  <div className="flip-card-front rounded-2xl p-4 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/90 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950/60 border border-indigo-200/80 dark:border-slate-700 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <span>{currentFlashcard.category}</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <RefreshCw className="w-3 h-3" /> Tap to Flip
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug my-auto">
                      {currentFlashcard.front}
                    </p>
                    <div className="text-[10px] text-slate-400">Question Side</div>
                  </div>

                  {/* Back Side */}
                  <div className="flip-card-back rounded-2xl p-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-600 text-white flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-200">
                      <span>Verified Insight</span>
                      <span>Tap to Flip Back</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium my-auto">
                      {currentFlashcard.back}
                    </p>
                    <div className="text-[10px] text-indigo-200">Answer Side</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT 5 COLUMNS: Neural Soundscape Equalizer + Milestones / Brain Dump / Analytics */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Acoustic Synthesizer & Equalizer Card */}
          <div className="premium-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-outfit">
                  Neural Acoustic Soundscapes
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Live Animated Equalizer Bars when playing */}
                {isRunning && activeSound !== 'none' && !isAudioMuted && (
                  <div className="flex items-end gap-0.5 h-4 px-1.5">
                    <span className="w-1 bg-indigo-500 rounded-full animate-soundwave-1" />
                    <span className="w-1 bg-violet-500 rounded-full animate-soundwave-2" />
                    <span className="w-1 bg-cyan-500 rounded-full animate-soundwave-3" />
                    <span className="w-1 bg-emerald-500 rounded-full animate-soundwave-4" />
                  </div>
                )}
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
                  title={isAudioMuted ? 'Unmute Ambient Audio' : 'Mute Ambient Audio'}
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {ambientOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = activeSound === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setActiveSound(opt.id);
                      if (isRunning) startAmbientAudio(opt.id);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'btn-3d-indigo text-white'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{opt.label}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {opt.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume Control Bar */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                Acoustic Gain
              </span>
              <input
                type="range"
                min="0.05"
                max="0.85"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Acoustic Gain Volume"
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 tabular-nums w-10 text-right">
                {isAudioMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>

          {/* Multi-Tab Study Deck: Milestones | Distraction Pad | Focus Log */}
          <div className="card-3d rounded-3xl p-5 sm:p-6">
            {/* Daily Focus Target Progress Bar */}
            <div className="mb-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Daily Deep-Work Target</span>
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {totalMinutesToday} / {dailyTargetMinutes} mins ({dailyGoalPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(4, dailyGoalPercent)}%` }}
                />
              </div>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 mb-4">
              <button
                onClick={() => setRightTab('tasks')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  rightTab === 'tasks'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Milestones ({tasks.filter((t) => t.done).length}/{tasks.length})
              </button>
              <button
                onClick={() => setRightTab('dump')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  rightTab === 'dump'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Distraction Pad ({distractionNotes.length})
              </button>
              <button
                onClick={() => setRightTab('history')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  rightTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                History ({sessionHistory.length})
              </button>
            </div>

            {/* TAB 1: Session Milestones */}
            {rightTab === 'tasks' && (
              <div className="animate-fadeIn">
                <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    placeholder="Add a study milestone..."
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 btn-3d-indigo rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        task.done
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                      >
                        {task.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'}>
                          {task.text}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition ml-2 cursor-pointer"
                        title="Remove milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Distraction Catcher / Mind Dump Pad */}
            {rightTab === 'dump' && (
              <div className="animate-fadeIn">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                  Random thought popped into your head while studying? Park it here in 2 seconds and return to your timer immediately:
                </p>
                <form onSubmit={handleAddDistraction} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={distractionInput}
                    onChange={(e) => setDistractionInput(e.target.value)}
                    placeholder="Jot intrusive thought & stay focused..."
                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 btn-3d-indigo rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    Park It
                  </button>
                </form>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {distractionNotes.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.text}</p>
                        <span className="text-[10px] text-slate-400">{item.time}</span>
                      </div>
                      <button
                        onClick={() => setDistractionNotes((prev) => prev.filter((d) => d.id !== item.id))}
                        className="text-slate-400 hover:text-emerald-500 p-1 ml-2 cursor-pointer"
                        title="Done / Clear"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Session History Log */}
            {rightTab === 'history' && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Completed Focus Blocks
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">Daily Target:</span>
                    {[60, 120, 180].map((target) => (
                      <button
                        key={target}
                        onClick={() => setDailyTargetMinutes(target)}
                        className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold cursor-pointer ${
                          dailyTargetMinutes === target
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {target}m
                      </button>
                    ))}
                  </div>
                </div>

                {sessionHistory.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                    <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No focus blocks logged yet today
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Complete a Pomodoro or tap "⚡ 10s Demo" to record your first session!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {sessionHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {rec.goal}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {rec.durationMinutes} min · {rec.completedAt}
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          +{rec.xpEarned} XP
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
