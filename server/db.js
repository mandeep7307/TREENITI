const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'treeniti.db'));
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT 'Green Warrior',
    avatar TEXT DEFAULT '🌳',
    language TEXT DEFAULT 'hi',
    role TEXT DEFAULT 'user',
    referral_code TEXT UNIQUE,
    referred_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
    login_streak INTEGER DEFAULT 1,
    is_banned INTEGER DEFAULT 0,
    device_id TEXT,
    last_3h_claim DATETIME
  );

  CREATE TABLE IF NOT EXISTS trees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    tree_name TEXT DEFAULT 'कल्पवृक्ष (My Tree)',
    level INTEGER DEFAULT 1,
    growth_percentage REAL DEFAULT 5.0,
    daily_growth_today REAL DEFAULT 0.0,
    last_growth_date TEXT DEFAULT '',
    mood TEXT DEFAULT 'Happy',
    water_count INTEGER DEFAULT 0,
    fertilizer_count INTEGER DEFAULT 0,
    fruits_count INTEGER DEFAULT 0,
    last_watered_at DATETIME,
    last_fertilized_at DATETIME,
    last_shaken_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    coins INTEGER DEFAULT 150,
    cash_balance REAL DEFAULT 1.5,
    referral_earnings REAL DEFAULT 0.0,
    task_earnings REAL DEFAULT 0.0,
    total_withdrawn REAL DEFAULT 0.0,
    upi_id TEXT DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount_coins INTEGER DEFAULT 0,
    amount_inr REAL DEFAULT 0.0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount_inr REAL NOT NULL,
    upi_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_note TEXT DEFAULT '',
    utr_number TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS real_plantations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tree_name TEXT NOT NULL,
    stage TEXT NOT NULL, -- 'day_1', 'day_7', 'day_15', 'day_30'
    photo_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_comment TEXT DEFAULT '',
    coins_rewarded INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_hi TEXT NOT NULL,
    title_en TEXT NOT NULL,
    content_hi TEXT NOT NULL,
    content_en TEXT NOT NULL,
    category TEXT DEFAULT 'Environment',
    read_time_seconds INTEGER DEFAULT 30,
    reward_coins INTEGER DEFAULT 20,
    views_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS article_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    read_date TEXT NOT NULL,
    rewarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, article_id, read_date),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );

  CREATE TABLE IF NOT EXISTS daily_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mission_key TEXT NOT NULL,
    title_hi TEXT NOT NULL,
    title_en TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 1,
    reward_coins INTEGER DEFAULT 25,
    is_claimed INTEGER DEFAULT 0,
    date_key TEXT NOT NULL,
    UNIQUE(user_id, mission_key, date_key),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    reward_coins INTEGER NOT NULL,
    is_completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    UNIQUE(user_id, platform),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tree_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger_type TEXT NOT NULL, -- 'water', 'fertilizer', 'shake', 'thank_you', 'random', 'need_water'
    level_min INTEGER DEFAULT 1,
    message_hi TEXT NOT NULL,
    message_en TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS live_tickers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_hi TEXT NOT NULL,
    message_en TEXT NOT NULL,
    icon TEXT DEFAULT '🌱',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    rating INTEGER DEFAULT 5,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

// Insert default system settings
const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO system_settings (key, value, description)
  VALUES (@key, @value, @description)
`);

const defaultSettings = [
  { key: 'coin_rate', value: '100', description: 'Coins required for 1 Rupee (100 coins = ₹1)' },
  { key: 'min_withdrawal', value: '10', description: 'Minimum withdrawal amount in INR' },
  { key: 'daily_growth_limit', value: '4.0', description: 'Maximum daily tree growth percentage' },
  { key: 'fruit_coin_value', value: '50', description: 'Coins per harvested fruit' },
  { key: 'referral_l1_percent', value: '5', description: 'Lifetime commission % for Level 1 referral' },
  { key: 'referral_l2_percent', value: '2', description: 'Lifetime commission % for Level 2 referral' },
  { key: 'shake_interval_minutes', value: '15', description: 'Minutes between Shake Tree games' }
];

for (const s of defaultSettings) {
  insertSetting.run(s);
}

// Seed default Tree Talking Messages
const msgCount = db.prepare('SELECT COUNT(*) as cnt FROM tree_messages').get().cnt;
if (msgCount === 0) {
  const insertMsg = db.prepare(`
    INSERT INTO tree_messages (trigger_type, level_min, message_hi, message_en)
    VALUES (?, ?, ?, ?)
  `);

  const initialMsgs = [
    ['thank_you', 1, 'धन्यवाद! आपने मुझे पानी दिया, मैं आपको शुद्ध हवा दूंगा! 🍃', 'Thank you! You watered me, I will give you pure oxygen! 🍃'],
    ['thank_you', 2, 'वाह! कितनी ताज़गी है। आपकी वजह से हमारी धरती हरी-भरी हो रही है! 💚', 'Wow! So refreshing. Because of you, our Earth is turning greener! 💚'],
    ['thank_you', 3, 'खाद और पानी से मेरी जड़ें मज़बूत हो रही हैं, धन्यवाद दोस्त! 🌳', 'With fertilizer & water, my roots are growing strong, thank you friend! 🌳'],
    ['water', 1, 'आहा! ठंडा-ठंडा पानी पाकर मेरा मन खिल उठा! 💧', 'Ah! Sweet cold water, I feel so refreshed! 💧'],
    ['fertilizer', 1, 'जैविक खाद मिली, अब मैं तेज़ी से बढ़ूँगा और फल दूंगा! 🌿', 'Organic nutrition received, now I will grow faster & bear fruits! 🌿'],
    ['shake', 4, 'अरे वाह! आपने पेड़ हिलाया और मीठे-मीठे फल गिरे, जल्दी लूट लो! 🍎', 'Hurray! You shook the tree and sweet fruits fell, collect them fast! 🍎'],
    ['need_water', 1, 'मुझे प्यास लगी है दोस्त, कृपया थोड़ा पानी दें! 🥺', 'I am thirsty friend, please give me some water! 🥺'],
    ['random', 1, 'पेड़ लगाओ, जीवन बचाओ! एक पेड़ 4 लोगों के लिए ऑक्सीजन देता है। 🌏', 'Plant trees, save life! One tree produces oxygen for 4 people. 🌏'],
    ['random', 3, 'आज के छोटे पौधे ही कल के घने जंगल बनेंगे! 🍀', 'Today’s tiny saplings are tomorrow’s lush forests! 🍀']
  ];

  for (const m of initialMsgs) {
    insertMsg.run(...m);
  }
}

// Seed default Live Tickers
const tickerCount = db.prepare('SELECT COUNT(*) as cnt FROM live_tickers').get().cnt;
if (tickerCount === 0) {
  const insertTicker = db.prepare(`
    INSERT INTO live_tickers (message_hi, message_en, icon)
    VALUES (?, ?, ?)
  `);

  const initialTickers = [
    ['रवि कुमार ने आज 2 नए पेड़ लगाए और ₹15 कमाए! 🌱', 'Ravi Kumar planted 2 real trees today & earned ₹15! 🌱', '🌱'],
    ['अमित शर्मा ने ₹50 का UPI विड्रॉल सफलतापूर्वक प्राप्त किया! 💰', 'Amit Sharma successfully received ₹50 UPI withdrawal! 💰', '💰'],
    ['प्रिया सिंह का पेड़ लेवल 5 (Young Tree) पर पहुँचा! 🌸', 'Priya Singh’s tree reached Level 5 (Young Tree)! 🌸', '🌸'],
    ['सुनील ने 7 दिन का प्लांटेशन प्रूफ अपलोड किया - वेरिफाइड! 📸', 'Sunil uploaded Day 7 plantation proof - Verified! 📸', '📸'],
    ['Treeniti परिवार में अब तक 10,000+ पौधे लगाए जा चुके हैं! 🌳', 'Over 10,000+ trees planted so far in Treeniti family! 🌳', '🌳']
  ];

  for (const t of initialTickers) {
    insertTicker.run(...t);
  }
}

// Seed default environmental articles
const artCount = db.prepare('SELECT COUNT(*) as cnt FROM articles').get().cnt;
if (artCount === 0) {
  const insertArt = db.prepare(`
    INSERT INTO articles (title_hi, title_en, content_hi, content_en, category, read_time_seconds, reward_coins)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertArt.run(
    'पेड़ क्यों हैं हमारे जीवन की संजीवनी बूटी?',
    'Why Are Trees The Lifeline Of Our Planet?',
    `पेड़ हमारे पर्यावरण का सबसे महत्वपूर्ण अंग हैं। एक परिपक्व पेड़ साल भर में लगभग 22 किलोग्राम कार्बन डाइऑक्साइड सोखता है और 100 किलोग्राम शुद्ध ऑक्सीजन प्रदान करता है।

पेड़ न केवल हवा को शुद्ध करते हैं, बल्कि वे मिट्टी के कटाव को रोकते हैं और भूजल स्तर को बढ़ाते हैं। जब हम पेड़ लगाते हैं, तो हम केवल एक पौधा नहीं लगाते, बल्कि आने वाली पीढ़ियों के लिए जीवन बोते हैं।

Treeniti के साथ आपका हर डिजिटल पेड़ वास्तविक धरती पर हरियाली लाने का संकल्प है। नियमित रूप से पानी दें, सीखें और हरियाली फैलाएं!`,
    `Trees are the most vital pillar of our global ecosystem. A single mature tree absorbs roughly 22 kg of carbon dioxide every year and releases around 100 kg of pure oxygen.

Beyond air purification, trees prevent soil erosion and naturally recharge underground aquifers. When we plant a tree, we are planting hope and clean breathable air for the next generation.

With Treeniti, your digital tree journey empowers real-world plantation. Water regularly, educate yourself and spread green love!`,
    'Forestry',
    20,
    30
  );

  insertArt.run(
    'ग्लोबल वार्मिंग से निपटने में पेड़ों की भूमिका',
    'How Planting Trees Combats Global Warming',
    `आज पृथ्वी का तापमान लगातार बढ़ रहा है। अत्यधिक औद्योगिकीकरण और पेड़ों की कटाई के कारण कार्बन उत्सर्जन चरम पर है।

वैज्ञानिकों का मानना है कि यदि हम प्रति व्यक्ति कम से कम 5 पेड़ लगाएं और उनकी देखभाल करें, तो वैश्विक तापमान वृद्धि को नियंत्रित किया जा सकता है।

पेड़ प्राकृतिक एयर कंडीशनर के रूप में कार्य करते हैं। वे शहरों में तापमान को 2 से 8 डिग्री सेल्सियस तक कम कर सकते हैं। आइए आज ही एक पौधा लगाएं और उसका ख्याल रखें!`,
    `Global temperatures are climbing at alarming rates. Industrial emissions paired with deforestation have triggered serious climate shifts.

Environmental scientists report that planting and nurturing 5 trees per citizen could dramatically curb global temperature increases.

Trees act as nature's original air conditioners, lowering local city temperatures by 2 to 8 degrees Celsius. Pledge to plant and protect trees today!`,
    'Climate Change',
    25,
    35
  );

  insertArt.run(
    'जैविक खाद और प्राकृतिक कीटनाशक के फायदे',
    'Benefits of Organic Fertilizer & Natural Pest Control',
    `रासायनिक खादों और कीटनाशकों से हमारी मिट्टी की उर्वरता नष्ट हो रही है। जैविक खाद (वर्मीकम्पोस्ट, गोबर खाद) मिट्टी में सूक्ष्मजीवों को सक्रिय करती है।

नीम का तेल और गोमूत्र जैसे प्राकृतिक कीटनाशक पर्यावरण को नुकसान पहुंचाए बिना हानिकारक कीटों से पौधों की रक्षा करते हैं।

अपने घर के बगीचे और पौधों में प्राकृतिक तरीकों का इस्तेमाल करें, जिससे पौधे लंबे समय तक स्वस्थ और फलदायी बने रहें।`,
    `Synthetic fertilizers degrade topsoil health over time. Organic compost and vermicompost nurture vital soil microorganisms naturally.

Neem oil extract and natural pest repellents safeguard plants without contaminating water bodies or harming beneficial pollinators like bees.

Choose natural care for your garden and nurture sustainable green growth!`,
    'Plant Care',
    20,
    25
  );
}

// Seed Super Admin user if not exists
const adminUser = db.prepare('SELECT id FROM users WHERE phone = ?').get('9999999999');
if (!adminUser) {
  const insertUser = db.prepare(`
    INSERT INTO users (phone, name, role, referral_code, language)
    VALUES (?, ?, ?, ?, ?)
  `);
  const res = insertUser.run('9999999999', 'Super Admin Treeniti', 'admin', 'TREENITI_ADMIN', 'hi');
  const adminId = res.lastInsertRowid;

  db.prepare(`
    INSERT INTO wallets (user_id, coins, cash_balance)
    VALUES (?, ?, ?)
  `).run(adminId, 50000, 500.0);

  db.prepare(`
    INSERT INTO trees (user_id, tree_name, level, growth_percentage, mood)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, 'प्रशासन कल्पवृक्ष', 7, 100.0, 'Excited');
}

module.exports = db;
