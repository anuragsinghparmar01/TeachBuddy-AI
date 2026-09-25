import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Download, 
  RotateCcw,
  BookOpen,
  ArrowRight,
  Printer,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import type { UserProfile } from '../types';
import { aiService } from '../services/aiService';

interface ExamPrepModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
  onStartQuizForTopic?: (topic: string) => void;
}

export const ExamPrepModule: React.FC<ExamPrepModuleProps> = ({
  user,
  darkMode,
  onOpenVoiceCallWithTopic = (_t?: string) => {},
  onStartQuizForTopic = (_t?: string) => {}
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'Computer'>('Mathematics');
  const [activeTab, setActiveTab] = useState<'formulas' | 'traps' | 'cheat_sheet' | 'timer'>('formulas');
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  // Exam Countdown Timer (e.g. 15-min or 30-min blitz)
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch {}
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Preloaded High-Yield Formulas
  const formulasData: Record<string, { topic: string; formulas: { name: string; eq: string; tip: string }[] }> = {
    Mathematics: {
      topic: 'Calculus, Algebra & Trigonometry',
      formulas: [
        { name: 'Quadratic Roots', eq: 'x = (-b ± √(b² - 4ac)) / 2a', tip: 'Check Discriminant D = b² - 4ac first: D > 0 real distinct, D = 0 equal, D < 0 imaginary.' },
        { name: 'Derivative Product Rule', eq: 'd/dx [u · v] = u·v\' + v·u\'', tip: 'Never differentiate both at the same time: First keep one, differentiate other.' },
        { name: 'Derivative Quotient Rule', eq: 'd/dx [u / v] = (v·u\' - u·v\') / v²', tip: 'Denominator is always squared (v²). Top is (Low d-High - High d-Low).' },
        { name: 'Pythagorean Trig Identities', eq: 'sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ', tip: 'Divide sin²θ + cos²θ = 1 by cos²θ to instantly derive the second identity.' },
        { name: 'Integration by Parts', eq: '∫ u·v dx = u∫v dx - ∫ (u\' · ∫v dx) dx', tip: 'Follow ILATE rule for choosing u: Inverse, Logarithmic, Algebraic, Trig, Exponential.' },
      ]
    },
    Physics: {
      topic: 'Mechanics, Electromagnetism & Optics',
      formulas: [
        { name: 'Newton\'s 2nd Law of Motion', eq: 'F_net = m · a = dp/dt', tip: 'F is net unbalanced force. Remember vector direction for friction opposes motion.' },
        { name: 'Kinematic Equations', eq: 'v = u + at | s = ut + ½at² | v² = u² + 2as', tip: 'Only valid for CONSTANT acceleration. For gravity upward, use a = -g.' },
        { name: 'Ohm\'s Law & Electrical Power', eq: 'V = I·R | P = V·I = I²R = V²/R', tip: 'Use P = I²R for series circuits and P = V²/R for parallel circuits.' },
        { name: 'Snell\'s Law of Refraction', eq: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)', tip: 'Angle θ is measured from the NORMAL, never from the mirror surface.' },
        { name: 'Work-Energy Theorem', eq: 'W_net = ΔK = ½mv_f² - ½mv_i²', tip: 'Work done by ALL forces equals change in kinetic energy.' },
      ]
    },
    Chemistry: {
      topic: 'Physical, Inorganic & Organic',
      formulas: [
        { name: 'Ideal Gas Law', eq: 'P · V = n · R · T', tip: 'Always convert Temperature to Kelvin (T = °C + 273.15). R = 0.0821 L·atm/mol·K.' },
        { name: 'Molarity & Dilution', eq: 'M = moles / Volume(L) | M₁V₁ = M₂V₂', tip: 'Moles stay constant before and after dilution.' },
        { name: 'pH and pOH', eq: 'pH = -log₁₀[H⁺] | pH + pOH = 14 (at 25°C)', tip: 'Each 1-unit decrease in pH means 10x higher hydrogen ion concentration.' },
        { name: 'First Order Kinetics Half-Life', eq: 't½ = 0.693 / k', tip: 'Half life of a first-order reaction is INDEPENDENT of initial concentration.' },
      ]
    },
    Biology: {
      topic: 'Genetics, Cell Cycle & Physiology',
      formulas: [
        { name: 'Hardy-Weinberg Equilibrium', eq: 'p + q = 1 | p² + 2pq + q² = 1', tip: 'p = dominant allele freq, q = recessive allele freq. p² = homozygous dominant freq.' },
        { name: 'Photosynthesis Overall Reaction', eq: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', tip: 'Water is split during light reactions to release O₂ gas (Photolysis).' },
        { name: 'Cellular Respiration ATP Yield', eq: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~36-38 ATP', tip: 'Glycolysis yields 2 ATP net; majority (~32-34) from Oxidative Phosphorylation.' },
      ]
    },
    Computer: {
      topic: 'Data Structures & Algorithms',
      formulas: [
        { name: 'Binary Search Time Complexity', eq: 'O(log n) time | O(1) space', tip: 'Array MUST be sorted. Middle element is checked each step, halving search space.' },
        { name: 'Merge Sort Complexity', eq: 'O(n log n) Best, Avg, Worst', tip: 'Guaranteed O(n log n) divide-and-conquer, but requires O(n) auxiliary memory.' },
        { name: 'Max Nodes in Binary Tree of Height h', eq: 'N_max = 2^(h+1) - 1', tip: 'Full balanced binary tree with height 3 has at most 15 nodes.' },
      ]
    }
  };

  // Preloaded Examiner Traps
  const examTraps: Record<string, { trap: string; fix: string }[]> = {
    Mathematics: [
      { trap: 'Forgetting ± when taking square root (e.g. x² = 9 giving only x = 3)', fix: 'Always write ±: x = +3 or x = -3 unless a physical dimension is specified.' },
      { trap: 'Dividing both sides by a variable containing 0 (e.g. x² = x cancelling x)', fix: 'Factor out instead: x(x - 1) = 0, giving two roots x = 0 and x = 1.' },
      { trap: 'Not changing inequality sign when multiplying/dividing by a negative number', fix: 'Flip the inequality immediately: -2x < 6 becomes x > -3.' },
    ],
    Physics: [
      { trap: 'Using g = +9.8 when projectile is flying upward without sign convention', fix: 'Define +y as upwards: acceleration is then -9.8 m/s².' },
      { trap: 'Confusing Mass (kg) with Weight (N)', fix: 'Mass is constant matter in kg; Weight = m·g in Newtons.' },
      { trap: 'Adding series resistors formula to parallel circuits', fix: 'Parallel is 1/R_eq = 1/R₁ + 1/R₂. Total resistance is always SMALLER than smallest branch.' },
    ],
    Chemistry: [
      { trap: 'Forgetting to convert Celsius to Kelvin in Gas equations', fix: 'Always add 273.15 to °C before applying PV = nRT.' },
      { trap: 'Confusing Oxidation state with formal charge or atom count', fix: 'In H₂O₂, Oxygen is -1, not -2 (peroxide exception).' },
      { trap: 'Balancing charges in Redox equations using only electrons on wrong side', fix: 'Check both atom count AND net charge balance on left and right.' },
    ],
    Biology: [
      { trap: 'Confusing Mitosis with Meiosis daughter cell chromosome counts', fix: 'Mitosis = 2 identical diploid (2n) cells. Meiosis = 4 unique haploid (n) gametes.' },
      { trap: 'Thinking arteries ALWAYS carry oxygenated blood', fix: 'Pulmonary Artery carries DEOXYGENATED blood from heart to lungs.' },
    ],
    Computer: [
      { trap: 'Off-by-one errors in loop boundaries (i <= n vs i < n)', fix: 'Array indexes run from 0 to n-1. Indexing at n will cause an OutOfBounds error.' },
      { trap: 'Confusing Assignment (=) with Comparison (==)', fix: 'In conditions like if (x = 5), you assign 5 and evaluate true instead of comparing.' },
    ]
  };

  const handleGenerateExamSummary = async (topicToUse?: string) => {
    const finalTopic = topicToUse || customTopic || `${selectedSubject} Core High-Yield Exam Topics`;
    setLoading(true);
    setAiOutput(null);

    try {
      const res = await aiService.generateContent({
        prompt: `Create a concise, high-yield EXAM CHEAT-SHEET for students on: "${finalTopic}".
Include:
1. Core Definitions (1-line each)
2. Must-Know Formulas & Units
3. 3 Predictable Exam Questions with short answers
4. Examiner traps & tricks to avoid
Keep it bulleted, ultra-clean, and easy to review in 3 minutes.`,
        temperature: 0.3
      });

      setAiOutput(res.text || 'Unable to generate cheat sheet. Please retry.');
    } catch {
      setAiOutput('Exam Cheat-Sheet:\n• Always check units (SI conversion)\n• Verify boundary conditions\n• State the formula before plugging numbers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top Banner: Minimalist Header */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl shadow-black/20' 
          : 'bg-white border-amber-200/80 text-slate-800 shadow-md shadow-amber-100/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight font-outfit">
                  Exam Prep Center
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                  High Yield
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rapid formulas, examiner traps, 15-min mock timer & 1-page cheat sheets
              </p>
            </div>
          </div>

          {/* Quick Subject Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {(['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer'] as const).map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedSubject === subj
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Tabs */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'formulas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ Essential Formulas</span>
          </button>

          <button
            onClick={() => setActiveTab('traps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'traps'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>🔥 Top Examiner Traps</span>
          </button>

          <button
            onClick={() => setActiveTab('cheat_sheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'cheat_sheet'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📋 Rapid Cheat-Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'timer'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⏱️ Mock Timer</span>
          </button>
        </div>
      </div>

      {/* CONTENT PANEL 1: ESSENTIAL FORMULAS */}
      {activeTab === 'formulas' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {selectedSubject} High-Yield Formula Vault
            </h2>
            <button
              onClick={() => onStartQuizForTopic(`${selectedSubject} Formulas`)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Test with Quiz →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formulasData[selectedSubject]?.formulas.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  darkMode 
                    ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50' 
                    : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black font-outfit text-indigo-600 dark:text-indigo-400">
                    {item.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-slate-800 text-slate-500 font-mono">
                    #{idx + 1}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white border border-slate-200/60 dark:border-slate-800 select-all mb-2">
                  {item.eq}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                  💡 <strong className="text-slate-700 dark:text-slate-300">Exam Tip:</strong> {item.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT PANEL 2: EXAM TRAPS */}
      {activeTab === 'traps' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>Examiners design tricky multiple-choice options around these exact common pitfalls.</span>
          </div>

          <div className="space-y-2.5">
            {examTraps[selectedSubject]?.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border ${
                  darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                    ✕
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                      Common Trap
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.trap}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pl-8 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      Correct Exam Rule
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {item.fix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT PANEL 3: 1-PAGE CHEAT SHEET */}
      {activeTab === 'cheat_sheet' && (
        <div className="space-y-3">
          <div className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={`e.g. ${selectedSubject} Formulas, Laws & Key Experiments`}
                className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleGenerateExamSummary()}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Generating...' : 'Build 1-Page Summary'}</span>
              </button>
            </div>

            {/* Quick 1-click popular topics */}
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Topics:</span>
              {[
                'Derivatives & Integrals',
                'Optics & Ray Diagrams',
                'Organic Reaction Mechanisms',
                'Mendelian Genetics',
                'Vedic Math Speed Shortcuts'
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setCustomTopic(t);
                    handleGenerateExamSummary(t);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* AI Output Card */}
          {aiOutput && (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all animate-fadeIn ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-emerald-50/50 border-emerald-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-3 border-b border-emerald-200/50 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-sm font-outfit">
                    1-Page Rapid Exam Cheat-Sheet
                  </h3>
                </div>
                <button
                  onClick={() => window.print()}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>
              <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300 font-sans">
                {aiOutput}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT PANEL 4: MOCK TIMER */}
      {activeTab === 'timer' && (
        <div className={`p-6 rounded-2xl border text-center ${
          darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}>
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              15-Minute Rapid Exam Simulation Sprint
            </h2>
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400 my-4">
              {formatTime(timeLeft)}
            </div>

            {/* Timer Durations */}
            <div className="flex items-center justify-center gap-2">
              {[5, 15, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerMinutes(m);
                    setTimeLeft(m * 60);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    timerMinutes === m
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m} Min
                </button>
              ))}
            </div>

            {/* Play / Pause / Reset */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition cursor-pointer ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
                }`}
              >
                {isTimerRunning ? 'Pause Timer' : 'Start Exam Sprint'}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimeLeft(timerMinutes * 60);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Reset
              </button>
            </div>

            <p className="text-xs text-slate-400">
              💡 Tip: Close all other tabs, keep a blank sheet and pen ready, and solve questions without looking at hints until the timer ends.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
