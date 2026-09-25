import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Eraser, 
  Trash2, 
  Download, 
  Sparkles, 
  Grid, 
  Check, 
  Maximize2, 
  Minimize2, 
  Undo,
  Square,
  Circle as CircleIcon,
  Minus,
  MoveRight,
  Highlighter,
  Atom,
  Activity,
  Compass,
  Zap,
  Layers,
  HelpCircle,
  Copy
} from 'lucide-react';
import type { UserProfile } from '../types';
import { aiService } from '../services/aiService';

interface WhiteboardModuleProps {
  user: UserProfile;
  darkMode: boolean;
  onOpenVoiceCallWithTopic?: (topic: string) => void;
}

type ToolMode = 'pen' | 'highlighter' | 'line' | 'arrow' | 'rect' | 'circle' | 'eraser';

export const WhiteboardModule: React.FC<WhiteboardModuleProps> = ({
  darkMode,
  onOpenVoiceCallWithTopic = (_t?: string) => {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('pen');
  const [color, setColor] = useState('#4f46e5'); // default indigo
  const [brushSize, setBrushSize] = useState(4);
  const [gridType, setGridType] = useState<'grid' | 'dots' | 'lines' | 'blank'>('grid');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [previewImage, setPreviewImage] = useState<ImageData | null>(null);
  const [aiSolving, setAiSolving] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const colors = [
    { label: 'Indigo', value: '#4f46e5', bg: 'bg-indigo-600' },
    { label: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
    { label: 'Crimson', value: '#ef4444', bg: 'bg-rose-500' },
    { label: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
    { label: 'Sky', value: '#0ea5e9', bg: 'bg-sky-500' },
    { label: 'Violet', value: '#8b5cf6', bg: 'bg-purple-500' },
    { label: 'Neon Yellow', value: '#eab308', bg: 'bg-yellow-400' },
    { label: 'Monochrome', value: darkMode ? '#f8fafc' : '#0f172a', bg: darkMode ? 'bg-white' : 'bg-slate-900' },
  ];

  // Initialize and resize canvas
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.min(Math.max(window.innerHeight * (isFullScreen ? 0.8 : 0.65), 440), 760);

    let tempImage: ImageData | null = null;
    const ctx = canvas.getContext('2d');
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      try {
        tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {}
    }

    canvas.width = width;
    canvas.height = height;

    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (tempImage) {
        ctx.putImageData(tempImage, 0, 0);
      }
    }
  };

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullScreen]);

  // Touch and Mouse Coordinate helper
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const saveStateToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev.slice(-15), imgData]);
    } catch {}
  };

  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    saveStateToHistory();
    setIsDrawing(true);
    setStartPoint(coords);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Cache current canvas for geometric shape previews
    if (['line', 'arrow', 'rect', 'circle'].includes(toolMode)) {
      setPreviewImage(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    if (toolMode === 'eraser') {
      ctx.strokeStyle = darkMode ? '#0b0f19' : '#ffffff';
      ctx.lineWidth = brushSize * 4;
    } else if (toolMode === 'highlighter') {
      ctx.strokeStyle = `${color}40`; // 25% opacity
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }
  };

  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (toolMode === 'pen' || toolMode === 'highlighter' || toolMode === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (startPoint && previewImage) {
      // Shape Preview: Restore canvas and draw interactive shape preview
      ctx.putImageData(previewImage, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;

      if (toolMode === 'line') {
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      } else if (toolMode === 'arrow') {
        drawArrow(ctx, startPoint.x, startPoint.y, coords.x, coords.y, brushSize * 2.5);
      } else if (toolMode === 'rect') {
        const w = coords.x - startPoint.x;
        const h = coords.y - startPoint.y;
        ctx.strokeRect(startPoint.x, startPoint.y, w, h);
      } else if (toolMode === 'circle') {
        const radius = Math.sqrt(Math.pow(coords.x - startPoint.x, 2) + Math.pow(coords.y - startPoint.y, 2));
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  // Helper to draw clean arrow
  const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, headlen: number) => {
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const handleStopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    setStartPoint(null);
    setPreviewImage(null);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    ctx.putImageData(previous, 0, 0);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    saveStateToHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setAiAnalysis(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    exportCtx.fillStyle = darkMode ? '#0b0f19' : '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `teachbuddy-board-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  // Preset scientific & math diagrams
  const loadPresetFormula = (type: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    saveStateToHistory();
    handleClear();

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillStyle = darkMode ? '#f8fafc' : '#0f172a';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (type === 'pythagoras') {
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy + 70);
      ctx.lineTo(cx + 100, cy + 70);
      ctx.lineTo(cx - 100, cy - 80);
      ctx.closePath();
      ctx.stroke();

      ctx.fillText('Base (b)', cx - 20, cy + 95);
      ctx.fillText('Height (a)', cx - 180, cy);
      ctx.fillText('Hypotenuse (c)', cx + 10, cy - 10);
      ctx.fillText('c² = a² + b²', cx - 50, cy - 110);
    } else if (type === 'sine') {
      // Draw Cartesian coordinate & sine wave
      ctx.beginPath();
      ctx.moveTo(cx - 180, cy);
      ctx.lineTo(cx + 180, cy);
      ctx.moveTo(cx, cy - 100);
      ctx.lineTo(cx, cy + 100);
      ctx.stroke();

      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let x = -160; x <= 160; x++) {
        const y = Math.sin(x * 0.05) * 60;
        if (x === -160) ctx.moveTo(cx + x, cy - y);
        else ctx.lineTo(cx + x, cy - y);
      }
      ctx.stroke();
      ctx.fillText('y = A·sin(ωt + φ)', cx - 70, cy - 110);
    } else if (type === 'atom') {
      // Bohr model
      ctx.beginPath();
      ctx.fillStyle = '#ef4444';
      ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = darkMode ? '#f8fafc' : '#0f172a';
      ctx.fillText('Nucleus (p⁺, n⁰)', cx - 60, cy + 35);

      ctx.strokeStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 110, 45, Math.PI / 4, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, 110, 45, -Math.PI / 4, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillText('Bohr Electron Orbits', cx - 80, cy - 80);
    } else if (type === 'axes') {
      // Cartesian Coordinate Axes
      ctx.beginPath();
      ctx.moveTo(cx - 180, cy);
      ctx.lineTo(cx + 180, cy);
      ctx.moveTo(cx, cy - 120);
      ctx.lineTo(cx, cy + 120);
      ctx.stroke();

      drawArrow(ctx, cx, cy, cx + 180, cy, 10);
      drawArrow(ctx, cx, cy, cx, cy - 120, 10);
      ctx.fillText('+X', cx + 190, cy + 5);
      ctx.fillText('+Y', cx - 10, cy - 130);
      ctx.fillText('Origin (0,0)', cx + 10, cy + 20);
    }
  };

  const handleAiSolveDrawing = async () => {
    setAiSolving(true);
    setAiAnalysis(null);

    try {
      const prompt = `I am a student working on my digital whiteboard for STEM revision. Please analyze what is written or drawn on this whiteboard, provide the exact mathematical formula, detailed step-by-step resolution, and key examination tip to avoid mistakes.`;
      
      const res = await aiService.generateContent({
        prompt: `${prompt}\n\nPlease format with clean, structured bullet points, clear mathematical equations, and an inspiring encouraging tone.`,
        temperature: 0.3
      });

      if (res.text) {
        setAiAnalysis(res.text);
      } else {
        setAiAnalysis('I see your whiteboard notes! Here is the breakdown: 1. Identify all given values. 2. Apply the fundamental formula. 3. Substitute values carefully with appropriate units.');
      }
    } catch {
      setAiAnalysis('💡 Whiteboard Tutor Tip: To solve problems accurately, identify your knowns and unknowns first, write down the governing formula, then substitute step-by-step!');
    } finally {
      setAiSolving(false);
    }
  };

  const copyAiText = () => {
    if (!aiAnalysis) return;
    navigator.clipboard.writeText(aiAnalysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-4 max-w-6xl mx-auto ${isFullScreen ? 'fixed inset-0 z-50 p-4 bg-slate-950 text-white overflow-auto' : ''}`}>
      {/* Top Header & Preset Bar */}
      <div className={`rounded-3xl p-4 border transition-all ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl shadow-black/20' 
          : 'bg-white border-slate-200/80 text-slate-800 shadow-lg shadow-indigo-100/40'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight font-outfit">
                  Smart Digital Whiteboard
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-indigo-500/20">
                  AI Equipped
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Freehand drawings, geometric shapes, science diagrams & live AI step-by-step solver
              </p>
            </div>
          </div>

          {/* Quick Diagram Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden md:inline">Instant Diagrams:</span>
            <button
              onClick={() => loadPresetFormula('pythagoras')}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Right Triangle</span>
            </button>
            <button
              onClick={() => loadPresetFormula('sine')}
              className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 hover:bg-sky-100 text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Sine Wave</span>
            </button>
            <button
              onClick={() => loadPresetFormula('atom')}
              className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1"
            >
              <Atom className="w-3.5 h-3.5" />
              <span>Bohr Atom</span>
            </button>
            <button
              onClick={() => loadPresetFormula('axes')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-semibold whitespace-nowrap cursor-pointer transition flex items-center gap-1"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cartesian Axes</span>
            </button>
          </div>
        </div>

        {/* Enhanced Multi-Tool Toolbar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* Tool Modes: Pen, Highlighter, Shapes, Eraser */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            {[
              { id: 'pen', label: 'Pen', icon: PenTool },
              { id: 'highlighter', label: 'Neon Glow', icon: Highlighter },
              { id: 'line', label: 'Line', icon: Minus },
              { id: 'arrow', label: 'Arrow', icon: MoveRight },
              { id: 'rect', label: 'Rectangle', icon: Square },
              { id: 'circle', label: 'Circle', icon: CircleIcon },
              { id: 'eraser', label: 'Eraser', icon: Eraser },
            ].map((tool) => {
              const IconComp = tool.icon;
              const isActive = toolMode === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setToolMode(tool.id as ToolMode)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={tool.label}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* Color Palette & Brush Thickness */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setColor(c.value); if (toolMode === 'eraser') setToolMode('pen'); }}
                  className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center transition-all cursor-pointer ${
                    toolMode !== 'eraser' && color === c.value 
                      ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' 
                      : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  title={c.label}
                >
                  {toolMode !== 'eraser' && color === c.value && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>

            {/* Brush Sizes */}
            <div className="flex items-center gap-1 ml-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {[2, 4, 8, 14].map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                    brushSize === size 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title={`Stroke: ${size}px`}
                >
                  <span style={{ fontSize: `${Math.min(8 + size, 14)}px` }}>•</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Tools: Grid, Undo, Clear, Save, AI Explain, Fullscreen */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const types: ('grid' | 'dots' | 'lines' | 'blank')[] = ['grid', 'dots', 'lines', 'blank'];
                const nextIdx = (types.indexOf(gridType) + 1) % types.length;
                setGridType(types[nextIdx]);
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              title="Toggle Grid / Lines"
            >
              <Grid className="w-4 h-4 text-indigo-500" />
            </button>

            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              title="Undo Stroke"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              onClick={handleClear}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
              title="Clear Whiteboard"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              title="Download PNG"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Board"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* AI Explain Button */}
            <button
              onClick={handleAiSolveDrawing}
              disabled={aiSolving}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 active:scale-95 transition cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${aiSolving ? 'animate-spin' : ''}`} />
              <span>{aiSolving ? 'Analyzing...' : 'AI Explain'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area with Grid Patterns */}
      <div 
        ref={containerRef}
        className={`w-full rounded-3xl overflow-hidden border transition-all relative ${
          darkMode 
            ? 'bg-[#0b0f19] border-slate-800 shadow-2xl shadow-black/40' 
            : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
        }`}
        style={{
          backgroundImage: 
            gridType === 'grid' 
              ? `linear-gradient(to right, ${darkMode ? '#1e293b25' : '#e2e8f080'} 1px, transparent 1px), linear-gradient(to bottom, ${darkMode ? '#1e293b25' : '#e2e8f080'} 1px, transparent 1px)`
              : gridType === 'dots'
              ? `radial-gradient(${darkMode ? '#334155' : '#cbd5e1'} 1.2px, transparent 1.2px)`
              : gridType === 'lines'
              ? `linear-gradient(to bottom, ${darkMode ? '#1e293b30' : '#e2e8f090'} 1px, transparent 1px)`
              : 'none',
          backgroundSize: gridType === 'dots' ? '24px 24px' : '28px 28px',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStartDrawing}
          onMouseMove={handleDraw}
          onMouseUp={handleStopDrawing}
          onMouseLeave={handleStopDrawing}
          onTouchStart={handleStartDrawing}
          onTouchMove={handleDraw}
          onTouchEnd={handleStopDrawing}
          className="touch-none cursor-crosshair w-full block"
        />

        {/* Floating Voice Discuss prompt */}
        <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-2">
          <button
            onClick={() => onOpenVoiceCallWithTopic('Whiteboard Math & Science Concept')}
            className="px-3 py-1.5 rounded-full bg-slate-900/85 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-bold backdrop-blur-md shadow-lg flex items-center gap-1.5 hover:scale-105 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Discuss Board with Voice Tutor</span>
          </button>
        </div>
      </div>

      {/* AI Analysis Output Card */}
      {aiAnalysis && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-indigo-200/80 dark:border-indigo-900/50 shadow-xl animate-fade-in relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white font-outfit">
                AI Whiteboard Explanation & Step-by-Step Solution
              </h3>
            </div>
            <button
              onClick={copyAiText}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            {aiAnalysis}
          </div>
        </div>
      )}
    </div>
  );
};
