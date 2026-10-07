import React, { useState, useEffect } from 'react';
import { X, Apple, Wind, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../audio';

export const ShakeGameModal = ({ isOpen, onClose, onComplete, lang }) => {
  const [gameState, setGameState] = useState('ready'); // 'ready', 'playing', 'finished'
  const [timeLeft, setTimeLeft] = useState(10);
  const [shakeCount, setShakeCount] = useState(0);
  const [fallingFruits, setFallingFruits] = useState([]);
  const [collectedFruits, setCollectedFruits] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setGameState('ready');
      setTimeLeft(10);
      setShakeCount(0);
      setFallingFruits([]);
      setCollectedFruits(0);
    }
  }, [isOpen]);

  // Game timer
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      finishGame();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Start game
  const startGame = () => {
    setGameState('playing');
    setTimeLeft(10);
    setShakeCount(0);
    setCollectedFruits(0);
    setFallingFruits([]);
    sounds.playShakeRustle();
  };

  // Shake tree action
  const handleShakeTap = () => {
    if (gameState !== 'playing') return;

    sounds.playShakeRustle();
    setShakeCount((prev) => prev + 1);

    // Spawn falling fruits
    const newFruit = {
      id: Date.now() + Math.random(),
      left: Math.floor(Math.random() * 70) + 15, // 15% to 85%
      type: Math.random() > 0.4 ? '🍎' : '🍏'
    };
    setFallingFruits((prev) => [...prev, newFruit]);
  };

  // Catch fruit
  const handleCatchFruit = (fruitId) => {
    sounds.playFruitDrop();
    setCollectedFruits((prev) => prev + 1);
    setFallingFruits((prev) => prev.filter((f) => f.id !== fruitId));
  };

  // Finish Game
  const finishGame = async () => {
    setGameState('finished');
    sounds.playLevelUp();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (onComplete) {
      onComplete(Math.max(2, collectedFruits));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 rounded-3xl border border-emerald-500/40 p-6 shadow-2xl overflow-hidden text-center text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wind className="w-6 h-6 text-amber-400 animate-spin" />
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-emerald-400">
            {lang === 'hi' ? 'पेड़ हिलाओ (Shake Tree Game)' : 'Shake Tree Mini-Game'}
          </h2>
        </div>

        {/* READY STATE */}
        {gameState === 'ready' && (
          <div className="py-6 space-y-4">
            <div className="text-7xl animate-bounce">🌳</div>
            <p className="text-sm text-slate-300 px-4 leading-relaxed">
              {lang === 'hi'
                ? 'नियम: आपके पास 10 सेकंड हैं! शेक बटन दबाएं, पेड़ हिलेगा और ताज़े फल गिरेंगे। गिरते हुए फलों पर तुरंत टैप करके टोकरी में भरें!'
                : 'Rules: You have 10 seconds! Tap shake button to shake the tree. Fast tap falling fruits to collect them into your basket!'}
            </p>
            <button
              onClick={startGame}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-black text-base shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>{lang === 'hi' ? 'खेल शुरू करें (Start Now)' : 'Start Game'}</span>
            </button>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === 'playing' && (
          <div className="relative py-2">
            {/* Top Game Bar */}
            <div className="flex justify-between items-center bg-slate-800/80 rounded-2xl p-3 border border-slate-700 mb-4">
              <div className="text-left">
                <span className="text-xs text-slate-400">{lang === 'hi' ? 'समय शेष' : 'Time Left'}:</span>
                <div className="text-xl font-black text-amber-400">{timeLeft}s</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">{lang === 'hi' ? 'एकत्रित फल' : 'Collected'}:</span>
                <div className="text-xl font-black text-emerald-400 flex items-center gap-1 justify-end">
                  <Apple className="w-4 h-4" />
                  <span>{collectedFruits}</span>
                </div>
              </div>
            </div>

            {/* Tree Shaking Interactive Stage */}
            <div
              onClick={handleShakeTap}
              className="relative h-56 w-full rounded-2xl bg-gradient-to-b from-sky-950/60 to-emerald-950/90 border border-emerald-500/20 overflow-hidden cursor-pointer select-none flex flex-col items-center justify-end"
            >
              {/* Falling Fruits Overlay */}
              {fallingFruits.map((fruit) => (
                <button
                  key={fruit.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCatchFruit(fruit.id);
                  }}
                  className="absolute text-3xl animate-falling-fruit z-30 cursor-pointer hover:scale-125 transition-transform"
                  style={{ left: `${fruit.left}%`, top: '15%' }}
                >
                  {fruit.type}
                </button>
              ))}

              {/* Shaking Tree Graphic */}
              <div className="text-8xl animate-tree-shake mb-2">
                🌳
              </div>

              {/* Tap to shake hint */}
              <div className="absolute top-2 w-full text-center">
                <span className="text-[11px] bg-slate-900/80 px-3 py-1 rounded-full text-amber-300 font-bold border border-amber-500/30">
                  {lang === 'hi' ? 'पेड़ पर टैप करें या शेक बटन दबाएं! 👆' : 'Tap Tree to Shake! 👆'}
                </span>
              </div>

              {/* Basket */}
              <div className="w-full bg-amber-900/40 border-t border-amber-600/30 p-2 flex justify-center items-center gap-2 text-xs font-bold text-amber-300">
                <span>🧺 {lang === 'hi' ? 'फलों की टोकरी' : 'Fruit Basket'}:</span>
                <span className="text-white font-extrabold">{collectedFruits}</span>
              </div>
            </div>

            {/* Big Shake Button */}
            <button
              onClick={handleShakeTap}
              className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-slate-950 font-black text-base shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Wind className="w-5 h-5 animate-spin" />
              <span>{lang === 'hi' ? 'हिलाएं (TAP TO SHAKE!)' : 'SHAKE TREE!'}</span>
            </button>
          </div>
        )}

        {/* FINISHED STATE */}
        {gameState === 'finished' && (
          <div className="py-6 space-y-4">
            <div className="text-6xl animate-bounce">🏆</div>
            <h3 className="text-xl font-black text-emerald-400">
              {lang === 'hi' ? 'शानदार खेल!' : 'Awesome Play!'}
            </h3>
            <p className="text-sm text-slate-300">
              {lang === 'hi'
                ? `आपने ${Math.max(2, collectedFruits)} मीठे फल बटोरे हैं!`
                : `You collected ${Math.max(2, collectedFruits)} sweet fruits!`}
            </p>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/30 text-amber-300 font-bold text-sm">
              +{Math.max(2, collectedFruits) * 10 + 20} कॉइन्स वॉलेट में क्रेडिट किए गए! 🪙
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-base transition-all cursor-pointer"
            >
              {lang === 'hi' ? 'जारी रखें' : 'Done & Continue'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
