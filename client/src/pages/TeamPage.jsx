import React, { useState, useEffect } from 'react';
import { Users, Copy, Share2, Check, Award, ArrowRight, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

export const TeamPage = ({ user, lang, t }) => {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('l1'); // 'l1' or 'l2'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralStats();
    }
  }, [user]);

  const fetchReferralStats = async () => {
    try {
      const res = await fetch(`/api/referral/stats/${user.id}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {}
  };

  const refCode = stats?.referralCode || user?.referral_code || 'TREE1234';
  const inviteUrl = `${window.location.origin}?ref=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = lang === 'hi'
      ? `🌳 Treeniti से जुड़ें और अपना डिजिटल पेड़ लगाकर असली पैसे कमाएं! मेरा रेफरल कोड: ${refCode} लगाएं और तुरंत ₹5 + 150 कॉइन्स पाएं! डाउनलोड/जॉइन करें: ${inviteUrl}`
      : `🌳 Join Treeniti, plant digital trees and earn real money! Use my referral code: ${refCode} to get ₹5 + 150 coins bonus! Join here: ${inviteUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto">
      
      {/* Referral Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-4 sm:p-5 border border-emerald-500/30 text-white shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-2xl shadow-lg">
            👥
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300">
              {lang === 'hi' ? 'मेरी टीम & रेफरल नेटवर्क' : 'My Team & Referral MLM'}
            </h1>
            <p className="text-xs text-slate-300">
              {lang === 'hi' ? 'प्रति दोस्त ₹21 रिवॉर्ड + लाइफटाइम 5% और 2% कमीशन!' : 'Earn ₹21 per friend + 5% & 2% Lifetime Commission!'}
            </p>
          </div>
        </div>

        {/* Share Code Card */}
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-emerald-500/30 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              {t.shareCode}
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-300 tracking-wider">
              {refCode}
            </span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer border border-slate-700 active:scale-95 flex items-center gap-1 text-xs font-semibold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-3 gap-2 text-center text-white">
        <div className="bg-slate-900 rounded-2xl p-3 border border-emerald-500/20 shadow-md">
          <span className="text-[10px] text-slate-400 block">{lang === 'hi' ? 'कुल रेफरल आय' : 'Referral Earned'}</span>
          <span className="text-base font-black text-emerald-400">₹{(stats?.totalEarningsInr || 0).toFixed(1)}</span>
        </div>
        <div className="bg-slate-900 rounded-2xl p-3 border border-cyan-500/20 shadow-md">
          <span className="text-[10px] text-slate-400 block">{lang === 'hi' ? 'लेवल 1 (Direct)' : 'Level 1'}</span>
          <span className="text-base font-black text-cyan-400">{stats?.l1Count || 0}</span>
        </div>
        <div className="bg-slate-900 rounded-2xl p-3 border border-amber-500/20 shadow-md">
          <span className="text-[10px] text-slate-400 block">{lang === 'hi' ? 'लेवल 2 (Indirect)' : 'Level 2'}</span>
          <span className="text-base font-black text-amber-400">{stats?.l2Count || 0}</span>
        </div>
      </div>

      {/* Multi-Level Earning Rules Breakdown */}
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 text-white space-y-3">
        <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>{lang === 'hi' ? 'रेफरल रिवॉर्ड अनलॉक शर्तें (कुल ₹21)' : 'Reward Unlock Conditions (Total ₹21)'}</span>
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-emerald-400 font-extrabold text-sm block">₹5</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">{lang === 'hi' ? 'दोस्त लॉगिन' : 'Friend Login'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-emerald-400 font-extrabold text-sm block">₹6</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">{lang === 'hi' ? '3 दिन सक्रिय' : '3 Days Active'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-emerald-400 font-extrabold text-sm block">₹10</span>
            <span className="text-[10px] text-slate-300 block mt-0.5">{lang === 'hi' ? '7 दिन सक्रिय' : '7 Days Active'}</span>
          </div>
        </div>

        {/* Multi-level Commission Explanation (A - B - C) */}
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1.5">
          <span className="font-bold text-emerald-300 block">
            🌳 {lang === 'hi' ? 'लाइफटाइम मल्टी-लेवल कमीशन (A – B – C):' : 'Multi-Level Lifetime Commission (A - B - C):'}
          </span>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {lang === 'hi'
              ? 'A ने रेफर किया B को, B ने रेफर किया C को: A को B की हर कमाई का 5% और C की कमाई का 2% लाइफटाइम सीधे वॉलेट में मिलेगा!'
              : 'When you refer B, and B refers C: You get 5% of B\'s earnings and 2% of C\'s earnings for lifetime directly into your wallet!'}
          </p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 text-white space-y-3">
        <div className="flex border-b border-slate-800 pb-2 gap-4">
          <button
            onClick={() => setActiveTab('l1')}
            className={`text-xs font-bold pb-1 transition-all cursor-pointer ${
              activeTab === 'l1'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.level1Team} ({stats?.l1Count || 0})
          </button>
          <button
            onClick={() => setActiveTab('l2')}
            className={`text-xs font-bold pb-1 transition-all cursor-pointer ${
              activeTab === 'l2'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.level2Team} ({stats?.l2Count || 0})
          </button>
        </div>

        <div className="space-y-2">
          {activeTab === 'l1' && (
            stats?.l1Users && stats.l1Users.length > 0 ? (
              stats.l1Users.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{m.name}</span>
                    <span className="text-[10px] text-slate-400">📞 ••••••{m.phone?.slice(-4)} | Level {m.tree_level || 1} Tree</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold block">{m.coins || 0} 🪙</span>
                    <span className="text-[10px] text-slate-500">5% Passive</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                {lang === 'hi' ? 'अभी तक कोई डायरेक्ट मेंबर नहीं है। अपना कोड शेयर करें!' : 'No direct members yet. Share your referral code!'}
              </div>
            )
          )}

          {activeTab === 'l2' && (
            stats?.l2Users && stats.l2Users.length > 0 ? (
              stats.l2Users.map((m) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{m.name}</span>
                    <span className="text-[10px] text-slate-400">📞 ••••••{m.phone?.slice(-4)} | Level {m.tree_level || 1} Tree</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold block">{m.coins || 0} 🪙</span>
                    <span className="text-[10px] text-slate-500">2% Passive</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                {lang === 'hi' ? 'लेवल 2 में अभी कोई सदस्य नहीं है।' : 'No Level 2 members yet.'}
              </div>
            )
          )}
        </div>
      </div>

    </div>
  );
};
