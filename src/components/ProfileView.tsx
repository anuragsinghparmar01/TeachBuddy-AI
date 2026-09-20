import React, { useState, useRef } from 'react';
import { 
  Award, 
  Flame, 
  Zap, 
  BookOpen, 
  CheckCircle2, 
  Calendar, 
  Download, 
  ShieldCheck, 
  LogOut, 
  User, 
  TrendingUp, 
  GraduationCap,
  Clock,
  Camera,
  Upload,
  Edit3,
  Check,
  Sparkles,
  Target
} from 'lucide-react';
import type { UserProfile, AgeGroup, InstitutionType } from '../types';
import { exportStudentReportToPdf } from '../services/pdfService';
import { audioService } from '../services/audioService';

interface ProfileViewProps {
  user: UserProfile;
  darkMode: boolean;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onNavigate?: (tab: any) => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
}

// 8 stylish scholar avatar badges
const AVATAR_PRESETS = [
  { id: 'scholar_1', emoji: '🧑‍🎓', label: 'Scholar' },
  { id: 'scientist_1', emoji: '🔬', label: 'Scientist' },
  { id: 'math_1', emoji: '📐', label: 'Mathematician' },
  { id: 'coder_1', emoji: '💻', label: 'Coder' },
  { id: 'astro_1', emoji: '🚀', label: 'Astronaut' },
  { id: 'polymath_1', emoji: '📚', label: 'Polymath' },
  { id: 'thinker_1', emoji: '🧠', label: 'Philosopher' },
  { id: 'artist_1', emoji: '🎨', label: 'Creator' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  darkMode,
  onUpdateUser = (_updated: Partial<UserProfile>) => {},
  onNavigate = (_tab: any) => {},
  onOpenAuth = () => {},
  onLogout = () => {},
  onOpenAdmin = () => {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.name || '');
  const [bioInput, setBioInput] = useState(user.studentBio || '');
  const [institutionInput, setInstitutionInput] = useState<InstitutionType>(user.institution || 'High School');
  const [targetGoalInput, setTargetGoalInput] = useState(user.targetExamOrGoal || 'Class 12 Board & Competitive Exam');
  const [learningStyleInput, setLearningStyleInput] = useState<'Visual' | 'Auditory' | 'Reading' | 'Kinesthetic'>(
    user.learningStyle || 'Visual'
  );
  const [studyHoursInput, setStudyHoursInput] = useState(user.studyGoalHours || 3);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentXp = user.xp || 0;
  const currentLevel = user.level || 1;
  const xpInCurrentLevel = currentXp % 200;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / 200) * 100));

  const handleExportPdf = () => {
    exportStudentReportToPdf(user);
  };

  const handleSaveProfile = () => {
    onUpdateUser({
      name: nameInput.trim() || 'Scholar',
      studentBio: bioInput.trim(),
      institution: institutionInput,
      targetExamOrGoal: targetGoalInput.trim(),
      learningStyle: learningStyleInput,
      studyGoalHours: studyHoursInput,
    });
    setIsEditing(false);
  };

  // Upload custom profile picture (base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Image file size should be less than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onUpdateUser({
        avatarImage: base64,
        avatarPreset: undefined,
      });
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof AVATAR_PRESETS[number]) => {
    onUpdateUser({
      avatarPreset: preset.emoji,
      avatarImage: undefined,
    });
    setShowAvatarPicker(false);
  };

  const isAdmin = user.email?.toLowerCase() === 'anuragsinghparmar95@gmail.com' || user.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Hidden File Input for Avatar Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Main Profile Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Avatar & Personal Details */}
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar Circle with Upload Overlay */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-indigo-600/20 overflow-hidden border-2 border-white/20">
                {user.avatarImage ? (
                  <img 
                    src={user.avatarImage} 
                    alt={user.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : user.avatarPreset ? (
                  <span className="text-4xl">{user.avatarPreset}</span>
                ) : (
                  <span>{user.name ? user.name.charAt(0).toUpperCase() : 'S'}</span>
                )}
              </div>

              {/* Hover Edit Button */}
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition active:scale-95 cursor-pointer"
                title="Change Avatar or Upload Picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user.name || 'Scholar'}</h1>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Edit Profile Information"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {user.studentBio || 'Curious mind mastering concepts, problems, and daily goals with TeachBuddy AI.'}
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Level {currentLevel} Scholar
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {user.institution || 'High School'}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  {user.learningStyle || 'Visual'} Learner
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Certificate & Report</span>
            </button>
            {user.email ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Avatar Selection Dropdown / Drawer */}
        {showAvatarPicker && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Scholar Avatar or Upload Photo
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Image</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                    user.avatarPreset === preset.emoji
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl">{preset.emoji}</span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Inline Profile Edit Form */}
        {isEditing && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Edit Scholar Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Target Exam / Goal</label>
                <input
                  type="text"
                  value={targetGoalInput}
                  onChange={(e) => setTargetGoalInput(e.target.value)}
                  placeholder="e.g. CBSE Class 12, JEE Advanced, NEET, UPSC"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Student Bio / Motto</label>
                <input
                  type="text"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="A short motto or study ambition"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Learning Style</label>
                <select
                  value={learningStyleInput}
                  onChange={(e) => setLearningStyleInput(e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Visual">Visual (Diagrams, Mind Maps, Charts)</option>
                  <option value="Auditory">Auditory (Voice Buddy, Audio Calls)</option>
                  <option value="Reading">Reading & Writing (Notes, Summaries)</option>
                  <option value="Kinesthetic">Kinesthetic (Active Drills, Quizzes, Practice)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Daily Study Target</label>
                <select
                  value={studyHoursInput}
                  onChange={(e) => setStudyHoursInput(parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value={1}>1 Hour per day</option>
                  <option value={2}>2 Hours per day</option>
                  <option value={3}>3 Hours per day (Recommended)</option>
                  <option value={4}>4 Hours per day</option>
                  <option value={6}>6 Hours per day (Intensive)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Level XP Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-500 dark:text-slate-400">Level Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400">{xpInCurrentLevel} / 200 XP</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Streak</span>
          </div>
          <p className="text-2xl font-black">{user.streakDays || 1} Days</p>
          <span className="text-[10px] text-slate-400">Daily consistency</span>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Knowledge XP</span>
          </div>
          <p className="text-2xl font-black">{currentXp}</p>
          <span className="text-[10px] text-slate-400">Total earned</span>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Level</span>
          </div>
          <p className="text-2xl font-black">{currentLevel}</p>
          <span className="text-[10px] text-slate-400">Tier: {currentLevel >= 5 ? 'Grandmaster' : currentLevel >= 3 ? 'Researcher' : 'Apprentice'}</span>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-teal-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Target</span>
          </div>
          <p className="text-base font-black truncate">{user.studyGoalHours || 3} hrs/day</p>
          <span className="text-[10px] text-slate-400">{user.targetExamOrGoal || 'Active Goal'}</span>
        </div>
      </div>

      {/* Badges Showcase */}
      <div className={`p-6 rounded-3xl border transition-all space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Badges & Achievements</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">
            {(user.badges?.length || 3)} Badges Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { title: 'Founding Scholar', desc: 'Joined TeachBuddy AI', icon: '🌟' },
            { title: '7-Day Champion', desc: 'Maintained 7 days streak', icon: '🔥' },
            { title: 'Speed Solver', desc: 'Solved complex problems', icon: '⚡' },
            { title: 'Quiz Master', desc: 'Scored 100% on a quiz', icon: '🎯' },
          ].map((badge, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3"
            >
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <p className="text-xs font-bold leading-tight">{badge.title}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Quick Link */}
      {isAdmin && (
        <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
          darkMode ? 'bg-purple-950/30 border-purple-800/40 text-white' : 'bg-purple-50 border-purple-200 text-purple-950'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-xs font-bold">Admin Console</p>
              <p className="text-[11px] text-purple-600/80 dark:text-purple-300">
                Manage platform features, announcements, and database configurations.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAdmin}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Open Admin
          </button>
        </div>
      )}
    </div>
  );
};
