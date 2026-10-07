import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../audio';

export const SpinWheelModal = ({ isOpen, onClose, onSpinComplete, lang }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);

  const prizes = [
    { label: '10 🪙', color: '#10b981', coins: 10 },
    { label: '25 🪙', color: '#06b6d4', coins: 25 },
    { label: '50 🪙', color: '#3b82f6', coins: 50 },
    { label: '100 🪙', color: '#8b5cf6', coins: 100 },
    { label: '150 🪙', color: '#ec4899', coins: 150 },
    { label: '500 👑', color: '#f59e0b', coins: 500 }
  ];

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setWonPrize(null);
    sounds.playShakeRustle();

    // Call API spin or simulate target
    const targetIdx = Math.floor(Math.random() * prizes.length);
    const segmentAngle = 360 / prizes.length;
    // Align wheel so target segment stops under pointer (at top: 270 deg or 0 deg offset)
    const extraRounds = 5 * 360;
    const prizeAngle = 360 - (targetIdx * segmentAngle + segmentAngle / 2);
    const finalRotation = rotation + extraRounds + prizeAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      const prize = prizes[targetIdx];
      setWonPrize(prize);
      sounds.playLevelUp();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      if (onSpinComplete) {
        onSpinComplete(prize.coins);
      }
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 rounded-3xl border border-emerald-500/40 p-6 shadow-2xl text-center text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-extrabold text-amber-300 mb-1 flex items-center justify-center gap-2">
          <span>🛞</span>
          <span>{lang === 'hi' ? 'लकी स्पिन व्हील' : 'Lucky Spin Wheel'}</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          {lang === 'hi' ? 'व्हील घुमाएं और मुफ्त कॉइन्स जीतें!' : 'Spin the wheel & win free green coins!'}
        </p>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 mx-auto my-2 flex items-center justify-center">
          {/* Top Pointer */}
          <div className="absolute -top-3 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 filter drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />

          {/* Rotating Wheel */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-2xl overflow-hidden relative transition-transform duration-[4000ms] ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {prizes.map((p, idx) => {
              const rotate = idx * 60;
              return (
                <div
                  key={idx}
                  className="absolute w-1/2 h-1/2 top-0 right-0 origin-bottom-left flex items-center justify-center"
                  style={{
                    backgroundColor: p.color,
                    transform: `rotate(${rotate}deg) skewY(30deg)`
                  }}
                >
                  <span
                    className="text-xs font-black text-white absolute transform -rotate-45"
                    style={{ left: '40%', top: '35%' }}
                  >
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Center Hub */}
          <div className="absolute z-20 w-14 h-14 rounded-full bg-slate-900 border-4 border-amber-400 flex items-center justify-center shadow-lg">
            <span className="text-lg">🌿</span>
          </div>
        </div>

        {/* Won Prize announcement */}
        {wonPrize && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm animate-bounce">
            🎉 {lang === 'hi' ? 'बधाई! आपने जीते:' : 'Congratulations! You won:'} +{wonPrize.coins} कॉइन्स!
          </div>
        )}

        {/* Spin Action Button */}
        <button
          onClick={handleSpin}
          disabled={spinning}
          className={`mt-4 w-full py-3.5 rounded-2xl font-black text-base shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
            spinning
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>{spinning ? (lang === 'hi' ? 'घूम रहा है...' : 'Spinning...') : (lang === 'hi' ? 'स्पिन करें 🛞' : 'SPIN NOW 🛞')}</span>
        </button>
      </div>
    </div>
  );
};
