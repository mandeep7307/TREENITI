import React from 'react';
import { X, Download, Smartphone, CheckCircle, Share2, Sparkles } from 'lucide-react';

export const InstallModal = ({ isOpen, onClose, onNativeInstall, deferredPrompt, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-emerald-500/40 p-6 shadow-2xl text-white text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20 mb-3">
          🌳
        </div>

        <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
          {lang === 'hi' ? 'Treeniti ऐप मोबाइल में इंस्टॉल करें' : 'Install Treeniti on Your Phone'}
        </h2>

        <p className="text-xs text-slate-300 mt-1 mb-4 leading-relaxed">
          {lang === 'hi'
            ? 'Treeniti को अपने Android या iPhone मोबाइल में एक असली ऐप की तरह इंस्टॉल करें और बिना ब्राउज़र के फुल स्क्रीन में खेलें!'
            : 'Install Treeniti directly onto your Android or iPhone home screen and play in fullscreen native app mode!'}
        </p>

        {/* Action Button: If deferredPrompt is available */}
        {deferredPrompt ? (
          <button
            onClick={() => {
              onNativeInstall();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mb-4"
          >
            <Download className="w-5 h-5" />
            <span>{lang === 'hi' ? 'अभी मोबाइल में इंस्टॉल करें (Install Now)' : 'Install Now to Phone'}</span>
          </button>
        ) : null}

        {/* Step-by-Step Instructions for Mobile Users */}
        <div className="space-y-2.5 text-left bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold shrink-0">Android</span>
            <p className="text-slate-300">
              {lang === 'hi'
                ? 'Chrome ब्राउज़र में ऊपर 3-डॉट्स (⋮) पर क्लिक करें और "Install app" या "Add to Home screen" चुनें।'
                : 'In Chrome browser, tap the 3 dots (⋮) at top right and choose "Install app" or "Add to Home screen".'}
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold shrink-0">iPhone / iOS</span>
            <p className="text-slate-300">
              {lang === 'hi'
                ? 'Safari ब्राउज़र में नीचे शेयर बटन (⎙) दबाएं और "Add to Home Screen (होम स्क्रीन पर जोड़ें)" चुनें।'
                : 'In Safari browser, tap the Share icon at the bottom and select "Add to Home Screen".'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-3 text-[11px] text-emerald-400 font-semibold">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>100% Free & Safe</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast Native Feel</span>
          </span>
        </div>

      </div>
    </div>
  );
};
