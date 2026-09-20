import React, { useState, useRef } from 'react';
import { 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  PenTool, 
  Eraser, 
  RotateCcw, 
  ArrowRight, 
  PhoneCall, 
  Copy, 
  Check,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react';
import { AiIcon } from './AiIcon';
import type { UserProfile, ProblemSolution } from '../types';
import { ALL_SUBJECTS } from '../types';
import { aiService } from '../services/aiService';
import { exportProblemSolutionToPdf } from '../services/pdfService';

interface ProblemSolverModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onOpenVoiceCallWithTopic: (topic: string) => void;
}

export const ProblemSolverModule: React.FC<ProblemSolverModuleProps> = ({
  user,
  darkMode,
  onOpenVoiceCallWithTopic,
}) => {
  const [problemText, setProblemText] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scratchpad canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const sampleProblems = [
    {
      label: "Calculus: Find limit of (sin x)/x as x -> 0",
      subject: "Mathematics",
      text: "Evaluate the limit: lim(x->0) (sin(x))/x and explain using L'Hopital's rule and geometric unit circle proof.",
    },
    {
      label: "Physics: Projectile Motion at 45 degrees",
      subject: "Physics",
      text: "A soccer ball is kicked with an initial velocity of 20 m/s at an angle of 45 degrees above horizontal. Find the maximum height and total flight time (g = 9.8 m/s^2).",
    },
    {
      label: "Chemistry: Balancing Redox in Acidic Medium",
      subject: "Chemistry",
      text: "Balance the redox reaction: MnO4- + Fe2+ -> Mn2+ + Fe3+ in acidic solution using the ion-electron method.",
    },
    {
      label: "Coding: Two-Sum Problem in Python",
      subject: "Computer Science",
      text: "Given an array of integers nums and an integer target, write an optimal O(n) Python algorithm using a hash map to find indices of the two numbers such that they add up to target.",
    },
  ];

  const handleSolve = async (textToSolve?: string, sub?: string) => {
    const text = (textToSolve || problemText).trim();
    if (!text) return;

    setIsLoading(true);
    setCopied(false);
    setErrorMessage(null);
    try {
      const data = await aiService.solveProblem(text, sub || subject, user.ageGroup, user.preferredLanguage);
      setSolution(data);
      setProblemText(text);
      if (sub) setSubject(sub);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Live Gemini API solver failed. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Scratchpad drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = darkMode ? '#818cf8' : '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const copySolution = () => {
    if (!solution) return;
    const text = `Problem: ${solution.problemText}\n\nFinal Answer:\n${solution.finalAnswer}\n\nStep-by-Step:\n${solution.stepByStep.map(s => `${s.stepNumber}. ${s.title}: ${s.explanation} (${s.formulaOrCode || ''})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
        darkMode ? 'bg-[#0e1422] border-slate-800/80 text-white shadow-xl shadow-black/20' : 'bg-white border-slate-200/90 text-slate-900 shadow-md shadow-slate-200/50'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
          <div className="flex items-center gap-4">
            <AiIcon size="md" variant="cyber" glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Step-by-Step Problem Solver</h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-extrabold border border-cyan-500/25">
                  Deep Verification
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Exact mathematical derivations, scientific proofs, algorithmic code, and interactive scratchpad.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowScratchpad(!showScratchpad)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <PenTool className="w-3.5 h-3.5 text-cyan-500" />
            <span>{showScratchpad ? 'Hide Scratchpad' : 'Open Scratchpad'}</span>
          </button>
        </div>

        {/* Scratchpad Whiteboard */}
        {showScratchpad && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5" /> Scratchpad Canvas (Draft your working here)
              </span>
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-500 font-semibold"
              >
                <Eraser className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={750}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl cursor-crosshair shadow-inner"
            />
          </div>
        )}

        {/* Form Inputs */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="sm:w-1/4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ALL_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Paste or Type Problem Statement
              </label>
              <div className="relative">
                <textarea
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  rows={3}
                  placeholder="Paste any equation, word problem, calculus proof, or coding prompt here..."
                  className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Quick Samples Dropdown */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs py-1">
              <span className="text-slate-400 font-bold shrink-0">Try:</span>
              {sampleProblems.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSolve(sp.text, sp.subject)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:border-indigo-400 transition"
                >
                  {sp.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleSolve()}
              disabled={isLoading || !problemText.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-md active:scale-95 shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Solving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solve Step-by-Step</span>
                </>
              )}
            </button>
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
            onClick={() => handleSolve()}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Solution Display */}
      {solution && (
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 animate-fadeIn ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Verified Solution
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {solution.subject} · Difficulty: {solution.difficulty}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportProblemSolutionToPdf(solution, user.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                title="Download step-by-step solution as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={copySolution}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => onOpenVoiceCallWithTopic(`Problem: ${solution.problemText.slice(0, 40)}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Discuss on Voice Call</span>
              </button>
            </div>
          </div>

          {/* Extracted Knowns & Concepts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Given Data & Conditions
              </h4>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                {solution.givenData.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Core Principles & Formulas Used
              </h4>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                {solution.conceptsUsed.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step-by-Step Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Step-by-Step Mathematical & Logical Execution
            </h3>

            <div className="space-y-3">
              {solution.stepByStep.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h4>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                    {step.explanation}
                  </p>

                  {step.formulaOrCode && (
                    <div className="ml-8 p-3 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs border border-slate-800 overflow-x-auto">
                      <code>{step.formulaOrCode}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final Answer Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-2 border-emerald-500/40 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Final Answer
            </span>
            <p className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-200 font-mono">
              {solution.finalAnswer}
            </p>
          </div>

          {/* Pro Tips & Common Pitfalls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {solution.proTips && solution.proTips.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" /> Exam Shortcuts & Pro Tips
                </span>
                <ul className="list-disc pl-4 text-xs text-amber-950 dark:text-amber-200 space-y-1 font-medium">
                  {solution.proTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {solution.commonMistakesToAvoid && solution.commonMistakesToAvoid.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Common Mistakes to Avoid
                </span>
                <ul className="list-disc pl-4 text-xs text-rose-950 dark:text-rose-200 space-y-1 font-medium">
                  {solution.commonMistakesToAvoid.map((mistake, idx) => (
                    <li key={idx}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
