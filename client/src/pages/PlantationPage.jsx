import React, { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, Clock, XCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { sounds } from '../audio';
import confetti from 'canvas-confetti';

export const PlantationPage = ({ user, lang, t }) => {
  const [proofs, setProofs] = useState([]);
  const [selectedStage, setSelectedStage] = useState('day_1');
  const [treeName, setTreeName] = useState('Neem Tree (नीम का पेड़)');
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      fetchProofs();
    }
  }, [user]);

  const fetchProofs = async () => {
    try {
      const res = await fetch(`/api/plantation/my-proofs/${user.id}`);
      const data = await res.json();
      setProofs(data.proofs || []);
    } catch (e) {}
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      setMsg(lang === 'hi' ? 'कृपया पौधे की फोटो चुनें!' : 'Please select a photo of your tree!');
      return;
    }

    setUploading(true);
    setMsg('');

    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('treeName', treeName);
    formData.append('stage', selectedStage);
    formData.append('photo', photoFile);

    try {
      const res = await fetch('/api/plantation/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      sounds.playLevelUp();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setMsg(lang === 'hi' ? data.message : data.message_en);
      setPhotoFile(null);
      setPreviewUrl('');
      fetchProofs();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const stages = [
    { key: 'day_1', label: t.day1, icon: '🌱' },
    { key: 'day_7', label: t.day7, icon: '🌿' },
    { key: 'day_15', label: t.day15, icon: '🪴' },
    { key: 'day_30', label: t.day30, icon: '🌳' }
  ];

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto">
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-4 sm:p-5 border border-emerald-500/30 text-white shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-lg">
            📸
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-amber-300">
              {t.realPlantationTitle}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.realPlantationDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-white space-y-4 shadow-md">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'hi' ? 'नया पौधा फोटो अपलोड करें' : 'Upload Tree Growth Photo'}</span>
        </h2>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center">
            {msg}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-3">
          {/* Stage selection */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-semibold">
              {lang === 'hi' ? 'विकास चरण चुनें:' : 'Select Growth Stage:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stages.map((st) => (
                <button
                  type="button"
                  key={st.key}
                  onClick={() => setSelectedStage(st.key)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedStage === st.key
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 scale-102'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">{st.icon}</span>
                  <span className="text-[11px]">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tree Name */}
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">
              {lang === 'hi' ? 'पेड़ की प्रजाति / नाम' : 'Tree Species / Name'}
            </label>
            <input
              type="text"
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Photo File Picker / Camera */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5 font-semibold">
              {t.uploadPhoto}
            </label>
            
            <label className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-800/40 transition-all text-center">
              {previewUrl ? (
                <div className="space-y-2">
                  <img src={previewUrl} alt="Preview" className="h-32 rounded-xl object-cover mx-auto shadow-md" />
                  <span className="text-[10px] text-emerald-400 font-bold block">✓ {lang === 'hi' ? 'फोटो चुनी गई (बदलने के लिए क्लिक करें)' : 'Photo Selected (Click to change)'}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-emerald-400 mb-1" />
                  <span className="text-xs font-bold text-slate-200">
                    {lang === 'hi' ? 'कैमरा से फोटो खींचें या फाइल चुनें' : 'Snap photo or browse file'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WebP supported</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || !photoFile}
            className={`w-full py-3 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              photoFile
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{uploading ? (lang === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...') : (lang === 'hi' ? 'वेरिफिकेशन के लिए भेजें' : 'Submit for Verification')}</span>
          </button>
        </form>
      </div>

      {/* Uploaded History Status */}
      <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-white space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {lang === 'hi' ? 'अपलोड किए गए पौधे & स्टेटस' : 'Submitted Proofs & Verification Status'}
        </h3>

        <div className="space-y-2.5">
          {proofs && proofs.length > 0 ? (
            proofs.map((p) => (
              <div key={p.id} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={p.photo_url}
                    alt={p.stage}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-600 shadow-sm"
                  />
                  <div>
                    <span className="font-bold text-white block capitalize">{p.tree_name} ({p.stage.replace('_', ' ').toUpperCase()})</span>
                    <span className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>
                    {p.admin_comment && (
                      <span className="text-[10px] text-amber-300 block italic mt-0.5">Note: {p.admin_comment}</span>
                    )}
                  </div>
                </div>

                <div>
                  {p.status === 'approved' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>+{p.coins_rewarded || 100}🪙 Verified</span>
                    </span>
                  )}
                  {p.status === 'pending' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Under Review</span>
                    </span>
                  )}
                  {p.status === 'rejected' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              {lang === 'hi' ? 'अभी तक कोई फोटो अपलोड नहीं की गई है।' : 'No tree photos uploaded yet.'}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
