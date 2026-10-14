import React, { useState, useEffect } from 'react';
import { translations } from './translations';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { EarnPage } from './pages/EarnPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { TeamPage } from './pages/TeamPage';
import { WalletPage } from './pages/WalletPage';
import { PlantationPage } from './pages/PlantationPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminPage } from './pages/AdminPage';
import { InfoPages } from './pages/InfoPages';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ShakeGameModal } from './components/ShakeGameModal';
import { SpinWheelModal } from './components/SpinWheelModal';
import { AdBannerModal } from './components/AdBannerModal';
import { CertificateModal } from './components/CertificateModal';
import { ShareTreeModal } from './components/ShareTreeModal';
import { sounds } from './audio';
import confetti from 'canvas-confetti';
import { Menu, X, Shield, Award, HelpCircle, Info, FileText, MessageSquare } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState('hi');
  const t = translations[lang] || translations.hi;

  const [activeTab, setActiveTab] = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // User & Economy State
  const [user, setUser] = useState(null);
  const [tree, setTree] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [tickers, setTickers] = useState([]);
  const [talkingMessage, setTalkingMessage] = useState('');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShakeOpen, setIsShakeOpen] = useState(false);
  const [isSpinOpen, setIsSpinOpen] = useState(false);
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isShareTreeOpen, setIsShareTreeOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  // Native PWA deferred prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Tree & Game Animations
  const [isWatering, setIsWatering] = useState(false);
  const [isFertilizing, setIsFertilizing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [shakeReady, setShakeReady] = useState(true);
  const [shakeWaitSec, setShakeWaitSec] = useState(0);

  // Listen for beforeinstallprompt for native phone installation
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('📱 PWA install prompt ready!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Initialize or load saved session
  useEffect(() => {
    const savedUser = localStorage.getItem('treeniti_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        fetchUserData(u.id);
      } catch (e) {
        setIsAuthOpen(true);
      }
    } else {
      // Prompt user with login choices (Google / Mobile OTP)
      setIsAuthOpen(true);
    }

    fetchTickers();
  }, []);

  // Poll shake status periodically
  useEffect(() => {
    if (user) {
      checkShakeStatus();
      const interval = setInterval(checkShakeStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const initDefaultUser = async () => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9876543210', code: '1234' })
      });
      const data = await res.json();
      if (res.ok) {
        handleLoginSuccess(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserData = async (userId) => {
    try {
      const res = await fetch(`/api/auth/me/${userId}`);
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setTree(data.tree);
        setWallet(data.wallet);
      }
    } catch (e) {}
  };

  const fetchTickers = async () => {
    try {
      const res = await fetch('/api/tickers');
      const data = await res.json();
      setTickers(data.tickers || []);
    } catch (e) {}
  };

  const checkShakeStatus = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/tree/shake-status/${user.id}`);
      const data = await res.json();
      setShakeReady(data.canShake);
      setShakeWaitSec(data.remainingSeconds || 0);
    } catch (e) {}
  };

  const handleLoginSuccess = (data) => {
    setUser(data.user);
    setTree(data.tree);
    setWallet(data.wallet);
    localStorage.setItem('treeniti_user', JSON.stringify(data.user));
    if (data.user.language) {
      setLang(data.user.language);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('treeniti_user');
    setUser(null);
    setTree(null);
    setWallet(null);
    setIsProfileOpen(false);
    setIsAuthOpen(true);
  };

  // Water Tree Action
  const handleWater = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setIsWatering(true);
    sounds.playWater();

    try {
      const res = await fetch('/api/tree/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(lang === 'hi' ? data.error : data.error_en);
        setIsWatering(false);
        return;
      }

      sounds.playCoin();
      setTree(data.tree);
      setWallet(data.wallet);
      setTalkingMessage(lang === 'hi' ? data.message : data.message_en);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setTimeout(() => {
      setIsWatering(false);
    }, 1200);
  };

  // Fertilizer / Pesticide Action (खाद और कीटनाशक)
  const handleFertilize = async (type = 'organic_fertilizer') => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setIsFertilizing(true);
    sounds.playShakeRustle();

    try {
      const res = await fetch('/api/tree/fertilizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(lang === 'hi' ? data.error : data.error_en);
        setIsFertilizing(false);
        return;
      }

      sounds.playCoin();
      setTree(data.tree);
      setWallet(data.wallet);
      setTalkingMessage(lang === 'hi' ? data.message : data.message_en);
    } catch (e) {}

    setTimeout(() => {
      setIsFertilizing(false);
    }, 1200);
  };

  // Shake Complete
  const handleShakeComplete = async (fruitsCaught) => {
    if (!user) return;
    try {
      const res = await fetch('/api/tree/shake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setTree(data.tree);
        setWallet(data.wallet);
        setShakeReady(false);
        setTalkingMessage(lang === 'hi' ? data.message_hi : data.message_en);
      }
    } catch (e) {}
  };

  // Sell Fruits
  const handleSellFruits = async (count) => {
    if (!user) return;
    try {
      const res = await fetch('/api/tree/sell-fruits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, count })
      });
      const data = await res.json();
      if (res.ok) {
        setTree(data.tree);
        setWallet(data.wallet);
      }
    } catch (e) {}
  };

  // Daily Check-in
  const handleDailyCheckin = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/rewards/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(lang === 'hi' ? data.error : data.error_en);
        return;
      }

      sounds.playLevelUp();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setWallet(data.wallet);
      setUser((prev) => ({ ...prev, login_streak: data.streak }));
    } catch (e) {}
  };

  // Claim 3-Hour Oxygen
  const handleClaim3h = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/rewards/claim-3h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(lang === 'hi' ? data.error : data.error_en);
        return;
      }

      sounds.playCoin();
      setWallet(data.wallet);
    } catch (e) {}
  };

  // Spin complete
  const handleSpinComplete = (coinsWon) => {
    sounds.playCoin();
    fetchUserData(user.id);
  };

  // Rewarded Ad claim
  const handleAdClaimed = (coins) => {
    sounds.playCoin();
    if (wallet) {
      setWallet((prev) => ({ ...prev, coins: prev.coins + coins }));
    }
  };

  // Update profile
  const handleUpdateProfile = async ({ name, avatar }) => {
    try {
      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar, language: lang })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      }
    } catch (e) {}
  };

  // Rename tree
  const handleRenameTree = async (newTreeName) => {
    try {
      const res = await fetch('/api/tree/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, treeName: newTreeName })
      });
      const data = await res.json();
      if (res.ok) {
        setTree(data.tree);
      }
    } catch (e) {}
  };

  // Trigger Native Phone Installation
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      }
      setDeferredPrompt(null);
    }
  };

  // Language toggle
  const toggleLanguage = () => {
    const nextLang = lang === 'hi' ? 'en' : 'hi';
    setLang(nextLang);
    if (user) {
      handleUpdateProfile({ language: nextLang });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      
      {/* Top Navbar: Adapts to Desktop Web navigation & Mobile header */}
      <Navbar
        user={user}
        wallet={wallet}
        lang={lang}
        onToggleLang={toggleLanguage}
        onOpenLogin={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCertificate={() => setIsCertOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        t={t}
      />

      {/* Mobile Subheader Bar (Visible on mobile screens) */}
      <div className="md:hidden px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center text-xs">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800"
        >
          <Menu className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">{t.navMenu}</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Live Sync
          </span>
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-pointer"
            >
              Super Admin
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Responsive container for Web & App */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4">
        {activeTab === 'home' && (
          <HomePage
            user={user}
            tree={tree}
            wallet={wallet}
            tickers={tickers}
            talkingMessage={talkingMessage}
            shakeReady={shakeReady}
            shakeWaitSec={shakeWaitSec}
            onWater={handleWater}
            onFertilize={handleFertilize}
            onShakeOpen={() => setIsShakeOpen(true)}
            onSpinOpen={() => setIsSpinOpen(true)}
            onAdOpen={() => setIsAdOpen(true)}
            onDailyCheckin={handleDailyCheckin}
            onClaim3h={handleClaim3h}
            onSellFruits={handleSellFruits}
            onOpenCertificate={() => setIsCertOpen(true)}
            onOpenLogin={() => setIsAuthOpen(true)}
            onShareTreeOpen={() => setIsShareTreeOpen(true)}
            setActiveTab={setActiveTab}
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'earn' && (
          <EarnPage
            user={user}
            wallet={wallet}
            onDailyCheckin={handleDailyCheckin}
            onClaim3h={handleClaim3h}
            onSpinOpen={() => setIsSpinOpen(true)}
            onAdOpen={() => setIsAdOpen(true)}
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'articles' && (
          <ArticlesPage
            user={user}
            lang={lang}
            t={t}
            onCoinEarned={() => fetchUserData(user?.id)}
          />
        )}

        {activeTab === 'team' && (
          <TeamPage
            user={user}
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletPage
            user={user}
            wallet={wallet}
            onRefreshUser={() => fetchUserData(user?.id)}
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'plantation' && (
          <PlantationPage
            user={user}
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage
            lang={lang}
            t={t}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            adminUser={user}
            lang={lang}
            t={t}
          />
        )}

        {['feedback', 'about', 'help', 'terms', 'privacy'].includes(activeTab) && (
          <InfoPages
            viewType={activeTab}
            user={user}
            lang={lang}
            t={t}
            onBack={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Bottom Navigation Bar: Hidden on Desktop (md:hidden), Visible on Mobile phone */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        t={t}
      />

      {/* Slide-out Menu Drawer for Mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 bg-slate-900 h-full p-5 border-r border-slate-800 flex flex-col justify-between text-white shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌳</span>
                  <span className="font-black text-lg text-emerald-400">TREENITI</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Mini Profile */}
              {user && (
                <div
                  onClick={() => {
                    setIsProfileOpen(true);
                    setDrawerOpen(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 mb-4 flex items-center gap-3 cursor-pointer hover:border-emerald-500/50"
                >
                  <div className="text-2xl">{user.avatar || '🌳'}</div>
                  <div className="flex-1 truncate">
                    <span className="text-xs font-bold text-white block truncate">{user.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Ref: {user.referral_code}</span>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="space-y-1 text-xs font-semibold">
                {[
                  { id: 'team', label: lang === 'hi' ? 'My Team (मेरी टीम)' : 'My Team', icon: '👥' },
                  { id: 'wallet', label: lang === 'hi' ? 'My Income (मेरी कमाई)' : 'My Income', icon: '💰' },
                  { id: 'plantation', label: lang === 'hi' ? 'रियल प्लांटेशन ट्रैकिंग' : 'Real Plantation', icon: '📸' },
                  { id: 'leaderboard', label: lang === 'hi' ? 'रैंक बोर्ड (Leaderboard)' : 'Rank Board', icon: '🏆' },
                  { id: 'feedback', label: lang === 'hi' ? 'फीडबैक (Feedback)' : 'Feedback', icon: '💬' },
                  { id: 'about', label: lang === 'hi' ? 'About Us (हमारे बारे में)' : 'About Us', icon: 'ℹ️' },
                  { id: 'help', label: lang === 'hi' ? 'Help Us (मदद)' : 'Help Us', icon: '❓' },
                  { id: 'terms', label: lang === 'hi' ? 'Terms & Conditions' : 'Terms & Conditions', icon: '📜' },
                  { id: 'privacy', label: lang === 'hi' ? 'Privacy Policy' : 'Privacy Policy', icon: '🔒' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setDrawerOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-emerald-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-center text-[10px] text-slate-500">
              Treeniti Platform v2.0 • Green Earth Initiative
            </div>
          </div>
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* ALL MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
        t={t}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        tree={tree}
        wallet={wallet}
        onUpdateProfile={handleUpdateProfile}
        onRenameTree={handleRenameTree}
        onLogout={handleLogout}
        lang={lang}
        t={t}
      />

      <ShakeGameModal
        isOpen={isShakeOpen}
        onClose={() => setIsShakeOpen(false)}
        onComplete={handleShakeComplete}
        lang={lang}
      />

      <SpinWheelModal
        isOpen={isSpinOpen}
        onClose={() => setIsSpinOpen(false)}
        onSpinComplete={handleSpinComplete}
        lang={lang}
      />

      <AdBannerModal
        isOpen={isAdOpen}
        onClose={() => setIsAdOpen(false)}
        onRewardClaimed={handleAdClaimed}
        lang={lang}
      />

      <CertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        user={user}
        tree={tree}
        lang={lang}
      />

      <ShareTreeModal
        isOpen={isShareTreeOpen}
        onClose={() => setIsShareTreeOpen(false)}
        user={user}
        tree={tree}
        lang={lang}
      />

    </div>
  );
}
