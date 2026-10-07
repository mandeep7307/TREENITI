import React, { useState } from 'react';
import { X, Phone, KeyRound, ArrowRight, ShieldCheck, Sparkles, UserCheck, Mail } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onLoginSuccess, lang, t }) => {
  const [step, setStep] = useState('main'); // 'main' (Google + Phone) or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Google Login Handler
  const handleGoogleSignIn = async (emailToUse) => {
    const targetEmail = emailToUse || customGoogleEmail || 'user.nature@gmail.com';
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split('@')[0].replace('.', ' '),
          avatar: '🌱',
          referralCode: referralCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');

      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send Mobile OTP
  const handleSendOtp = async (inputPhone) => {
    const targetPhone = inputPhone || phone;
    if (!targetPhone || targetPhone.length < 10) {
      setError(lang === 'hi' ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setDemoCode(data.demoCode);
      setOtp(data.demoCode); // prefill for testing convenience
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify Mobile OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      setError(lang === 'hi' ? 'कृपया OTP दर्ज करें' : 'Please enter OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp, referralCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');

      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins
  const quickLogin = (presetPhone, presetCode) => {
    setPhone(presetPhone);
    setOtp(presetCode);
    handleSendOtp(presetPhone);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-emerald-500/40 p-6 shadow-2xl text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center text-2xl shadow-lg mb-2">
            🌱
          </div>
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            {lang === 'hi' ? 'लॉगिन / साइन-अप' : 'Sign in / Sign up'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'hi' ? 'Treeniti ग्रीन रिवॉर्ड्स प्लेटफ़ॉर्म' : 'Treeniti Green Rewards Platform'}
          </p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* MAIN VIEW: GOOGLE + MOBILE OTP BOTH VISIBLE */}
        {step === 'main' && (
          <div className="space-y-4">
            
            {/* 1. GOOGLE SIGN-IN BUTTON (TOP & PROMINENT) */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleSignIn('green.user@gmail.com')}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-extrabold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-slate-200"
              >
                {/* Official Google SVG Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.13C3.25 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.02-3.13z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.61l4.02 3.13c.95-2.84 3.6-4.99 6.72-4.99z"/>
                </svg>
                <span>{lang === 'hi' ? 'Sign up with Google (गूगल से लॉगिन)' : 'Sign up with Google'}</span>
              </button>

              {/* Optional Custom Gmail Toggle */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowCustomGoogle(!showCustomGoogle)}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  {showCustomGoogle
                    ? (lang === 'hi' ? 'छिपाएं' : 'Hide')
                    : (lang === 'hi' ? 'अन्य Google ईमेल दर्ज करना चाहते हैं? यहाँ क्लिक करें' : 'Want to enter custom Google email? Click here')}
                </button>
              </div>

              {showCustomGoogle && (
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn(customGoogleEmail)}
                    disabled={loading || !customGoogleEmail}
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    {lang === 'hi' ? 'इस ईमेल से Google लॉगिन करें' : 'Login with this Google Email'}
                  </button>
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                {lang === 'hi' ? 'या मोबाइल OTP से' : 'OR WITH MOBILE OTP'}
              </span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            {/* 2. MOBILE NUMBER & OTP SECTION */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  {lang === 'hi' ? 'रेफरल कोड (वैकल्पिक)' : 'Referral Code (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="TREE123456"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs uppercase font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>{loading ? (lang === 'hi' ? 'OTP भेजा जा रहा है...' : 'Sending...') : t.sendOtp}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Credentials */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 block text-center uppercase tracking-wider font-semibold">
                  ⚡ {lang === 'hi' ? 'त्वरित 1-क्लिक परीक्षण' : 'Quick 1-Click Testing'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => quickLogin('9876543210', '1234')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-emerald-300 text-center cursor-pointer"
                  >
                    👤 {lang === 'hi' ? 'यूज़र लॉगिन' : 'User Demo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin('9999999999', '9999')}
                    className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold text-amber-300 text-center cursor-pointer"
                  >
                    👑 {lang === 'hi' ? 'सुपर एडमिन' : 'Admin Demo'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs text-slate-300 block">
                {lang === 'hi' ? 'OTP भेजा गया:' : 'OTP sent to:'} <strong className="text-white font-mono">{phone}</strong>
              </span>
              {demoCode && (
                <div className="mt-1 text-xs text-amber-400 font-bold">
                  {t.demoOtpHint} <span className="bg-amber-400/20 px-2 py-0.5 rounded font-mono text-sm">{demoCode}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                {t.enterOtp}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="1234"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-base tracking-widest font-mono text-center text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? (lang === 'hi' ? 'जाँच हो रही है...' : 'Verifying...') : t.verifyOtp}</span>
            </button>

            <button
              type="button"
              onClick={() => setStep('main')}
              className="w-full text-center text-xs text-slate-400 hover:text-white cursor-pointer py-1"
            >
              ← {lang === 'hi' ? 'नंबर बदलें' : 'Change Number'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
