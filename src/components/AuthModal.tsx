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
  AlertCircle
} from 'lucide-react';
import type { UserProfile } from '../types';
import { audioService } from '../services/audioService';

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
  const [authTab, setAuthTab] = useState<'google' | 'phone' | 'admin'>('google');

  // Google flow state
  const [studentName, setStudentName] = useState(user.name || 'Alex Student');
  const [studentEmail, setStudentEmail] = useState(user.email || 'student@example.com');
  const [institution, setInstitution] = useState(user.institution || 'School');

  // Phone flow state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Admin flow state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  if (!isOpen) return null;

  // Google sign in
  const handleGoogleSignIn = () => {
    audioService.playSound('success');
    onLoginSuccess({
      name: studentName.trim() || 'Student Scholar',
      email: studentEmail.trim() || 'student@gmail.com',
      institution: institution as any,
      role: 'student',
    });
    onClose();
  };

  // Phone OTP Flow
  const handleSendOtp = () => {
    if (phoneNumber.length < 8) {
      alert('Please enter a valid phone number');
      return;
    }
    setOtpSent(true);
    setOtpCode('742819'); // Simulated instant OTP
    audioService.playSound('click');
  };

  const handleVerifyOtp = () => {
    audioService.playSound('success');
    onLoginSuccess({
      name: `Student (${phoneNumber.slice(-4)})`,
      phone: phoneNumber,
      email: `phone_${phoneNumber}@teachbuddy.ai`,
      role: 'student',
    });
    onClose();
  };

  // Dedicated Admin Login Check
  // Admin credentials explicitly specified by user:
  // email: anuragsinghparmar95@gmail.com
  // password: 963852741
  const handleAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const targetEmail = 'anuragsinghparmar95@gmail.com';
    const targetPassword = '963852741';

    if (
      adminEmail.trim().toLowerCase() === targetEmail.toLowerCase() &&
      adminPassword.trim() === targetPassword
    ) {
      audioService.playSound('levelup');
      onLoginSuccess(
        {
          name: 'Anurag Singh Parmar (Admin)',
          email: targetEmail,
          role: 'admin',
          isPremium: true,
        },
        true // opens admin panel
      );
      onClose();
    } else {
      setAdminError('Invalid credentials! Admin login requires email: anuragsinghparmar95@gmail.com and the authorized admin password.');
      audioService.playSound('click');
    }
  };

  const handleQuickFillAdmin = () => {
    setAdminEmail('anuragsinghparmar95@gmail.com');
    setAdminPassword('963852741');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Modal Top */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="TeachBuddy AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sign In to TeachBuddy AI</h2>
              <p className="text-[11px] text-slate-400">Save notes, track progress & sync schedules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 p-2 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-center">
          <button
            onClick={() => setAuthTab('google')}
            className={`py-2 rounded-xl transition ${
              authTab === 'google'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Google
          </button>
          <button
            onClick={() => setAuthTab('phone')}
            className={`py-2 rounded-xl transition ${
              authTab === 'phone'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Phone No.
          </button>
          <button
            onClick={() => setAuthTab('admin')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              authTab === 'admin'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* TAB 1: GOOGLE SIGN IN */}
          {authTab === 'google' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Institution / Education Stage
                  </label>
                  <select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="School">School / K-12</option>
                    <option value="High School">High School (Grades 9-12)</option>
                    <option value="College / University">College / University</option>
                    <option value="Coaching / Institute">Coaching / Competitive Exams</option>
                    <option value="Self Learner">Self / Lifelong Learner</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full py-3 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-100 transition flex items-center justify-center gap-2 shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* TAB 2: PHONE NUMBER */}
          {authTab === 'phone' && (
            <div className="space-y-4 text-xs">
              {!otpSent ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <span className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9876543210"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendOtp}
                    className="w-full py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    SMS code sent to +91 {phoneNumber}. Enter 6-digit OTP below:
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 742819"
                      maxLength={6}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Log In</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADMIN LOGIN */}
          {authTab === 'admin' && (
            <form onSubmit={handleAdminSignIn} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
                <div>
                  <span className="font-bold block">Administrator Access Portal</span>
                  Admin credentials allow customizing app features, system fonts, pricing, and system announcements.
                </div>
              </div>

              {adminError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="anuragsinghparmar95@gmail.com"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="•••••••••"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline font-semibold"
                >
                  Fill Admin Credentials
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In as Admin</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
