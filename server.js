const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'finverse_premium_jwt_secrecy_token_2026';

// Your MongoDB Atlas Connection String
const MONGODB_URI = 'mongodb+srv://asksarkar0786_db_user:moXY8JHGKNFo9hoo@cluster0.tuze8d4.mongodb.net/finverse?retryWrites=true&w=majority';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('=== Connected to MongoDB Atlas successfully ===');
    seedDefaultUser();
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

// ── Database Schemas & Models ──

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Other' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

// Asset Schema
const AssetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Other' },
  value: { type: Number, required: true },
  purchaseValue: { type: Number, default: 0 },
  notes: { type: String, default: '' }
});
const Asset = mongoose.model('Asset', AssetSchema);

// Debt Schema
const DebtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'Other' },
  remaining: { type: String, default: '' },
  monthly: { type: String, default: '' },
  due: { type: String, default: '' },
  paid: { type: String, default: '' }
});
const Debt = mongoose.model('Debt', DebtSchema);

// Audit Schema
const AuditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  item: { type: String, required: true },
  category: { type: String, default: 'Other' },
  type: { type: String, required: true },
  futureValue: { type: Number, default: 0 },
  freedomDaysLost: { type: Number, default: 0 },
  sovereigntyImpact: { type: String, default: 'Negative' },
  aiNudge: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Audit = mongoose.model('Audit', AuditSchema);

// ── Database Seeding Helper ──
async function seedDefaultUser() {
  try {
    const existing = await User.findOne({ email: 'alex.chen@example.com' });
    if (existing) {
      console.log('Seeder: Default user alex.chen@example.com already exists.');
      return;
    }

    console.log('Seeder: Seeding default user alex.chen@example.com...');
    const user = new User({
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      // bcrypt hash for "finance123"
      passwordHash: '$2a$10$wN1QYlB8XwZqC5bFzJ/u1e.V1d.yLd8w0nC7xJb0jQ1hU1kZg2.8O'
    });
    const savedUser = await user.save();
    const userId = savedUser._id;

    // Seed Transactions
    await Transaction.insertMany([
      { userId, name: 'Salary', category: 'Salary', amount: 25000, type: 'income' },
      { userId, name: 'Potato chips', category: 'Food', amount: 500, type: 'expense' },
      { userId, name: 'Freelance', category: 'Freelance', amount: 25800, type: 'income' },
      { userId, name: 'Monthly salary', category: 'Salary', amount: 5200, type: 'income' },
      { userId, name: 'Monthly rent', category: 'Rent', amount: 1200, type: 'expense' }
    ]);

    // Seed Assets
    await Asset.insertMany([
      { userId, name: 'Apartment - Downtown', category: 'Real Estate', value: 185000, purchaseValue: 150000, notes: '2BHK, Rented out at $1200/mo' },
      { userId, name: 'Honda Civic 2022', category: 'Vehicle', value: 22000, purchaseValue: 28000, notes: 'Personal use' },
      { userId, name: 'Stock Portfolio', category: 'Investment', value: 45000, purchaseValue: 32000, notes: 'S&P 500 index funds + tech stocks' },
      { userId, name: 'Gold Chain 22K', category: 'Gold & Jewelry', value: 8500, purchaseValue: 6200, notes: '45 grams' },
      { userId, name: 'Savings Account', category: 'Cash & Bank', value: 12500, purchaseValue: 0, notes: 'High-yield savings' },
      { userId, name: 'Bitcoin + ETH', category: 'Crypto', value: 18000, purchaseValue: 12000, notes: '0.3 BTC + 4 ETH' }
    ]);

    // Seed Debts
    await Debt.insertMany([
      { userId, title: 'Student Loan', category: 'Education', remaining: '$16,500', monthly: '$450/mo', due: '2029-06-01', paid: '$8,500' },
      { userId, title: 'Credit Card', category: 'Credit', remaining: '$1,400', monthly: '$200/mo', due: '2026-08-01', paid: '$1,800' },
      { userId, title: 'Car Loan', category: 'Vehicle', remaining: '$12,000', monthly: '$350/mo', due: '2030-01-01', paid: '$3,000' }
    ]);

    // Seed Audits
    await Audit.insertMany([
      { userId, amount: 500, item: 'Apparel dress', category: 'Apparel', type: 'Waste', futureValue: 3995, freedomDaysLost: 0.1, sovereigntyImpact: 'Negative', aiNudge: "A $500 luxury now costs 0.1 days of your child's freedom later. Is vanity worth their time?" }
    ]);

    console.log('Seeder: Default user and data seeded successfully!');
  } catch (error) {
    console.error('Seeder: Seeding failed:', error);
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired. Invalid token.' });
    }
    req.user = user;
    next();
  });
}

// Helper to format Mongoose documents for standard JSON matching
function formatDocuments(docs) {
  return docs.map(doc => {
    const obj = doc.toObject();
    obj.id = obj._id.toString();
    return obj;
  });
}

// ── Auth Endpoints ──

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    const savedUser = await newUser.save();
    const token = jwt.sign({ id: savedUser._id, name: savedUser.name, email: savedUser.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: { id: savedUser._id, name: savedUser.name, email: savedUser.email } });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ error: 'Registration failed due to a server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed due to a server error' });
  }
});

// Get Profile Info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Combined Screen Sync Endpoints ──

app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    const assets = await Asset.find({ userId });
    const debts = await Debt.find({ userId });
    const audits = await Audit.find({ userId }).sort({ createdAt: -1 });

    res.json({
      transactions: formatDocuments(transactions),
      assets: formatDocuments(assets),
      debts: formatDocuments(debts),
      audits: formatDocuments(audits)
    });
  } catch (err) {
    console.error('Data Sync Error:', err);
    res.status(500).json({ error: 'Failed to sync financial data from MongoDB' });
  }
});

// ── Transactions Endpoints ──

app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { name, category, amount, type } = req.body;
  if (!name || amount === undefined || !type) {
    return res.status(400).json({ error: 'Name, amount, and type are required' });
  }

  try {
    const newTx = new Transaction({
      userId: req.user.id,
      name,
      category: category || 'Other',
      amount: parseFloat(amount),
      type
    });

    const savedTx = await newTx.save();
    res.status(201).json({ ...savedTx.toObject(), id: savedTx._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  const { name, category, amount, type } = req.body;
  
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (name !== undefined) tx.name = name;
    if (category !== undefined) tx.category = category;
    if (amount !== undefined) tx.amount = parseFloat(amount);
    if (type !== undefined) tx.type = type;

    const savedTx = await tx.save();
    res.json({ ...savedTx.toObject(), id: savedTx._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Transaction.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ── Assets Endpoints ──

app.post('/api/assets', authenticateToken, async (req, res) => {
  const { name, category, value, purchaseValue, notes } = req.body;
  if (!name || value === undefined) {
    return res.status(400).json({ error: 'Name and current value are required' });
  }

  try {
    const newAsset = new Asset({
      userId: req.user.id,
      name,
      category: category || 'Other',
      value: parseFloat(value),
      purchaseValue: purchaseValue !== undefined ? parseFloat(purchaseValue) : 0,
      notes: notes || ''
    });

    const savedAsset = await newAsset.save();
    res.status(201).json({ ...savedAsset.toObject(), id: savedAsset._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

app.put('/api/assets/:id', authenticateToken, async (req, res) => {
  const { name, category, value, purchaseValue, notes } = req.body;
  
  try {
    const asset = await Asset.findOne({ _id: req.params.id, userId: req.user.id });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (name !== undefined) asset.name = name;
    if (category !== undefined) asset.category = category;
    if (value !== undefined) asset.value = parseFloat(value);
    if (purchaseValue !== undefined) asset.purchaseValue = parseFloat(purchaseValue);
    if (notes !== undefined) asset.notes = notes;

    const savedAsset = await asset.save();
    res.json({ ...savedAsset.toObject(), id: savedAsset._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

app.delete('/api/assets/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Asset.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// ── Debts Endpoints ──

app.post('/api/debts', authenticateToken, async (req, res) => {
  const { title, category, remaining, monthly, due, paid } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const newDebt = new Debt({
      userId: req.user.id,
      title,
      category: category || 'Other',
      remaining: remaining || '',
      monthly: monthly || '',
      due: due || '',
      paid: paid || ''
    });

    const savedDebt = await newDebt.save();
    res.status(201).json({ ...savedDebt.toObject(), id: savedDebt._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create debt' });
  }
});

app.put('/api/debts/:id', authenticateToken, async (req, res) => {
  const { title, category, remaining, monthly, due, paid } = req.body;
  
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.user.id });
    if (!debt) {
      return res.status(404).json({ error: 'Debt not found' });
    }

    if (title !== undefined) debt.title = title;
    if (category !== undefined) debt.category = category;
    if (remaining !== undefined) debt.remaining = remaining;
    if (monthly !== undefined) debt.monthly = monthly;
    if (due !== undefined) debt.due = due;
    if (paid !== undefined) debt.paid = paid;

    const savedDebt = await debt.save();
    res.json({ ...savedDebt.toObject(), id: savedDebt._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update debt' });
  }
});

app.delete('/api/debts/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Debt.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Debt not found' });
    }
    res.json({ success: true, message: 'Debt deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

// ── Expense Audits Endpoints ──

app.post('/api/audits', authenticateToken, async (req, res) => {
  const { amount, item, category, type, futureValue, freedomDaysLost, sovereigntyImpact, aiNudge } = req.body;
  
  if (amount === undefined || !item || !type) {
    return res.status(400).json({ error: 'Amount, item, and category are required' });
  }

  try {
    const newAudit = new Audit({
      userId: req.user.id,
      amount: parseFloat(amount),
      item,
      category: category || 'Other',
      type,
      futureValue: parseFloat(futureValue || 0),
      freedomDaysLost: parseFloat(freedomDaysLost || 0),
      sovereigntyImpact: sovereigntyImpact || 'Negative',
      aiNudge: aiNudge || ''
    });

    const savedAudit = await newAudit.save();
    res.status(201).json({ ...savedAudit.toObject(), id: savedAudit._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save audit record' });
  }
});

app.delete('/api/audits', authenticateToken, async (req, res) => {
  try {
    await Audit.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: 'Audits cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear audits' });
  }
});

// Run server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== MongoDB-Backed Express Backend running at http://localhost:${PORT} ===`);
});
