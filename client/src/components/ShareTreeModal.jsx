import React, { useRef, useState } from 'react';
import { X, Share2, Download, Copy, Check, Sparkles, MessageCircle } from 'lucide-react';

export const ShareTreeModal = ({ isOpen, onClose, user, tree, lang }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);

  if (!isOpen) return null;

  const level = tree?.level || 1;
  const growth = (tree?.growth_percentage || 5).toFixed(1);
  const treeName = tree?.tree_name || 'मेरा कल्पवृक्ष';
  const userName = user?.name || 'Green Warrior';
  const referralCode = user?.referral_code || 'TREE100';

  const levelEmoji = {
    1: '🌰',
    2: '🌱',
    3: '🪴',
    4: '🌿',
    5: '🌲',
    6: '🌳',
    7: '👑'
  }[level] || '🌳';

  const shareText = lang === 'hi'
    ? `🌳 देखिए मेरा Treeniti डिजिटल पेड़ "${treeName}" (लेवल ${level}, ${growth}%)!\n🌱 आइए मिलकर धरती को हरा-भरा बनाएं और असली पैसे कमाएं।\n👉 मेरा रेफरल कोड इस्तेमाल करें: ${referralCode}\n${window.location.origin}`
    : `🌳 Check out my Treeniti digital tree "${treeName}" (Level ${level}, ${growth}%)!\n🌱 Plant trees, nurture the planet and earn real rewards!\n👉 Use my referral code: ${referralCode}\n${window.location.origin}`;

  // Generate Image onto HTML5 Canvas and Download
  const handleDownloadImage = () => {
    setDownloading(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient (Lush Emerald & Sky)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1350);
    bgGrad.addColorStop(0, '#064e3b'); // Dark emerald
    bgGrad.addColorStop(0.4, '#042f2e'); // Deep teal
    bgGrad.addColorStop(0.85, '#022c22');
    bgGrad.addColorStop(1, '#1c1917'); // Soil stone
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // 2. Decorative Green Glowing Circles
    const glow = ctx.createRadialGradient(540, 600, 50, 540, 600, 450);
    glow.addColorStop(0, 'rgba(52, 211, 153, 0.25)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(540, 600, 450, 0, Math.PI * 2);
    ctx.fill();

    // 3. Ornate Golden Border
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 14;
    ctx.strokeRect(36, 36, 1080 - 72, 1350 - 72);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(52, 52, 1080 - 104, 1350 - 104);

    // 4. Header Brand
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText('🌳 TREENITI • त्रिनिति 🌳', 540, 130);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText(lang === 'hi' ? 'डिजिटल हरियाली से असली पर्यावरण क्रांति' : 'Gamified Green Afforestation Platform', 540, 175);

    // 5. Tree Name Card
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 54px "Segoe UI", sans-serif';
    ctx.fillText(treeName, 540, 260);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '28px "Segoe UI", sans-serif';
    ctx.fillText(`${lang === 'hi' ? 'संरक्षक' : 'Nurtured by'}: ${userName}`, 540, 310);

    // 6. Tree Center Visual Emoji
    ctx.font = '280px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
    ctx.fillText(levelEmoji, 540, 680);

    // 7. Stats Banner Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(140, 780, 800, 220, 28);
    ctx.fill();
    ctx.stroke();

    // Stats Texts
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText(`${lang === 'hi' ? 'स्तर' : 'Level'} ${level} • ${tree?.level >= 7 ? '👑 Kalpavriksha' : 'Tree Stage'}`, 540, 840);

    ctx.font = 'bold 44px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`${growth}% ${lang === 'hi' ? 'विकास पूर्ण' : 'Growth Completed'}`, 540, 910);

    ctx.font = '26px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`💧 ${tree?.water_count || 0} Waters • 🍎 ${tree?.fruits_count || 0} Harvested Fruits`, 540, 960);

    // 8. Referral Code Footer Box
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(180, 1040, 720, 140, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(lang === 'hi' ? 'मेरे साथ जुड़ें और ₹21 + लाइफटाइम रिवॉर्ड पाएं!' : 'Join me on Treeniti & earn welcome rewards!', 540, 1085);

    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${lang === 'hi' ? 'रेफरल कोड' : 'Referral'}: ${referralCode}`, 540, 1140);

    // 9. Bottom URL & Timestamp
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('www.treeniti.org • Verified Green Impact', 540, 1260);

    // Convert to Image and Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Treeniti_Tree_${userName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloading(false);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Treeniti - ${treeName}`,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {}
    } else {
      handleCopyText();
    }
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-emerald-500/40 p-5 sm:p-6 shadow-2xl text-white my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center text-2xl shadow-lg mb-2">
            📸
          </div>
          <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            {lang === 'hi' ? 'पेड़ की फोटो शेयर करें' : 'Share Tree Image'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'hi' ? 'अपने पेड़ का सुंदर इमेज कार्ड बनाएं और दोस्तों के साथ शेयर करें!' : 'Generate your tree card and showcase green progress!'}
          </p>
        </div>

        {/* Live Tree Preview Card */}
        <div className="relative bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 p-5 rounded-2xl border-2 border-emerald-500/40 shadow-xl text-center space-y-3 overflow-hidden select-none">
          <div className="absolute top-2 right-2 text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
            {referralCode}
          </div>

          <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
            TREENITI GREEN GUARDIAN
          </div>

          <h3 className="text-xl font-black text-white">
            {treeName}
          </h3>

          <div className="text-7xl sm:text-8xl my-2 filter drop-shadow(0 0 20px rgba(52,211,153,0.5))">
            {levelEmoji}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">{lang === 'hi' ? 'स्तर' : 'Stage'}</span>
              <strong className="text-emerald-300">Level {level}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">{lang === 'hi' ? 'विकास' : 'Growth'}</span>
              <strong className="text-amber-300">{growth}%</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {/* 1. Download Generated High-Res Image */}
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? (lang === 'hi' ? 'इमेज बन रही है...' : 'Generating Image...') : (lang === 'hi' ? 'पेड़ की HD फोटो सेव करें (Download Image)' : 'Download HD Tree Image')}</span>
          </button>

          {/* 2. Direct WhatsApp Share */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 px-4 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer border border-emerald-500/30"
          >
            <MessageCircle className="w-4 h-4 text-emerald-300" />
            <span>{lang === 'hi' ? 'व्हाट्सएप पर शेयर करें (WhatsApp)' : 'Share via WhatsApp'}</span>
          </button>

          <div className="flex gap-2">
            {/* 3. Native Share */}
            <button
              onClick={handleShareNative}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95 transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'hi' ? 'शेयर करें' : 'Share'}</span>
            </button>

            {/* 4. Copy Invite Link */}
            <button
              onClick={handleCopyText}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? (lang === 'hi' ? 'कॉपी हुआ!' : 'Copied!') : (lang === 'hi' ? 'लिंक कॉपी करें' : 'Copy Text')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
