const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// JSON file storage
const DB_PATH = path.join(__dirname, 'data.json');

// Initialize or load data
function loadData() {
  if (fs.existsSync(DB_PATH)) {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  }
  // Default data structure
  const defaultData = {
    users: [
      {
        id: 1,
        name: 'Demo User',
        email: 'demo@fitforge.com',
        avatar: '',
        theme: 'light',
        created_at: new Date().toISOString()
      }
    ],
    goals: [],
    streaks: [
      {
        id: 1,
        user_id: 1,
        current_streak: 0,
        longest_streak: 0,
        last_workout_date: null
      }
    ]
  };
  saveData(defaultData);
  return defaultData;
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

let data = loadData();

// Helper to get next ID
function getNextId(array) {
  if (array.length === 0) return 1;
  return Math.max(...array.map(item => item.id)) + 1;
}

// ============ USER PROFILE ROUTES ============

// Get user profile
app.get('/api/user/:id', (req, res) => {
  const user = data.users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Update user profile
app.put('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email, avatar, theme } = req.body;
  const userIndex = data.users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  data.users[userIndex] = {
    ...data.users[userIndex],
    name: name || data.users[userIndex].name,
    email: email || data.users[userIndex].email,
    avatar: avatar || '',
    theme: theme || 'light'
  };

  saveData(data);
  res.json(data.users[userIndex]);
});

// Update theme only
app.patch('/api/user/:id/theme', (req, res) => {
  const userId = parseInt(req.params.id);
  const { theme } = req.body;
  const userIndex = data.users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  data.users[userIndex].theme = theme;
  saveData(data);
  res.json({ success: true, theme });
});

// ============ GOALS ROUTES ============

// Get all goals for user
app.get('/api/goals/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userGoals = data.goals
    .filter(g => g.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(userGoals);
});

// Create new goal
app.post('/api/goals', (req, res) => {
  const { user_id, title, description, target_value, category } = req.body;
  const newGoal = {
    id: getNextId(data.goals),
    user_id: parseInt(user_id),
    title,
    description: description || '',
    target_value: target_value || '',
    category: category || 'Other',
    is_completed: false,
    created_at: new Date().toISOString()
  };
  data.goals.push(newGoal);
  saveData(data);
  res.json(newGoal);
});

// Update goal
app.put('/api/goals/:id', (req, res) => {
  const goalId = parseInt(req.params.id);
  const goalIndex = data.goals.findIndex(g => g.id === goalId);

  if (goalIndex === -1) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const { title, description, target_value, category, is_completed } = req.body;
  data.goals[goalIndex] = {
    ...data.goals[goalIndex],
    title,
    description,
    target_value,
    category,
    is_completed: !!is_completed
  };

  saveData(data);
  res.json(data.goals[goalIndex]);
});

// Delete goal
app.delete('/api/goals/:id', (req, res) => {
  const goalId = parseInt(req.params.id);
  data.goals = data.goals.filter(g => g.id !== goalId);
  saveData(data);
  res.json({ success: true });
});

// ============ STREAK ROUTES ============

// Get streak for user
app.get('/api/streak/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  let streak = data.streaks.find(s => s.user_id === userId);

  if (!streak) {
    streak = {
      id: getNextId(data.streaks),
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_workout_date: null
    };
    data.streaks.push(streak);
    saveData(data);
  }

  res.json(streak);
});

// Log workout and update streak
app.post('/api/streak/:userId/log', (req, res) => {
  const userId = parseInt(req.params.userId);
  const today = new Date().toISOString().split('T')[0];

  let streakIndex = data.streaks.findIndex(s => s.user_id === userId);

  if (streakIndex === -1) {
    const newStreak = {
      id: getNextId(data.streaks),
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_workout_date: today
    };
    data.streaks.push(newStreak);
    saveData(data);
    return res.json(newStreak);
  }

  const streak = data.streaks[streakIndex];

  if (streak.last_workout_date === today) {
    // Already logged today
    return res.json(streak);
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreakCount;
  if (streak.last_workout_date === yesterdayStr) {
    // Consecutive day - increment streak
    newStreakCount = streak.current_streak + 1;
  } else {
    // Streak broken - start fresh
    newStreakCount = 1;
  }

  data.streaks[streakIndex] = {
    ...streak,
    current_streak: newStreakCount,
    longest_streak: Math.max(newStreakCount, streak.longest_streak),
    last_workout_date: today
  };

  saveData(data);
  res.json(data.streaks[streakIndex]);
});

// Reset streak
app.post('/api/streak/:userId/reset', (req, res) => {
  const userId = parseInt(req.params.userId);
  const streakIndex = data.streaks.findIndex(s => s.user_id === userId);

  if (streakIndex !== -1) {
    data.streaks[streakIndex].current_streak = 0;
    data.streaks[streakIndex].last_workout_date = null;
    saveData(data);
    res.json(data.streaks[streakIndex]);
  } else {
    res.status(404).json({ error: 'Streak not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`FitForge backend running on http://localhost:${PORT}`);
});
