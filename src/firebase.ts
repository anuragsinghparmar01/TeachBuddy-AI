import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore, 
  setLogLevel,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  onSnapshot,
  Firestore 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import type { UserProfile, StudyNote, QuizResult, StudySchedule, AdminSettings } from './types';

// Read config from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0109144674",
  appId: "1:1021698453499:web:72756097f75c9077ec255e",
  apiKey: "AIzaSyBTDFkIyfx0won82XM7hFjnwt7kL0CVl5c",
  authDomain: "gen-lang-client-0109144674.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-c1576f5e-5cf5-43ef-8e5d-2830f2738039",
  storageBucket: "gen-lang-client-0109144674.firebasestorage.app",
  messagingSenderId: "1021698453499",
  oAuthClientId: "1021698453499-fkpt92hjakml3vt7tah98lp12nu8h1le.apps.googleusercontent.com",
};

let app: any;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  // Silent log level ensures transient offline/reachability retries do not throw noisy console errors
  setLogLevel('silent');
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  // Firestore instance with custom database ID and auto-detecting transport
  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
  } catch {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (err) {
  // Graceful offline fallback
}

export { db, auth, googleProvider };

// Local Storage Fallback Keys
const STORAGE_KEYS = {
  USER: 'techbuddy_user_profile',
  NOTES: 'techbuddy_saved_notes',
  QUIZZES: 'techbuddy_quiz_history',
  SCHEDULES: 'techbuddy_schedules',
  ADMIN_SETTINGS: 'techbuddy_admin_settings',
};

// Default Admin settings
export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  appName: 'TeachBuddy AI',
  announcementBanner: '',
  announcementEnabled: false,
  premiumPriceMonthly: 0,
  promoDiscountPercent: 0,
  activeFont: 'Outfit',
  darkModeDefault: false,
  childModeDefault: false,
  features: {
    voiceCallEnabled: true,
    quizModuleEnabled: true,
    problemSolverEnabled: true,
    notesModuleEnabled: true,
    schedulesEnabled: true,
    gamificationEnabled: true,
    childModeToggleEnabled: true,
    premiumPaywallEnabled: false,
  },
  supportedSubjects: [
    'Mathematics & Calculus',
    'Physics & Mechanics',
    'Chemistry & Biology',
    'Computer Science & Coding',
    'English & Literature',
    'History & Social Studies',
    'Economics & Business',
    'Competitive Exams (JEE / NEET / SAT / UPSC)',
    'Real World & General Knowledge',
  ],
  adminEmail: 'anuragsinghparmar95@gmail.com',
};

// Default User profile
export const DEFAULT_USER: UserProfile = {
  uid: '',
  name: 'Student Scholar',
  email: '',
  avatar: '👨‍🎓',
  role: 'student',
  ageGroup: 'high_school',
  institution: 'School',
  xp: 250,
  level: 1,
  streakDays: 4,
  maxStreak: 7,
  streakFreezes: 2,
  lastActiveDate: new Date().toISOString(),
  isPremium: true, // 100% Free VIP Student Pro for all!
  childMode: false,
  selectedVoice: 'female',
  preferredLanguage: 'hi-IN',
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  badges: ['Curious Mind', 'Fast Learner', '3-Day Spark', 'Pro Student'],
  rankTier: 'Gold Scholar',
  createdAt: new Date().toISOString(),
  isAuthenticated: false,
};

export function getLocalUser(): UserProfile {
  const cached = localStorage.getItem(STORAGE_KEYS.USER);
  if (cached) {
    try {
      return { ...DEFAULT_USER, ...JSON.parse(cached) };
    } catch {
      return DEFAULT_USER;
    }
  }
  return DEFAULT_USER;
}

export function saveLocalUser(user: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  if (db && user.uid && auth?.currentUser && auth.currentUser.uid === user.uid) {
    const userRef = doc(db, 'users', user.uid);
    setDoc(userRef, user, { merge: true }).catch((err) => {
      console.warn('Firestore sync user error:', err?.message || err);
    });
  }
}

export function listenToUserProfile(uid: string, callback: (data: UserProfile | null) => void): () => void {
  if (!db || !uid) return () => {};
  // Only listen to Firestore if user has active Firebase auth session
  if (!auth?.currentUser || auth.currentUser.uid !== uid) {
    return () => {};
  }
  try {
    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          callback(data);
        }
      },
      (error) => {
        // Prevent uncaught errors in snapshot listener
        console.warn('Firestore user snapshot listener notice:', error.code);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('listenToUserProfile warning:', err);
    return () => {};
  }
}

// Persistence Helpers: Store credential, profile, and API key used only, nothing else
export async function saveUserProfile(user: UserProfile): Promise<void> {
  // Always save locally for instant responsiveness
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

  if (db && user.uid && auth?.currentUser && auth.currentUser.uid === user.uid) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const cleanDocument = {
        // 1. Credentials
        uid: user.uid,
        email: user.email || '',
        lastLoginAt: new Date().toISOString(),
        // 2. Profile
        name: user.name || 'Scholar',
        avatar: user.avatar || '👨‍🎓',
        avatarImage: user.avatarImage || null,
        role: user.role || 'student',
        ageGroup: user.ageGroup || 'high_school',
        institution: user.institution || 'School',
        xp: user.xp || 0,
        level: user.level || 1,
        streakDays: user.streakDays || 0,
        maxStreak: user.maxStreak || 0,
        preferredLanguage: user.preferredLanguage || 'en-US',
        selectedVoice: user.selectedVoice || 'female',
        voiceSpeed: user.voiceSpeed ?? 1.0,
        voicePitch: user.voicePitch ?? 1.0,
        createdAt: user.createdAt || new Date().toISOString(),
        lastActiveDate: new Date().toISOString(),
        // 3. API Key(s) used
        geminiApiKey: user.geminiApiKey || (user as any).apiKey || '',
        customApiKey: user.customApiKey || user.geminiApiKey || '',
        moduleApiKeys: user.moduleApiKeys || null,
      };

      await setDoc(userRef, cleanDocument, { merge: true });
    } catch (e: any) {
      console.warn('Firestore sync userProfile notice:', e?.message || e);
    }
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (db && uid && auth?.currentUser && auth.currentUser.uid === uid) {
    try {
      const fetchWithTimeout = new Promise<UserProfile | null>((resolve) => {
        const timer = setTimeout(() => resolve(null), 2500);
        const userRef = doc(db!, 'users', uid);
        getDoc(userRef)
          .then((snap) => {
            clearTimeout(timer);
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data));
              resolve(data);
            } else {
              resolve(null);
            }
          })
          .catch(() => {
            clearTimeout(timer);
            resolve(null);
          });
      });

      const result = await fetchWithTimeout;
      if (result) return result;
    } catch (e: any) {
      console.warn('Firestore getUserProfile notice:', e?.message || e);
    }
  }

  const cached = localStorage.getItem(STORAGE_KEYS.USER);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveNoteToFirestore(userId: string, note: StudyNote): Promise<void> {
  const currentNotes = getLocalNotes();
  const index = currentNotes.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    currentNotes[index] = note;
  } else {
    currentNotes.unshift(note);
  }
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(currentNotes));

  if (db && userId && auth?.currentUser && auth.currentUser.uid === userId) {
    try {
      const noteRef = doc(db, 'users', userId, 'notes', note.id);
      await setDoc(noteRef, note);
    } catch (e: any) {
      console.warn('Firestore save note notice:', e?.message || e);
    }
  }
}

export function getLocalNotes(): StudyNote[] {
  const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function deleteNoteFromFirestore(userId: string, noteId: string): Promise<void> {
  const notes = getLocalNotes().filter((n) => n.id !== noteId);
  localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));

  if (db && userId && auth?.currentUser && auth.currentUser.uid === userId) {
    try {
      const noteRef = doc(db, 'users', userId, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (e: any) {
      console.warn('Firestore delete note notice:', e?.message || e);
    }
  }
}

export async function saveQuizResultToFirestore(userId: string, result: QuizResult): Promise<void> {
  const history = getLocalQuizzes();
  history.unshift(result);
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(history.slice(0, 50)));

  if (db && userId && auth?.currentUser && auth.currentUser.uid === userId) {
    try {
      const quizRef = doc(db, 'users', userId, 'quizzes', result.id);
      await setDoc(quizRef, result);
    } catch (e: any) {
      console.warn('Firestore save quiz notice:', e?.message || e);
    }
  }
}

export function getLocalQuizzes(): QuizResult[] {
  const raw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveScheduleToFirestore(userId: string, schedule: StudySchedule): Promise<void> {
  const schedules = getLocalSchedules();
  const idx = schedules.findIndex((s) => s.id === schedule.id);
  if (idx >= 0) {
    schedules[idx] = schedule;
  } else {
    schedules.unshift(schedule);
  }
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));

  if (db && userId && auth?.currentUser && auth.currentUser.uid === userId) {
    try {
      const schedRef = doc(db, 'users', userId, 'schedules', schedule.id);
      await setDoc(schedRef, schedule);
    } catch (e: any) {
      console.warn('Firestore save schedule notice:', e?.message || e);
    }
  }
}

export function getLocalSchedules(): StudySchedule[] {
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getLocalAdminSettings(): AdminSettings {
  const cached = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      // Ensure the old default welcome banner is removed
      const isOldBanner =
        typeof parsed?.announcementBanner === 'string' &&
        (parsed.announcementBanner.includes('100% Free AI Tutor') ||
          parsed.announcementBanner.includes('Welcome to TeachBuddy AI') ||
          parsed.announcementBanner.includes('Learn • Grow • Together'));
      return {
        ...DEFAULT_ADMIN_SETTINGS,
        ...parsed,
        announcementBanner: isOldBanner ? '' : (parsed.announcementBanner || ''),
        announcementEnabled: isOldBanner ? false : Boolean(parsed.announcementEnabled),
        features: {
          ...DEFAULT_ADMIN_SETTINGS.features,
          ...(parsed?.features || {}),
        },
      };
    } catch {
      return DEFAULT_ADMIN_SETTINGS;
    }
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  if (db) {
    try {
      const fetchWithTimeout = new Promise<AdminSettings | null>((resolve) => {
        const timer = setTimeout(() => resolve(null), 2500);
        const settingsRef = doc(db!, 'settings', 'global_config');
        getDoc(settingsRef)
          .then((snap) => {
            clearTimeout(timer);
            if (snap.exists()) {
              const data = snap.data() as Partial<AdminSettings>;
              const isOldBanner =
                typeof data?.announcementBanner === 'string' &&
                (data.announcementBanner.includes('100% Free AI Tutor') ||
                  data.announcementBanner.includes('Welcome to TeachBuddy AI') ||
                  data.announcementBanner.includes('Learn • Grow • Together'));
              const merged: AdminSettings = {
                ...DEFAULT_ADMIN_SETTINGS,
                ...data,
                announcementBanner: isOldBanner ? '' : (data.announcementBanner || ''),
                announcementEnabled: isOldBanner ? false : Boolean(data.announcementEnabled),
                features: {
                  ...DEFAULT_ADMIN_SETTINGS.features,
                  ...(data?.features || {}),
                },
              };
              localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(merged));
              resolve(merged);
            } else {
              resolve(null);
            }
          })
          .catch(() => {
            clearTimeout(timer);
            resolve(null);
          });
      });

      const result = await fetchWithTimeout;
      if (result) return result;
    } catch (e) {
      console.warn('Firestore get admin settings notice:', e);
    }
  }

  return getLocalAdminSettings();
}

export async function saveAdminSettings(settings: AdminSettings, userEmail?: string): Promise<void> {
  // Save locally first for instant reactive UI
  localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(settings));

  if (db) {
    try {
      const settingsRef = doc(db, 'settings', 'global_config');
      await setDoc(settingsRef, settings, { merge: true });
    } catch (e) {
      console.warn('Firestore save admin settings notice:', e);
      // Even if Firestore encounters network issues, local state persists
    }
  }
}

export async function logoutUser(): Promise<void> {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
  localStorage.removeItem(STORAGE_KEYS.USER);
}

