import React, { useState, useEffect } from 'react';
import { Trophy, Award, Sparkles, Flame, Gift } from 'lucide-react';

export const LeaderboardPage = ({ lang, t }) => {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaders(data.leaderboard || []);
    } catch (e) {}
  };

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-emerald-950 to-slate-900 rounded-3xl p-4 sm:p-5 border border-amber-500/30 text-white shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg">
            🏆
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-emerald-300">
              {lang === 'hi' ? 'लीडरबोर्ड & रैंक बोर्ड' : 'Hall of Fame & Leaderboard'}
            </h1>
            <p className="text-xs text-slate-300">
              {lang === 'hi' ? 'सर्वश्रेष्ठ पर्यावरण संरक्षक जिन्होंने सबसे बड़ा पेड़ उगाया!' : 'Top green guardians growing the highest level trees!'}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Loot Offer Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-emerald-950/60 rounded-2xl p-4 border border-purple-500/30 text-white shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl">
            🎁
          </div>
          <div>
            <span className="text-xs font-black text-purple-300 uppercase tracking-wider block">
              {lang === 'hi' ? 'साप्ताहिक लूट ऑफर (Weekly Loot)' : 'Weekly Loot Offer'}
            </span>
            <p className="text-[11px] text-slate-300">
              {lang === 'hi' ? 'इस सप्ताह के टॉप 3 ट्री प्लांटर्स को ₹500 का स्पेशल ग्रीन बोनस!' : 'Top 3 tree growers this week win ₹500 Green Bonus!'}
            </p>
          </div>
        </div>
      </div>

      {/* Leaders List */}
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 text-white space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          {lang === 'hi' ? 'रैंक बोर्ड (Top Guardians)' : 'Global Rankings'}
        </h3>

        <div className="space-y-2">
          {leaders.map((u, idx) => {
            const rank = idx + 1;
            const rankBadge =
              rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            return (
              <div
                key={u.id}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                  rank <= 3
                    ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-amber-500/40 shadow-md font-bold'
                    : 'bg-slate-800/40 border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg font-black w-6 text-center text-amber-400">
                    {rankBadge}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-base">
                    {u.avatar || '🌳'}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {u.tree_name} • Level {u.level} ({u.growth_percentage}%)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-amber-400 font-extrabold block">🪙 {u.coins}</span>
                  <span className="text-[10px] text-emerald-400">≈ ₹{(u.coins / 100).toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
