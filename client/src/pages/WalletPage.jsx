import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownCircle, ArrowUpRight, CheckCircle2, Clock, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { sounds } from '../audio';
import confetti from 'canvas-confetti';

export const WalletPage = ({ user, wallet, onRefreshUser, lang, t }) => {
  const [walletData, setWalletData] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('10');
  const [upiId, setUpiId] = useState(wallet?.upi_id || '');
  const [coinsToConvert, setCoinsToConvert] = useState(100);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const res = await fetch(`/api/wallet/${user.id}`);
      const data = await res.json();
      setWalletData(data);
      if (data.wallet?.upi_id && !upiId) {
        setUpiId(data.wallet.upi_id);
      }
    } catch (e) {}
  };

  const handleConvertCoins = async () => {
    if (!walletData?.wallet?.coins || walletData.wallet.coins < 100) {
      setMsg({ type: 'error', text: lang === 'hi' ? 'कम से कम 100 कॉइन्स होने चाहिए!' : 'Minimum 100 coins required to convert!' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/wallet/convert-coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, coinsToConvert: 100 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');

      sounds.playCoin();
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      setMsg({ type: 'success', text: lang === 'hi' ? '100 कॉइन्स को ₹1.00 कैश में बदला गया!' : 'Converted 100 Coins into ₹1.00 cash!' });
      fetchWallet();
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!upiId || !upiId.includes('@')) {
      setMsg({ type: 'error', text: lang === 'hi' ? 'कृपया सही UPI ID दर्ज करें (उदा. 9876543210@paytm)' : 'Please enter valid UPI ID' });
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 10) {
      setMsg({ type: 'error', text: lang === 'hi' ? 'न्यूनतम विड्रॉल राशि ₹10 है!' : 'Minimum withdrawal is ₹10!' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amountInr: amt, upiId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed');

      sounds.playLevelUp();
      setMsg({ type: 'success', text: lang === 'hi' ? data.message : data.message_en });
      fetchWallet();
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const cashBal = walletData?.wallet?.cash_balance || wallet?.cash_balance || 0;
  const coinBal = walletData?.wallet?.coins || wallet?.coins || 0;
  const refEarn = walletData?.wallet?.referral_earnings || wallet?.referral_earnings || 0;

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto">
      
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-5 border border-emerald-500/30 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              {t.walletBalance} (UPI Cash)
            </span>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 mt-1">
              ₹{cashBal.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold block">
              {t.coins} {lang === 'hi' ? 'शेष' : 'Balance'}
            </span>
            <div className="text-xl font-bold text-amber-300 mt-1">
              🪙 {coinBal}
            </div>
          </div>
        </div>

        {/* 100 Coins = ₹1 Converter Action */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-amber-300 block">100 {t.coins} = ₹1.00</span>
            <span className="text-[10px] text-slate-400">{lang === 'hi' ? 'कॉइन्स को विड्रॉल कैश में बदलें' : 'Convert Coins to Withdrawable Cash'}</span>
          </div>
          <button
            onClick={handleConvertCoins}
            disabled={loading || coinBal < 100}
            className={`py-1.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              coinBal >= 100
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {lang === 'hi' ? 'कन्वर्ट करें 💱' : 'Convert 💱'}
          </button>
        </div>

        {/* Mini stats */}
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 text-xs text-slate-400">
          <div>
            <span>{lang === 'hi' ? 'रेफरल से कमाई:' : 'Referral Earnings:'}</span>
            <strong className="text-emerald-400 block font-semibold">₹{refEarn.toFixed(2)}</strong>
          </div>
          <div className="text-right">
            <span>{lang === 'hi' ? 'कुल निकाला गया:' : 'Total Withdrawn:'}</span>
            <strong className="text-slate-200 block font-semibold">₹{(walletData?.wallet?.total_withdrawn || 0).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Alert message if any */}
      {msg.text && (
        <div className={`p-3 rounded-2xl text-xs font-bold text-center border ${
          msg.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
        }`}>
          {msg.text}
        </div>
      )}

      {/* UPI Withdrawal Form */}
      <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-white space-y-4">
        <div className="flex items-center gap-2">
          <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">
            {lang === 'hi' ? 'UPI में तत्काल विड्रॉल' : 'Instant UPI Withdrawal'}
          </h2>
        </div>

        <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
          {t.minWithdrawalNotice}
        </p>

        <form onSubmit={handleWithdraw} className="space-y-3">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              {lang === 'hi' ? 'विड्रॉल राशि (₹ INR)' : 'Withdrawal Amount (₹ INR)'}
            </label>
            <input
              type="number"
              min="10"
              step="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1">
              {lang === 'hi' ? 'UPI ID (Google Pay / PhonePe / Paytm)' : 'UPI ID (GPay / PhonePe / Paytm)'}
            </label>
            <input
              type="text"
              placeholder="username@okaxis or 9876543210@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || cashBal < 10}
            className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              cashBal >= 10
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{loading ? (lang === 'hi' ? 'प्रक्रिया चल रही है...' : 'Processing...') : t.withdrawBtn}</span>
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 text-white space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {lang === 'hi' ? 'विड्रॉल इतिहास (Withdrawal Status)' : 'Withdrawal History'}
        </h3>

        <div className="space-y-2">
          {walletData?.withdrawals && walletData.withdrawals.length > 0 ? (
            walletData.withdrawals.map((w) => (
              <div key={w.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">₹{w.amount_inr} → {w.upi_id}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(w.created_at).toLocaleDateString()} {w.utr_number ? `| UTR: ${w.utr_number}` : ''}
                  </span>
                </div>

                <div>
                  {w.status === 'approved' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approved</span>
                    </span>
                  )}
                  {w.status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Pending</span>
                    </span>
                  )}
                  {w.status === 'rejected' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-slate-500">
              {lang === 'hi' ? 'अभी तक कोई विड्रॉल नहीं हुआ है।' : 'No withdrawal records yet.'}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
