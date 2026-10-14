import React, { useState } from 'react';
import { X, Phone, KeyRound, ArrowRight, ShieldCheck, Sparkles, UserCheck, Mail, Smartphone } from 'lucide-react';
import { sendFirebaseOtp, verifyFirebaseOtp } from '../firebase';

export const AuthModal = ({ isOpen, onClose, onLoginSuccess, lang, t }) => {
  const [step, setStep] = useState('main'); // 'main' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [useRealSms, setUseRealSms] = useState(false); // Toggle between Firebase Real SMS and Fast Local/Demo Mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Send Mobile OTP (Supports Google Firebase Real SMS + Instant Demo)
  const handleSendOtp = async (inputPhone, forceLocal = false) => {
    const targetPhone = inputPhone || phone;
    if (!targetPhone || targetPhone.length < 10) {
      setError(lang === 'hi' ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    // If Real SMS mode is enabled and not a quick demo click
    if (useRealSms && !forceLocal && targetPhone !== '9999999999') {
      try {
        const fullPhone = targetPhone.startsWith('+') ? targetPhone : `+91${targetPhone}`;
        await sendFirebaseOtp(fullPhone);
        setDemoCode('');
        setOtp('');
        setStep('otp');
      } catch (firebaseErr) {
        console.error('Firebase Real SMS Error:', firebaseErr);
        setError(firebaseErr.message?.includes('api-key-not-valid')
          ? (lang === 'hi'
              ? 'Firebase API Key सेट नहीं है। कृपया client/src/firebase.js में अपनी कीज़ डालें या टेस्ट मोड चालू रखें।'
              : 'Firebase API key is not configured yet in client/src/firebase.js. Please use test mode or enter your keys.')
          : firebaseErr.message || 'Failed to send Real SMS via Firebase');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Default Fast Mode
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

    // If Real SMS Firebase Verification
    if (useRealSms && phone !== '9999999999' && !demoCode) {
      try {
        const firebaseUser = await verifyFirebaseOtp(otp);
        // Inform backend about successful phone authentication
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            code: otp,
            referralCode,
            firebaseVerified: true,
            firebaseUid: firebaseUser?.uid
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login synchronization failed');

        onLoginSuccess(data);
        onClose();
        return;
      } catch (err) {
        setError(err.message || 'Invalid Firebase Real SMS OTP code');
        setLoading(false);
        return;
      }
    }

    // Default Local Verification
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
    handleSendOtp(presetPhone, true);
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

        {/* MAIN VIEW: MOBILE OTP LOGIN */}
        {step === 'main' && (
          <div className="space-y-4">

            {/* 2. MOBILE NUMBER & OTP SECTION */}
            <div className="space-y-3">
              {/* Invisible Google reCAPTCHA Anchor for Firebase */}
              <div id="recaptcha-container"></div>

              {/* Free Real SMS Toggle */}
              <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Smartphone className={`w-4 h-4 ${useRealSms ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-bold text-white block">
                      {lang === 'hi' ? 'वास्तविक SMS OTP (Real SMS)' : 'Real SMS OTP Mode'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {useRealSms ? (lang === 'hi' ? 'फोन पर असली SMS आएगा' : 'Sends real SMS to phone') : (lang === 'hi' ? 'फास्ट डेमो मोड सक्रिय' : 'Instant testing mode active')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseRealSms(!useRealSms)}
                  className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    useRealSms ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {useRealSms ? 'ON' : 'OFF'}
                </button>
              </div>

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
