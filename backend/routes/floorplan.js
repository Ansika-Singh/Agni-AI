const express = require('express');
const router = express.Router();
const { generateFloorPlan } = require('../services/geminiService');

// POST /api/floorplan/generate
router.post('/generate', async (req, res) => {
  try {
    const { description, preferences } = req.body;
    if (!description && !preferences) {
      return res.status(400).json({ error: 'description or preferences required' });
    }

    const prompt = description || buildPromptFromPreferences(preferences);
    const floorPlan = await generateFloorPlan(prompt, preferences);
    const floors = [...new Set(floorPlan.rooms.map(r => r.floor || 0))];
    console.log(`[API /generate] Returning ${floorPlan.rooms.length} rooms across floors: ${floors.join(', ')}`);
    res.json({ success: true, floorPlan });
  } catch (err) {
    console.error('Floor plan error:', err);
    res.status(500).json({ error: 'Failed to generate floor plan' });
  }
});

// POST /api/floorplan/template
router.post('/template', (req, res) => {
  const { type } = req.body;
  const templates = require('../data/templates');
  const template = templates[type] || templates['2BHK'];
  res.json({ success: true, floorPlan: template });
});

function buildPromptFromPreferences(prefs) {
  return `Design a ${prefs.homeType || '2BHK'} home, which is a ${prefs.storeys || 'Single Storey'} structure, with ${prefs.style || 'Modern'} style, 
  facing ${prefs.facing || 'East'}, budget ${prefs.budget || '₹15L–₹30L'}, 
  with rooms: ${(prefs.rooms || []).join(', ')}, 
  Vastu compliance: ${prefs.vastu || 'Preferred'}, 
  kitchen style: ${prefs.kitchenStyle || 'Open Kitchen'}, 
  color palette: ${prefs.colorPalette || 'Warm (beige, terracotta)'}, 
  flooring material: ${prefs.flooring || 'Marble'}, 
  special requirements: ${(prefs.specialRequirements || []).join(', ') || 'None'}.`;
}

module.exports = router;
