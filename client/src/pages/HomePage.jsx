import React, { useState } from 'react';
import { TreeScene } from '../components/TreeScene';
import { Apple, Gift, Clock, Sparkles, Tv, ChevronRight, Award, Flame, AlertCircle } from 'lucide-react';
import { sounds } from '../audio';
import confetti from 'canvas-confetti';

export const HomePage = ({
  user,
  tree,
  wallet,
  tickers,
  talkingMessage,
  shakeReady,
  shakeWaitSec,
  onWater,
  onFertilize,
  onShakeOpen,
  onSpinOpen,
  onAdOpen,
  onDailyCheckin,
  onClaim3h,
  onSellFruits,
  onOpenCertificate,
  onOpenLogin,
  onShareTreeOpen,
  setActiveTab,
  lang,
  t
}) => {
  const [sellingFruits, setSellingFruits] = useState(false);

  const handleSell = async () => {
    if (!tree?.fruits_count || tree.fruits_count <= 0) return;
    setSellingFruits(true);
    await onSellFruits(tree.fruits_count);
    setSellingFruits(false);
    sounds.playCoin();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  return (
    <div className="pb-20 max-w-7xl mx-auto space-y-4">
      
      {/* Welcome Google Sign-in Banner (Visible if user not logged in) */}
      {!user && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 sm:p-5 rounded-3xl border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner">🌱</div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-emerald-300">
                {lang === 'hi' ? 'Treeniti ग्रीन रिवॉर्ड्स में आपका स्वागत है' : 'Welcome to Treeniti Green Rewards'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {lang === 'hi' ? 'डिजिटल पेड़ लगाएं, पर्यावरण की रक्षा करें और असली पैसे कमाएं!' : 'Plant digital trees, save the planet & earn real UPI money!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>📱</span>
              <span>{lang === 'hi' ? 'मोबाइल OTP से लॉगिन करें' : 'Login with Mobile OTP'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. सूचना बोर्ड (Live Running Ticker) - Full Width */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-lg overflow-hidden select-none">
        <span className="text-base bg-emerald-500/20 p-1.5 rounded-xl shrink-0">📢</span>
        <div className="flex-1 overflow-hidden">
          <div className="text-xs sm:text-sm font-semibold text-emerald-300 truncate">
            {tickers && tickers.length > 0 ? (
              <span>{lang === 'hi' ? tickers[0].message_hi : tickers[0].message_en}</span>
            ) : (
              <span>{lang === 'hi' ? 'रवि ने आज 2 नए पेड़ लगाए और ₹15 कमाए! 🌱' : 'Ravi planted 2 new trees today! 🌱'}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className="text-xs font-bold text-amber-400 hover:underline flex items-center shrink-0 cursor-pointer"
        >
          <span>{lang === 'hi' ? 'सूचना बोर्ड' : 'Board'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Responsive Grid: On Desktop (lg:) side-by-side, On Mobile stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN (lg:col-span-7 or 8): Interactive Tree Scene & Growth Roadmap */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Virtual Tree Scene */}
          <TreeScene
            tree={tree}
            talkingMessage={talkingMessage}
            onWater={onWater}
            onFertilize={onFertilize}
            onShake={onShakeOpen}
            onShareTree={onShareTreeOpen}
            shakeReady={shakeReady}
            shakeWaitSec={shakeWaitSec}
            lang={lang}
            t={t}
          />

          {/* Tree Growth Stages & Perks Banner */}
          <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 text-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">{lang === 'hi' ? 'पेड़ के 7 स्तर और अनलॉक विशेषताएं' : '7 Tree Growth Stages & Perks'}</span>
              </span>
              <button
                onClick={onOpenCertificate}
                className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{t.certificate}</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 pt-1 text-center">
              {[
                { lvl: 1, name: 'Seed', icon: '🌰' },
                { lvl: 2, name: 'Sprout', icon: '🌱' },
                { lvl: 3, name: 'Plant', icon: '🪴' },
                { lvl: 4, name: 'Growing', icon: '🌿' },
                { lvl: 5, name: 'Young', icon: '🌲' },
                { lvl: 6, name: 'Mature', icon: '🌳' },
                { lvl: 7, name: 'Harvest', icon: '👑' }
              ].map((s) => {
                const isReached = (tree?.level || 1) >= s.lvl;
                const isCurrent = (tree?.level || 1) === s.lvl;
                return (
                  <div
                    key={s.lvl}
                    className={`p-2 rounded-2xl flex flex-col items-center border transition-all ${
                      isCurrent
                        ? 'bg-emerald-500/30 border-emerald-400 font-bold scale-105 shadow-md'
                        : isReached
                        ? 'bg-slate-800/80 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 opacity-40 text-slate-500'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{s.icon}</span>
                    <span className="text-[10px] mt-1 font-bold">L{s.lvl}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-5): Fruit Economy, Quick Earn Cards & Milestones */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Fruit Inventory & Market Card */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 rounded-3xl p-4 sm:p-5 border border-amber-500/30 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-sm">
                🍎
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-200">{t.fruitInventory}:</span>
                  <span className="text-base font-black text-amber-300">{tree?.fruits_count || 0}</span>
                </div>
                <span className="text-xs text-slate-400 block mt-0.5">
                  {lang === 'hi' ? '1 फल = 50 कॉइन्स (₹0.50)' : '1 Fruit = 50 Coins (₹0.50)'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSell}
              disabled={!tree?.fruits_count || tree.fruits_count <= 0 || sellingFruits}
              className={`py-2.5 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md ${
                tree?.fruits_count > 0
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {sellingFruits ? '...' : (lang === 'hi' ? 'फल बेचें 🪙' : 'Sell Fruits 🪙')}
            </button>
          </div>

          {/* Quick Earn Cards (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Daily Streak Check-in */}
            <div
              onClick={onDailyCheckin}
              className="bg-slate-900/90 border border-emerald-500/20 hover:border-emerald-500/40 p-4 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-xs font-bold text-white block">{t.dailyCheckin}</span>
              <span className="text-[11px] text-emerald-400 font-bold mt-0.5">+50 कॉइन्स</span>
            </div>

            {/* 3-Hour Oxygen Claim */}
            <div
              onClick={onClaim3h}
              className="bg-slate-900/90 border border-cyan-500/20 hover:border-cyan-500/40 p-4 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white block">{lang === 'hi' ? '3-घंटे रिवॉर्ड' : '3-Hr Claim'}</span>
              <span className="text-[11px] text-cyan-400 font-bold mt-0.5">+35 कॉइन्स</span>
            </div>

            {/* Lucky Spin Wheel */}
            <div
              onClick={onSpinOpen}
              className="bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/40 p-4 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white block">{lang === 'hi' ? 'लकी स्पिन' : 'Spin Wheel'}</span>
              <span className="text-[11px] text-amber-400 font-bold mt-0.5">Up to 500🪙</span>
            </div>

            {/* Rewarded Video Ad */}
            <div
              onClick={onAdOpen}
              className="bg-slate-900/90 border border-purple-500/20 hover:border-purple-500/40 p-4 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                <Tv className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white block">{lang === 'hi' ? 'वीडियो ऐड' : 'Watch Ad'}</span>
              <span className="text-[11px] text-purple-400 font-bold mt-0.5">+30 कॉइन्स</span>
            </div>

          </div>

          {/* Real Plantation CTA Card */}
          <div
            onClick={() => setActiveTab('plantation')}
            className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-4 sm:p-5 border border-emerald-500/40 shadow-lg cursor-pointer hover:border-emerald-400 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl group-hover:scale-110 transition-transform">📸</span>
                <div>
                  <h4 className="text-sm font-black text-emerald-300">
                    {lang === 'hi' ? 'असली पौधा लगाएं & ₹ कमाएं' : 'Plant Real Tree & Earn'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {lang === 'hi' ? '1, 7, 15, 30 दिन की फोटो अपलोड करें और इनाम पाएं!' : 'Upload Day 1, 7, 15, 30 photos for verified green bonuses!'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
