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
  Flame, 
  Award,
  CloudRain,
  Trees,
  Coffee,
  Bell,
  Brain,
  Zap,
  Target
} from 'lucide-react';
import type { UserProfile } from '../types';
import { audioService } from '../services/audioService';

interface FocusModeModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

type AmbientSoundType = 'none' | 'rain' | 'forest' | 'cafe' | 'bowl' | 'alpha';

export const FocusModeModule: React.FC<FocusModeModuleProps> = ({
  user,
  darkMode,
  onUpdateUser,
}) => {
  // Timer States
  const [selectedDuration, setSelectedDuration] = useState<number>(25); // in minutes
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [sessionGoal, setSessionGoal] = useState<string>('Deep Revision & Concept Mastery');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Task List
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'Revise key formulas and definitions', done: false },
    { id: '2', text: 'Solve 5 challenging practice problems', done: false },
    { id: '3', text: 'Summarize core insights in Notes', done: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState<string>('');

  // Web Audio Ambient Synthesizer
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('rain');
  const [volume, setVolume] = useState<number>(0.3);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ source?: AudioNode; gain?: GainNode; stop?: () => void }>({});

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
        // Synthesize soft soothing rain with noise buffer & lowpass
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
      } else if (type === 'bowl' || type === 'alpha') {
        // Singing Bowl or 432Hz Alpha wave harmonic
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc.type = 'sine';
        osc2.type = 'sine';
        const baseFreq = type === 'bowl' ? 432 : 216;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc2.frequency.setValueAtTime(baseFreq + (type === 'alpha' ? 10 : 1.5), ctx.currentTime); // 10Hz binaural beat

        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
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
        // Warm brown noise generator
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // boost volume
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

  // Main Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Session finished
      audioService.playSound('levelup');
      if (!isBreak) {
        setCompletedSessions((prev) => prev + 1);
        const earnedXp = (user.xp || 0) + 60;
        onUpdateUser({ xp: earnedXp });
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 min break
      } else {
        setIsBreak(false);
        setTimeLeft(selectedDuration * 60);
      }
      setIsRunning(false);
      stopAmbientAudio();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, selectedDuration]);

  const handleSelectPreset = (mins: number) => {
    setIsRunning(false);
    setIsBreak(false);
    setSelectedDuration(mins);
    setTimeLeft(mins * 60);
  };

  const handleToggleTimer = () => {
    if (!isRunning) {
      audioService.playSound('click');
    }
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(selectedDuration * 60);
    stopAmbientAudio();
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progress percentage
  const totalSecs = isBreak ? 5 * 60 : selectedDuration * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSecs - timeLeft) / totalSecs) * 100));

  // Task management
  const handleToggleTask = (id: string) => {
    audioService.playSound('pop');
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

  const ambientOptions: { id: AmbientSoundType; label: string; icon: any }[] = [
    { id: 'rain', label: 'Monsoon Rain', icon: CloudRain },
    { id: 'forest', label: 'Breeze & Nature', icon: Trees },
    { id: 'cafe', label: 'Study Cafe', icon: Coffee },
    { id: 'bowl', label: 'Singing Bowl', icon: Bell },
    { id: 'alpha', label: 'Alpha Waves', icon: Brain },
    { id: 'none', label: 'Silent Mode', icon: VolumeX },
  ];

  return (
    <div className={`w-full transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 p-4 sm:p-8 bg-slate-950 text-white overflow-y-auto' : 'max-w-6xl mx-auto px-4 py-6'}`}>
      
      {/* Header with Title & Fullscreen toggle */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-outfit">
                Focus & Zen Study Room
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Deep Work Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distraction-free Pomodoro, Ambient Acoustic Generator, and Goal Tracker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isFullScreen ? "Exit Fullscreen" : "Zen Fullscreen Mode"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Pomodoro Clock Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-xl relative overflow-hidden backdrop-blur-md">
          
          {/* Glowing Aura Accent */}
          <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-pink-500/10 blur-3xl pointer-events-none" />
          
          {/* Session Type Pill & Goal */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <span className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase flex items-center gap-1.5 ${
              isBreak 
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isBreak ? 'bg-emerald-500' : 'bg-indigo-500 animate-ping'}`} />
              {isBreak ? 'Break Refresh (5 min)' : 'Focus Session'}
            </span>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 px-3 py-1.5 rounded-full">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{completedSessions} Pomodoros Completed (+{completedSessions * 60} XP)</span>
            </div>
          </div>

          {/* Goal Input */}
          <div className="mb-6">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Current Focus Objective
            </label>
            <input
              type="text"
              value={sessionGoal}
              onChange={(e) => setSessionGoal(e.target.value)}
              placeholder="What are you mastering in this session?"
              className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Big Clock Dial with Radial SVG */}
          <div className="flex flex-col items-center justify-center my-4">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* SVG Circular Progress Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800 fill-transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="44%"
                  stroke="url(#timerGradient)"
                  strokeWidth="8"
                  strokeDasharray="276"
                  strokeDashoffset={276 - (276 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="fill-transparent transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Central Digits */}
              <div className="absolute flex flex-col items-center justify-center text-center select-none">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-outfit">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">
                  {isRunning ? 'Flow State Active' : 'Ready to Focus'}
                </span>
              </div>
            </div>

            {/* Play/Pause & Reset Action Bar */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleResetTimer}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleToggleTimer}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  isRunning
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-rose-500/25'
                    : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 shadow-indigo-600/30'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                <span>{isRunning ? 'Pause Session' : 'Start Focus Flow'}</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center sm:text-left">
              Select Preset Duration
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { mins: 15, label: '15m Sprint' },
                { mins: 25, label: '25m Classic' },
                { mins: 45, label: '45m Deep' },
                { mins: 60, label: '60m Master' },
              ].map((p) => (
                <button
                  key={p.mins}
                  onClick={() => handleSelectPreset(p.mins)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                    selectedDuration === p.mins && !isBreak
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ambient Sounds & Tasks Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Ambient Acoustic Synthesizer Card */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-outfit uppercase tracking-wider">
                  Ambient Study Sounds
                </h3>
              </div>
              <button
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Synthesized neural alpha frequencies and calming environmental acoustics to drown out distractions:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {ambientOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = activeSound === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveSound(opt.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3 pt-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Focus Session Task Checklist */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-outfit uppercase tracking-wider">
                  Session Milestones
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {tasks.filter((t) => t.done).length} / {tasks.length} Done
              </span>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="Add a milestone to conquer..."
                className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Tasks List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                    task.done
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
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
                    <span className={`line-clamp-2 ${task.done ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {task.text}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition ml-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Inspiring Motivational Banner */}
            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-pink-500/10 border border-indigo-500/20 text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                "Success in competitive exams & scholarship is the sum of small focus blocks repeated day in and day out."
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
