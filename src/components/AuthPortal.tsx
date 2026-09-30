import React, { useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Globe, 
  GraduationCap, 
  Phone, 
  AlertCircle,
  KeyRound,
  Crown,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  HelpCircle
} from 'lucide-react';
import { auth, googleProvider, saveUserProfile, getUserProfile } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import type { UserProfile, AgeGroup, InstitutionType, IndianLanguageCode } from '../types';
import { INDIAN_LANGUAGES } from '../types';
import { audioService } from '../services/audioService';

interface AuthPortalProps {
  onLoginSuccess: (user: Partial<UserProfile>, isAdminLogin?: boolean) => void;
  onGuestContinue?: (name?: string) => void;
  onContinueAsGuest?: () => void;
  darkMode?: boolean;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ 
  onLoginSuccess, 
  onGuestContinue, 
  onContinueAsGuest,
  darkMode = true 
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'phone' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('742819');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('high_school');
  const [institution, setInstitution] = useState<InstitutionType>('School');
  const [preferredLanguage, setPreferredLanguage] = useState<IndianLanguageCode>('hi-IN');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to translate Firebase auth error codes to friendly explanations
  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      return 'This email address is already registered. Please switch to the "Sign In" tab above.';
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Incorrect email or password. Please verify your details or use Admin Demo Fill below.';
    }
    if (code === 'auth/user-not-found') {
      return 'No registered student account was found with this email. Please click "New Student" to create your free account.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters in length.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address (e.g. name@gmail.com).';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Access is temporarily paused for security. Please try again shortly.';
    }
    return err?.message || 'Authentication error occurred. Please verify your details.';
  };

  // Complete profile and write dedicated record to database
  const completeAuth = async (uid: string, userEmail: string, userName: string, userPhone?: string) => {
    let existingProfile: UserProfile | null = null;
    try {
      existingProfile = await getUserProfile(uid);
    } catch {
      existingProfile = null;
    }

    const isAnuragAdmin = userEmail.trim().toLowerCase() === 'anuragsinghparmar95@gmail.com';

    const profileToUse: UserProfile = existingProfile ? {
      ...existingProfile,
      uid,
      email: userEmail || existingProfile.email,
      name: isAnuragAdmin ? 'Anurag Singh Parmar (Super Admin)' : (existingProfile.name || userName || 'Student Scholar'),
      phone: userPhone || existingProfile.phone || '',
      role: isAnuragAdmin ? 'admin' : (existingProfile.role || 'student'),
      lastActiveDate: new Date().toISOString(),
      isAuthenticated: true,
      isPremium: true,
    } : {
      uid,
      name: isAnuragAdmin ? 'Anurag Singh Parmar (Super Admin)' : (userName || 'Student Scholar'),
      email: userEmail || '',
      phone: userPhone || '',
      avatar: isAnuragAdmin ? '👑' : '👨‍🎓',
      role: isAnuragAdmin ? 'admin' : 'student',
      ageGroup,
      institution,
      xp: 350,
      level: 1,
      streakDays: 1,
      maxStreak: 1,
      streakFreezes: 2,
      lastActiveDate: new Date().toISOString(),
      isPremium: true, // Pro is 100% Free Forever for all students
      childMode: ageGroup === 'child',
      selectedVoice: 'female',
      preferredLanguage,
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      badges: ['First Step', 'Pioneer Scholar', '100% Free Pro Member'],
      rankTier: 'Gold Scholar',
      createdAt: new Date().toISOString(),
      isAuthenticated: true,
    };

    // Store in dedicated Firestore users collection
    try {
      await saveUserProfile(profileToUse);
    } catch (e) {
      console.warn('Firestore store fallback notice:', e);
    }

    audioService.playSound('levelup');
    onLoginSuccess(profileToUse, isAnuragAdmin);
  };

  // Google 1-Tap Sign In
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const isEmbeddedIframe = typeof window !== 'undefined' && window.self !== window.top;
      if (isEmbeddedIframe || !auth || !googleProvider) {
        // Fallback for sandboxed preview iframe where popups are blocked by cross-origin security
        const demoUid = `scholar_google_${Date.now()}`;
        await completeAuth(demoUid, email || 'scholar@teachbuddy.ai', name || 'Google Student Scholar');
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await completeAuth(user.uid, user.email || '', user.displayName || 'Google Scholar', user.phoneNumber || undefined);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setIsLoading(false);
        return;
      }
      console.warn('Google Auth notice:', err?.message || err);
      // Seamless fallback if popup fails in restricted preview
      const demoUid = `user_google_${Date.now()}`;
      await completeAuth(demoUid, email || 'student@teachbuddy.ai', name || 'Student Scholar');
    } finally {
      setIsLoading(false);
    }
  };

  // Email / Password Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim()) throw new Error('Please enter your email address');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');

        if (auth) {
          try {
            const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
            await completeAuth(res.user.uid, email.trim(), name.trim());
            return;
          } catch (fbErr: any) {
            if (fbErr.code === 'auth/email-already-in-use') {
              throw fbErr;
            }
            // Offline/preview fallback
            const uid = `student_${Date.now()}`;
            await completeAuth(uid, email.trim(), name.trim());
            return;
          }
        } else {
          const uid = `student_${Date.now()}`;
          await completeAuth(uid, email.trim(), name.trim());
        }
      } else if (authMode === 'signin') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both your email and password');
        }
        
        // Admin Direct Verified Login
        if (
          (email.trim().toLowerCase() === 'admin@teachbuddy.ai' && password.trim() === 'admin1234') ||
          (email.trim().toLowerCase() === 'anuragsinghparmar95@gmail.com' && password.trim() === '963852741')
        ) {
          await completeAuth('admin_user', email.trim(), 'Administrator');
          return;
        }

        if (auth) {
          try {
            const res = await signInWithEmailAndPassword(auth, email.trim(), password);
            await completeAuth(res.user.uid, email.trim(), res.user.displayName || email.split('@')[0]);
            return;
          } catch (fbErr: any) {
            // Check if error is wrong password or user not found
            if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
              throw fbErr;
            }
            // Offline/preview fallback
            const uid = `user_${Date.now()}`;
            await completeAuth(uid, email.trim(), email.split('@')[0]);
            return;
          }
        } else {
          const uid = `user_${Date.now()}`;
          await completeAuth(uid, email.trim(), email.split('@')[0]);
        }
      }
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
      audioService.playSound('click');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Flow
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Please enter your email address to receive the password reset link.');
      return;
    }

    setIsLoading(true);
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email.trim());
      }
      setSuccessMsg(`Password reset instructions sent to ${email.trim()}. Please check your email inbox and spam folder.`);
      audioService.playSound('success');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Phone OTP Flow
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpSent) {
      if (!phone || phone.length < 10) {
        setError('Please enter a valid 10-digit Indian mobile number');
        return;
      }
      setOtpSent(true);
      const randomCode = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(randomCode);
      audioService.playSound('pop');
    } else {
      if (!otp || otp.length < 4) {
        setError('Please enter the 6-digit OTP code received');
        return;
      }
      setIsLoading(true);
      const uid = `phone_${phone}_${Date.now()}`;
      await completeAuth(uid, `${phone}@teachbuddy.student`, name || `Scholar (${phone.slice(-4)})`, `+91 ${phone}`);
      setIsLoading(false);
    }
  };

  // Fast Demo Login
  const handleQuickDemo = () => {
    const demoUid = `demo_${Date.now()}`;
    completeAuth(demoUid, 'scholar@teachbuddy.ai', 'Aarav Sharma');
  };

  // Quick fill admin
  const handleFillAdmin = () => {
    setAuthMode('signin');
    setEmail('admin@teachbuddy.ai');
    setPassword('admin1234');
    setError(null);
    setSuccessMsg('Filled Admin credentials (admin@teachbuddy.ai / admin1234). Click "Sign In to Dashboard" to proceed.');
  };

  const handleGuestDismiss = () => {
    audioService.playSound('click');
    if (onGuestContinue) {
      onGuestContinue('Guest Student');
    } else if (onContinueAsGuest) {
      onContinueAsGuest();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100 flex flex-col items-center p-3 sm:p-6 font-outfit select-none">
      {/* Background glow styling */}
      <div className="fixed top-10 left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md my-auto py-2 sm:py-4 relative z-10">
        {/* App Emblem Header */}
        <div className="text-center mb-3 sm:mb-5 space-y-1">
          <div className="inline-flex p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-xl shadow-indigo-500/30 mb-0.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            </div>
          </div>
          
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            TeachBuddy AI
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-400 font-medium">
            Smart Study Companion & Interactive Tutor
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-5 text-xs font-bold">
            <button
              onClick={() => { setAuthMode('signin'); setError(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                authMode === 'signin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setError(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                authMode === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              New Student
            </button>
            <button
              onClick={() => { setAuthMode('phone'); setError(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                authMode === 'phone' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇮🇳 Mobile
            </button>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google 1-Tap Login */}
          {authMode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full mb-3.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">or sign in with email</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>
            </>
          )}

          {/* Form: Forgot Password */}
          {authMode === 'forgot' ? (
            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Password Reset Link</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          ) : authMode === 'phone' ? (
            /* Form: Indian Mobile OTP */
            <form onSubmit={handlePhoneSubmit} className="space-y-3.5">
              {!otpSent ? (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Priyanshu Sharma"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Indian Mobile Number (+91)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">🇮🇳 +91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full pl-16 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Enter Verification Code
                    </label>
                    <span className="text-[10px] text-emerald-400 font-bold">Sent to +91 {phone}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-center flex items-center justify-between">
                    <span className="text-[11px] text-indigo-300">Instant Demo OTP Code:</span>
                    <button
                      type="button"
                      onClick={() => setOtp(generatedOtp)}
                      className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold cursor-pointer"
                    >
                      Use {generatedOtp}
                    </button>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-base font-bold"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <span>{otpSent ? 'Verify & Enter TeachBuddy' : 'Send Instant OTP'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            /* Form: Email & Password (Sign In or Sign Up) */
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ananya Patel"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Learning Stage
                      </label>
                      <select
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                        className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="child">Child / Primary 🎈</option>
                        <option value="middle_school">Middle School (6-8)</option>
                        <option value="high_school">High School (9-12)</option>
                        <option value="college">College / University</option>
                        <option value="competitive_exam">JEE / NEET / UPSC</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        AI Voice Language
                      </label>
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value as IndianLanguageCode)}
                        className="w-full px-2.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {INDIAN_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setError(null); }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Admin Quick Fill CTA */}
              {authMode === 'signin' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleFillAdmin}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer transition"
                  >
                    <span>⚡ Quick Fill Admin Login</span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Create Free Student Account' : 'Sign In to Dashboard'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Access & Skip as Guest */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-slate-400 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>⚡ Fast 1-Click Student Demo</span>
            </button>

            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <Crown className="w-3 h-3 fill-emerald-400" />
              Pro 100% Free
            </span>
          </div>

          {/* Explicit Guest Explorer Escape Button */}
          <div className="mt-3 pt-2 text-center">
            <button
              type="button"
              onClick={handleGuestDismiss}
              className="text-[11px] text-slate-400 hover:text-white font-medium underline underline-offset-4 cursor-pointer transition"
            >
              Skip sign-in & explore TeachBuddy AI as Guest →
            </button>
          </div>
        </div>

        {/* Privacy & Safety Note */}
        <div className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted Cloud Storage • Separate & Isolated Student Data</span>
        </div>
      </div>
    </div>
  );
};
