import React from 'react';
import { Home, Target, BookOpen, Users, Wallet, Camera, Trophy, Shield } from 'lucide-react';

export const BottomNav = ({ activeTab, setActiveTab, user, t }) => {
  const tabs = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'earn', label: t.navEarn, icon: Target },
    { id: 'articles', label: t.navArticles, icon: BookOpen },
    { id: 'team', label: t.navTeam, icon: Users },
    { id: 'plantation', label: t.navPlantation, icon: Camera },
    { id: 'wallet', label: t.navWallet, icon: Wallet },
    { id: 'leaderboard', label: t.navRanks, icon: Trophy }
  ];

  if (user?.role === 'admin') {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-emerald-500/20 py-1.5 px-2 select-none shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-emerald-500/20' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 max-w-[55px] truncate text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
