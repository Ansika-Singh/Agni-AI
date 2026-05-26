require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Secure CORS: Allow frontend URL or localhost
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL || 'http://localhost:3000'
];
app.use(cors({ origin: allowedOrigins }));

// Protect against massive JSON payloads
app.use(express.json({ limit: '2mb' }));

// Rate limiting to protect Gemini API quota
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Routes
app.use('/api/floorplan', require('./routes/floorplan'));
app.use('/api/vastu', require('./routes/vastu'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/chat', require('./routes/chat'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// MongoDB connection (optional — app works without it in mock mode)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.warn('⚠️  MongoDB not connected:', err.message));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Agni AI backend running on http://localhost:${PORT}`));

// Global Error Handlers
app.use((err, req, res, next) => {
  console.error('Unhandled Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // It is recommended to crash gracefully here in production, but for dev we just log
});
