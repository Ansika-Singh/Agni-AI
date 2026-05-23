require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

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
