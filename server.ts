import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

// Leaderboard - In-memory for now (will be reset on server restart)
// In a real plug-and-play app, this could be a local JSON file or just handled client-side
let leaderboard: any[] = [];

// GET /api/leaderboard - Fetch top 10 players
app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard.slice(0, 10));
});

// POST /api/leaderboard - Update leaderboard
app.post('/api/leaderboard', (req, res) => {
  const { name, balance, stats } = req.body;
  
  const existingIndex = leaderboard.findIndex(e => e.name === name);
  const newEntry = { name, balance, stats, timestamp: Date.now() };

  if (existingIndex !== -1) {
    if (balance > leaderboard[existingIndex].balance) {
      leaderboard[existingIndex] = newEntry;
    }
  } else {
    leaderboard.push(newEntry);
  }

  leaderboard.sort((a, b) => b.balance - a.balance);
  if (leaderboard.length > 50) leaderboard.pop(); // Keep only top 50
  
  res.json({ success: true, leaderboard: leaderboard.slice(0, 10) });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

