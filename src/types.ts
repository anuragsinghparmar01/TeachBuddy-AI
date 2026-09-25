export type AgeGroup = 'child' | 'middle_school' | 'high_school' | 'college' | 'competitive_exam' | 'professional';

export type InstitutionType = 'School' | 'High School' | 'College / University' | 'Coaching / Institute' | 'Self Learner';

export type AppFont = 'Outfit' | 'Fredoka' | 'Plus Jakarta Sans' | 'Space Mono';

export type VoiceGender = 'female' | 'male';

export type IndianLanguageCode = 
  | 'en-US' // English
  | 'en-IN' // English (India)
  | 'hi-IN' // Hindi
  | 'hi-mix' // Hinglish
  | 'bn-IN' // Bengali
  | 'ta-IN' // Tamil
  | 'te-IN' // Telugu
  | 'mr-IN' // Marathi
  | 'gu-IN' // Gujarati
  | 'kn-IN' // Kannada
  | 'ml-IN' // Malayalam
  | 'pa-IN' // Punjabi
  | 'or-IN' // Odia
  | 'ur-IN'; // Urdu

export type LanguageCode = IndianLanguageCode;

export interface IndianLanguageOption {
  code: IndianLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  greeting: string;
}

export const INDIAN_LANGUAGES: IndianLanguageOption[] = [
  { code: 'en-US', name: 'English', nativeName: 'English (US/UK)', flag: '🌐', greeting: 'Hello! I am your TeachBuddy AI tutor.' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', greeting: 'नमस्ते! मैं आपका TeachBuddy AI हूँ।' },
  { code: 'hi-mix', name: 'Hinglish', nativeName: 'Hinglish (Hindi+English)', flag: '🇮🇳', greeting: 'Hello! Main aapka TeachBuddy AI tutor hoon.' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'Indian English', flag: '🇮🇳', greeting: 'Hello! I am your TeachBuddy AI tutor.' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', greeting: 'নমস্কার! আমি আপনার TeachBuddy AI।' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', greeting: 'வணக்கம்! நான் உங்கள் TeachBuddy AI.' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', greeting: 'నమస్కారం! నేను మీ TeachBuddy AI.' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', greeting: 'नमस्कार! मी तुमचा TeachBuddy AI आहे.' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', greeting: 'નમસ્તે! હું તમારો TeachBuddy AI છું.' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', greeting: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ TeachBuddy AI.' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', greeting: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ TeachBuddy AI ആണ്.' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ TeachBuddy AI ਹਾਂ।' },
  { code: 'or-IN', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', greeting: 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ TeachBuddy AI।' },
  { code: 'ur-IN', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳', greeting: 'آداب! میں آپ کا TeachBuddy AI ساتھی ہوں۔' },
];

export type ActiveTab = 
  | 'explain' 
  | 'notes' 
  | 'solver' 
  | 'quiz' 
  | 'exam' 
  | 'counsel' 
  | 'whiteboard' 
  | 'focus'
  | 'writing'
  | 'personality'
  | 'courses' 
  | 'schedule' 
  | 'games' 
  | 'profile' 
  | 'settings' 
  | 'teach' 
  | 'dashboard' 
  | 'quizzes' 
  | 'challenge' 
  | 'streaks';

export const ALL_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science & AI',
  'History & Civics',
  'Geography & Environment',
  'Economics & Commerce',
  'Political Science & Public Governance',
  'English Literature & Grammar',
  'Business Studies & Management',
  'Accountancy & Financial Literacy',
  'Psychology & Cognitive Science',
  'Environmental Science & Ecology',
  'Logic & Critical Reasoning',
  'Vedic Math & Speed Math',
  'General Knowledge & Current Affairs',
  'Philosophy & Ethics',
  'Astronomy & Space Science',
] as const;

export type SubjectName = typeof ALL_SUBJECTS[number];

export interface ModuleApiKeys {
  explainKey: string;
  notesKey: string;
  voiceKey: string;
  solverKey: string;
  quizKey: string;
  generalKey: string;
}

export const DEFAULT_MODULE_API_KEYS: ModuleApiKeys = {
  explainKey: '',
  notesKey: '',
  voiceKey: '',
  solverKey: '',
  quizKey: '',
  generalKey: '',
};

export interface DailyGoal {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
  icon: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  avatarImage?: string; // Base64 or image URL uploaded by student
  avatarPreset?: string;
  studentBio?: string;
  learningStyle?: 'Visual' | 'Auditory' | 'Reading' | 'Kinesthetic';
  studyGoalHours?: number;
  role: 'student' | 'admin';
  ageGroup: AgeGroup;
  institution: InstitutionType;
  targetExamOrGoal?: string;
  xp: number;
  level: number;
  streakDays: number;
  maxStreak?: number;
  streakFreezes?: number;
  lastActiveDate: string;
  isPremium: boolean;
  premiumExpiry?: string;
  childMode: boolean;
  selectedVoice: VoiceGender;
  preferredLanguage: IndianLanguageCode;
  voiceSpeed: number;
  voicePitch: number;
  badges: string[];
  rankTier?: string;
  mysteryBoxOpenedDate?: string;
  createdAt: string;
  isAuthenticated?: boolean;
  geminiApiKey?: string;
  customApiKey?: string;
  moduleApiKeys?: ModuleApiKeys;
  openingTheme?: 'command_center' | 'particles';
  customBuddyName?: string;
  responseDepth?: 'concise' | 'balanced' | 'in_depth';
  bgAmbientSound?: 'off' | 'lofi' | 'rain' | 'library' | 'binaural';
  bgAmbientVolume?: number;
  soundEffectsEnabled?: boolean;
  themeAccent?: 'indigo' | 'emerald' | 'amber' | 'fuchsia' | 'cyan';
  appFont?: AppFont;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

export interface QuizResult {
  id: string;
  topic: string;
  chapter?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  xpEarned: number;
  timestamp: string;
  timeSpentSeconds: number;
  userAnswers: number[];
}

export interface ProblemSolution {
  id: string;
  problemText: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  givenData: string[];
  conceptsUsed: string[];
  stepByStep: {
    stepNumber: number;
    title: string;
    explanation: string;
    formulaOrCode?: string;
  }[];
  finalAnswer: string;
  proTips: string[];
  commonMistakesToAvoid?: string[];
  timestamp: string;
}

export interface StudyNote {
  id: string;
  topic: string;
  chapter: string;
  unit?: string;
  subject: string;
  ageGroup: AgeGroup;
  summary: string;
  bulletPoints: string[];
  formulasAndKeyTerms: { term: string; definition: string }[];
  mindmapOutline: { main: string; subtopics: string[] }[];
  practiceQuestions: string[];
  tags: string[];
  createdAt: string;
  isFavorite?: boolean;
}

export interface StudyScheduleTask {
  id: string;
  day: string; // e.g. 'Monday' or 'Day 1'
  timeSlot: string; // e.g. '04:00 PM - 05:00 PM'
  subject: string;
  topic: string;
  activityType: 'Concept' | 'Quiz' | 'Problem Solving' | 'Revision Notes' | 'Voice Call Buddy';
  durationMinutes: number;
  completed: boolean;
}

export interface StudySchedule {
  id: string;
  title: string;
  targetGoal: string;
  examDate?: string;
  hoursPerDay: number;
  totalDays: number;
  tasks: StudyScheduleTask[];
  createdAt: string;
}

export interface VoiceCallMessage {
  id: string;
  sender: 'user' | 'buddy';
  text: string;
  timestamp: string;
  audioDuration?: number;
}

export interface AdminSettings {
  appName: string;
  announcementBanner: string;
  announcementEnabled: boolean;
  premiumPriceMonthly: number; // 499
  promoDiscountPercent: number;
  activeFont: AppFont;
  darkModeDefault: boolean;
  childModeDefault: boolean;
  features: {
    voiceCallEnabled: boolean;
    quizModuleEnabled: boolean;
    problemSolverEnabled: boolean;
    notesModuleEnabled: boolean;
    schedulesEnabled: boolean;
    gamificationEnabled: boolean;
    childModeToggleEnabled: boolean;
    premiumPaywallEnabled: boolean;
  };
  supportedSubjects: string[];
  adminEmail: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requirement: string;
}
