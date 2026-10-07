import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Clock, Award, CheckCircle, Eye, ArrowLeft, AlertCircle, ShieldAlert } from 'lucide-react';
import { sounds } from '../audio';
import confetti from 'canvas-confetti';

export const ArticlesPage = ({ user, lang, t, onCoinEarned }) => {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [readingTimer, setReadingTimer] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (e) {}
  };

  // Tab Active / Visibility Detection (Anti-Cheat)
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Reading duration counter (increments only when tab is active and article is open)
  useEffect(() => {
    let interval;
    if (selectedArticle && !claimed && isTabActive) {
      interval = setInterval(() => {
        setReadingTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedArticle, claimed, isTabActive]);

  const openArticle = async (art) => {
    try {
      const res = await fetch(`/api/articles/${art.id}`);
      const data = await res.json();
      setSelectedArticle(data.article);
      setReadingTimer(0);
      setScrolledToBottom(false);
      setClaimed(false);
      setClaimMsg('');
    } catch (e) {}
  };

  // Scroll Detection
  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 60) {
      setScrolledToBottom(true);
    }
  };

  const handleClaimReward = async () => {
    if (!selectedArticle || !user) return;
    setClaiming(true);
    setClaimMsg('');

    try {
      const res = await fetch(`/api/articles/${selectedArticle.id}/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          readingDurationSec: readingTimer,
          scrolledToBottom: true,
          tabActiveDurationSec: readingTimer
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim');

      setClaimed(true);
      setClaimMsg(lang === 'hi' ? `बधाई! +${data.rewardCoins} कॉइन्स मिले!` : `Success! +${data.rewardCoins} Coins claimed!`);
      sounds.playCoin();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      if (onCoinEarned) onCoinEarned(data.rewardCoins);
    } catch (err) {
      setClaimMsg(err.message);
    } finally {
      setClaiming(false);
    }
  };

  const requiredTime = selectedArticle?.read_time_seconds || 20;
  const progressPercent = Math.min(100, Math.round((readingTimer / requiredTime) * 100));
  const canClaim = readingTimer >= requiredTime && scrolledToBottom && !claimed;

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto">
      
      {/* Article Detail View */}
      {selectedArticle ? (
        <div className="bg-slate-900 rounded-3xl border border-emerald-500/30 p-4 sm:p-6 shadow-2xl space-y-4 text-white">
          
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'hi' ? 'सभी लेखों पर वापस' : 'Back to Articles'}</span>
          </button>

          {/* Anti-cheat Tracker Bar */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 font-bold text-amber-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'पढ़ने का समय:' : 'Reading Time:'} {readingTimer}s / {requiredTime}s</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-400">
                +{selectedArticle.reward_coins} {t.coins}
              </span>
            </div>

            {/* Progress */}
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Status Checks */}
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className={isTabActive ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                {isTabActive ? '✓ सक्रिय टैब (Active)' : '⚠ टैब इनएक्टिव (Paused)'}
              </span>
              <span className={scrolledToBottom ? 'text-emerald-400' : 'text-amber-400'}>
                {scrolledToBottom ? '✓ नीचे तक पढ़ा (Scrolled)' : '⬇ नीचे तक स्क्रॉल करें'}
              </span>
            </div>
          </div>

          {/* Article Header */}
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              {selectedArticle.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200 leading-snug">
              {lang === 'hi' ? selectedArticle.title_hi : selectedArticle.title_en}
            </h1>
          </div>

          {/* Article Scrollable Content */}
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className="h-72 overflow-y-auto pr-2 space-y-3 text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800"
          >
            {(lang === 'hi' ? selectedArticle.content_hi : selectedArticle.content_en)
              .split('\n\n')
              .map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
          </div>

          {claimMsg && (
            <div className={`p-3 rounded-xl text-xs font-bold text-center border ${
              claimed ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}>
              {claimMsg}
            </div>
          )}

          {/* Claim Button */}
          {claimed ? (
            <div className="w-full py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-sm text-center flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>{lang === 'hi' ? 'रिवॉर्ड सफलतापूर्वक प्राप्त किया गया!' : 'Reward Claimed!'}</span>
            </div>
          ) : (
            <button
              onClick={handleClaimReward}
              disabled={!canClaim || claiming}
              className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                canClaim
                  ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>
                {canClaim
                  ? (lang === 'hi' ? `रिवॉर्ड प्राप्त करें (+${selectedArticle.reward_coins} कॉइन)` : `Claim Reward (+${selectedArticle.reward_coins} Coins)`)
                  : (lang === 'hi' ? 'पूरा पढ़ें और नीचे तक स्क्रॉल करें...' : 'Read completely & scroll down to unlock...')}
              </span>
            </button>
          )}

        </div>
      ) : (
        /* Articles List View */
        <div className="space-y-3">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-4 sm:p-5 border border-emerald-500/30 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                📚
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300">
                  {lang === 'hi' ? 'पर्यावरण ज्ञान & लेख' : 'Green Knowledge Hub'}
                </h1>
                <p className="text-xs text-slate-300">
                  {lang === 'hi' ? 'लेख पढ़ें, पर्यावरण सीखें और प्रति लेख कॉइन्स कमाएं!' : 'Read green articles, learn eco-tips & earn coins!'}
                </p>
              </div>
            </div>
          </div>

          {/* List Cards */}
          <div className="space-y-2.5">
            {articles.map((art) => (
              <div
                key={art.id}
                onClick={() => openArticle(art)}
                className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-98 shadow-md text-white flex items-center justify-between gap-3 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{art.read_time_seconds}s</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {lang === 'hi' ? art.title_hi : art.title_en}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-amber-400 block">
                    +{art.reward_coins} {t.coins}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5 justify-end mt-0.5">
                    <Eye className="w-3 h-3" />
                    <span>{art.views_count}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
