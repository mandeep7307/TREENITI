import React from 'react';
import { Download, Globe, Award, LogIn, Home, Target, BookOpen, Users, Wallet, Camera, Trophy, Shield } from 'lucide-react';

export const Navbar = ({
  user,
  wallet,
  lang,
  onToggleLang,
  onInstallApp,
  onOpenLogin,
  onOpenProfile,
  onOpenCertificate,
  activeTab,
  setActiveTab,
  t
}) => {
  const navLinks = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'earn', label: t.navEarn, icon: Target },
    { id: 'articles', label: t.navArticles, icon: BookOpen },
    { id: 'team', label: t.navTeam, icon: Users },
    { id: 'plantation', label: t.navPlantation, icon: Camera },
    { id: 'wallet', label: t.navWallet, icon: Wallet },
    { id: 'leaderboard', label: t.navRanks, icon: Trophy }
  ];

  if (user?.role === 'admin') {
    navLinks.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-emerald-500/20 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl">🌳</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                TREENITI
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                त्रिनिति
              </span>
            </div>
            <p className="text-[9px] text-slate-400 hidden lg:block -mt-1 font-medium">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* DESKTOP NAVIGATION TABS (Visible on screens >= md) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Install App, Lang Switcher, Wallet Coins, Profile/Login */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Install Mobile App Button */}
          <button
            onClick={onInstallApp}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black cursor-pointer shadow-md active:scale-95 transition-all"
            title="Install Treeniti App on your mobile device"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'hi' ? 'ऐप इंस्टॉल करें' : 'Install App'}</span>
            <span className="sm:hidden">{lang === 'hi' ? 'ऐप' : 'App'}</span>
          </button>

          {/* Language Switcher (हिंदी / English) */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{lang === 'hi' ? 'English' : 'हिंदी'}</span>
          </button>

          {/* Certificate Quick Button */}
          {user && (
            <button
              onClick={onOpenCertificate}
              title={t.certificate}
              className="hidden lg:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 cursor-pointer transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="font-semibold">{t.certificate}</span>
            </button>
          )}

          {/* Wallet Coins Badge */}
          {user && (
            <div
              onClick={() => setActiveTab('wallet')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-950/60 to-emerald-950/60 border border-amber-500/40 px-3 py-1.5 rounded-2xl cursor-pointer hover:border-amber-400 transition-all select-none shadow-sm"
            >
              <span className="text-amber-400 font-extrabold text-xs sm:text-sm">🪙 {wallet?.coins || 0}</span>
              <span className="text-slate-400 text-[10px]">≈</span>
              <span className="text-emerald-400 font-bold text-xs sm:text-sm">₹{((wallet?.coins || 0) / 100).toFixed(1)}</span>
            </div>
          )}

          {/* User Profile / Login Button */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-base shadow-md border border-emerald-400/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>{user.avatar || '👤'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.login}</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
