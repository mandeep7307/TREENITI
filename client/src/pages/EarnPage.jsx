import React, { useState, useEffect } from 'react';
import { Target, Flame, Clock, Sparkles, Tv, CheckCircle, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import { sounds } from '../audio';
import confetti from 'canvas-confetti';

export const EarnPage = ({
  user,
  wallet,
  onDailyCheckin,
  onClaim3h,
  onSpinOpen,
  onAdOpen,
  lang,
  t
}) => {
  const [socialTasks, setSocialTasks] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loadingTask, setLoadingTask] = useState('');

  useEffect(() => {
    if (user) {
      fetchSocialTasks();
      fetchMissions();
    }
  }, [user]);

  const fetchSocialTasks = async () => {
    try {
      const res = await fetch(`/api/rewards/social-tasks/${user.id}`);
      const data = await res.json();
      setSocialTasks(data.tasks || []);
    } catch (e) {}
  };

  const fetchMissions = async () => {
    try {
      const res = await fetch(`/api/rewards/daily-missions/${user.id}`);
      const data = await res.json();
      setMissions(data.missions || []);
    } catch (e) {}
  };

  const handleCompleteSocial = async (platform, url) => {
    window.open(url, '_blank');
    setLoadingTask(platform);

    setTimeout(async () => {
      try {
        const res = await fetch('/api/rewards/complete-social-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, platform })
        });
        const data = await res.json();
        if (res.ok) {
          sounds.playCoin();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          fetchSocialTasks();
        }
      } catch (e) {}
      setLoadingTask('');
    }, 2000);
  };

  const handleClaimMission = async (missionId) => {
    try {
      const res = await fetch('/api/rewards/claim-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, missionId })
      });
      const data = await res.json();
      if (res.ok) {
        sounds.playCoin();
        fetchMissions();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-5 pb-20 max-w-xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-4 sm:p-5 border border-emerald-500/30 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
            🎯
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300">
              {lang === 'hi' ? 'कमाई केंद्र & दैनिक मिशन' : 'Earn Hub & Daily Missions'}
            </h1>
            <p className="text-xs text-slate-300">
              {lang === 'hi' ? 'मिशन पूरे करें, सोशल मीडिया फॉलो करें और कॉइन्स कमाएं!' : 'Complete daily quests, follow green channels and earn coins!'}
            </p>
          </div>
        </div>
      </div>

      {/* Routine Fast Claims */}
      <div className="grid grid-cols-2 gap-3">
        {/* Daily Streak */}
        <div
          onClick={onDailyCheckin}
          className="bg-slate-900 rounded-2xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{t.dailyCheckin}</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="my-2">
            <span className="text-lg font-black text-emerald-400">+50</span>
            <span className="text-xs text-slate-400 ml-1">Coins</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {lang === 'hi' ? `वर्तमान स्ट्रीक: ${user?.login_streak || 1} दिन` : `Streak: ${user?.login_streak || 1} Days`}
          </span>
        </div>

        {/* 3-Hour Oxygen */}
        <div
          onClick={onClaim3h}
          className="bg-slate-900 rounded-2xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{lang === 'hi' ? '3-घंटे रिवॉर्ड' : '3-Hr Oxygen'}</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <span className="text-lg font-black text-cyan-400">+35</span>
            <span className="text-xs text-slate-400 ml-1">Coins</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {lang === 'hi' ? 'हर 3 घंटे में मुफ्त दावा' : 'Claim every 3 hours'}
          </span>
        </div>
      </div>

      {/* Daily Missions Section */}
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>{t.dailyMissions}</span>
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold">
            {lang === 'hi' ? 'आज के मिशन' : "Today's Tasks"}
          </span>
        </div>

        <div className="space-y-2.5">
          {missions.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3"
            >
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-200 block">
                  {lang === 'hi' ? m.title_hi : m.title_en}
                </span>
                <span className="text-[10px] text-amber-400 font-semibold">
                  +{m.reward_coins} {t.coins}
                </span>
              </div>

              {m.is_claimed ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'प्राप्त' : 'Claimed'}</span>
                </span>
              ) : (
                <button
                  onClick={() => handleClaimMission(m.id)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  {lang === 'hi' ? 'दावा करें' : 'Claim'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Social Media Tasks Section */}
      <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t.socialTasks}</span>
          </span>
          <span className="text-[10px] text-slate-400">
            {lang === 'hi' ? 'फॉलो करें और सिक्के पाएं' : 'Follow & get coins'}
          </span>
        </div>

        <div className="space-y-2.5">
          {socialTasks.map((task) => (
            <div
              key={task.platform}
              className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{task.icon}</span>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">{task.name}</span>
                  <span className="text-[11px] font-black text-amber-400">+{task.reward_coins} {t.coins}</span>
                </div>
              </div>

              {task.isCompleted ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'सत्यापित' : 'Done'}</span>
                </span>
              ) : (
                <button
                  onClick={() => handleCompleteSocial(task.platform, task.url)}
                  disabled={loadingTask === task.platform}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-emerald-300 font-bold text-xs border border-slate-600 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>{loadingTask === task.platform ? '...' : (lang === 'hi' ? 'जॉइन करें' : 'Follow')}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
