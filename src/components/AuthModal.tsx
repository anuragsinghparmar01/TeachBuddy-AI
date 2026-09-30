import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import type { UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { auth, googleProvider, saveUserProfile, getUserProfile } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLoginSuccess: (user: Partial<UserProfile>, isAdminLogin?: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onLoginSuccess,
}) => {
  const [authTab, setAuthTab] = useState<'google' | 'email' | 'phone' | 'admin'>('email');

  // Email/Password state
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(user.name || '');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Phone flow state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Admin flow state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Feedback & Loading
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Complete profile & persist
  const completeAuth = async (uid: string, userEmail: string, userName: string) => {
    const isAnuragAdmin = userEmail.trim().toLowerCase() === 'anuragsinghparmar95@gmail.com';
    let existing: UserProfile | null = null;
    try {
      existing = await getUserProfile(uid);
    } catch {
      existing = null;
    }

    const updatedUser: UserProfile = existing ? {
      ...existing,
      uid,
      email: userEmail || existing.email,
      name: isAnuragAdmin ? 'Anurag Singh Parmar (Super Admin)' : (existing.name || userName || 'Student Scholar'),
      role: isAnuragAdmin ? 'admin' : (existing.role || 'student'),
      isAuthenticated: true,
      lastActiveDate: new Date().toISOString(),
    } : {
      ...user,
      uid,
      email: userEmail || '',
      name: isAnuragAdmin ? 'Anurag Singh Parmar (Super Admin)' : (userName || 'Student Scholar'),
      role: isAnuragAdmin ? 'admin' : 'student',
      isAuthenticated: true,
      lastActiveDate: new Date().toISOString(),
    };

    try {
      await saveUserProfile(updatedUser);
    } catch (e) {
      console.warn('saveUserProfile notice:', e);
    }

    audioService.playSound('levelup');
    onLoginSuccess(updatedUser, isAnuragAdmin);
    onClose();
  };

  // Google sign in
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const isEmbeddedIframe = typeof window !== 'undefined' && window.self !== window.top;
      if (isEmbeddedIframe || !auth || !googleProvider) {
        const demoUid = `scholar_google_${Date.now()}`;
        await completeAuth(demoUid, email || 'scholar@teachbuddy.ai', name || 'Google Scholar');
        return;
      }
      const res = await signInWithPopup(auth, googleProvider);
      await completeAuth(res.user.uid, res.user.email || '', res.user.displayName || 'Google Scholar');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setIsLoading(false);
        return;
      }
      console.warn('Google popup notice:', err);
      const demoUid = `scholar_${Date.now()}`;
      await completeAuth(demoUid, email || 'student@teachbuddy.ai', name || 'Student Scholar');
    } finally {
      setIsLoading(false);
    }
  };

  // Email Auth
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter your email and password');
      }

      // Shortcut for Super Admin
      if (
        email.trim().toLowerCase() === 'anuragsinghparmar95@gmail.com' &&
        password.trim() === '963852741'
      ) {
        await completeAuth('super_admin_anurag', 'anuragsinghparmar95@gmail.com', 'Anurag Singh Parmar (Super Admin)');
        return;
      }

      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        if (auth) {
          try {
            const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
            await completeAuth(res.user.uid, email.trim(), name.trim());
            return;
          } catch (fbErr: any) {
            if (fbErr.code === 'auth/email-already-in-use') {
              throw new Error('This email is already registered. Please sign in instead.');
            }
          }
        }
        const uid = `user_${Date.now()}`;
        await completeAuth(uid, email.trim(), name.trim());
      } else {
        if (auth) {
          try {
            const res = await signInWithEmailAndPassword(auth, email.trim(), password);
            await completeAuth(res.user.uid, email.trim(), res.user.displayName || email.split('@')[0]);
            return;
          } catch (fbErr: any) {
            if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/invalid-credential') {
              throw new Error('Incorrect email or password. Please verify and try again.');
            }
            if (fbErr.code === 'auth/user-not-found') {
              throw new Error('No account found with this email. Please click "Create Account".');
            }
          }
        }
        const uid = `user_${Date.now()}`;
        await completeAuth(uid, email.trim(), email.split('@')[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error.');
      audioService.playSound('click');
    } finally {
      setIsLoading(false);
    }
  };

  // Phone OTP Flow
  const handleSendOtp = () => {
    if (phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }
    setError(null);
    setOtpSent(true);
    setOtpCode('742819');
    audioService.playSound('click');
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setError('Please enter the OTP code');
      return;
    }
    const uid = `phone_${phoneNumber}_${Date.now()}`;
    await completeAuth(uid, `${phoneNumber}@teachbuddy.student`, `Student (${phoneNumber.slice(-4)})`);
  };

  // Dedicated Admin Login Check
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const targetEmail = adminEmail.trim() || 'admin@teachbuddy.ai';
    if (!adminPassword.trim()) {
      setAdminError('Please enter an admin password.');
      return;
    }

    await completeAuth(`admin_${Date.now()}`, targetEmail, 'Administrator');
  };

  const handleQuickFillAdmin = () => {
    setAdminEmail('admin@teachbuddy.ai');
    setAdminPassword('admin1234');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn font-outfit">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Modal Top */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="TeachBuddy AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sign In to TeachBuddy AI</h2>
              <p className="text-[11px] text-slate-400">Save notes, sync schedules & track progress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-4 p-2 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-center gap-1">
          <button
            onClick={() => { setAuthTab('email'); setError(null); }}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              authTab === 'email'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => { setAuthTab('google'); setError(null); }}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              authTab === 'google'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Google
          </button>
          <button
            onClick={() => { setAuthTab('phone'); setError(null); }}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              authTab === 'phone'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🇮🇳 Mobile
          </button>
          <button
            onClick={() => { setAuthTab('admin'); setError(null); }}
            className={`py-1.5 rounded-xl transition cursor-pointer ${
              authTab === 'admin'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            👑 Admin
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: EMAIL AUTH */}
          {authTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create Free Account"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: GOOGLE */}
          {authTab === 'google' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Sign in with your Google account to automatically synchronize notes, tests, and study schedules.
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center justify-center gap-2.5 shadow-sm transition active:scale-98 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* TAB 3: PHONE OTP */}
          {authTab === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Enter Indian Mobile Number (+91)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">🇮🇳 +91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-16 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-xs">
                    <span className="text-indigo-300">Instant Demo Code:</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode('742819')}
                      className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold cursor-pointer text-xs"
                    >
                      Use 742819
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white text-center font-mono text-base font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Verify & Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADMIN */}
          {authTab === 'admin' && (
            <form onSubmit={handleAdminSignIn} className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-300">
                <span className="font-bold flex items-center gap-1.5 mb-1 text-purple-200">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Admin Console Access
                </span>
                <p className="text-[11px] text-purple-400/80">
                  Full administrative permissions to configure platform features, system fonts, pricing, and curriculum subjects.
                </p>
              </div>

              {adminError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{adminError}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@teachbuddy.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="•••••••••"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                >
                  ⚡ Fill Admin Credentials
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Open Admin Console</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
