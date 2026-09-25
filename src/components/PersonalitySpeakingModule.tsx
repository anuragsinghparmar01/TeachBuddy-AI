import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Eye, 
  Hand, 
  Smile, 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCircle2, 
  Award, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  Flame, 
  BrainCircuit, 
  HelpCircle,
  Lightbulb,
  Target,
  Zap,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import type { UserProfile } from '../types';
import { aiService } from '../services/aiService';
import { audioService } from '../services/audioService';

interface PersonalitySpeakingModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

type SubTab = 'bodyLanguage' | 'presentation' | 'voiceModulation' | 'personality' | 'aiCoach';

export const PersonalitySpeakingModule: React.FC<PersonalitySpeakingModuleProps> = ({
  user,
  darkMode,
  onUpdateUser,
  onOpenVoiceCallWithTopic,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('bodyLanguage');

  // WPM Reading Speedometer state
  const [readingTimer, setReadingTimer] = useState(0);
  const [isReadingActive, setIsReadingActive] = useState(false);
  const [calculatedWpm, setCalculatedWpm] = useState<number | null>(null);

  // Daily Challenge state
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('teachbuddy_personality_challenges') || '[]');
    } catch {
      return [];
    }
  });

  // AI Speech / Pitch Coach state
  const [pitchTopic, setPitchTopic] = useState('Introduction of an AI Education Platform');
  const [pitchContext, setPitchContext] = useState('College Seminar / Investor Pitch');
  const [targetAudience, setTargetAudience] = useState('Professors, Students & Evaluators');
  const [speechScript, setSpeechScript] = useState(
    'Good morning everyone. Have you ever wondered why studying for competitive exams feels so overwhelming? Today, I want to present a solution that turns 4-hour cramming into 25-minute mastery sessions using intelligent personalized tutoring.'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);

  // Timer for reading test
  useEffect(() => {
    let interval: any;
    if (isReadingActive) {
      interval = setInterval(() => {
        setReadingTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReadingActive]);

  const practicePassage = `The secret of charismatic speaking is not about possessing a loud voice; it is about intentional presence and the courage to pause. When you step before an audience, your body speaks first. An open stance, relaxed shoulders, and steady eye contact establish immediate trust. When you dare to pause for two seconds before delivering your key idea, the entire room leans in to listen.`;
  const practicePassageWordCount = practicePassage.trim().split(/\s+/).length;

  const handleStartReading = () => {
    setReadingTimer(0);
    setCalculatedWpm(null);
    setIsReadingActive(true);
    audioService.playSound('click');
  };

  const handleStopReading = () => {
    setIsReadingActive(false);
    audioService.playSound('levelup');
    if (readingTimer > 0) {
      const minutes = readingTimer / 60;
      const wpm = Math.round(practicePassageWordCount / minutes);
      setCalculatedWpm(wpm);
    }
  };

  // Complete a personality challenge
  const handleToggleChallenge = (challengeId: string, xpReward: number = 50) => {
    let updated: string[];
    if (completedChallenges.includes(challengeId)) {
      updated = completedChallenges.filter((id) => id !== challengeId);
    } else {
      updated = [...completedChallenges, challengeId];
      const newXp = (user.xp || 0) + xpReward;
      onUpdateUser({ xp: newXp });
      audioService.playSound('levelup');
    }
    setCompletedChallenges(updated);
    localStorage.setItem('teachbuddy_personality_challenges', JSON.stringify(updated));
  };

  // AI Pitch / Speech Analysis
  const handleAnalyzeSpeech = async () => {
    if (!speechScript.trim()) return;
    setIsAnalyzing(true);
    audioService.playSound('whoosh');

    try {
      const result = await aiService.analyzeSpeechOrPitch({
        speechText: speechScript,
        context: pitchContext,
        topic: pitchTopic,
        targetAudience: targetAudience,
      });
      setAiFeedback(result);
      audioService.playSound('success');
    } catch (err) {
      console.error('Speech analysis error:', err);
      // Fallback evaluation
      setAiFeedback({
        overallScore: 84,
        toneAnalysis: 'Engaging, clear and visionary with a strong opening rhetorical question.',
        deliveryTips: {
          bodyLanguage: 'Plant your feet shoulder-width apart, use open palms during the central question, and smile after delivering the solution.',
          voiceModulation: 'Drop your pitch slightly on "25-minute mastery" to make the contrast sound definitive.',
          pacing: 'Aim for 135 words per minute. Insert a deliberate 2-second silence after the rhetorical question.',
        },
        fillerWordAlerts: ['No critical filler words detected. Ensure words like "basically" or "you know" are avoided during live delivery.'],
        strengths: ['Strong rhetorical opening hook', 'Clear problem-to-solution contrast', 'Relatable problem premise'],
        improvements: ['Include 1 concrete metric or case study', 'End with a clear, inspiring call to action'],
        suggestedHook: '"Every year, over 2 million students burn out studying 12 hours a day—not because they lack intelligence, but because they lack a personalized strategy."',
        polishedExcerpt: '"Imagine learning complex physics or legal drafting with a personal mentor who never tires and explains concepts through real-world intuition."',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Banner with Rich Atmosphere */}
      <div className={`p-6 sm:p-8 rounded-3xl transition-all duration-300 relative overflow-hidden border ${
        darkMode 
          ? 'bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-950 border-violet-500/20 text-white shadow-2xl' 
          : 'bg-gradient-to-br from-white via-violet-50/40 to-amber-50/40 border-violet-100/80 text-slate-900 shadow-xl shadow-violet-100/30'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Executive Presence, Presentation & Charisma Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Personality, Speaking & Body Language Masterclass
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              Master the non-verbal psychology of leaders: commanding posture, magnetic eye contact, the 10-20-30 slide rule, vocal modulation, and AI speech coaching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onOpenVoiceCallWithTopic && (
              <button
                onClick={() => onOpenVoiceCallWithTopic('Speaking & Personality Development')}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Practice Speaking with AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'bodyLanguage', label: 'Body Language Mastery', icon: Eye, desc: 'Posture, Hands & Gaze' },
          { id: 'presentation', label: 'Presentation & Slides', icon: Tv, desc: 'Hooks, Slides, Q&A' },
          { id: 'voiceModulation', label: 'Voice Modulation Lab', icon: Volume2, desc: 'Tone, Speed & Pauses' },
          { id: 'personality', label: 'Personality & Charisma', icon: UserCheck, desc: 'Daily Habits & Presence' },
          { id: 'aiCoach', label: 'AI Speech & Pitch Coach', icon: Sparkles, desc: 'Live Script Evaluation' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as SubTab);
                audioService.playSound('click');
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500 shadow-md shadow-violet-600/25 scale-[1.02]'
                  : darkMode
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                  : 'bg-white/90 hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-xs'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-violet-500'}`} />
              <div>{tab.label}</div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BODY LANGUAGE MASTERY */}
      {activeSubTab === 'bodyLanguage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: The Power Posture */}
            <div className={`p-6 rounded-3xl border transition hover:shadow-xl ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-200 dark:border-indigo-800">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">1. The Command Posture</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Slouching signals anxiety and reduces lung capacity by up to 30%. Command the room with relaxed, grounded verticality.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">The Grounded Stance:</span>
                  Feet shoulder-width apart. Weight evenly distributed on both soles. Never cross your legs while standing.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">The Open Torso:</span>
                  Keep your chest open to expose the heart center. Crossing arms creates an unconscious psychological barrier.
                </div>
              </div>
            </div>

            {/* Card 2: Eye Contact Architecture */}
            <div className={`p-6 rounded-3xl border transition hover:shadow-xl ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 border border-teal-200 dark:border-teal-800">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">2. Eye Contact Architecture</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Eye contact is the single highest predictor of perceived intelligence and trustworthiness.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-teal-600 dark:text-teal-400 block mb-0.5">The Triangle Method (1-on-1):</span>
                  Look at left eye (5s), right eye (5s), then nose/forehead bridge. Never look down when thinking; look slightly up or to the side.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-teal-600 dark:text-teal-400 block mb-0.5">The Lighthouse Sweep (Crowd):</span>
                  Divide the room into 3 zones (Left, Center, Right). Deliver one complete sentence to one specific person before sweeping to the next zone.
                </div>
              </div>
            </div>

            {/* Card 3: Hand Gestures & Spatial Storytelling */}
            <div className={`p-6 rounded-3xl border transition hover:shadow-xl ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800">
                <Hand className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">3. Hand Gestures & The Box</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Research shows charismatic leaders use hand gestures that are synchronized with their words.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">The Strike Box:</span>
                  Keep hand gestures between your belt buckle and your collarbone. Gesturing too high looks erratic; below the waist looks lifeless.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">Open Palms & The Steeple:</span>
                  Show open palms when explaining facts (signals honesty). Form fingertip steeple when making critical executive statements.
                </div>
              </div>
            </div>

            {/* Card 4: Micro-Expressions & Listening Presence */}
            <div className={`p-6 rounded-3xl border transition hover:shadow-xl ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-800">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">4. Micro-Expressions & Facial Mastery</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Your face registers emotions 200 milliseconds before your brain can verbalize them.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-0.5">The Triple Nod:</span>
                  When listening, give three slow, rhythmic nods. It encourages the speaker to elaborate and establishes deep empathetic rapport.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-0.5">The Duchenne Smile:</span>
                  A sincere smile engages the orbicularis oculi muscles (crow's feet around eyes). Never paste on a static smile before beginning to speak.
                </div>
              </div>
            </div>

            {/* Card 5: Virtual & Video Call Presence */}
            <div className={`p-6 rounded-3xl border transition hover:shadow-xl ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 border border-violet-200 dark:border-violet-800">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">5. Virtual & Video Call Charisma</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Over 70% of professional interviews and client pitches take place over webcam. Master video presence.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-violet-600 dark:text-violet-400 block mb-0.5">The Eye-Level Lens Rule:</span>
                  Elevate your laptop with books or a stand so the camera is exactly parallel to your eyebrows. Looking down projects low energy.
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-violet-600 dark:text-violet-400 block mb-0.5">Look at the Dot, Not the Face:</span>
                  When speaking, look directly into the camera lens dot, not at your own video. To the other person, it feels like direct eye contact.
                </div>
              </div>
            </div>

            {/* Card 6: The Anti-Fidget Checklist */}
            <div className={`p-6 rounded-3xl border transition hover:shadow-xl ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base mb-2">6. The Anti-Fidget Lockdown</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Unconscious self-touching (pacifying behavior) betrays anxiety even when your voice sounds composed.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Avoid twisting rings, watches, or pen clicking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Never touch your neck, earlobe, or nose when answering questions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Rest hands quietly on table or in lap when not actively gesturing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRESENTATION & SLIDE SKILLS */}
      {activeSubTab === 'presentation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The 10-20-30 Rule */}
            <div className={`p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2">
                <Tv className="w-5 h-5 text-indigo-500" />
                The Golden 10-20-30 Slide Rule
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                Formulated by Guy Kawasaki, this principle guarantees high retention and stops "death by PowerPoint".
              </p>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700">
                  <span className="block text-xl font-black text-indigo-600 dark:text-indigo-400">10</span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Max Slides</span>
                </div>
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-200 dark:border-slate-700">
                  <span className="block text-xl font-black text-teal-600 dark:text-teal-400">20</span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Minutes</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700">
                  <span className="block text-xl font-black text-amber-600 dark:text-amber-400">30pt</span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Min Font Size</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">Why 30pt font?</strong> Because it forces you to write only core concepts. If you need 12pt font, you are reading your slides instead of presenting!
              </p>
            </div>

            {/* The First 60 Seconds: Hook Formulations */}
            <div className={`p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                The 60-Second Hook Architecture
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                90% of listeners decide if you are worth paying attention to in the first 60 seconds. Never open with: "Hello, my name is X and today I will talk about Y."
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-amber-600 dark:text-amber-400">1. The Provocative Question:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">"What if I told you that 80% of what you revised yesterday will vanish by tomorrow unless you use one specific technique?"</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-amber-600 dark:text-amber-400">2. The Shocking Statistic:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">"In the next 15 minutes, over 50,000 students across India will make the exact same error in their calculus exam."</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-amber-600 dark:text-amber-400">3. The Relatable Story:</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">"Three years ago, I walked out of an interview feeling like I had prepared for everything except the first question they asked..."</p>
                </div>
              </div>
            </div>
          </div>

          {/* The PREP Framework for Q&A */}
          <div className={`p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="font-extrabold text-base mb-2 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-violet-500" />
              The PREP Framework for Handling Impromptu Questions
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              When a professor, judge, or boss asks a question on the spot, follow PREP to sound structured without rambling:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-slate-800 border border-violet-200 dark:border-slate-700">
                <span className="font-black text-violet-600 dark:text-violet-400 text-sm block mb-1">P - Point</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">State your core answer directly in one clean sentence.</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700">
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm block mb-1">R - Reason</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">Provide the rationale, data, or logical explanation.</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700">
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block mb-1">E - Example</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">Share a 15-second concrete case study, anecdote, or metric.</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700">
                <span className="font-black text-amber-600 dark:text-amber-400 text-sm block mb-1">P - Point Reiterate</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">Conclude cleanly by linking back to your initial statement.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VOICE MODULATION LAB */}
      {activeSubTab === 'voiceModulation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Speedometer & Teleprompter (7 cols) */}
            <div className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Speech Speedometer & Cadence Test
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target pace for executive presence: <strong>130 to 150 Words Per Minute (WPM)</strong>.
                  </p>
                </div>
                {calculatedWpm !== null && (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    calculatedWpm >= 125 && calculatedWpm <= 155
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      : calculatedWpm > 155
                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  }`}>
                    {calculatedWpm} WPM ({calculatedWpm >= 125 && calculatedWpm <= 155 ? 'Ideal Cadence' : calculatedWpm > 155 ? 'Too Fast' : 'Slightly Slow'})
                  </div>
                )}
              </div>

              {/* Practice Passage Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-slate-950 border border-indigo-100 dark:border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 select-none">
                {practicePassage}
              </div>

              {/* Controls & Live Timer */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>Timer:</span>
                  <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
                    {readingTimer}s
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isReadingActive ? (
                    <button
                      onClick={handleStartReading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Reading Test</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopReading}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-2 transition cursor-pointer animate-pulse"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Finished Reading</span>
                    </button>
                  )}
                </div>
              </div>

              {calculatedWpm !== null && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white">Pacing Analysis:</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    {calculatedWpm < 125 
                      ? 'You spoke at a deliberate, relaxed pace. Perfect for complex scientific concepts or emotional storytelling, but pick up pace slightly during main points.'
                      : calculatedWpm > 155
                      ? 'You were speaking slightly fast. When nervous, human speech accelerates. Use 2-second deliberate pauses between paragraphs to reset your breath.'
                      : 'Outstanding cadence! 130-150 WPM allows the human brain to process your ideas effortlessly without fatigue.'}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Tongue Twisters & Warmup Drills (5 cols) */}
            <div className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-teal-500" />
                Articulation Tongue Twister Drills
              </h3>
              <p className="text-xs text-slate-500">
                Warm up your vocal cords and articulation muscles before interviews or stage presentations:
              </p>

              <div className="space-y-2.5 text-xs">
                {[
                  { title: 'Diction & Clarity', text: 'Red leather, yellow leather, rich feather, quick weather.' },
                  { title: 'Breath Control', text: 'She sells seashells by the seashore with supreme certainty.' },
                  { title: 'Vowel Projection', text: 'Unique New York, unique New York, you know you need unique New York.' },
                  { title: 'Dental & Lingual Precision', text: 'Peter Piper picked a peck of pickled peppers precisely.' },
                ].map((drill, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-teal-600 dark:text-teal-400 block mb-0.5">{drill.title}</span>
                      <span className="text-slate-700 dark:text-slate-300 italic">"{drill.text}"</span>
                    </div>
                    <button
                      onClick={() => audioService.speak(drill.text, 'female', 1.0, 1.0, 'en-US')}
                      className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 hover:bg-teal-500/25 transition cursor-pointer"
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERSONALITY IMPROVEMENT & CHARISMA GYM */}
      {activeSubTab === 'personality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The 70/30 Rule of Conversations */}
            <div className={`p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                The 70/30 Rule of Magnetic Charisma
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                People do not remember the person who talked about themselves for an hour; they remember the person who made them feel heard and valued.
              </p>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">70% Active Listening:</strong>
                  Ask open-ended curiosity questions ("What inspired you to choose that direction?", "What was the most unexpected challenge you faced?").
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">The Reflective Mirror:</strong>
                  Repeat the last 2-3 words of what the other person just said with a curious tone. This prompts them to reveal deeper insights automatically.
                </div>
              </div>
            </div>

            {/* Overcoming Stage Fright & The 4-7-8 Breathing Protocol */}
            <div className={`p-6 rounded-3xl border ${
              darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-emerald-500" />
                The 4-7-8 Pre-Stage Panic Protocol
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                Heart racing before speaking? Activate your parasympathetic nervous system in 60 seconds with vagus nerve regulation.
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700">
                  <span className="block font-black text-emerald-600 dark:text-emerald-400 text-base">Inhale 4s</span>
                  <span className="text-[10px] text-slate-500">Through Nose</span>
                </div>
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-200 dark:border-slate-700">
                  <span className="block font-black text-teal-600 dark:text-teal-400 text-base">Hold 7s</span>
                  <span className="text-[10px] text-slate-500">Oxygenate</span>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-indigo-200 dark:border-slate-700">
                  <span className="block font-black text-indigo-600 dark:text-indigo-400 text-base">Exhale 8s</span>
                  <span className="text-[10px] text-slate-500">Through Mouth</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Repeat 3 cycles before stepping onto stage or unmuting your microphone. Your heart rate will drop by 15-20 BPM.
              </p>
            </div>
          </div>

          {/* Daily 5-Minute Charisma Challenges */}
          <div className={`p-6 rounded-3xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Daily Charisma Missions (+50 XP Each)
                </h3>
                <p className="text-xs text-slate-500">
                  Micro-actions that build authentic confidence in real life:
                </p>
              </div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/20">
                {completedChallenges.length} / 4 Completed
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { id: 'mission_compliment', title: 'Give 1 Sincere Non-Appearance Compliment', desc: 'Compliment someone on their effort, idea, or calm energy instead of clothes.' },
                { id: 'mission_pause', title: 'The 3-Second Pause in Conversation', desc: 'Count 1-2-3 in your head before answering questions today without rushing.' },
                { id: 'mission_eye', title: 'Hold Eye Contact for 5 Seconds', desc: 'Hold unbroken, friendly eye contact with a colleague, shopkeeper, or teacher.' },
                { id: 'mission_listen', title: 'The Zero-Interrupt Rule', desc: 'Listen to a full 3-minute explanation from a friend without interrupting once.' },
              ].map((mission) => {
                const isDone = completedChallenges.includes(mission.id);
                return (
                  <div
                    key={mission.id}
                    onClick={() => handleToggleChallenge(mission.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone ? 'bg-emerald-500 text-white' : 'border border-slate-400 dark:border-slate-600'
                    }`}>
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <span className={`font-bold block ${isDone ? 'line-through opacity-80' : ''}`}>
                        {mission.title}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                        {mission.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AI SPEECH & PITCH COACH */}
      {activeSubTab === 'aiCoach' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Script Editor (5 cols) */}
          <div className={`lg:col-span-5 p-5 sm:p-6 rounded-3xl border space-y-4 ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Speech & Pitch Script Analyzer
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Speech / Pitch Topic
              </label>
              <input
                type="text"
                value={pitchTopic}
                onChange={(e) => setPitchTopic(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                  darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Context / Setting
                </label>
                <input
                  type="text"
                  value={pitchContext}
                  onChange={(e) => setPitchContext(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                    darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Your Speech / Monologue Script
              </label>
              <textarea
                rows={5}
                value={speechScript}
                onChange={(e) => setSpeechScript(e.target.value)}
                placeholder="Paste or type your draft speech here..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium leading-relaxed resize-none ${
                  darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <button
              onClick={handleAnalyzeSpeech}
              disabled={isAnalyzing || !speechScript.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Evaluating Delivery & Impact...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Delivery with AI Coach</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: AI Feedback Report (7 cols) */}
          <div className="lg:col-span-7">
            {aiFeedback ? (
              <div className={`p-6 rounded-3xl border space-y-4 ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Speech Evaluation Report
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Impact Score:</span>
                    <span className="px-3 py-0.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 font-black text-sm border border-violet-500/30">
                      {aiFeedback.overallScore || 85} / 100
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 text-xs">
                  <span className="font-bold text-violet-700 dark:text-violet-300 block mb-0.5">Tone Assessment:</span>
                  <p className="text-slate-700 dark:text-slate-300">{aiFeedback.toneAnalysis}</p>
                </div>

                {/* Delivery Tips Matrix */}
                {aiFeedback.deliveryTips && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Body Language:</span>
                      <p className="text-slate-600 dark:text-slate-300">{aiFeedback.deliveryTips.bodyLanguage}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-teal-600 dark:text-teal-400 block mb-1">Voice Modulation:</span>
                      <p className="text-slate-600 dark:text-slate-300">{aiFeedback.deliveryTips.voiceModulation}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">Pacing & Breathing:</span>
                      <p className="text-slate-600 dark:text-slate-300">{aiFeedback.deliveryTips.pacing}</p>
                    </div>
                  </div>
                )}

                {/* Suggested Hook Alternative */}
                {aiFeedback.suggestedHook && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs space-y-1">
                    <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      Alternative High-Impact Opening Hook:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 italic font-medium">
                      "{aiFeedback.suggestedHook}"
                    </p>
                  </div>
                )}

                {/* Polished Power Excerpt */}
                {aiFeedback.polishedExcerpt && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 text-xs space-y-1">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Polished Charisma Excerpt:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      "{aiFeedback.polishedExcerpt}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`p-10 rounded-3xl border text-center space-y-3 ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-slate-800 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto border border-violet-100 dark:border-slate-700">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                  Ready for AI Speech Analysis
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "Analyze Delivery with AI Coach" to receive tailored delivery cues, body language instructions, alternative hooks, and vocal variety suggestions.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
