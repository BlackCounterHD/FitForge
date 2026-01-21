const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4069;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`FitForge backend running on http://localhost:${PORT}`);
});
