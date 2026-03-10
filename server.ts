import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URI || '';
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

if (!uri || uri.includes('<db_password>')) {
  console.warn('WARNING: MONGODB_URI is not properly configured. Please update your .env file.');
}

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, sparse: true, unique: true },
  phone: { type: String, sparse: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 50000 },
  bankruptCount: { type: Number, default: 0 },
  isDead: { type: Boolean, default: false },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    pushes: { type: Number, default: 0 },
    blackjacks: { type: Number, default: 0 },
    totalHands: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
  },
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB via Mongoose'))
  .catch(err => console.error('Mongoose connection error:', err));

// Auth Endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ] 
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: email || undefined,
      phone: phone || undefined,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });
    res.status(201).json({ token, user: { name: user.name, balance: user.balance, stats: user.stats } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier }
      ]
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, balance: user.balance, stats: user.stats } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to verify token (optional for now, but good practice)
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    (req as any).userId = (decoded as any).userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/leaderboard - Fetch top 10 players
app.get('/api/leaderboard', async (req, res) => {
  try {
    const entries = await User.find()
      .sort({ balance: -1 })
      .limit(10)
      .select('name balance stats timestamp')
      .lean();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Update user stats and balance after a game
app.post('/api/user/update', authenticate, async (req: any, res) => {
  try {
    const { balance, stats, bankruptCount, isDead } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      $set: { balance, stats, bankruptCount, isDead }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
