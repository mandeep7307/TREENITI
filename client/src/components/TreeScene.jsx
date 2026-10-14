import React, { useState } from 'react';
import { Droplet, Sparkles, Wind, Heart, Bug, Apple } from 'lucide-react';

export const TreeScene = ({
  tree,
  isWatering,
  isFertilizing,
  isShaking,
  talkingMessage,
  onWater,
  onFertilize,
  onShake,
  onShareTree,
  shakeReady,
  shakeWaitSec,
  lang,
  t
}) => {
  const [showCareMenu, setShowCareMenu] = useState(false);
  const level = tree?.level || 1;
  const growth = tree?.growth_percentage || 5;
  const mood = tree?.mood || 'Happy';

  // Mood icon mapping
  const getMoodFace = () => {
    switch (mood) {
      case 'Excited':
        return { emoji: '🤩', text: t.treeMoodExcited, color: 'text-amber-400 bg-amber-950/80' };
      case 'Waiting':
        return { emoji: '🥺', text: t.treeMoodWaiting, color: 'text-blue-400 bg-blue-950/80' };
      case 'Sad':
        return { emoji: '😢', text: t.treeMoodSad, color: 'text-rose-400 bg-rose-950/80' };
      default:
        return { emoji: '😊', text: t.treeMoodHappy, color: 'text-emerald-400 bg-emerald-950/80' };
    }
  };

  const moodInfo = getMoodFace();

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-sky-900 via-emerald-950 to-slate-950 border border-emerald-500/20 shadow-2xl p-4 sm:p-6 select-none">
      {/* Dynamic Background Elements */}
      <div className="absolute top-4 left-6 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border border-white/10 flex items-center gap-1.5 shadow-md ${moodInfo.color}`}>
          <span>{moodInfo.emoji}</span>
          <span>{moodInfo.text}</span>
        </span>
      </div>

      <div className="absolute top-4 right-6 flex items-center gap-2">
        {onShareTree && (
          <button
            onClick={onShareTree}
            className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-md"
            title={lang === 'hi' ? 'पेड़ की फोटो शेयर करें' : 'Share Tree Image'}
          >
            <span>📸</span>
            <span className="hidden sm:inline">{lang === 'hi' ? 'शेयर' : 'Share'}</span>
          </button>
        )}
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Apple className="w-3.5 h-3.5" />
          <span>{tree?.fruits_count || 0} {lang === 'hi' ? 'फल' : 'Fruits'}</span>
        </span>
      </div>

      {/* Forest Flying Birds (Unlocked at Level 4+) */}
      {level >= 4 && (
        <div className="absolute top-8 left-0 w-full pointer-events-none overflow-hidden h-12">
          <div className="animate-bird absolute text-sky-200 opacity-70 text-lg flex gap-3">
            <span>🕊️</span>
            <span className="text-sm">🕊️</span>
          </div>
        </div>
      )}

      {/* Forest Fluttering Butterflies (Unlocked at Level 4+) */}
      {level >= 4 && (
        <div className="absolute top-28 right-12 pointer-events-none animate-butterfly text-2xl">
          🦋
        </div>
      )}
      {level >= 5 && (
        <div className="absolute top-36 left-12 pointer-events-none animate-butterfly text-xl" style={{ animationDelay: '3s' }}>
          🦋
        </div>
      )}

      {/* Floating Tree Talking Message Bubble */}
      {talkingMessage && (
        <div className="relative mx-auto mt-7 max-w-sm z-20 transition-all duration-300">
          <div className="bg-white/95 text-slate-900 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-400/40 relative animate-bounce flex items-center gap-2">
            <span className="text-base">💬</span>
            <span className="flex-1 text-center font-semibold text-emerald-950">
              {talkingMessage}
            </span>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/95"></div>
          </div>
        </div>
      )}

      {/* Tree Visualization Canvas Area */}
      <div className="relative h-64 sm:h-72 w-full flex items-end justify-center my-4 overflow-hidden">
        {/* Animated Watering Drop Effect */}
        {isWatering && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div className="text-3xl animate-bounce">🚿</div>
            <div className="animate-water-drop text-cyan-400 text-2xl">💧</div>
            <div className="animate-water-drop text-cyan-300 text-xl" style={{ animationDelay: '0.2s' }}>💧</div>
          </div>
        )}

        {/* Animated Fertilizer / Spray Effect */}
        {isFertilizing && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div className="text-3xl animate-pulse">🌿</div>
            <div className="text-emerald-300 text-sm font-bold animate-ping">✨ +Bio Nutrition ✨</div>
          </div>
        )}

        {/* The Visual Tree Representation based on 7 Levels */}
        <div className={`relative flex flex-col items-center justify-end transition-all duration-500 ${isShaking ? 'animate-tree-shake' : ''}`}>
          
          {/* Level 1: Digital Seed */}
          {level === 1 && (
            <div className="flex flex-col items-center animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-900 to-amber-700 border-2 border-amber-500/60 shadow-lg flex items-center justify-center text-2xl">
                🌰
              </div>
              <div className="text-[11px] font-bold text-amber-300 mt-2 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Level 1: {lang === 'hi' ? 'बीज (Seed)' : 'Seed'}
              </div>
            </div>
          )}

          {/* Level 2: Sprout */}
          {level === 2 && (
            <div className="flex flex-col items-center">
              <div className="text-6xl filter drop-shadow(0 0 12px rgba(34,197,94,0.6))">
                🌱
              </div>
              <div className="text-[11px] font-bold text-emerald-300 mt-1 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Level 2: {lang === 'hi' ? 'अंकुर (Sprout)' : 'Sprout'}
              </div>
            </div>
          )}

          {/* Level 3: Young Plant */}
          {level === 3 && (
            <div className="flex flex-col items-center">
              <div className="text-7xl filter drop-shadow(0 0 16px rgba(34,197,94,0.7))">
                🪴
              </div>
              <div className="text-[11px] font-bold text-emerald-300 mt-1 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Level 3: {lang === 'hi' ? 'पौधा (Plant)' : 'Plant'}
              </div>
            </div>
          )}

          {/* Level 4: Growing Plant with Leaves */}
          {level === 4 && (
            <div className="flex flex-col items-center relative">
              <div className="text-8xl filter drop-shadow(0 0 20px rgba(34,197,94,0.8))">
                🌿
              </div>
              <div className="text-[11px] font-bold text-emerald-300 mt-1 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Level 4: {lang === 'hi' ? 'बढ़ता पौधा (Growing Plant)' : 'Growing Plant'}
              </div>
            </div>
          )}

          {/* Level 5: Young Tree with Flowers */}
          {level === 5 && (
            <div className="flex flex-col items-center relative">
              <div className="relative">
                <span className="text-9xl filter drop-shadow(0 0 24px rgba(34,197,94,0.8))">
                  🌲
                </span>
                {/* Blooming Flowers on branches */}
                <span className="absolute top-6 left-2 text-xl animate-pulse">🌸</span>
                <span className="absolute top-10 right-2 text-xl animate-pulse" style={{ animationDelay: '0.8s' }}>🌺</span>
                <span className="absolute top-3 right-6 text-lg animate-pulse" style={{ animationDelay: '1.4s' }}>🌸</span>
              </div>
              <div className="text-[11px] font-bold text-emerald-300 mt-1 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Level 5: {lang === 'hi' ? 'युवा वृक्ष (Young Tree)' : 'Young Tree'}
              </div>
            </div>
          )}

          {/* Level 6: Mature Tree with Fruits */}
          {level === 6 && (
            <div className="flex flex-col items-center relative">
              <div className="relative">
                <span className="text-[120px] leading-none filter drop-shadow(0 0 28px rgba(34,197,94,0.9))">
                  🌳
                </span>
                {/* Hanging Fruits */}
                <span className="absolute top-6 left-6 text-2xl animate-bounce">🍎</span>
                <span className="absolute top-12 right-6 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🍎</span>
                <span className="absolute top-4 right-10 text-xl animate-bounce" style={{ animationDelay: '1s' }}>🍏</span>
              </div>
              <div className="text-[11px] font-bold text-emerald-300 mt-1 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Level 6: {lang === 'hi' ? 'फलदार परिपक्व वृक्ष' : 'Mature Tree'}
              </div>
            </div>
          )}

          {/* Level 7: Mighty Kalpavriksha (Golden Glow & Infinite Fruits) */}
          {level >= 7 && (
            <div className="flex flex-col items-center relative">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl animate-pulse"></div>
                <span className="text-[130px] leading-none filter drop-shadow(0 0 35px rgba(251,191,36,0.9))">
                  🌳
                </span>
                {/* Abundant ripe fruits */}
                <span className="absolute top-4 left-4 text-3xl animate-bounce">🥭</span>
                <span className="absolute top-12 left-10 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🍎</span>
                <span className="absolute top-6 right-6 text-3xl animate-bounce" style={{ animationDelay: '0.7s' }}>🍎</span>
                <span className="absolute top-14 right-10 text-2xl animate-bounce" style={{ animationDelay: '1.1s' }}>🥭</span>
                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xl">✨</span>
              </div>
              <div className="text-[11px] font-bold text-amber-300 mt-1 bg-amber-950/90 px-3 py-0.5 rounded-full border border-amber-400/40 shadow-lg flex items-center gap-1">
                <span>👑</span>
                <span>Level 7: {lang === 'hi' ? 'महावृक्ष (Kalpavriksha)' : 'Mighty Tree'}</span>
              </div>
            </div>
          )}

        </div>

        {/* Soil Ground Mound */}
        <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-amber-950 to-emerald-950/80 border-t border-emerald-800/40 rounded-t-3xl flex items-center justify-around px-4">
          <span className="text-xs text-emerald-400/60">🌱</span>
          <span className="text-xs text-amber-600/60">🍂</span>
          <span className="text-xs text-emerald-400/60">🍀</span>
          <span className="text-xs text-amber-700/60">🍄</span>
          <span className="text-xs text-emerald-400/60">🌿</span>
        </div>
      </div>

      {/* Growth Progress Bar */}
      <div className="mt-2 space-y-1.5 bg-slate-900/80 p-3 rounded-2xl border border-emerald-500/20 backdrop-blur-md">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="text-emerald-400">🌳 {tree?.tree_name || 'My Tree'}</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-300 font-semibold">{t.level} {level}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">
              {t.growthPercentage}: <strong className="text-emerald-400">{growth.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Progress Fill */}
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-300 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${Math.min(100, growth)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
          <span>{t.todayGrowth}: <strong className="text-amber-400">{(tree?.daily_growth_today || 0).toFixed(1)}%</strong></span>
          <span className="text-emerald-400 font-medium">{t.dailyLimit}</span>
        </div>
      </div>

      {/* Main Game Control Buttons */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {/* Game 1: Water Tree Button */}
        <button
          onClick={onWater}
          disabled={isWatering}
          className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg border border-cyan-400/40 transition-all cursor-pointer"
        >
          <Droplet className={`w-5 h-5 mb-1 text-cyan-200 ${isWatering ? 'animate-bounce' : ''}`} />
          <span>{t.waterTree}</span>
          <span className="text-[10px] text-cyan-200 font-normal">+15 {t.coins}</span>
        </button>

        {/* Game 1: Fertilizer / Pesticide Button (खाद और कीटनाशक) */}
        <div className="relative">
          <button
            onClick={() => setShowCareMenu(!showCareMenu)}
            disabled={isFertilizing}
            className="w-full h-full flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg border border-emerald-400/40 transition-all cursor-pointer"
          >
            <Sparkles className={`w-5 h-5 mb-1 text-emerald-200 ${isFertilizing ? 'animate-spin' : ''}`} />
            <span className="text-center">{lang === 'hi' ? 'खाद व दवा ⚡' : 'Care & Shield ⚡'}</span>
            <span className="text-[10px] text-emerald-200 font-normal">{lang === 'hi' ? 'चुनें' : 'Options'}</span>
          </button>

          {/* Care Menu Dropdown for Organic Fertilizer vs Natural Pesticide */}
          {showCareMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 bg-slate-900 border border-emerald-500/40 rounded-2xl p-2 shadow-2xl z-30 space-y-1.5 backdrop-blur-md">
              <button
                onClick={() => {
                  setShowCareMenu(false);
                  onFertilize('organic_fertilizer');
                }}
                className="w-full text-left p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-800/80 border border-emerald-500/30 text-white cursor-pointer transition-all flex items-center gap-2"
              >
                <span className="text-base">🌿</span>
                <div>
                  <span className="text-xs font-bold block">{lang === 'hi' ? 'जैविक खाद' : 'Bio Fertilizer'}</span>
                  <span className="text-[10px] text-emerald-300 block">+25 🪙 • +1.0%</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowCareMenu(false);
                  onFertilize('natural_pesticide');
                }}
                className="w-full text-left p-2 rounded-xl bg-teal-950/80 hover:bg-teal-800/80 border border-teal-500/30 text-white cursor-pointer transition-all flex items-center gap-2"
              >
                <span className="text-base">🛡️</span>
                <div>
                  <span className="text-xs font-bold text-teal-200 block">{lang === 'hi' ? 'कीटनाशक रक्षा' : 'Pesticide Shield'}</span>
                  <span className="text-[10px] text-amber-300 block">+35 🪙 • +1.5% Boost</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Game 2: Shake Tree Button */}
        <button
          onClick={onShake}
          disabled={!shakeReady || isShaking}
          className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl font-bold text-xs sm:text-sm shadow-lg border transition-all cursor-pointer active:scale-95 ${
            shakeReady
              ? 'bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white border-amber-400/60 animate-pulse'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 cursor-not-allowed opacity-80'
          }`}
        >
          <Wind className={`w-5 h-5 mb-1 ${shakeReady ? 'text-amber-200 animate-spin' : 'text-slate-400'}`} />
          <span>{lang === 'hi' ? 'पेड़ हिलाएं' : 'Shake Tree'}</span>
          <span className="text-[10px] font-normal">
            {shakeReady ? (
              <span className="text-amber-200 font-semibold">{t.shakeReady}</span>
            ) : (
              `${Math.ceil(shakeWaitSec / 60)} min`
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
