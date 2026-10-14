const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static uploads
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Google Play Store Digital Asset Links verification
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "org.treeniti.greenapp",
        sha256_cert_fingerprints: [
          "14:6D:E9:7F:0F:5C:CF:45:47:4E:AD:A2:4E:51:72:C6:13:4E:9A:89:C8:31:84:82:1C:18:AE:52:19:D4:4B:99"
        ]
      }
    }
  ]);
});

// Multer storage for tree photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `tree_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`);
  }
});
const upload = multer({ storage });

// Helper: Format Date
const getTodayKey = () => new Date().toISOString().slice(0, 10);

// Helper: Multi-level referral commission distribution
function distributeCommission(userId, coinsAmount, description) {
  try {
    const settingL1 = db.prepare("SELECT value FROM system_settings WHERE key = 'referral_l1_percent'").get();
    const settingL2 = db.prepare("SELECT value FROM system_settings WHERE key = 'referral_l2_percent'").get();
    const l1Percent = parseFloat(settingL1 ? settingL1.value : 5) / 100;
    const l2Percent = parseFloat(settingL2 ? settingL2.value : 2) / 100;

    const user = db.prepare('SELECT referred_by, name FROM users WHERE id = ?').get(userId);
    if (!user || !user.referred_by) return;

    // Level 1 Referrer
    const l1ReferrerId = user.referred_by;
    const l1Coins = Math.max(1, Math.round(coinsAmount * l1Percent));
    const l1Inr = l1Coins / 100;

    db.prepare(`
      UPDATE wallets 
      SET coins = coins + ?, referral_earnings = referral_earnings + ?
      WHERE user_id = ?
    `).run(l1Coins, l1Inr, l1ReferrerId);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
      VALUES (?, 'referral_l1', ?, ?, ?)
    `).run(l1ReferrerId, l1Coins, l1Inr, `Level 1 Commission (5%) from ${user.name}: ${description}`);

    // Level 2 Referrer (Referrer of Level 1)
    const l1User = db.prepare('SELECT referred_by, name FROM users WHERE id = ?').get(l1ReferrerId);
    if (l1User && l1User.referred_by) {
      const l2ReferrerId = l1User.referred_by;
      const l2Coins = Math.max(1, Math.round(coinsAmount * l2Percent));
      const l2Inr = l2Coins / 100;

      db.prepare(`
        UPDATE wallets 
        SET coins = coins + ?, referral_earnings = referral_earnings + ?
        WHERE user_id = ?
      `).run(l2Coins, l2Inr, l2ReferrerId);

      db.prepare(`
        INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
        VALUES (?, 'referral_l2', ?, ?, ?)
      `).run(l2ReferrerId, l2Coins, l2Inr, `Level 2 Commission (2%) from ${user.name}: ${description}`);
    }
  } catch (err) {
    console.error('Commission Error:', err);
  }
}

// Helper: Calculate tree level based on growth %
function calculateTreeLevel(growthPercent) {
  if (growthPercent < 15) return 1; // Seed
  if (growthPercent < 30) return 2; // Sprout
  if (growthPercent < 45) return 3; // Plant
  if (growthPercent < 60) return 4; // Growing Plant
  if (growthPercent < 80) return 5; // Young Tree
  if (growthPercent < 95) return 6; // Mature Tree
  return 7; // Mature Fruit Tree (Harvest ready)
}

// ==========================================
// 1. AUTH & USER ACCOUNT APIs
// ==========================================

// Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
  }

  // Predefined demo OTP for frictionless access
  const code = phone === '9999999999' ? '9999' : '1234';
  const expiresAt = Date.now() + 10 * 60 * 1000;

  db.prepare(`
    INSERT OR REPLACE INTO otp_codes (phone, code, expires_at)
    VALUES (?, ?, ?)
  `).run(phone, code, expiresAt);

  console.log(`[OTP Generated] Phone: ${phone} -> OTP: ${code}`);

  res.json({
    success: true,
    message: 'OTP sent successfully to ' + phone,
    demoCode: code, // Provided for user convenience
    isSuperAdmin: phone === '9999999999'
  });
});

// Verify OTP & Login (Supports Firebase Real SMS verification & Local Codes)
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, code, referralCode, deviceId, firebaseVerified } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // If not already verified via Google Firebase Real SMS Auth, verify against DB
  if (!firebaseVerified) {
    if (!code) {
      return res.status(400).json({ error: 'OTP code is required' });
    }
    const otpRecord = db.prepare('SELECT * FROM otp_codes WHERE phone = ?').get(phone);
    if (!otpRecord || otpRecord.code !== code.trim()) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }
  }

  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const myRefCode = 'TREE' + Math.floor(100000 + Math.random() * 900000);
    let referredById = null;

    if (referralCode) {
      const referrer = db.prepare('SELECT id, name FROM users WHERE referral_code = ?').get(referralCode.trim().toUpperCase());
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const insertUser = db.prepare(`
      INSERT INTO users (phone, name, role, referral_code, referred_by, device_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insertUser.run(
      phone,
      phone === '9999999999' ? 'Super Admin Treeniti' : `Nature Lover #${phone.slice(-4)}`,
      phone === '9999999999' ? 'admin' : 'user',
      myRefCode,
      referredById,
      deviceId || 'browser'
    );
    const userId = result.lastInsertRowid;

    // Create Initial Wallet (150 Welcome Coins)
    db.prepare(`
      INSERT INTO wallets (user_id, coins, cash_balance)
      VALUES (?, 150, 1.5)
    `).run(userId);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
      VALUES (?, 'coin_reward', 150, 1.5, 'Welcome Bonus on Registration! 🌱')
    `).run(userId);

    // Create Tree
    db.prepare(`
      INSERT INTO trees (user_id, tree_name, level, growth_percentage, mood)
      VALUES (?, 'मेरा कल्पवृक्ष', 1, 5.0, 'Happy')
    `).run(userId);

    // Reward referrer if applicable (₹5 bonus on friend login)
    if (referredById) {
      const friendBonusCoins = 500; // 500 coins = ₹5
      const friendBonusInr = 5.0;
      db.prepare(`
        UPDATE wallets 
        SET coins = coins + ?, referral_earnings = referral_earnings + ?
        WHERE user_id = ?
      `).run(friendBonusCoins, friendBonusInr, referredById);

      db.prepare(`
        INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
        VALUES (?, 'referral_l1', ?, ?, ?)
      `).run(referredById, friendBonusCoins, friendBonusInr, `Referral Reward: Friend ${phone.slice(-4)} registered (₹5 unlocked)`);
    }

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  } else {
    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  }

  // Clear OTP
  db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);

  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(user.id);
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(user.id);

  res.json({
    success: true,
    isNewUser,
    user,
    tree,
    wallet
  });
});

// Google Sign-In & Registration
app.post('/api/auth/google-login', (req, res) => {
  const { email, name, avatar, googleId, referralCode, deviceId } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Google email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = db.prepare('SELECT * FROM users WHERE email = ? OR (google_id IS NOT NULL AND google_id = ?)').get(cleanEmail, googleId || cleanEmail);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const myRefCode = 'TREE' + Math.floor(100000 + Math.random() * 900000);
    let referredById = null;

    if (referralCode) {
      const referrer = db.prepare('SELECT id, name FROM users WHERE referral_code = ?').get(referralCode.trim().toUpperCase());
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const userPhone = req.body.phone || `G_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

    const insertUser = db.prepare(`
      INSERT INTO users (phone, email, google_id, name, avatar, role, referral_code, referred_by, device_id)
      VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?)
    `);
    const result = insertUser.run(
      userPhone,
      cleanEmail,
      googleId || cleanEmail,
      name || cleanEmail.split('@')[0],
      avatar || '🌳',
      myRefCode,
      referredById,
      deviceId || 'google_auth'
    );
    const userId = result.lastInsertRowid;

    // Create Initial Wallet (150 Welcome Coins)
    db.prepare(`
      INSERT INTO wallets (user_id, coins, cash_balance)
      VALUES (?, 150, 1.5)
    `).run(userId);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
      VALUES (?, 'coin_reward', 150, 1.5, 'Welcome Bonus via Google Sign-In! 🌱')
    `).run(userId);

    // Create Tree
    db.prepare(`
      INSERT INTO trees (user_id, tree_name, level, growth_percentage, mood)
      VALUES (?, 'मेरा कल्पवृक्ष', 1, 5.0, 'Happy')
    `).run(userId);

    // Reward referrer if applicable (₹5 bonus on friend registration)
    if (referredById) {
      const friendBonusCoins = 500;
      const friendBonusInr = 5.0;
      db.prepare(`
        UPDATE wallets 
        SET coins = coins + ?, referral_earnings = referral_earnings + ?
        WHERE user_id = ?
      `).run(friendBonusCoins, friendBonusInr, referredById);

      db.prepare(`
        INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
        VALUES (?, 'referral_l1', ?, ?, ?)
      `).run(referredById, friendBonusCoins, friendBonusInr, `Referral Reward: Friend ${cleanEmail.split('@')[0]} joined via Google (₹5 unlocked)`);
    }

    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  } else {
    // Existing user login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  }

  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(user.id);
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(user.id);

  res.json({
    success: true,
    isNewUser,
    user,
    tree,
    wallet
  });
});

// Get User Profile & Full State
app.get('/api/auth/me/:userId', (req, res) => {
  const { userId } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(user.id);
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(user.id);

  // Dynamic Tree Mood evaluation
  // Excited: watered/fertilized in last 2 hours
  // Happy: watered in last 12 hours
  // Waiting: watered 12 to 24 hours ago
  // Sad: not watered for more than 24 hours
  if (tree && tree.last_watered_at) {
    const lastWateredTime = new Date(tree.last_watered_at).getTime();
    const hoursSinceWater = (Date.now() - lastWateredTime) / (1000 * 60 * 60);
    let calculatedMood = tree.mood;

    if (hoursSinceWater > 24) {
      calculatedMood = 'Sad';
    } else if (hoursSinceWater > 12) {
      calculatedMood = 'Waiting';
    } else if (hoursSinceWater <= 2 && tree.mood === 'Excited') {
      calculatedMood = 'Excited';
    } else {
      calculatedMood = 'Happy';
    }

    if (calculatedMood !== tree.mood) {
      db.prepare('UPDATE trees SET mood = ? WHERE id = ?').run(calculatedMood, tree.id);
      tree.mood = calculatedMood;
    }
  }

  res.json({ user, tree, wallet });
});

// Update Profile
app.put('/api/auth/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const { name, avatar, language } = req.body;

  db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name), 
        avatar = COALESCE(?, avatar), 
        language = COALESCE(?, language)
    WHERE id = ?
  `).run(name, avatar, language, userId);

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ success: true, user: updatedUser });
});

// ==========================================
// 2. VIRTUAL TREE & GAMES APIs
// ==========================================

// Tree Water Action (Game 1)
app.post('/api/tree/water', (req, res) => {
  const { userId } = req.body;
  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  const today = getTodayKey();
  let dailyGrowth = tree.last_growth_date === today ? tree.daily_growth_today : 0.0;

  const maxDailyLimitSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'daily_growth_limit'").get();
  const maxLimit = parseFloat(maxDailyLimitSetting ? maxDailyLimitSetting.value : 6.0);

  if (dailyGrowth >= maxLimit) {
    return res.status(400).json({
      error: `आज का अधिकतम विकास कोटा (${maxLimit}%) पूरा हो चुका है! कल फिर से पानी दें।`,
      error_en: `Today's growth limit of ${maxLimit}% reached! Water again tomorrow.`
    });
  }

  const growthIncrement = 1.0; // 1% per watering
  const newDailyGrowth = Math.min(maxLimit, dailyGrowth + growthIncrement);
  const newGrowth = Math.min(100.0, tree.growth_percentage + growthIncrement);
  const newLevel = calculateTreeLevel(newGrowth);
  const rewardCoins = 15;

  db.prepare(`
    UPDATE trees 
    SET growth_percentage = ?, 
        daily_growth_today = ?, 
        last_growth_date = ?, 
        level = ?, 
        water_count = water_count + 1,
        mood = 'Happy',
        last_watered_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(newGrowth, newDailyGrowth, today, newLevel, userId);

  // Credit Coins
  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(rewardCoins, userId);
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'water_reward', ?, ?, 'Tree Watering Care Reward 💧')
  `).run(userId, rewardCoins, rewardCoins / 100);

  // Commission to team
  distributeCommission(userId, rewardCoins, 'Tree Water Action');

  // Random thank you message
  const msg = db.prepare(`
    SELECT * FROM tree_messages 
    WHERE trigger_type IN ('water', 'thank_you') 
    ORDER BY RANDOM() LIMIT 1
  `).get();

  const updatedTree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  const updatedWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    message: msg ? msg.message_hi : 'धन्यवाद! पेड़ को ताज़ा पानी मिला।',
    message_en: msg ? msg.message_en : 'Thank you! The tree received fresh water.',
    tree: updatedTree,
    wallet: updatedWallet,
    earnedCoins: rewardCoins,
    dailyGrowth: newDailyGrowth,
    maxLimit
  });
});

// Tree Fertilizer Action (खाद और कीटनाशक दवा)
app.post('/api/tree/fertilizer', (req, res) => {
  const { userId, type } = req.body; // 'organic_fertilizer' or 'natural_pesticide'
  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  const today = getTodayKey();
  let dailyGrowth = tree.last_growth_date === today ? tree.daily_growth_today : 0.0;
  const maxDailyLimitSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'daily_growth_limit'").get();
  const maxLimit = parseFloat(maxDailyLimitSetting ? maxDailyLimitSetting.value : 6.0);

  if (dailyGrowth >= maxLimit) {
    return res.status(400).json({
      error: `आज का पोषण कोटा (${maxLimit}%) पूरा हो चुका है! कल फिर पोषण दें।`,
      error_en: `Today's nutrition limit of ${maxLimit}% is already complete! Care again tomorrow.`
    });
  }

  const isPesticide = type === 'natural_pesticide';
  const growthIncrement = isPesticide ? 1.5 : 1.0; // Special powerup bonus
  const newDailyGrowth = Math.min(maxLimit, dailyGrowth + growthIncrement);
  const newGrowth = Math.min(100.0, tree.growth_percentage + growthIncrement);
  const newLevel = calculateTreeLevel(newGrowth);
  const rewardCoins = isPesticide ? 35 : 25;
  const actionName = isPesticide ? 'कीटनाशक रक्षा शील्ड' : 'जैविक खाद पोषण';
  const actionNameEn = isPesticide ? 'Natural Pesticide Shield' : 'Organic Fertilizer Boost';

  db.prepare(`
    UPDATE trees 
    SET growth_percentage = ?, 
        daily_growth_today = ?, 
        last_growth_date = ?, 
        level = ?, 
        fertilizer_count = fertilizer_count + 1,
        mood = 'Excited',
        last_fertilized_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(newGrowth, newDailyGrowth, today, newLevel, userId);

  // Credit coins
  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(rewardCoins, userId);
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'fertilizer_reward', ?, ?, ?)
  `).run(userId, rewardCoins, rewardCoins / 100, `${actionNameEn} (+${growthIncrement}% Power-up) 🌿🛡️`);

  distributeCommission(userId, rewardCoins, actionNameEn);

  const msg = db.prepare(`
    SELECT * FROM tree_messages 
    WHERE trigger_type = 'fertilizer' 
    ORDER BY RANDOM() LIMIT 1
  `).get();

  const updatedTree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  const updatedWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    message: isPesticide
      ? 'कीटनाशक सुरक्षा कवच सक्रिय! पेड़ कीटों से सुरक्षित है और तेजी से बढ़ रहा है! 🛡️'
      : (msg ? msg.message_hi : 'जैविक खाद से पेड़ हरा-भरा और पोषित हो गया! 🌿'),
    message_en: isPesticide
      ? 'Natural Pesticide Shield activated! Tree protected from pests with +1.5% boost! 🛡️'
      : (msg ? msg.message_en : 'Organic fertilizer revitalized and nourished your tree! 🌿'),
    tree: updatedTree,
    wallet: updatedWallet,
    earnedCoins: rewardCoins,
    powerUpType: type || 'organic_fertilizer'
  });
});

// Rename Tree
app.post('/api/tree/rename', (req, res) => {
  const { userId, treeName } = req.body;
  if (!treeName || !treeName.trim()) {
    return res.status(400).json({ error: 'Tree name cannot be empty' });
  }

  db.prepare('UPDATE trees SET tree_name = ? WHERE user_id = ?').run(treeName.trim(), userId);
  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  res.json({ success: true, tree });
});

// Tree Shake Game Status (Game 2)
app.get('/api/tree/shake-status/:userId', (req, res) => {
  const { userId } = req.params;
  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  const intervalSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'shake_interval_minutes'").get();
  const intervalMinutes = parseInt(intervalSetting ? intervalSetting.value : 15);

  let canShake = true;
  let remainingSeconds = 0;

  if (tree.last_shaken_at) {
    const lastShake = new Date(tree.last_shaken_at).getTime();
    const now = Date.now();
    const elapsedMinutes = (now - lastShake) / (1000 * 60);

    if (elapsedMinutes < intervalMinutes) {
      canShake = false;
      remainingSeconds = Math.round((intervalMinutes - elapsedMinutes) * 60);
    }
  }

  res.json({
    canShake,
    remainingSeconds,
    fruitsCount: tree.fruits_count,
    treeLevel: tree.level
  });
});

// Shake Tree Action (Game 2 - Drops fruits & coins)
app.post('/api/tree/shake', (req, res) => {
  const { userId } = req.body;
  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  // Fruits dropped: 2 to 6 depending on level
  const fruitsGained = Math.floor(Math.random() * 4) + 2;
  const coinsGained = fruitsGained * 10 + 20;

  db.prepare(`
    UPDATE trees 
    SET fruits_count = fruits_count + ?, 
        last_shaken_at = CURRENT_TIMESTAMP,
        mood = 'Excited'
    WHERE user_id = ?
  `).run(fruitsGained, userId);

  // Credit coins
  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(coinsGained, userId);
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'shake_reward', ?, ?, 'Tree Shake Game: ${fruitsGained} Fruits Harvested! 🍎')
  `).run(userId, coinsGained, coinsGained / 100);

  distributeCommission(userId, coinsGained, 'Shake Tree Game');

  const updatedTree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  const updatedWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    fruitsGained,
    coinsGained,
    message_hi: `वाह! पेड़ हिलाने से ${fruitsGained} ताज़े फल गिरे और +${coinsGained} कॉइन्स मिले!`,
    message_en: `Awesome! Shaking the tree dropped ${fruitsGained} fresh fruits and +${coinsGained} coins!`,
    tree: updatedTree,
    wallet: updatedWallet
  });
});

// Fruit Economy: Sell/Harvest Fruits for Coins
app.post('/api/tree/sell-fruits', (req, res) => {
  const { userId, count } = req.body;
  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  if (!tree) return res.status(404).json({ error: 'Tree not found' });

  const fruitsToSell = parseInt(count) || tree.fruits_count;
  if (fruitsToSell <= 0 || tree.fruits_count < fruitsToSell) {
    return res.status(400).json({ error: 'Not enough fruits in inventory' });
  }

  const fruitValueSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'fruit_coin_value'").get();
  const coinPerFruit = parseInt(fruitValueSetting ? fruitValueSetting.value : 50);
  const totalCoins = fruitsToSell * coinPerFruit;

  db.prepare('UPDATE trees SET fruits_count = fruits_count - ? WHERE user_id = ?').run(fruitsToSell, userId);
  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(totalCoins, userId);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'fruit_sell', ?, ?, 'Sold ${fruitsToSell} organic fruits for coins 🍏')
  `).run(userId, totalCoins, totalCoins / 100);

  const updatedTree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);
  const updatedWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    soldCount: fruitsToSell,
    coinsEarned: totalCoins,
    tree: updatedTree,
    wallet: updatedWallet
  });
});

// Tree Talking Messages
app.get('/api/tree/talking-message', (req, res) => {
  const msg = db.prepare('SELECT * FROM tree_messages ORDER BY RANDOM() LIMIT 1').get();
  res.json({ message: msg });
});

// ==========================================
// 3. COIN REWARD SYSTEM & EARNING APIs
// ==========================================

// Daily Check-in / Login Streak Reward
app.post('/api/rewards/daily-checkin', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check if claimed today
  const today = getTodayKey();
  const tx = db.prepare(`
    SELECT id FROM transactions 
    WHERE user_id = ? AND type = 'daily_login' AND DATE(created_at) = ?
  `).get(userId, today);

  if (tx) {
    return res.status(400).json({
      error: 'आज का डेली लॉगिन रिवॉर्ड पहले ही प्राप्त किया जा चुका है!',
      error_en: 'Daily login reward has already been claimed today!'
    });
  }

  const streak = (user.login_streak || 1) + 1;
  const rewardCoins = 50 + Math.min(streak * 5, 50); // scales with streak

  db.prepare('UPDATE users SET login_streak = ? WHERE id = ?').run(streak, userId);
  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(rewardCoins, userId);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'daily_login', ?, ?, 'Daily Check-in Reward (Streak Day ${streak}) 📅')
  `).run(userId, rewardCoins, rewardCoins / 100);

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    rewardCoins,
    streak,
    wallet
  });
});

// 3-Hour Claim Reward
app.post('/api/rewards/claim-3h', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.last_3h_claim) {
    const lastClaim = new Date(user.last_3h_claim).getTime();
    const diffHours = (Date.now() - lastClaim) / (1000 * 60 * 60);
    if (diffHours < 3) {
      const waitMin = Math.round((3 - diffHours) * 60);
      return res.status(400).json({
        error: `अगले रिवॉर्ड के लिए ${waitMin} मिनट प्रतीक्षा करें!`,
        error_en: `Please wait ${waitMin} minutes for the next 3-hour reward!`
      });
    }
  }

  const rewardCoins = 35;
  db.prepare('UPDATE users SET last_3h_claim = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(rewardCoins, userId);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, '3h_reward', ?, ?, '3-Hour Routine Oxygen Reward 🕒')
  `).run(userId, rewardCoins, rewardCoins / 100);

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    rewardCoins,
    wallet
  });
});

// Spin Wheel 🛞
app.post('/api/rewards/spin-wheel', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const prizes = [
    { label: '10 Coins', coins: 10, probability: 30 },
    { label: '25 Coins', coins: 25, probability: 30 },
    { label: '50 Coins', coins: 50, probability: 20 },
    { label: '100 Coins', coins: 100, probability: 10 },
    { label: '150 Coins', coins: 150, probability: 7 },
    { label: 'Jackpot 500 Coins', coins: 500, probability: 3 }
  ];

  // Weighted random
  const rand = Math.random() * 100;
  let cum = 0;
  let wonPrize = prizes[0];

  for (const p of prizes) {
    cum += p.probability;
    if (rand <= cum) {
      wonPrize = p;
      break;
    }
  }

  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(wonPrize.coins, userId);
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'coin_reward', ?, ?, 'Spin Wheel Lucky Reward 🛞')
  `).run(userId, wonPrize.coins, wonPrize.coins / 100);

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    wonPrize,
    wallet
  });
});

// Social Media Follow Tasks
const socialTaskList = [
  { platform: 'youtube', name: 'YouTube Channel', reward_coins: 150, url: 'https://youtube.com', icon: '📺' },
  { platform: 'facebook', name: 'Facebook Page', reward_coins: 100, url: 'https://facebook.com', icon: '📘' },
  { platform: 'instagram', name: 'Instagram Page', reward_coins: 100, url: 'https://instagram.com', icon: '📸' },
  { platform: 'twitter', name: 'Twitter (X)', reward_coins: 50, url: 'https://x.com', icon: '🐦' },
  { platform: 'whatsapp', name: 'WhatsApp Channel', reward_coins: 50, url: 'https://whatsapp.com', icon: '💬' },
  { platform: 'telegram', name: 'Telegram Channel', reward_coins: 50, url: 'https://telegram.org', icon: '✈️' }
];

app.get('/api/rewards/social-tasks/:userId', (req, res) => {
  const { userId } = req.params;
  const completed = db.prepare('SELECT platform FROM social_tasks WHERE user_id = ? AND is_completed = 1').all(userId);
  const completedSet = new Set(completed.map(c => c.platform));

  const tasksWithStatus = socialTaskList.map(task => ({
    ...task,
    isCompleted: completedSet.has(task.platform)
  }));

  res.json({ tasks: tasksWithStatus });
});

app.post('/api/rewards/complete-social-task', (req, res) => {
  const { userId, platform } = req.body;
  const taskDef = socialTaskList.find(t => t.platform === platform);
  if (!taskDef) return res.status(400).json({ error: 'Invalid platform task' });

  const existing = db.prepare('SELECT * FROM social_tasks WHERE user_id = ? AND platform = ?').get(userId, platform);
  if (existing && existing.is_completed) {
    return res.status(400).json({ error: 'Task already completed' });
  }

  db.prepare(`
    INSERT INTO social_tasks (user_id, platform, reward_coins, is_completed, completed_at)
    VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, platform) DO UPDATE SET is_completed = 1, completed_at = CURRENT_TIMESTAMP
  `).run(userId, platform, taskDef.reward_coins);

  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(taskDef.reward_coins, userId);
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'social_task', ?, ?, 'Social Media Task Reward (${taskDef.name}) 🌐')
  `).run(userId, taskDef.reward_coins, taskDef.reward_coins / 100);

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    rewardCoins: taskDef.reward_coins,
    wallet
  });
});

// Daily Missions
app.get('/api/rewards/daily-missions/:userId', (req, res) => {
  const { userId } = req.params;
  const today = getTodayKey();

  const defaultMissions = [
    { key: 'water_tree', title_hi: 'पेड़ को 2 बार पानी दें', title_en: 'Water Tree 2 times', target: 2, reward: 25 },
    { key: 'read_article', title_hi: '1 पर्यावरण लेख पढ़ें', title_en: 'Read 1 Environment Article', target: 1, reward: 30 },
    { key: 'shake_game', title_hi: '1 बार पेड़ हिलाएं (Shake Game)', title_en: 'Play Shake Game 1 time', target: 1, reward: 20 },
    { key: 'spin_wheel', title_hi: 'लकी स्पिन व्हील घुमाएं', title_en: 'Spin the Lucky Wheel', target: 1, reward: 15 }
  ];

  // Ensure missions exist for today
  for (const m of defaultMissions) {
    db.prepare(`
      INSERT OR IGNORE INTO daily_missions (user_id, mission_key, title_hi, title_en, target, reward_coins, date_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, m.key, m.title_hi, m.title_en, m.target, m.reward, today);
  }

  const missions = db.prepare('SELECT * FROM daily_missions WHERE user_id = ? AND date_key = ?').all(userId, today);
  res.json({ missions });
});

// Claim Mission
app.post('/api/rewards/claim-mission', (req, res) => {
  const { userId, missionId } = req.body;
  const mission = db.prepare('SELECT * FROM daily_missions WHERE id = ? AND user_id = ?').get(missionId, userId);
  if (!mission) return res.status(404).json({ error: 'Mission not found' });

  if (mission.is_claimed) {
    return res.status(400).json({ error: 'Mission reward already claimed' });
  }

  db.prepare('UPDATE daily_missions SET is_claimed = 1 WHERE id = ?').run(missionId);
  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(mission.reward_coins, userId);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'coin_reward', ?, ?, 'Daily Mission Reward: ${mission.title_hi} 🎯')
  `).run(userId, mission.reward_coins, mission.reward_coins / 100);

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
  res.json({ success: true, rewardCoins: mission.reward_coins, wallet });
});

// ==========================================
// 4. ARTICLE & KNOWLEDGE SYSTEM (ANTI-CHEAT)
// ==========================================

// List Articles
app.get('/api/articles', (req, res) => {
  const articles = db.prepare('SELECT id, title_hi, title_en, category, read_time_seconds, reward_coins, views_count FROM articles ORDER BY id DESC').all();
  res.json({ articles });
});

// Get Article Detail
app.get('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  db.prepare('UPDATE articles SET views_count = views_count + 1 WHERE id = ?').run(id);
  res.json({ article });
});

// Reward Article Reading (with Anti-Cheat verification)
app.post('/api/articles/:id/reward', (req, res) => {
  const { id } = req.params;
  const { userId, readingDurationSec, scrolledToBottom, tabActiveDurationSec } = req.body;

  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  // Anti-Cheat Check:
  // Must have spent at least 70% of required read time with active tab and scrolled
  const requiredTime = article.read_time_seconds * 0.7;
  if (!scrolledToBottom) {
    return res.status(400).json({ error: 'कृपया पूरा लेख नीचे तक पढ़ें (Scroll to bottom required)' });
  }
  if (readingDurationSec < requiredTime || tabActiveDurationSec < requiredTime) {
    return res.status(400).json({ error: 'पर्याप्त पढ़ने का समय नहीं बीता या टैब इनएक्टिव था!' });
  }

  const today = getTodayKey();
  const existingRead = db.prepare('SELECT id FROM article_reads WHERE user_id = ? AND article_id = ? AND read_date = ?').get(userId, id, today);
  if (existingRead) {
    return res.status(400).json({ error: 'आज इस लेख का रिवॉर्ड पहले ही लिया जा चुका है' });
  }

  // Daily article reward limit (Max 5 articles per day)
  const todayReadsCount = db.prepare('SELECT COUNT(*) as cnt FROM article_reads WHERE user_id = ? AND read_date = ?').get(userId, today).cnt;
  if (todayReadsCount >= 5) {
    return res.status(400).json({ error: 'आज की आर्टिकल रिवॉर्ड सीमा (5 आर्टिकल्स) समाप्त हो चुकी है!' });
  }

  db.prepare(`
    INSERT INTO article_reads (user_id, article_id, read_date)
    VALUES (?, ?, ?)
  `).run(userId, id, today);

  db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(article.reward_coins, userId);
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'article_reward', ?, ?, 'Knowledge Article Reward: ${article.title_hi.slice(0, 30)}... 📚')
  `).run(userId, article.reward_coins, article.reward_coins / 100);

  distributeCommission(userId, article.reward_coins, 'Article Read Reward');

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    rewardCoins: article.reward_coins,
    wallet
  });
});

// ==========================================
// 5. REFERRAL SYSTEM & MULTI-LEVEL MLM
// ==========================================

app.get('/api/referral/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const user = db.prepare('SELECT referral_code, name, created_at FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Level 1 Referrals (Users referred directly by this user)
  const l1Users = db.prepare(`
    SELECT u.id, u.name, u.phone, u.created_at, u.last_login, 
           w.coins, w.cash_balance, t.level as tree_level
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    LEFT JOIN trees t ON u.id = t.user_id
    WHERE u.referred_by = ?
    ORDER BY u.id DESC
  `).all(userId);

  // Level 2 Referrals (Users referred by Level 1 users)
  let l2Users = [];
  if (l1Users.length > 0) {
    const l1Ids = l1Users.map(u => u.id);
    const placeholders = l1Ids.map(() => '?').join(',');
    l2Users = db.prepare(`
      SELECT u.id, u.name, u.phone, u.created_at, u.last_login,
             w.coins, w.cash_balance, t.level as tree_level, u.referred_by as upline_id
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      LEFT JOIN trees t ON u.id = t.user_id
      WHERE u.referred_by IN (${placeholders})
      ORDER BY u.id DESC
    `).all(...l1Ids);
  }

  const wallet = db.prepare('SELECT referral_earnings FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    referralCode: user.referral_code,
    totalEarningsInr: wallet ? wallet.referral_earnings : 0,
    l1Count: l1Users.length,
    l2Count: l2Users.length,
    totalTeamCount: l1Users.length + l2Users.length,
    l1Users,
    l2Users,
    planRules: {
      friendLoginRewardInr: 5,
      active3DaysRewardInr: 6,
      active7DaysRewardInr: 10,
      totalRewardPerInviteInr: 21,
      l1CommissionPercent: 5,
      l2CommissionPercent: 2
    }
  });
});

// ==========================================
// 6. WALLET & WITHDRAWAL SYSTEM
// ==========================================

// Get Wallet
app.get('/api/wallet/:userId', (req, res) => {
  const { userId } = req.params;
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const settingRate = db.prepare("SELECT value FROM system_settings WHERE key = 'coin_rate'").get();
  const coinRate = parseInt(settingRate ? settingRate.value : 100);

  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(userId);
  const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY id DESC').all(userId);

  res.json({
    wallet,
    coinRate, // e.g. 100 coins = 1 INR
    equivalentInr: (wallet.coins / coinRate).toFixed(2),
    transactions,
    withdrawals
  });
});

// Convert Coins to INR Cash
app.post('/api/wallet/convert-coins', (req, res) => {
  const { userId, coinsToConvert } = req.body;
  const coins = parseInt(coinsToConvert);
  if (!coins || coins <= 0) return res.status(400).json({ error: 'Invalid coins amount' });

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
  if (!wallet || wallet.coins < coins) {
    return res.status(400).json({ error: 'Insufficient coins in wallet' });
  }

  const settingRate = db.prepare("SELECT value FROM system_settings WHERE key = 'coin_rate'").get();
  const rate = parseInt(settingRate ? settingRate.value : 100);
  const inrAmount = parseFloat((coins / rate).toFixed(2));

  db.prepare(`
    UPDATE wallets 
    SET coins = coins - ?, cash_balance = cash_balance + ?
    WHERE user_id = ?
  `).run(coins, inrAmount, userId);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'coin_convert', ?, ?, 'Converted ${coins} Coins to ₹${inrAmount} Cash Balance 💱')
  `).run(userId, -coins, inrAmount);

  const updatedWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
  res.json({ success: true, wallet: updatedWallet, inrAmount });
});

// Request UPI Withdrawal
app.post('/api/wallet/withdraw', (req, res) => {
  const { userId, amountInr, upiId } = req.body;
  const amount = parseFloat(amountInr);

  const minSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'min_withdrawal'").get();
  const minAmount = parseFloat(minSetting ? minSetting.value : 10.0);

  if (!amount || amount < minAmount) {
    return res.status(400).json({ error: `न्यूनतम विड्रॉल राशि ₹${minAmount} है! (Minimum withdrawal is ₹${minAmount})` });
  }

  if (!upiId || !upiId.includes('@')) {
    return res.status(400).json({ error: 'मान्य UPI ID दर्ज करें (उदा. username@okaxis, mobile@paytm)' });
  }

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
  if (!wallet || wallet.cash_balance < amount) {
    return res.status(400).json({ error: 'नकद शेष राशि अपर्याप्त है! कृपया पहले कॉइन्स को कन्वर्ट करें।' });
  }

  // Deduct from wallet balance
  db.prepare(`
    UPDATE wallets 
    SET cash_balance = cash_balance - ?, upi_id = ?
    WHERE user_id = ?
  `).run(amount, upiId, userId);

  // Insert withdrawal request
  const insertW = db.prepare(`
    INSERT INTO withdrawals (user_id, amount_inr, upi_id, status)
    VALUES (?, ?, ?, 'pending')
  `);
  const result = insertW.run(userId, amount, upiId);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'withdrawal', 0, ?, 'UPI Withdrawal Request #${result.lastInsertRowid} to ${upiId} 💸')
  `).run(userId, -amount);

  const updatedWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  res.json({
    success: true,
    message: 'विड्रॉल रिक्वेस्ट सफलतापूर्वक दर्ज की गई! 24 घंटे में आपके खाते में आ जाएगी।',
    message_en: 'Withdrawal request submitted successfully! Will be credited within 24 hours.',
    wallet: updatedWallet
  });
});

// ==========================================
// 7. REAL PLANTATION PHOTO VERIFICATION APIs
// ==========================================

// Upload real plantation photo (Day 1, 7, 15, 30)
app.post('/api/plantation/upload', upload.single('photo'), (req, res) => {
  const { userId, treeName, stage } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Please attach a photo of your real planted tree' });
  }

  const validStages = ['day_1', 'day_7', 'day_15', 'day_30'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({ error: 'Valid stage (day_1, day_7, day_15, day_30) required' });
  }

  const photoUrl = `/uploads/${req.file.filename}`;

  const insert = db.prepare(`
    INSERT INTO real_plantations (user_id, tree_name, stage, photo_url, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  const result = insert.run(userId, treeName || 'My Real Tree', stage, photoUrl);

  res.json({
    success: true,
    message: 'फोटो सफलतापूर्वक अपलोड हो गई! एडमिन द्वारा सत्यापन के बाद रिवॉर्ड मिलेगा।',
    message_en: 'Photo uploaded successfully! Reward will be credited after admin verification.',
    id: result.lastInsertRowid,
    photoUrl
  });
});

// Get User's Plantation Proofs
app.get('/api/plantation/my-proofs/:userId', (req, res) => {
  const { userId } = req.params;
  const proofs = db.prepare('SELECT * FROM real_plantations WHERE user_id = ? ORDER BY id DESC').all(userId);
  res.json({ proofs });
});

// ==========================================
// 8. TREE CERTIFICATE DATA
// ==========================================

app.get('/api/certificate/:userId', (req, res) => {
  const { userId } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const tree = db.prepare('SELECT * FROM trees WHERE user_id = ?').get(userId);

  res.json({
    certificateId: `TRN-CERT-${String(user.id).padStart(6, '0')}`,
    userName: user.name,
    phone: user.phone,
    treeName: tree ? tree.tree_name : 'कल्पवृक्ष',
    treeLevel: tree ? tree.level : 1,
    growthPercentage: tree ? tree.growth_percentage : 5.0,
    plantedDate: tree ? tree.created_at : user.created_at,
    issueDate: new Date().toLocaleDateString('hi-IN'),
    authority: 'Treeniti Green Foundation & Afforestation Trust',
    verificationUrl: `https://treeniti.org/verify/TRN-CERT-${String(user.id).padStart(6, '0')}`
  });
});

// ==========================================
// 9. PUBLIC / GENERAL / COMMUNITY APIs
// ==========================================

// Live Tickers
app.get('/api/tickers', (req, res) => {
  const tickers = db.prepare('SELECT * FROM live_tickers WHERE active = 1 ORDER BY id DESC LIMIT 10').all();
  res.json({ tickers });
});

// Leaderboard / Rank Board
app.get('/api/leaderboard', (req, res) => {
  const topUsers = db.prepare(`
    SELECT u.id, u.name, u.avatar, t.tree_name, t.level, t.growth_percentage, w.coins
    FROM users u
    JOIN trees t ON u.id = t.user_id
    JOIN wallets w ON u.id = w.user_id
    ORDER BY t.growth_percentage DESC, w.coins DESC
    LIMIT 25
  `).all();

  res.json({ leaderboard: topUsers });
});

// Submit Feedback
app.post('/api/feedback', (req, res) => {
  const { userId, rating, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Feedback message is required' });
  }

  db.prepare(`
    INSERT INTO feedbacks (user_id, rating, message)
    VALUES (?, ?, ?)
  `).run(userId, rating || 5, message.trim());

  res.json({
    success: true,
    message: 'आपकी प्रतिक्रिया के लिए धन्यवाद! हम लगातार Treeniti को बेहतर बना रहे हैं।'
  });
});

// System Settings
app.get('/api/system/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM system_settings').all();
  const map = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  res.json({ settings: map });
});

// ==========================================
// 10. COMPLETE ADMIN & SUPER ADMIN PANEL APIs
// ==========================================

// Middleware for Admin check
function verifyAdmin(req, res, next) {
  const adminId = req.headers['x-admin-id'];
  if (!adminId) return res.status(401).json({ error: 'Admin authorization header required' });

  const admin = db.prepare('SELECT id, role FROM users WHERE id = ?').get(adminId);
  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
}

// Admin Dashboard Summary
app.get('/api/admin/stats', verifyAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  const totalTrees = db.prepare('SELECT COUNT(*) as cnt FROM trees').get().cnt;
  const pendingWithdrawals = db.prepare("SELECT COUNT(*) as cnt FROM withdrawals WHERE status = 'pending'").get().cnt;
  const pendingPlantations = db.prepare("SELECT COUNT(*) as cnt FROM real_plantations WHERE status = 'pending'").get().cnt;
  const totalCoinsDistributed = db.prepare("SELECT SUM(amount_coins) as total FROM transactions WHERE amount_coins > 0").get().total || 0;
  const totalWithdrawnInr = db.prepare("SELECT SUM(amount_inr) as total FROM withdrawals WHERE status = 'approved'").get().total || 0;

  res.json({
    totalUsers,
    totalTrees,
    pendingWithdrawals,
    pendingPlantations,
    totalCoinsDistributed,
    totalWithdrawnInr
  });
});

// Admin Users Management
app.get('/api/admin/users', verifyAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.*, w.coins, w.cash_balance, t.tree_name, t.level as tree_level, t.growth_percentage
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    LEFT JOIN trees t ON u.id = t.user_id
    ORDER BY u.id DESC
  `).all();
  res.json({ users });
});

// Admin Ban/Unban User
app.post('/api/admin/users/:id/ban', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT is_banned FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const newStatus = user.is_banned ? 0 : 1;
  db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(newStatus, id);

  res.json({ success: true, is_banned: newStatus });
});

// Admin Adjust User Balance
app.post('/api/admin/users/:id/adjust-balance', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { coinsChange, cashChange, reason } = req.body;

  db.prepare(`
    UPDATE wallets 
    SET coins = MAX(0, coins + ?), 
        cash_balance = MAX(0, cash_balance + ?)
    WHERE user_id = ?
  `).run(parseInt(coinsChange || 0), parseFloat(cashChange || 0), id);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
    VALUES (?, 'admin_adjustment', ?, ?, ?)
  `).run(id, parseInt(coinsChange || 0), parseFloat(cashChange || 0), `Admin Adjustment: ${reason || 'System correction'}`);

  res.json({ success: true, message: 'Balance adjusted successfully' });
});

// Admin Withdrawals List
app.get('/api/admin/withdrawals', verifyAdmin, (req, res) => {
  const list = db.prepare(`
    SELECT w.*, u.name as user_name, u.phone as user_phone
    FROM withdrawals w
    JOIN users u ON w.user_id = u.id
    ORDER BY w.id DESC
  `).all();
  res.json({ withdrawals: list });
});

// Admin Process Withdrawal (Approve / Reject)
app.post('/api/admin/withdrawals/:id/action', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { action, utrNumber, note } = req.body; // 'approve' or 'reject'

  const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id);
  if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
  if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Request is already processed' });

  if (action === 'approve') {
    db.prepare(`
      UPDATE withdrawals 
      SET status = 'approved', utr_number = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(utrNumber || 'UPI_SUCCESS', note || 'Payment approved & transferred', id);

    db.prepare(`
      UPDATE wallets 
      SET total_withdrawn = total_withdrawn + ?
      WHERE user_id = ?
    `).run(withdrawal.amount_inr, withdrawal.user_id);
  } else {
    // If rejected, refund money to cash_balance
    db.prepare(`
      UPDATE withdrawals 
      SET status = 'rejected', admin_note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(note || 'Rejected by admin', id);

    db.prepare(`
      UPDATE wallets 
      SET cash_balance = cash_balance + ?
      WHERE user_id = ?
    `).run(withdrawal.amount_inr, withdrawal.user_id);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
      VALUES (?, 'refund', 0, ?, 'Refund for rejected withdrawal request #${id}')
    `).run(withdrawal.user_id, withdrawal.amount_inr);
  }

  res.json({ success: true, action });
});

// Admin Plantation Verification
app.get('/api/admin/plantations', verifyAdmin, (req, res) => {
  const proofs = db.prepare(`
    SELECT p.*, u.name as user_name, u.phone as user_phone
    FROM real_plantations p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.id DESC
  `).all();
  res.json({ proofs });
});

app.post('/api/admin/plantations/:id/action', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { action, comment, rewardCoins } = req.body; // 'approve' or 'reject'

  const proof = db.prepare('SELECT * FROM real_plantations WHERE id = ?').get(id);
  if (!proof) return res.status(404).json({ error: 'Proof not found' });

  if (action === 'approve') {
    const coins = parseInt(rewardCoins || 100);
    db.prepare(`
      UPDATE real_plantations 
      SET status = 'approved', admin_comment = ?, coins_rewarded = ?
      WHERE id = ?
    `).run(comment || 'Verified authentic tree plantation! Keep growing!', coins, id);

    db.prepare('UPDATE wallets SET coins = coins + ? WHERE user_id = ?').run(coins, proof.user_id);

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount_coins, amount_inr, description)
      VALUES (?, 'coin_reward', ?, ?, 'Real Plantation Proof Verified (${proof.stage}) 🌳')
    `).run(proof.user_id, coins, coins / 100);

    // Also trigger a live ticker celebration
    db.prepare(`
      INSERT INTO live_tickers (message_hi, message_en, icon)
      VALUES (?, ?, '📸')
    `).run(
      `बधाई! एक और पर्यावरण मित्र ने ${proof.stage.replace('_', ' ').toUpperCase()} का पौधा फोटो वेरिफाई कराया!`,
      `Congrats! Another green warrior verified their ${proof.stage.replace('_', ' ').toUpperCase()} plantation photo!`
    );
  } else {
    db.prepare(`
      UPDATE real_plantations 
      SET status = 'rejected', admin_comment = ?
      WHERE id = ?
    `).run(comment || 'Photo is unclear or does not match tree growth stage', id);
  }

  res.json({ success: true, action });
});

// Admin Articles CRUD
app.post('/api/admin/articles', verifyAdmin, (req, res) => {
  const { title_hi, title_en, content_hi, content_en, category, read_time_seconds, reward_coins } = req.body;
  const insert = db.prepare(`
    INSERT INTO articles (title_hi, title_en, content_hi, content_en, category, read_time_seconds, reward_coins)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(
    title_hi, title_en, content_hi, content_en, 
    category || 'Environment', 
    read_time_seconds || 30, 
    reward_coins || 25
  );
  res.json({ success: true, id: result.lastInsertRowid });
});

app.delete('/api/admin/articles/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  res.json({ success: true });
});

// Admin Tree Messages CRUD
app.get('/api/admin/tree-messages', verifyAdmin, (req, res) => {
  const messages = db.prepare('SELECT * FROM tree_messages ORDER BY id DESC').all();
  res.json({ messages });
});

app.post('/api/admin/tree-messages', verifyAdmin, (req, res) => {
  const { trigger_type, level_min, message_hi, message_en } = req.body;
  const insert = db.prepare(`
    INSERT INTO tree_messages (trigger_type, level_min, message_hi, message_en)
    VALUES (?, ?, ?, ?)
  `);
  const result = insert.run(trigger_type, level_min || 1, message_hi, message_en);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.delete('/api/admin/tree-messages/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tree_messages WHERE id = ?').run(id);
  res.json({ success: true });
});

// Admin Tickers
app.get('/api/admin/tickers', verifyAdmin, (req, res) => {
  const tickers = db.prepare('SELECT * FROM live_tickers ORDER BY id DESC').all();
  res.json({ tickers });
});

app.post('/api/admin/tickers', verifyAdmin, (req, res) => {
  const { message_hi, message_en, icon } = req.body;
  const insert = db.prepare(`
    INSERT INTO live_tickers (message_hi, message_en, icon)
    VALUES (?, ?, ?)
  `);
  const result = insert.run(message_hi, message_en, icon || '📢');
  res.json({ success: true, id: result.lastInsertRowid });
});

app.delete('/api/admin/tickers/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM live_tickers WHERE id = ?').run(id);
  res.json({ success: true });
});

// Admin Update System Settings
app.put('/api/admin/settings', verifyAdmin, (req, res) => {
  const { settings } = req.body;
  if (settings && typeof settings === 'object') {
    const update = db.prepare(`
      INSERT INTO system_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    for (const [key, val] of Object.entries(settings)) {
      update.run(key, String(val));
    }
  }
  res.json({ success: true, message: 'Settings updated' });
});

// Admin Feedbacks List
app.get('/api/admin/feedbacks', verifyAdmin, (req, res) => {
  const list = db.prepare(`
    SELECT f.*, u.name as user_name, u.phone as user_phone
    FROM feedbacks f
    JOIN users u ON f.user_id = u.id
    ORDER BY f.id DESC
  `).all();
  res.json({ feedbacks: list });
});

// Serve client static build in production/unified mode
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🌲 Treeniti Server running on http://localhost:${PORT}`);
});
