import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  PhoneCall, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Award, 
  Headphones,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile, AdminSettings } from '../types';
import { audioService } from '../services/audioService';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  adminSettings: AdminSettings;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  user,
  adminSettings,
  onUpdateUser,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  if (!isOpen) return null;

  const basePrice = adminSettings?.premiumPriceMonthly || 499;
  const finalPrice = discountApplied > 0 ? Math.round(basePrice * (1 - discountApplied / 100)) : basePrice;

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'BUDDY50') {
      setDiscountApplied(50);
      audioService.playSound('success');
    } else if (promoCode.trim().toUpperCase() === 'TECH100' || promoCode.trim().toUpperCase() === 'STUDENT') {
      setDiscountApplied(100);
      audioService.playSound('success');
    } else {
      alert('Invalid promo code. Try "BUDDY50" for 50% off or "STUDENT" for 100% scholarship trial!');
    }
  };

  const handleSubscribe = () => {
    setIsProcessing(true);
    audioService.playSound('click');

    setTimeout(() => {
      setIsProcessing(false);
      setActivatedSuccess(true);
      onUpdateUser({
        isPremium: true,
        premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
      audioService.playSound('levelup');

      setTimeout(() => {
        setActivatedSuccess(false);
        onClose();
      }, 2000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Glow Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-600/30 via-orange-600/20 to-slate-900 border-b border-amber-500/20 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 mb-3">
            <Crown className="w-8 h-8 fill-slate-950" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block">
            TeachBuddy AI Premium
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Learn Like Talking to a Real Friend
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1.5">
            Unlimited in-depth AI work, interactive voice calls (Male & Female voices), and advanced step-by-step guidance.
          </p>

          {/* Pricing Highlight */}
          <div className="mt-4 inline-flex items-baseline gap-1.5 bg-black/40 px-4 py-2 rounded-2xl border border-amber-400/30">
            <span className="text-3xl font-black text-amber-400 font-mono">
              ₹{finalPrice}
            </span>
            <span className="text-xs text-slate-400">/ month</span>
            {discountApplied > 0 && (
              <span className="text-xs text-emerald-400 font-bold ml-2">
                ({discountApplied}% OFF Applied)
              </span>
            )}
          </div>
        </div>

        {/* Feature List */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { title: "Real Voice Phone Call Buddy", desc: "Male & Female AI voice options with human-like warmth" },
              { title: "Deep Problem Solving", desc: "Multi-tier breakdown for hard STEM & competitive exam problems" },
              { title: "Unlimited Topic Quizzes", desc: "No daily limit on quizzes, flashcards & active recall drills" },
              { title: "Personalized Exam Roadmaps", desc: "Adaptive timetables tuned to your actual exam date" },
              { title: "Ad-Free & Priority AI Speed", desc: "Sub-second responses with maximum pedagogy depth" },
              { title: "Parent & Child Safe Mode", desc: "Curated learning environments for students of any age" },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-start gap-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{feat.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code Input */}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder='Try promo code: "BUDDY50" or "STUDENT"'
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 placeholder-slate-500 font-mono"
            />
            <button
              onClick={handleApplyPromo}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
            >
              Apply
            </button>
          </div>

          {/* Activation Button */}
          <button
            onClick={handleSubscribe}
            disabled={isProcessing || user.isPremium}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
              user.isPremium
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-amber-500/20'
            }`}
          >
            {activatedSuccess ? (
              <>
                <Check className="w-5 h-5" />
                <span>Premium Activated! Welcome!</span>
              </>
            ) : user.isPremium ? (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>You are already a PRO Member!</span>
              </>
            ) : isProcessing ? (
              <span>Securing Instant Access...</span>
            ) : (
              <>
                <span>Unlock TeachBuddy Premium for ₹{finalPrice}/mo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Cancel anytime with 1-click. No hidden fees. Instant activation.
          </p>
        </div>
      </div>
    </div>
  );
};
