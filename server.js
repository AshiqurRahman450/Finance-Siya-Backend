const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'finverse_premium_jwt_secrecy_token_2026';

// Your MongoDB Atlas Connection String
const MONGODB_URI = 'mongodb+srv://asksarkar0786_db_user:moXY8JHGKNFo9hoo@cluster0.tuze8d4.mongodb.net/finverse?retryWrites=true&w=majority';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - body:`, req.body);
  next();
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

app.get("/", (req, res) => {
  res.json({
    message: "Hello! Backend is running 🚀",
    status: "active",
    timestamp: new Date().toISOString()
  });
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Lesson Schema (Leverage Lab)
const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  duration: { type: String, default: '15:00' },
  views: { type: String, default: '0' },
  level: { type: String, default: 'Beginner' },
  completed: { type: Boolean, default: false },
  categoryId: { type: String, required: true },
  accentColor: { type: String, default: '#10B981' },
  videoUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Lesson = mongoose.model('Lesson', LessonSchema);

// Skill Lesson Schema
const SkillLessonSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  duration: { type: String, default: '15:00' },
  views: { type: String, default: '0' },
  level: { type: String, default: 'Beginner' },
  completed: { type: Boolean, default: false },
  videoUrl: { type: String, default: '' }
});

// Skill Schema (HVP)
const SkillSchema = new mongoose.Schema({
  title: { type: String, required: true },
  level: { type: Number, default: 0 },
  dotColor: { type: String, default: '#10B981' },
  subtitle: { type: String, default: '' },
  bars: { type: [Number], default: [] },
  lessons: { type: [SkillLessonSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});
const Skill = mongoose.model('Skill', SkillSchema);

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

// Savings Goal Schema
const SavingsGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  target: { type: Number, required: true },
  saved: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const SavingsGoal = mongoose.model('SavingsGoal', SavingsGoalSchema);

// Income Source Schema
const IncomeSourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  spendLimit: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const IncomeSource = mongoose.model('IncomeSource', IncomeSourceSchema);

const SurvivalSpendingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  food: { type: Number, default: 0 },
  clothes: { type: Number, default: 0 },
  travel: { type: Number, default: 0 },
  rent: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
  loan: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const SurvivalSpending = mongoose.model('SurvivalSpending', SurvivalSpendingSchema);

// ── Database Seeding Helper ──
// ── Database Seeding Helper ──
async function seedDefaultUser() {
  try {
    // 1. Seed regular user
    const existing = await User.findOne({ email: 'alex.chen@example.com' });
    let userId;
    if (!existing) {
      console.log('Seeder: Seeding default user alex.chen@example.com...');
      const user = new User({
        name: 'Alex Chen',
        email: 'alex.chen@example.com',
        role: 'user',
        // bcrypt hash for "finance123"
        passwordHash: '$2a$10$wN1QYlB8XwZqC5bFzJ/u1e.V1d.yLd8w0nC7xJb0jQ1hU1kZg2.8O'
      });
      const savedUser = await user.save();
      userId = savedUser._id;

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

      // Seed Savings Goals
      await SavingsGoal.insertMany([
        { userId, name: 'Emergency Fund', target: 10000, saved: 6500 },
        { userId, name: 'Vacation', target: 3000, saved: 1200 },
        { userId, name: 'New Laptop', target: 2500, saved: 900 }
      ]);
      console.log('Seeder: Default user and data seeded successfully!');
    } else {
      console.log('Seeder: Default user alex.chen@example.com already exists.');
    }

    // 2. Seed Admin user
    const existingAdmin = await User.findOne({ email: 'admin@finverse.com' });
    if (!existingAdmin) {
      console.log('Seeder: Seeding admin user admin@finverse.com...');
      const adminSalt = await bcrypt.genSalt(10);
      const adminPasswordHash = await bcrypt.hash('adminpassword123', adminSalt);
      const admin = new User({
        name: 'Finverse Admin',
        email: 'admin@finverse.com',
        role: 'admin',
        passwordHash: adminPasswordHash
      });
      await admin.save();
      console.log('Seeder: Admin user seeded successfully!');
    } else {
      console.log('Seeder: Admin user already exists.');
    }

    // 3. Seed Leverage Lab Lessons
    const lessonsCount = await Lesson.countDocuments({});
    if (lessonsCount === 0) {
      console.log('Seeder: Seeding default Leverage Lab lessons...');
      const initialLessons = [
        { title: 'Building Scalable Apps with React Native', description: 'Learn full-stack mobile development from zero to production-ready apps.', duration: '24:30', views: '1.2K', level: 'Advanced', completed: true, categoryId: '1', accentColor: '#3B82F6' },
        { title: 'YouTube Content Creation Masterclass', description: 'Grow your tech channel and monetise your expertise effectively.', duration: '18:45', views: '890', level: 'Intermediate', completed: false, categoryId: '1', accentColor: '#3B82F6' },
        { title: 'Automating Revenue with Code', description: 'Write code once, earn forever — systems that generate passive income.', duration: '32:10', views: '2.4K', level: 'Advanced', completed: false, categoryId: '1', accentColor: '#3B82F6' },
        { title: 'Writing an E-book That Sells', description: 'Turn your domain expertise into a polished, profitable digital product.', duration: '15:20', views: '640', level: 'Beginner', completed: true, categoryId: '2', accentColor: '#8B5CF6' },
        { title: 'Building Authority Through Knowledge', description: 'Position yourself as an expert and attract high-value opportunities.', duration: '22:00', views: '1.1K', level: 'Intermediate', completed: false, categoryId: '2', accentColor: '#8B5CF6' },
        { title: 'Freelance Agency Blueprint', description: 'Outsource effectively and build an agency that runs without you.', duration: '28:15', views: '1.8K', level: 'Advanced', completed: true, categoryId: '3', accentColor: '#F59E0B' },
        { title: 'Hiring & Managing Remote Teams', description: 'Find top talent globally and manage distributed teams at scale.', duration: '19:50', views: '950', level: 'Intermediate', completed: false, categoryId: '3', accentColor: '#F59E0B' },
        { title: 'Newsletter Growth Strategies', description: 'Build a loyal subscriber base that converts to revenue.', duration: '14:30', views: '720', level: 'Beginner', completed: false, categoryId: '4', accentColor: '#10B981' },
        { title: 'Networking for Leverage', description: 'Build strategic relationships that multiply your opportunities.', duration: '20:45', views: '1.5K', level: 'Intermediate', completed: true, categoryId: '4', accentColor: '#10B981' }
      ];
      await Lesson.insertMany(initialLessons);
      console.log('Seeder: Leverage Lab lessons seeded successfully!');
    }

    // 4. Seed HVP Skills
    const skillsCount = await Skill.countDocuments({});
    if (skillsCount === 0) {
      console.log('Seeder: Seeding default HVP skills...');
      const initialSkills = [
        {
          title: 'Tech / Coding', level: 78, dotColor: '#EF4444',
          subtitle: 'Strong in React, Node.js, Python',
          bars: [50, 60, 60, 80, 100],
          lessons: [
            { id: 'l1', title: 'React Native Fundamentals', description: 'Master components, state, and navigation from scratch.', duration: '22:15', views: '2.1K', level: 'Intermediate', completed: true },
            { id: 'l2', title: 'Node.js Backend Architecture', description: 'Build scalable REST APIs and microservices.', duration: '30:40', views: '1.8K', level: 'Advanced', completed: true },
            { id: 'l3', title: 'Python for Automation', description: 'Automate repetitive tasks and build smart scripts.', duration: '18:30', views: '1.4K', level: 'Beginner', completed: false }
          ]
        },
        {
          title: 'High-End Sales', level: 80, dotColor: '#F59E0B',
          subtitle: 'Learning consultative selling',
          bars: [30, 40, 50, 60, 70, 100],
          lessons: [
            { id: 'l4', title: 'Consultative Selling Framework', description: 'Ask the right questions and close premium deals.', duration: '25:00', views: '1.6K', level: 'Advanced', completed: true },
            { id: 'l5', title: 'Handling Objections Like a Pro', description: 'Turn "no" into "yes" with psychology-backed techniques.', duration: '16:45', views: '2.3K', level: 'Intermediate', completed: false },
            { id: 'l6', title: 'Building a Sales Pipeline', description: 'Create predictable revenue with a structured pipeline.', duration: '20:10', views: '980', level: 'Intermediate', completed: false }
          ]
        },
        {
          title: 'Business Strategy', level: 40, dotColor: '#3B82F6',
          subtitle: 'Reading Lean Startup',
          bars: [20, 20, 40, 40],
          lessons: [
            { id: 'l7', title: 'Lean Startup Methodology', description: 'Build, measure, learn — validate ideas fast.', duration: '28:30', views: '3.2K', level: 'Beginner', completed: true },
            { id: 'l8', title: 'Competitive Analysis Deep Dive', description: 'Map your market and find your strategic advantage.', duration: '19:15', views: '750', level: 'Intermediate', completed: false }
          ]
        },
        {
          title: 'UI/UX', level: 70, dotColor: '#8B5CF6',
          subtitle: 'Mastering Figma & design systems',
          bars: [40, 50, 60, 60, 70],
          lessons: [
            { id: 'l9', title: 'Design Systems from Zero', description: 'Build reusable tokens, components, and patterns.', duration: '35:20', views: '2.7K', level: 'Advanced', completed: true },
            { id: 'l10', title: 'User Research Essentials', description: 'Conduct interviews and usability tests that matter.', duration: '17:50', views: '1.1K', level: 'Beginner', completed: false },
            { id: 'l11', title: 'Figma Prototyping Masterclass', description: 'Create interactive prototypes and micro-animations.', duration: '24:00', views: '1.9K', level: 'Intermediate', completed: true }
          ]
        },
        {
          title: 'Psychology', level: 65, dotColor: '#10B981',
          subtitle: 'Studying human behavior & persuasion',
          bars: [30, 40, 50, 60, 65],
          lessons: [
            { id: 'l12', title: 'Influence & Persuasion', description: "Cialdini's principles applied to business and life.", duration: '21:30', views: '3.5K', level: 'Beginner', completed: true },
            { id: 'l13', title: 'Behavioral Economics', description: 'Understand how people make irrational decisions.', duration: '26:10', views: '1.3K', level: 'Intermediate', completed: false }
          ]
        }
      ];
      await Skill.insertMany(initialSkills);
      console.log('Seeder: HVP skills seeded successfully!');
    }

  } catch (error) {
    console.error('Seeder: Seeding failed:', error);
  }
}

// Flexible Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = { isGuest: true };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { isGuest: true };
      return next();
    }
    req.user = user;
    next();
  });
}

// Admin Authentication Middleware
function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
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
      passwordHash,
      role: 'user'
    });

    const savedUser = await newUser.save();
    const token = jwt.sign({ id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      token, 
      user: { 
        id: savedUser._id, 
        name: savedUser.name, 
        email: savedUser.email, 
        phone: savedUser.phone || '', 
        avatar: savedUser.avatar || '', 
        role: savedUser.role 
      } 
    });
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

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone || '', 
        avatar: user.avatar || '', 
        role: user.role 
      } 
    });
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
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '', avatar: user.avatar || '', role: user.role, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update User Profile (Name, Phone, Avatar)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, avatar, email } = req.body;
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatar !== undefined) updateFields.avatar = avatar;

    // Update user record in MongoDB Atlas
    const targetEmail = (email || req.user?.email || 'alex.chen@example.com').toLowerCase();
    const query = req.user?.id && !req.user?.isGuest
      ? { $or: [{ _id: req.user.id }, { email: targetEmail }] }
      : { email: targetEmail };

    await User.updateMany(query, { $set: updateFields });

    const updatedUser = await User.findOne(query).select('-passwordHash');
    const obj = updatedUser ? updatedUser.toObject() : { name, phone, avatar };
    if (obj._id) obj.id = obj._id.toString();

    console.log('[MongoDB Backend] Profile saved to database:', obj.name, '| Phone:', obj.phone);
    res.json({ message: 'Profile updated successfully', user: obj });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── Combined Screen Sync Endpoints ──

app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    let userId = req.user?.id;
    if (!userId || req.user?.isGuest) {
      const defaultUser = await User.findOne({ email: 'alex.chen@example.com' });
      if (defaultUser) userId = defaultUser._id;
    }

    const userDoc = userId ? await User.findById(userId) : null;
    console.log('[MongoDB Backend GET /api/data] User doc phone:', userDoc?.email, '| Phone:', userDoc?.phone);
    const transactions = userId ? await Transaction.find({ userId }).sort({ createdAt: -1 }) : [];
    const assets = userId ? await Asset.find({ userId }) : [];
    const debts = userId ? await Debt.find({ userId }) : [];
    const audits = userId ? await Audit.find({ userId }).sort({ createdAt: -1 }) : [];
    const savings = userId ? await SavingsGoal.find({ userId }).sort({ createdAt: -1 }) : [];
    const lessons = await Lesson.find({}).sort({ createdAt: 1 });
    const skills = await Skill.find({}).sort({ createdAt: 1 });
    const incomeSources = userId ? await IncomeSource.find({ userId }).sort({ createdAt: -1 }) : [];
    const survivalSpending = userId ? await SurvivalSpending.findOne({ userId }) : null;

    res.json({
      user: userDoc ? { id: userDoc._id.toString(), name: userDoc.name, email: userDoc.email, phone: userDoc.phone || '', avatar: userDoc.avatar || '' } : null,
      transactions: formatDocuments(transactions),
      assets: formatDocuments(assets),
      debts: formatDocuments(debts),
      audits: formatDocuments(audits),
      savings: formatDocuments(savings),
      lessons: formatDocuments(lessons),
      skills: formatDocuments(skills),
      incomeSources: formatDocuments(incomeSources),
      survivalSpending: survivalSpending ? { ...survivalSpending.toObject(), id: survivalSpending._id.toString() } : null
    });
  } catch (err) {
    console.error('Data Sync Error:', err);
    res.status(500).json({ error: 'Failed to sync financial data from MongoDB' });
  }
});

// ── File Upload Endpoint ──
app.post('/api/upload', authenticateAdmin, upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded' });
  }
  const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ videoUrl });
});

// ── Leverage Lab Lessons Endpoints ──

app.get('/api/leverage/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find({}).sort({ createdAt: 1 });
    res.json(formatDocuments(lessons));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leverage lessons' });
  }
});

app.post('/api/leverage/lessons', authenticateAdmin, async (req, res) => {
  const { title, description, duration, views, level, completed, categoryId, accentColor, videoUrl } = req.body;
  if (!title || !categoryId) {
    return res.status(400).json({ error: 'Title and categoryId are required' });
  }
  try {
    const newLesson = new Lesson({
      title,
      description: description || '',
      duration: duration || '15:00',
      views: views || '0',
      level: level || 'Beginner',
      completed: completed || false,
      categoryId,
      accentColor: accentColor || '#10B981',
      videoUrl: videoUrl || ''
    });
    const saved = await newLesson.save();
    res.status(201).json({ ...saved.toObject(), id: saved._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create leverage lesson' });
  }
});

app.put('/api/leverage/lessons/:id', authenticateAdmin, async (req, res) => {
  const { title, description, duration, views, level, completed, categoryId, accentColor, videoUrl } = req.body;
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (duration !== undefined) lesson.duration = duration;
    if (views !== undefined) lesson.views = views;
    if (level !== undefined) lesson.level = level;
    if (completed !== undefined) lesson.completed = completed;
    if (categoryId !== undefined) lesson.categoryId = categoryId;
    if (accentColor !== undefined) lesson.accentColor = accentColor;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;

    const saved = await lesson.save();
    res.json({ ...saved.toObject(), id: saved._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update leverage lesson' });
  }
});

app.delete('/api/leverage/lessons/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await Lesson.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leverage lesson' });
  }
});

// ── HVP Skills Endpoints ──

app.get('/api/hvp/skills', async (req, res) => {
  try {
    const skills = await Skill.find({}).sort({ createdAt: 1 });
    res.json(formatDocuments(skills));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch HVP skills' });
  }
});

app.post('/api/hvp/skills', authenticateAdmin, async (req, res) => {
  const { title, level, dotColor, subtitle, bars, lessons } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const newSkill = new Skill({
      title,
      level: level || 0,
      dotColor: dotColor || '#10B981',
      subtitle: subtitle || '',
      bars: bars || [],
      lessons: lessons || []
    });
    const saved = await newSkill.save();
    res.status(201).json({ ...saved.toObject(), id: saved._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create HVP skill' });
  }
});

app.put('/api/hvp/skills/:id', authenticateAdmin, async (req, res) => {
  const { title, level, dotColor, subtitle, bars, lessons } = req.body;
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    if (title !== undefined) skill.title = title;
    if (level !== undefined) skill.level = level;
    if (dotColor !== undefined) skill.dotColor = dotColor;
    if (subtitle !== undefined) skill.subtitle = subtitle;
    if (bars !== undefined) skill.bars = bars;
    if (lessons !== undefined) skill.lessons = lessons;

    const saved = await skill.save();
    res.json({ ...saved.toObject(), id: saved._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update HVP skill' });
  }
});

app.delete('/api/hvp/skills/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await Skill.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete HVP skill' });
  }
});

// ── Transactions Endpoints ──

app.get('/api/transactions/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Group by category (only for expenses)
    const categoryWise = await Transaction.aggregate([
      { $match: { userId, type: 'expense' } },
      { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } }
    ]);

    // Group by date (only for expenses)
    const dateWise = await Transaction.aggregate([
      { $match: { userId, type: 'expense' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      categoryWise: categoryWise.map(c => ({ category: c._id, amount: c.totalAmount, count: c.count })),
      dateWise: dateWise.map(d => ({ date: d._id, amount: d.totalAmount, count: d.count }))
    });
  } catch (err) {
    console.error('Analytics aggregation error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction analytics' });
  }
});

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

// ── Savings Goals Endpoints ──

app.post('/api/savings', authenticateToken, async (req, res) => {
  const { name, target, saved } = req.body;
  if (!name || target === undefined) {
    return res.status(400).json({ error: 'Name and target are required' });
  }

  try {
    const newGoal = new SavingsGoal({
      userId: req.user.id,
      name,
      target: parseFloat(target),
      saved: saved !== undefined ? parseFloat(saved) : 0
    });

    const savedGoal = await newGoal.save();
    res.status(201).json({ ...savedGoal.toObject(), id: savedGoal._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create savings goal' });
  }
});

app.put('/api/savings/:id', authenticateToken, async (req, res) => {
  const { name, target, saved } = req.body;

  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }

    if (name !== undefined) goal.name = name;
    if (target !== undefined) goal.target = parseFloat(target);
    if (saved !== undefined) goal.saved = parseFloat(saved);

    const savedGoal = await goal.save();
    res.json({ ...savedGoal.toObject(), id: savedGoal._id.toString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update savings goal' });
  }
});

app.delete('/api/savings/:id', authenticateToken, async (req, res) => {
  try {
    const result = await SavingsGoal.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Savings goal not found' });
    }
    res.json({ success: true, message: 'Savings goal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete savings goal' });
  }
});

// ── Income Sources Endpoints ──

app.get('/api/income-sources', authenticateToken, async (req, res) => {
  try {
    const sources = await IncomeSource.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(formatDocuments(sources));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch income sources' });
  }
});

app.post('/api/income-sources', authenticateToken, async (req, res) => {
  const { type, amount } = req.body;
  if (!type || amount === undefined) {
    return res.status(400).json({ error: 'Type and amount are required' });
  }
  try {
    const numericAmount = parseFloat(amount);
    const spendLimit = numericAmount / 30;
    const source = await IncomeSource.findOneAndUpdate(
      { userId: req.user.id, type },
      { amount: numericAmount, spendLimit },
      { new: true, upsert: true }
    );
    res.status(200).json({ ...source.toObject(), id: source._id.toString() });
  } catch (err) {
    console.error('Failed to create/update income source:', err);
    res.status(500).json({ error: 'Failed to save income source' });
  }
});

app.delete('/api/income-sources/:id', authenticateToken, async (req, res) => {
  try {
    const result = await IncomeSource.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Income source not found' });
    }
    res.json({ success: true, message: 'Income source deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete income source' });
  }
});

// ── Survival Spending Endpoints ──

app.get('/api/survival-spending', authenticateToken, async (req, res) => {
  try {
    const spending = await SurvivalSpending.findOne({ userId: req.user.id });
    res.json(spending ? { ...spending.toObject(), id: spending._id.toString() } : null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch survival spending' });
  }
});

app.post('/api/survival-spending', authenticateToken, async (req, res) => {
  const { food, clothes, travel, rent, other, loan } = req.body;
  try {
    const spending = await SurvivalSpending.findOneAndUpdate(
      { userId: req.user.id },
      {
        food: parseFloat(food || 0),
        clothes: parseFloat(clothes || 0),
        travel: parseFloat(travel || 0),
        rent: parseFloat(rent || 0),
        other: parseFloat(other || 0),
        loan: parseFloat(loan || 0)
      },
      { new: true, upsert: true }
    );
    res.status(200).json({ ...spending.toObject(), id: spending._id.toString() });
  } catch (err) {
    console.error('Failed to save survival spending:', err);
    res.status(500).json({ error: 'Failed to save survival spending' });
  }
});

// Run server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== MongoDB-Backed Express Backend running at http://localhost:${PORT} ===`);
});
