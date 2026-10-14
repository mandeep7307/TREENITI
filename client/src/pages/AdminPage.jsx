import React, { useState, useEffect } from 'react';
import { Shield, Users, ArrowDownCircle, Camera, BookOpen, Settings, CheckCircle2, XCircle, Search, Plus, Trash2, Bell } from 'lucide-react';
import { sounds } from '../audio';

export const AdminPage = ({ adminUser, lang, t }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'withdrawals', 'plantations', 'articles', 'tickers', 'settings'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [plantations, setPlantations] = useState([]);
  const [articles, setArticles] = useState([]);
  const [tickers, setTickers] = useState([]);
  const [treeMessages, setTreeMessages] = useState([]);
  const [newMsg, setNewMsg] = useState({ trigger_type: 'thank_you', level_min: 1, message_hi: '', message_en: '' });
  const [settings, setSettings] = useState({
    coin_rate: '100',
    min_withdrawal: '10',
    daily_growth_limit: '6.0',
    fruit_coin_value: '50'
  });
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // New Article Form
  const [newArt, setNewArt] = useState({
    title_hi: '',
    title_en: '',
    content_hi: '',
    content_en: '',
    category: 'Environment',
    read_time_seconds: 30,
    reward_coins: 25
  });

  // New Ticker Form
  const [newTicker, setNewTicker] = useState({ message_hi: '', message_en: '', icon: '🌱' });

  // Payout UTR state
  const [utrInput, setUtrInput] = useState({});

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchWithdrawals();
    fetchPlantations();
    fetchArticles();
    fetchTickers();
    fetchTreeMessages();
    fetchSettings();
  }, []);

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-admin-id': String(adminUser?.id || 1)
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: adminHeaders });
      const data = await res.json();
      setStats(data);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers: adminHeaders });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {}
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals', { headers: adminHeaders });
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch (e) {}
  };

  const fetchPlantations = async () => {
    try {
      const res = await fetch('/api/admin/plantations', { headers: adminHeaders });
      const data = await res.json();
      setPlantations(data.proofs || []);
    } catch (e) {}
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (e) {}
  };

  const fetchTickers = async () => {
    try {
      const res = await fetch('/api/tickers');
      const data = await res.json();
      setTickers(data.tickers || []);
    } catch (e) {}
  };

  const fetchTreeMessages = async () => {
    try {
      const res = await fetch('/api/admin/tree-messages', { headers: adminHeaders });
      const data = await res.json();
      setTreeMessages(data.messages || []);
    } catch (e) {}
  };

  const handleCreateMsg = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tree-messages', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(newMsg)
      });
      if (res.ok) {
        sounds.playCoin();
        setNewMsg({ trigger_type: 'thank_you', level_min: 1, message_hi: '', message_en: '' });
        fetchTreeMessages();
      }
    } catch (e) {}
  };

  const handleDeleteMsg = async (id) => {
    try {
      await fetch(`/api/admin/tree-messages/${id}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      fetchTreeMessages();
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/system/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (e) {}
  };

  // Process Withdrawal
  const handleWithdrawalAction = async (id, action) => {
    setLoading(true);
    try {
      const utr = utrInput[id] || 'UTR_' + Math.floor(100000 + Math.random() * 900000);
      const res = await fetch(`/api/admin/withdrawals/${id}/action`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ action, utrNumber: utr })
      });
      if (res.ok) {
        sounds.playLevelUp();
        setActionMsg(`Withdrawal #${id} ${action}ed!`);
        fetchWithdrawals();
        fetchStats();
      }
    } catch (e) {}
    setLoading(false);
  };

  // Process Plantation Proof
  const handlePlantationAction = async (id, action) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/plantations/${id}/action`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ action, rewardCoins: 150 })
      });
      if (res.ok) {
        sounds.playLevelUp();
        setActionMsg(`Plantation #${id} ${action}ed!`);
        fetchPlantations();
        fetchStats();
      }
    } catch (e) {}
    setLoading(false);
  };

  // Ban/Unban User
  const handleToggleBan = async (id) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/ban`, {
        method: 'POST',
        headers: adminHeaders
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {}
  };

  // Create Article
  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(newArt)
      });
      if (res.ok) {
        sounds.playCoin();
        setNewArt({
          title_hi: '',
          title_en: '',
          content_hi: '',
          content_en: '',
          category: 'Environment',
          read_time_seconds: 30,
          reward_coins: 25
        });
        fetchArticles();
      }
    } catch (e) {}
  };

  // Delete Article
  const handleDeleteArticle = async (id) => {
    try {
      await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: adminHeaders
      });
      fetchArticles();
    } catch (e) {}
  };

  // Create Ticker
  const handleCreateTicker = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/tickers', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify(newTicker)
      });
      if (res.ok) {
        setNewTicker({ message_hi: '', message_en: '', icon: '🌱' });
        fetchTickers();
      }
    } catch (e) {}
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ settings })
      });
      if (res.ok) {
        setActionMsg('Settings updated successfully!');
      }
    } catch (e) {}
  };

  const filteredUsers = users.filter(
    (u) =>
      u.phone?.includes(searchUser) ||
      u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.referral_code?.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto text-white">
      
      {/* Top Header */}
      <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/70 rounded-3xl p-4 sm:p-5 border border-amber-500/30 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg">
            👑
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-amber-300">
              {lang === 'hi' ? 'Treeniti सुपर एडमिन कंसोल' : 'Super Admin Console'}
            </h1>
            <p className="text-xs text-slate-400">
              {lang === 'hi' ? 'प्रत्येक भाग का पूर्ण नियंत्रण और प्रबंधन' : 'Complete Platform Administration & Governance'}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
          Super Admin
        </span>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
          {actionMsg}
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 text-xs font-bold">
        {[
          { id: 'overview', label: 'Dashboard', icon: Shield },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'withdrawals', label: 'Withdrawals', icon: ArrowDownCircle },
          { id: 'plantations', label: 'Plantations', icon: Camera },
          { id: 'articles', label: 'Articles', icon: BookOpen },
          { id: 'messages', label: 'Tree Messages', icon: Bell },
          { id: 'tickers', label: 'Notice Board', icon: Bell },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 rounded-2xl p-4 border border-emerald-500/20 shadow-md">
            <span className="text-xs text-slate-400 block font-semibold">Total Users</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats?.totalUsers || 0}</span>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 border border-teal-500/20 shadow-md">
            <span className="text-xs text-slate-400 block font-semibold">Total Digital Trees</span>
            <span className="text-2xl font-black text-teal-400 mt-1 block">{stats?.totalTrees || 0}</span>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 border border-amber-500/20 shadow-md">
            <span className="text-xs text-slate-400 block font-semibold">Pending Withdrawals</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{stats?.pendingWithdrawals || 0}</span>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 border border-cyan-500/20 shadow-md">
            <span className="text-xs text-slate-400 block font-semibold">Pending Photo Proofs</span>
            <span className="text-2xl font-black text-cyan-400 mt-1 block">{stats?.pendingPlantations || 0}</span>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 border border-purple-500/20 shadow-md">
            <span className="text-xs text-slate-400 block font-semibold">Coins Distributed</span>
            <span className="text-2xl font-black text-purple-400 mt-1 block">🪙 {stats?.totalCoinsDistributed || 0}</span>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 border border-green-500/20 shadow-md">
            <span className="text-xs text-slate-400 block font-semibold">Total Paid Out</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">₹{(stats?.totalWithdrawnInr || 0).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* 2. USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by phone, name, or referral code..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <span className="text-xs text-slate-400 font-bold">Total: {filteredUsers.length}</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-base">
                    {u.avatar || '👤'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{u.name}</span>
                      {u.role === 'admin' && (
                        <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 rounded font-black">ADMIN</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      📞 {u.phone} | Ref: {u.referral_code} | Level {u.tree_level || 1}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-amber-300 font-black block">🪙 {u.coins || 0}</span>
                    <span className="text-[10px] text-emerald-400">₹{(u.cash_balance || 0).toFixed(1)}</span>
                  </div>

                  <button
                    onClick={() => handleToggleBan(u.id)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                      u.is_banned
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    }`}
                  >
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. WITHDRAWALS MANAGEMENT */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Withdrawal Requests (UPI Payouts)</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {withdrawals.map((w) => (
              <div key={w.id} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-emerald-400">₹{w.amount_inr}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-mono text-white font-bold">{w.upi_id}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    User: {w.user_name} (📞 {w.user_phone}) | Date: {new Date(w.created_at).toLocaleString()}
                  </span>
                  {w.utr_number && (
                    <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">UTR: {w.utr_number}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {w.status === 'pending' ? (
                    <>
                      <input
                        type="text"
                        placeholder="Enter UTR No."
                        value={utrInput[w.id] || ''}
                        onChange={(e) => setUtrInput({ ...utrInput, [w.id]: e.target.value })}
                        className="bg-slate-900 border border-slate-600 rounded-xl px-2.5 py-1 text-xs text-white font-mono w-28"
                      />
                      <button
                        onClick={() => handleWithdrawalAction(w.id, 'approve')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer active:scale-95 transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleWithdrawalAction(w.id, 'reject')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      w.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {w.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. REAL PLANTATION PROOFS */}
      {activeTab === 'plantations' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Live Plantation Verification (Day 1 / 7 / 15 / 30)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {plantations.map((p) => (
              <div key={p.id} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2">
                <div className="flex gap-3">
                  <a href={p.photo_url} target="_blank" rel="noreferrer">
                    <img src={p.photo_url} alt="Tree" className="w-20 h-20 rounded-xl object-cover border border-slate-600 hover:scale-105 transition-transform" />
                  </a>
                  <div className="flex-1">
                    <span className="font-bold text-white block capitalize">{p.tree_name}</span>
                    <span className="text-[10px] text-amber-300 font-bold block uppercase">{p.stage.replace('_', ' ')}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">User: {p.user_name} (📞 {p.user_phone})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                  <span className={`text-[10px] font-black uppercase ${
                    p.status === 'approved' ? 'text-emerald-400' : p.status === 'pending' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    Status: {p.status}
                  </span>

                  {p.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handlePlantationAction(p.id, 'approve')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer active:scale-95"
                      >
                        Approve (+150🪙)
                      </button>
                      <button
                        onClick={() => handlePlantationAction(p.id, 'reject')}
                        className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer active:scale-95"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ARTICLES MANAGEMENT */}
      {activeTab === 'articles' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-5">
          <form onSubmit={handleCreateArticle} className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">नया पर्यावरण लेख जोड़ें (Add Article)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Title in Hindi"
                value={newArt.title_hi}
                onChange={(e) => setNewArt({ ...newArt, title_hi: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
              />
              <input
                type="text"
                placeholder="Title in English"
                value={newArt.title_en}
                onChange={(e) => setNewArt({ ...newArt, title_en: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <textarea
                placeholder="Content in Hindi"
                rows={3}
                value={newArt.content_hi}
                onChange={(e) => setNewArt({ ...newArt, content_hi: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                required
              />
              <textarea
                placeholder="Content in English"
                rows={3}
                value={newArt.content_en}
                onChange={(e) => setNewArt({ ...newArt, content_en: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                required
              />
            </div>
            <div className="flex gap-2 text-xs">
              <input
                type="number"
                placeholder="Read seconds"
                value={newArt.read_time_seconds}
                onChange={(e) => setNewArt({ ...newArt, read_time_seconds: parseInt(e.target.value) })}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white w-32"
              />
              <input
                type="number"
                placeholder="Reward coins"
                value={newArt.reward_coins}
                onChange={(e) => setNewArt({ ...newArt, reward_coins: parseInt(e.target.value) })}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white w-32"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black ml-auto cursor-pointer"
              >
                Publish Article
              </button>
            </div>
          </form>

          {/* Articles list */}
          <div className="space-y-2">
            {articles.map((art) => (
              <div key={art.id} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{art.title_hi}</span>
                  <span className="text-[10px] text-slate-400">{art.title_en} • +{art.reward_coins} 🪙</span>
                </div>
                <button
                  onClick={() => handleDeleteArticle(art.id)}
                  className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TREE TALKING MESSAGES MANAGEMENT */}
      {activeTab === 'messages' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
          <form onSubmit={handleCreateMsg} className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700 text-xs">
            <h3 className="font-bold text-emerald-400">नया ट्री टॉकिंग मैसेज जोड़ें (Tree Talking Speech Bubble)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Trigger Type</label>
                <select
                  value={newMsg.trigger_type}
                  onChange={(e) => setNewMsg({ ...newMsg, trigger_type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="thank_you">Thank You (धन्यवाद)</option>
                  <option value="water">Water Response (पानी)</option>
                  <option value="fertilizer">Fertilizer Response (खाद)</option>
                  <option value="shake">Shake Fruit (पेड़ हिलाना)</option>
                  <option value="random">Random Nature Fact (ज्ञान)</option>
                  <option value="need_water">Need Water Alert (प्यास)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Min Level (1-7)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={newMsg.level_min}
                  onChange={(e) => setNewMsg({ ...newMsg, level_min: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="मैसेज हिंदी में (e.g. धन्यवाद! आपने मुझे पानी दिया...)"
              value={newMsg.message_hi}
              onChange={(e) => setNewMsg({ ...newMsg, message_hi: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              required
            />
            <input
              type="text"
              placeholder="Message in English (e.g. Thank you! You watered me...)"
              value={newMsg.message_en}
              onChange={(e) => setNewMsg({ ...newMsg, message_en: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              required
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer shadow-md"
            >
              Add Tree Message
            </button>
          </form>

          {/* Messages list */}
          <div className="space-y-2">
            {treeMessages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      {msg.trigger_type} (L{msg.level_min}+)
                    </span>
                  </div>
                  <span className="font-bold text-white block">💬 {msg.message_hi}</span>
                  <span className="text-[10px] text-slate-400 block">{msg.message_en}</span>
                </div>
                <button
                  onClick={() => handleDeleteMsg(msg.id)}
                  className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. NOTICE BOARD & TICKERS */}
      {activeTab === 'tickers' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
          <form onSubmit={handleCreateTicker} className="space-y-2.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700 text-xs">
            <h3 className="font-bold text-amber-300">सूचना बोर्ड (Live Running Ticker) में नया नोटिस जोड़ें</h3>
            <input
              type="text"
              placeholder="Notice in Hindi (e.g. रवि ने आज 2 नए पेड़ लगाए...)"
              value={newTicker.message_hi}
              onChange={(e) => setNewTicker({ ...newTicker, message_hi: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              required
            />
            <input
              type="text"
              placeholder="Notice in English"
              value={newTicker.message_en}
              onChange={(e) => setNewTicker({ ...newTicker, message_en: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer"
            >
              Add to Notice Board
            </button>
          </form>

          <div className="space-y-2">
            {tickers.map((t) => (
              <div key={t.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <span className="font-bold text-white block">📢 {t.message_hi}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{t.message_en}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. ECONOMY SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Platform Economy & Policy Settings</h2>
          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">
                Coin Conversion Rate (Coins per ₹1 INR)
              </label>
              <input
                type="number"
                value={settings.coin_rate || '100'}
                onChange={(e) => setSettings({ ...settings, coin_rate: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">
                Minimum Withdrawal (₹ INR)
              </label>
              <input
                type="number"
                value={settings.min_withdrawal || '10'}
                onChange={(e) => setSettings({ ...settings, min_withdrawal: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">
                Daily Tree Growth Limit (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.daily_growth_limit || '4.0'}
                onChange={(e) => setSettings({ ...settings, daily_growth_limit: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">
                Fruit Value (Coins per harvested fruit)
              </label>
              <input
                type="number"
                value={settings.fruit_coin_value || '50'}
                onChange={(e) => setSettings({ ...settings, fruit_coin_value: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              Save Platform Settings
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
