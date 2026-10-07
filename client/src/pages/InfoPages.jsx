import React, { useState } from 'react';
import { HelpCircle, Info, Shield, FileText, MessageSquare, Send, CheckCircle2, ChevronRight } from 'lucide-react';
import { sounds } from '../audio';

export const InfoPages = ({ viewType, user, lang, t, onBack }) => {
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 1, rating, message: feedbackMsg })
      });
      if (res.ok) {
        sounds.playLevelUp();
        setSubmitted(true);
        setFeedbackMsg('');
      }
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto text-white">
      
      {/* FEEDBACK PAGE */}
      {viewType === 'feedback' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold">
              {lang === 'hi' ? 'आपकी प्रतिक्रिया (Feedback)' : 'Share Your Feedback'}
            </h1>
          </div>

          <p className="text-xs text-slate-300">
            {lang === 'hi' ? 'Treeniti को बेहतर बनाने के लिए आपके विचार और सुझाव हमारे लिए अत्यंत महत्वपूर्ण हैं।' : 'Your suggestions help us cultivate a greener and better experience!'}
          </p>

          {submitted ? (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
              <div>{lang === 'hi' ? 'धन्यवाद! आपकी प्रतिक्रिया दर्ज कर ली गई है।' : 'Thank you! Your feedback has been recorded.'}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {lang === 'hi' ? 'रेटिंग (Rating):' : 'Rating:'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl cursor-pointer transition-transform ${
                        star <= rating ? 'scale-110' : 'opacity-30'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {lang === 'hi' ? 'अपना संदेश या सुझाव लिखें:' : 'Your message or suggestion:'}
                </label>
                <textarea
                  rows={4}
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder={lang === 'hi' ? 'यहाँ लिखें...' : 'Write here...'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !feedbackMsg.trim()}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? '...' : (lang === 'hi' ? 'सबमिट करें' : 'Submit Feedback')}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ABOUT US */}
      {viewType === 'about' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold">
              {lang === 'hi' ? 'त्रिनिति (Treeniti) के बारे में' : 'About Treeniti'}
            </h1>
          </div>
          <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
            <p>
              {lang === 'hi'
                ? 'Treeniti एक अनूठा पर्यावरण-केंद्रित गेमिंग और अर्निंग प्लेटफ़ॉर्म है जिसका उद्देश्य डिजिटल तकनीक को वास्तविक वृक्षारोपण से जोड़ना है।'
                : 'Treeniti is a revolutionary eco-gamified platform connecting digital gamification directly to real-world afforestation.'}
            </p>
            <p>
              {lang === 'hi'
                ? 'हमारा मिशन: हर नागरिक को डिजिटल रूप से पेड़ लगाने के प्रति जागरूक करना और वास्तविक धरातल पर पौधे लगाने पर पुरस्कृत करना। 100 कॉइन्स = ₹1 की अर्थव्यवस्था से हम सतत विकास को बढ़ावा देते हैं।'
                : 'Our Mission: Empowering citizens to adopt trees digitally, plant saplings locally, and earn verifiable financial rewards through our 100 Coins = ₹1 transparent green economy.'}
            </p>
          </div>
        </div>
      )}

      {/* HELP & SUPPORT */}
      {viewType === 'help' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold">
              {lang === 'hi' ? 'मदद एवं सहायता (Help & Support)' : 'Help & Support'}
            </h1>
          </div>
          <div className="text-xs text-slate-300 space-y-2">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <strong className="text-white block">Q. विड्रॉल कितने समय में आता है?</strong>
              <span className="text-slate-400 mt-1 block">Ans. UPI विड्रॉल अनुरोध 12 से 24 कार्य घंटों के भीतर सीधे आपके बैंक खाते में स्थानांतरित कर दिया जाता है।</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <strong className="text-white block">Q. पेड़ को एक दिन में कितना पानी दे सकते हैं?</strong>
              <span className="text-slate-400 mt-1 block">Ans. पेड़ की अधिकतम दैनिक वृद्धि सीमा 4% है। कोटा पूरा होने के बाद अगले दिन पानी दें।</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <strong className="text-white block">Q. सहायता संपर्क:</strong>
              <span className="text-emerald-400 font-mono mt-1 block">support@treeniti.org | WhatsApp Helpline: +91 99999 99999</span>
            </div>
          </div>
        </div>
      )}

      {/* TERMS & CONDITIONS */}
      {viewType === 'terms' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold">
              {lang === 'hi' ? 'नियम व शर्तें (Terms & Conditions)' : 'Terms & Conditions'}
            </h1>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>1. एक डिवाइस पर केवल एक सक्रिय अकाउंट की अनुमति है। क्लोनिंग या फ्रॉड डिटेक्ट होने पर अकाउंट प्रतिबंधित किया जा सकता है।</p>
            <p>2. न्यूनतम विड्रॉल सीमा ₹10 है और यह केवल उपयोगकर्ता के वास्तविक UPI ID पर देय है।</p>
            <p>3. असली पेड़ की फोटो सत्यापन एडमिन द्वारा 24-48 घंटों में किया जाता है। अस्पष्ट या इंटरनेट से डाउनलोड की गई फोटो अमान्य होगी।</p>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY */}
      {viewType === 'privacy' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold">
              {lang === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}
            </h1>
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>हम उपयोगकर्ता के मोबाइल नंबर और गोपनीयता का पूरा सम्मान करते हैं। आपका डेटा कभी भी तीसरे पक्ष को नहीं बेचा जाता।</p>
            <p>अपलोड की गई पौधे की तस्वीरें केवल हरियाली प्रमाणीकरण और कम्युनिटी लीडरबोर्ड के लिए उपयोग की जाती हैं।</p>
          </div>
        </div>
      )}

    </div>
  );
};
