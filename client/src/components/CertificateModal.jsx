import React, { useRef } from 'react';
import { X, Download, Share2, Award, CheckCircle } from 'lucide-react';

export const CertificateModal = ({ isOpen, onClose, user, tree, lang }) => {
  const certRef = useRef(null);

  if (!isOpen) return null;

  const certId = `TRN-${String(user?.id || 1).padStart(5, '0')}-${new Date().getFullYear()}`;
  const userName = user?.name || 'Green Guardian';
  const treeName = tree?.tree_name || 'My Tree';
  const dateStr = new Date(tree?.created_at || Date.now()).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Treeniti Tree Adoption Certificate',
        text: `मैंने Treeniti पर डिजिटल पेड़ "${treeName}" लगाया है! मेरा Tree ID: ${certId} 🌱`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`I planted a tree on Treeniti! Tree ID: ${certId}`);
      alert(lang === 'hi' ? 'सर्टिफिकेट लिंक क्लिपबोर्ड में कॉपी हो गया!' : 'Certificate link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 rounded-3xl border border-emerald-500/30 p-4 sm:p-6 shadow-2xl my-auto text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Printable Area */}
        <div
          ref={certRef}
          className="relative bg-gradient-to-b from-[#fbf8f1] via-[#fffdf9] to-[#f7f3e8] text-slate-900 rounded-2xl p-6 sm:p-8 border-8 border-double border-emerald-800 shadow-2xl overflow-hidden select-none"
        >
          {/* Subtle Watermark Tree */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="text-[260px]">🌳</span>
          </div>

          {/* Top Header */}
          <div className="text-center relative z-10 space-y-1">
            <div className="flex justify-center items-center gap-2 text-emerald-800 font-black tracking-widest text-xs uppercase">
              <Award className="w-4 h-4 text-amber-600" />
              <span>TREENITI GREEN FOUNDATION</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-black text-emerald-950 uppercase tracking-wide pt-1">
              {lang === 'hi' ? 'वृक्षारोपण एवं संरक्षण प्रमाण पत्र' : 'CERTIFICATE OF TREE ADOPTION'}
            </h1>
            <p className="text-xs text-emerald-700 italic font-medium">
              Certificate ID: <strong className="font-mono text-slate-800">{certId}</strong>
            </p>
          </div>

          {/* Certificate Body */}
          <div className="text-center my-6 relative z-10 space-y-3">
            <p className="text-xs text-slate-600 tracking-wide">
              {lang === 'hi' ? 'यह प्रमाणित किया जाता है कि पर्यावरण रक्षक' : 'This is proudly presented to'}
            </p>

            <div className="text-xl sm:text-2xl font-serif font-black text-emerald-900 border-b-2 border-dashed border-emerald-800/40 pb-1.5 mx-auto max-w-sm">
              {userName}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed max-w-md mx-auto">
              {lang === 'hi'
                ? `ने धरती को हरा-भरा बनाने के संकल्प के साथ डिजिटल वृक्ष "${treeName}" का सफल रोपण एवं पोषण किया है। इनके निरंतर जल एवं देखभाल से पर्यावरण संरक्षण में अमूल्य योगदान दर्ज हुआ है।`
                : `has actively planted and nurtured the digital sacred tree "${treeName}", committing to environmental awareness, tree stewardship, and reduction of global carbon footprints.`}
            </p>
          </div>

          {/* Tree Details Card */}
          <div className="grid grid-cols-3 gap-2 bg-emerald-50/90 rounded-xl p-3 border border-emerald-200 text-center relative z-10 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">{lang === 'hi' ? 'पेड़ का नाम' : 'Tree Name'}</span>
              <strong className="text-emerald-900 truncate block">{treeName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">{lang === 'hi' ? 'स्तर / स्थिति' : 'Tree Stage'}</span>
              <strong className="text-emerald-800">Level {tree?.level || 1} ({tree?.growth_percentage || 5}%)</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">{lang === 'hi' ? 'रोपण तिथि' : 'Adoption Date'}</span>
              <strong className="text-slate-800">{dateStr}</strong>
            </div>
          </div>

          {/* Footer Seals & Verification */}
          <div className="mt-6 flex items-end justify-between relative z-10 pt-2 border-t border-emerald-900/10">
            {/* Seal */}
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-600 bg-amber-50 flex items-center justify-center text-amber-700 shadow-sm text-xs font-black">
                SEAL
              </div>
              <div className="text-left text-[10px] text-slate-600">
                <span className="font-bold text-emerald-900 block">Verified Green Asset</span>
                <span>Treeniti Protocol v2</span>
              </div>
            </div>

            {/* Signature */}
            <div className="text-right">
              <div className="font-serif italic font-bold text-emerald-950 text-sm border-b border-slate-400 pb-0.5">
                Pawan Sharma
              </div>
              <span className="text-[10px] text-slate-500 block">Chief Green Officer</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'hi' ? 'सर्टिफिकेट प्रिंट / सेव करें' : 'Print / Save Certificate'}</span>
          </button>
          <button
            onClick={handleShare}
            className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer border border-slate-700 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>{lang === 'hi' ? 'शेयर करें' : 'Share'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
