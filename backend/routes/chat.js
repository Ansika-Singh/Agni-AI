const express = require('express');
const router = express.Router();
const { chatWithAgni } = require('../services/geminiService');

// In-memory conversation store (use Redis/MongoDB for production)
const conversations = new Map();

// POST /api/chat/message
router.post('/message', async (req, res) => {
  try {
    const { message, language = 'en', sessionId } = req.body;

    if (!message) return res.status(400).json({ error: 'message required' });

    // Get or create conversation history
    const history = conversations.get(sessionId) || [];
    const response = await chatWithAgni(message, language, history);

    // Update history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });
    if (sessionId) conversations.set(sessionId, history.slice(-20)); // keep last 20

    res.json({ success: true, response, sessionId });
  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// DELETE /api/chat/session/:id — clear conversation
router.delete('/session/:id', (req, res) => {
  conversations.delete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
