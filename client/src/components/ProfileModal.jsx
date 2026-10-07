import React, { useState } from 'react';
import { X, User, Edit2, LogOut, Check, Sparkles } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose, user, tree, wallet, onUpdateProfile, onRenameTree, onLogout, lang, t }) => {
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '🌳');
  const [treeName, setTreeName] = useState(tree?.tree_name || '');
  const [isEditingTree, setIsEditingTree] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const avatars = ['🌳', '🌲', '🌴', '🪴', '🌸', '🦁', '🦅', '🦋', '🦊', '🍀'];

  const handleSave = () => {
    onUpdateProfile({ name, avatar });
    if (isEditingTree && treeName.trim()) {
      onRenameTree(treeName.trim());
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-emerald-500/40 p-6 shadow-2xl text-white">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-center text-white mb-4">
          {lang === 'hi' ? 'मेरी प्रोफ़ाइल' : 'User Profile'}
        </h2>

        {/* Avatar Select */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">{avatar}</div>
          <span className="text-[11px] text-slate-400 block mb-1.5">
            {lang === 'hi' ? 'अवतार चुनें:' : 'Select Avatar:'}
          </span>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-xs mx-auto">
            {avatars.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                  avatar === a ? 'bg-emerald-500/40 border border-emerald-400 scale-110' : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {lang === 'hi' ? 'आपका नाम' : 'Your Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">
              {lang === 'hi' ? 'पेड़ का नाम (Tree Name)' : 'Tree Name'}
            </label>
            <input
              type="text"
              value={treeName}
              onChange={(e) => {
                setTreeName(e.target.value);
                setIsEditingTree(true);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>{lang === 'hi' ? 'मोबाइल:' : 'Mobile:'}</span>
              <span className="font-mono text-white">{user?.phone}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{lang === 'hi' ? 'रेफरल कोड:' : 'Referral Code:'}</span>
              <span className="font-mono text-amber-300 font-bold">{user?.referral_code}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{lang === 'hi' ? 'भूमिका (Role):' : 'Role:'}</span>
              <span className="capitalize text-emerald-400 font-semibold">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{saved ? (lang === 'hi' ? 'सहेजा गया!' : 'Saved!') : (lang === 'hi' ? 'सहेजें (Save Changes)' : 'Save Changes')}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
