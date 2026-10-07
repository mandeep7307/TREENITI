import React, { useState, useEffect } from 'react';
import { X, Play, Award, CheckCircle } from 'lucide-react';
import { sounds } from '../audio';

export const AdBannerModal = ({ isOpen, onClose, onRewardClaimed, lang }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let timer;
    if (isOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && timeLeft === 0) {
      setIsCompleted(true);
      sounds.playCoin();
    }
    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(15);
      setIsCompleted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    if (onRewardClaimed) {
      onRewardClaimed(30);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-emerald-500/40 p-5 shadow-2xl text-center text-white overflow-hidden">
        
        {/* Top Header */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {lang === 'hi' ? 'प्रायोजित विज्ञापन (Rewarded Ad)' : 'Sponsored Video Ad'}
          </span>
          <div className="text-xs font-mono font-bold text-slate-400">
            {!isCompleted ? `${timeLeft}s` : 'Reward Ready!'}
          </div>
        </div>

        {/* Video Screen Simulation */}
        <div className="relative h-48 w-full rounded-2xl bg-gradient-to-tr from-emerald-950 via-teal-900 to-slate-900 border border-emerald-500/30 flex flex-col items-center justify-center overflow-hidden p-4">
          <div className="text-4xl animate-pulse mb-2">🌿</div>
          <h3 className="text-base font-black text-emerald-300">
            EcoGreen Solar & Forestry
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            "Switch to 100% clean solar energy & save both money and trees!"
          </p>
          <div className="mt-3 px-3 py-1 bg-white/10 rounded-full text-[11px] text-emerald-200">
            ★ Sponsor Partner of Treeniti ★
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 w-full bg-slate-800 h-1.5">
            <div
              className="h-full bg-emerald-400 transition-all duration-1000"
              style={{ width: `${((15 - timeLeft) / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          {isCompleted ? (
            <button
              onClick={handleClaim}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-base shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{lang === 'hi' ? '+30 कॉइन प्राप्त करें' : 'Claim +30 Coins'}</span>
            </button>
          ) : (
            <div className="py-3 px-4 rounded-2xl bg-slate-800/80 text-slate-400 text-xs font-semibold border border-slate-700">
              {lang === 'hi' ? `रिवॉर्ड अनलॉक होने में ${timeLeft} सेकंड बाकी हैं...` : `Please wait ${timeLeft}s to unlock reward...`}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
