import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Target, 
  Award, 
  Flame, 
  TrendingUp, 
  ChevronRight,
  BookOpen,
  RefreshCw,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { StudySchedule, StudyScheduleTask, UserProfile } from '../types';
import { aiService } from '../services/aiService';
import { audioService } from '../services/audioService';
import { saveScheduleToFirestore, getLocalSchedules } from '../firebase';
import { exportScheduleToPdf } from '../services/pdfService';

interface ScheduleModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onStartQuizForTopic?: (topic: string) => void;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

export const ScheduleModule: React.FC<ScheduleModuleProps> = ({
  user,
  darkMode,
  onUpdateUser = (_updated: Partial<UserProfile>) => {},
  onStartQuizForTopic = (_topic: string) => {},
  onOpenVoiceCallWithTopic = (_topic: string) => {},
}) => {
  const [targetGoal, setTargetGoal] = useState('Physics & Math Final Exams');
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [totalDays, setTotalDays] = useState(7);
  const [examDate, setExamDate] = useState('2026-10-15');
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<StudySchedule | null>(null);

  // Focus Study Pomodoro Timer
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'break'>('study');
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    const saved = getLocalSchedules();
    if (saved.length > 0) {
      setSchedule(saved[0]);
    }
  }, []);

  // Pomodoro Interval
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            audioService.playSound('levelup');
            if (pomodoroMode === 'study') {
              setPomodoroMode('break');
              return 5 * 60;
            } else {
              setPomodoroMode('study');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, pomodoroMode]);

  const handleGenerateSchedule = async () => {
    if (!targetGoal.trim()) return;
    setIsLoading(true);

    try {
      const generated = await aiService.generateSchedule(targetGoal, hoursPerDay, totalDays, examDate);
      setSchedule(generated);
      if (user.uid) {
        await saveScheduleToFirestore(user.uid, generated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    if (!schedule) return;

    const updatedTasks = schedule.tasks.map((t) => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        if (nextState) {
          audioService.playSound('success');
          // Award XP
          const newXp = (user.xp || 0) + 15;
          onUpdateUser({
            xp: newXp,
            level: Math.floor(newXp / 200) + 1,
          });
        }
        return { ...t, completed: nextState };
      }
      return t;
    });

    const updatedSchedule = { ...schedule, tasks: updatedTasks };
    setSchedule(updatedSchedule);

    if (user.uid) {
      await saveScheduleToFirestore(user.uid, updatedSchedule);
    }

    // Check if all tasks in schedule are completed
    const allCompleted = updatedTasks.every((t) => t.completed);
    if (allCompleted) {
      confetti({
        particleCount: 100,
        spread: 80,
      });
      audioService.playSound('levelup');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completedCount = schedule?.tasks.filter((t) => t.completed).length || 0;
  const totalCount = schedule?.tasks.length || 0;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Planner Header Banner */}
      <div className={`p-6 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Schedule</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized study timetable aligning concepts, practice drills, and focus sessions.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Inputs */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Goal or Target Syllabus
            </label>
            <input
              type="text"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="e.g. JEE Main Physics, SAT Prep"
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Hours Per Day
            </label>
            <select
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>1 Hour (Gentle)</option>
              <option value={2}>2 Hours (Standard)</option>
              <option value={3}>3 Hours (Optimal)</option>
              <option value={4}>4 Hours (Intense)</option>
              <option value={6}>6 Hours (Exam Sprint)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Schedule Duration
            </label>
            <select
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={3}>3 Days (Crash Prep)</option>
              <option value={7}>7 Days (Weekly Plan)</option>
              <option value={14}>14 Days (Bi-weekly)</option>
              <option value={30}>30 Days (Monthly Sprint)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Target Exam Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleGenerateSchedule}
                disabled={isLoading || !targetGoal.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Plan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Study Pomodoro Widget */}
      <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gradient-to-r from-indigo-900 to-slate-900 text-white'
      }`}>
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              TeachBuddy Focus Study Timer
            </span>
          </div>
          <h3 className="text-lg font-bold">
            {pomodoroMode === 'study' ? 'Deep Study Session (25 Min)' : 'Quick Rest Break (5 Min)'}
          </h3>
          <p className="text-xs text-slate-400">
            Scientifically proven Pomodoro technique for maximum retention.
          </p>
        </div>

        {/* Digital Clock & Controls */}
        <div className="flex items-center gap-4">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest px-4 py-2 rounded-2xl bg-black/40 border border-white/10">
            {formatTimer(pomodoroSeconds)}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`p-3 rounded-2xl font-bold transition shadow-md active:scale-95 ${
                isTimerRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setPomodoroSeconds(pomodoroMode === 'study' ? 25 * 60 : 5 * 60);
              }}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Schedule & Milestone Tracker */}
      {schedule && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 animate-fadeIn ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Progress Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <span>{schedule.totalDays} Days Roadmap</span>
                <span>•</span>
                <span>{schedule.hoursPerDay} hrs / day</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                {schedule.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => exportScheduleToPdf(schedule, user.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                title="Download study schedule as formatted PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Timetable (PDF)</span>
              </button>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 block">Progress</span>
                <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {completedCount}/{totalCount} ({completionPercentage}%)
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* Task Timeline List */}
          <div className="space-y-3">
            {schedule.tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 opacity-85'
                    : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className="shrink-0 text-indigo-600 dark:text-indigo-400 focus:outline-none"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400 hover:text-indigo-600" />
                    )}
                  </button>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300">
                        {task.day}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {task.timeSlot}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.activityType === 'Quiz'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : task.activityType === 'Voice Call Buddy'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {task.activityType}
                      </span>
                    </div>

                    <h4 className={`text-xs sm:text-sm font-bold ${
                      task.completed 
                        ? 'line-through text-slate-400 dark:text-slate-500' 
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {task.topic} ({task.subject})
                    </h4>
                  </div>
                </div>

                {/* Quick Action Links */}
                <div className="flex items-center gap-2 shrink-0">
                  {task.activityType === 'Quiz' && (
                    <button
                      onClick={() => onStartQuizForTopic(task.topic)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
                    >
                      Start Quiz
                    </button>
                  )}

                  {task.activityType === 'Voice Call Buddy' && (
                    <button
                      onClick={() => onOpenVoiceCallWithTopic(task.topic)}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition"
                    >
                      Call Buddy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
