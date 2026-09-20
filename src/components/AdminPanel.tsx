import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Type, 
  Sliders, 
  DollarSign, 
  Megaphone, 
  Database, 
  Save, 
  Check, 
  Sparkles, 
  Users, 
  Layers, 
  Plus, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import type { AdminSettings, AppFont } from '../types';
import { saveAdminSettings, DEFAULT_ADMIN_SETTINGS } from '../firebase';
import { audioService } from '../services/audioService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  onUpdateSettings: (newSettings: AdminSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<AdminSettings>(() => ({
    ...DEFAULT_ADMIN_SETTINGS,
    ...(settings || {}),
    features: {
      ...DEFAULT_ADMIN_SETTINGS.features,
      ...(settings?.features || {}),
    },
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [activeTab, setActiveTab] = useState<'fonts' | 'features' | 'pricing' | 'announcements' | 'subjects'>('fonts');

  if (!isOpen) return null;

  const fontOptions: { font: AppFont; name: string; preview: string; desc: string }[] = [
    { font: 'Outfit', name: 'Outfit (Default)', preview: 'Aa Bb Gg 123', desc: 'Modern, balanced geometric sans-serif for high clarity' },
    { font: 'Fredoka', name: 'Fredoka Rounded', preview: 'Aa Bb Gg 123', desc: 'Warm, friendly rounded style optimal for young learners' },
    { font: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans', preview: 'Aa Bb Gg 123', desc: 'Crisp, contemporary aesthetic with high readability' },
    { font: 'Space Mono', name: 'Space Mono', preview: 'Aa Bb Gg 123', desc: 'Technical monospace style ideal for coding and STEM' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    audioService.playSound('click');

    try {
      await saveAdminSettings(formData);
      onUpdateSettings(formData);
      setSaveSuccess(true);
      audioService.playSound('success');
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeature = (key: keyof AdminSettings['features']) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key],
      },
    }));
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    setFormData((prev) => ({
      ...prev,
      supportedSubjects: [...prev.supportedSubjects, newSubject.trim()],
    }));
    setNewSubject('');
  };

  const handleRemoveSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      supportedSubjects: prev.supportedSubjects.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold">Admin Control Center</h2>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  anuragsinghparmar95@gmail.com
                </span>
              </div>
              <p className="text-xs text-slate-400">Configure system fonts, toggle features, manage pricing & announcements</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'fonts', label: 'Fonts & Typography', icon: Type },
            { id: 'features', label: 'Feature Toggles', icon: Sliders },
            { id: 'pricing', label: 'Pricing & Plans', icon: DollarSign },
            { id: 'announcements', label: 'Announcements', icon: Megaphone },
            { id: 'subjects', label: 'Subjects Manager', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FONTS */}
          {activeTab === 'fonts' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Global System Font Selector</h3>
                <p className="text-xs text-slate-400">
                  Select the active typography font used throughout TeachBuddy AI. Changes reflect immediately across all student devices.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fontOptions.map((opt) => (
                  <div
                    key={opt.font}
                    onClick={() => setFormData({ ...formData, activeFont: opt.font })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.activeFont === opt.font
                        ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">{opt.name}</span>
                      {formData.activeFont === opt.font && (
                        <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className={`text-xl font-bold text-slate-200 mb-1 ${
                      opt.font === 'Outfit' ? 'font-outfit' :
                      opt.font === 'Fredoka' ? 'font-fredoka' :
                      opt.font === 'Plus Jakarta Sans' ? 'font-jakarta' : 'font-mono-tech'
                    }`}>
                      {opt.preview}
                    </div>
                    <p className="text-[11px] text-slate-400">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FEATURES */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Module & Feature Toggles</h3>
                <p className="text-xs text-slate-400">
                  Enable or disable key learning modules on the platform as needed.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'voiceCallEnabled', title: 'Real Voice Call Buddy', desc: 'AI audio call feature with Male/Female voices' },
                  { key: 'quizModuleEnabled', title: 'Topic & Chapter Quizzes', desc: 'Active recall multiple-choice engine' },
                  { key: 'problemSolverEnabled', title: 'Universal Problem Solver', desc: 'Step-by-step solver with whiteboard scratchpad' },
                  { key: 'notesModuleEnabled', title: 'Smart Revision Notes', desc: 'Summaries, formula sheets & flashcard views' },
                  { key: 'schedulesEnabled', title: 'Personalized Study Timetable', desc: 'Study schedule planner with Pomodoro timer' },
                  { key: 'gamificationEnabled', title: 'Gamified XP & Badges', desc: 'Streaks, levels, and celebratory animations' },
                  { key: 'childModeToggleEnabled', title: 'Child Mode Switcher', desc: 'Kid-friendly UI with Fredoka font & playful animations' },
                  { key: 'premiumPaywallEnabled', title: 'Premium Upgrade Flow', desc: '₹499/mo subscription modal and pro features' },
                ].map((item) => {
                  const isEnabled = formData.features[item.key as keyof AdminSettings['features']];
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggleFeature(item.key as any)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isEnabled
                          ? 'bg-slate-800/80 border-slate-700 hover:border-purple-400'
                          : 'bg-slate-900/50 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-100">{item.title}</h4>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>

                      <div className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                        isEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'
                      }`}>
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 text-xs max-w-md">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Subscription & Pricing Settings</h3>
                <p className="text-xs text-slate-400">
                  Update the monthly price and promotional discounts for TeachBuddy AI Premium.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Monthly Subscription Price (₹ INR)
                  </label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-slate-300">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={formData.premiumPriceMonthly}
                      onChange={(e) => setFormData({ ...formData, premiumPriceMonthly: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Default specified: ₹499 per month</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Universal Promo Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.promoDiscountPercent}
                    onChange={(e) => setFormData({ ...formData, promoDiscountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Current Effective Price: ₹{Math.round(formData.premiumPriceMonthly * (1 - (formData.promoDiscountPercent || 0) / 100))}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Top Announcement Banner</h3>
                <p className="text-xs text-slate-400">
                  Broadcast notices, new features, exam tips, or schedule alerts to all students at the top of every page.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableBanner"
                    checked={formData.announcementEnabled}
                    onChange={(e) => setFormData({ ...formData, announcementEnabled: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <label htmlFor="enableBanner" className="font-bold text-slate-300">
                    Enable Top Announcement Bar
                  </label>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Announcement Message
                  </label>
                  <input
                    type="text"
                    value={formData.announcementBanner}
                    onChange={(e) => setFormData({ ...formData, announcementBanner: e.target.value })}
                    placeholder="e.g. 🚀 Welcome to TeachBuddy AI! Your 24/7 AI Tutor & Interactive Voice Study Buddy."
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Live Preview</span>
                  <div className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-center">
                    {formData.announcementBanner || 'No message entered'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Curated Subjects & Syllabi</h3>
                <p className="text-xs text-slate-400">
                  Manage the list of subjects available across teaching, quizzes, and problem solving.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Environmental Science or Robotics"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAddSubject}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formData.supportedSubjects.map((sub, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-slate-200"
                  >
                    <span>{sub}</span>
                    <button
                      onClick={() => handleRemoveSubject(i)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Syncs to Firebase Firestore</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/30"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved & Applied!</span>
                </>
              ) : isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
