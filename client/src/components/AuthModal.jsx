import React, { useState } from 'react';
import { X, Phone, KeyRound, ArrowRight, ShieldCheck, Sparkles, UserCheck, Mail } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onLoginSuccess, lang, t }) => {
  const [activeTab, setActiveTab] = useState('phone'); // 'phone' or 'google'
  const [phoneStep, setPhoneStep] = useState('enter_phone'); // 'enter_phone' or 'enter_otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Google Login Handler
  const handleGoogleSignIn = async (emailToUse) => {
    const targetEmail = emailToUse || googleEmail || 'nature.lover@gmail.com';
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
      setPhoneStep('enter_otp');
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
            {lang === 'hi' ? 'Treeniti में लॉगिन करें' : 'Sign in to Treeniti'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'hi' ? 'मोबाइल OTP या Google से तुरंत जुड़ें' : 'Join via Mobile OTP or Google Account'}
          </p>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* METHOD TABS (Mobile OTP vs Google) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800/90 rounded-2xl mb-4 border border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('phone');
              setError('');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'phone'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'मोबाइल OTP' : 'Mobile OTP'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setError('');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-white text-slate-900 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {/* Google G icon */}
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.13C3.25 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.02-3.13z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.61l4.02 3.13c.95-2.84 3.6-4.99 6.72-4.99z"/>
            </svg>
            <span>{lang === 'hi' ? 'Google खाता' : 'Google Login'}</span>
          </button>
        </div>

        {/* TAB 1: MOBILE NUMBER WITH OTP */}
        {activeTab === 'phone' && (
          <div>
            {phoneStep === 'enter_phone' ? (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    {lang === 'hi' ? '10 अंकों का मोबाइल नंबर दर्ज करें' : 'Enter 10-digit Mobile Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
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

                {/* 1-Click Quick Demo Login Shortcuts */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 block text-center uppercase tracking-wider font-semibold">
                    ⚡ {lang === 'hi' ? 'त्वरित डेमो परीक्षण (1-क्लिक)' : 'Quick 1-Click Testing'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => quickLogin('9876543210', '1234')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-emerald-300 text-center cursor-pointer"
                    >
                      👤 {lang === 'hi' ? 'यूज़र डेमो' : 'User Demo'}
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
            ) : (
              /* OTP VERIFICATION VIEW */
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
                  <span>{loading ? (lang === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...') : t.verifyOtp}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPhoneStep('enter_phone')}
                  className="w-full text-center text-xs text-slate-400 hover:text-white cursor-pointer py-1"
                >
                  ← {lang === 'hi' ? 'नंबर बदलें' : 'Change Number'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GOOGLE SIGN-IN */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            {/* 1-Click Google Button */}
            <button
              type="button"
              onClick={() => handleGoogleSignIn('green.guardian@gmail.com')}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.13C3.25 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.02-3.13z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.61l4.02 3.13c.95-2.84 3.6-4.99 6.72-4.99z"/>
              </svg>
              <span>{lang === 'hi' ? 'Google खाते से 1-क्लिक साइन-इन' : '1-Click Sign in with Google'}</span>
            </button>

            {/* Custom Google Email Input option */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold text-center">
                {lang === 'hi' ? 'या अपना Google ईमेल दर्ज करें' : 'Or Enter Custom Google Email'}
              </span>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Google Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                onClick={() => handleGoogleSignIn()}
                disabled={loading || !googleEmail}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  googleEmail
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{loading ? '...' : (lang === 'hi' ? 'इस ईमेल से लॉगिन करें' : 'Login with this Email')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
