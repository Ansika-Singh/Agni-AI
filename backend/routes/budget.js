const express = require('express');
const router = express.Router();

const FURNITURE_CATALOG = [
  // Living Room
  { id: 1, name: 'L-Shaped Sofa', room: 'Living Room', style: 'Modern', price: 35000, budget_tier: '₹15L–₹30L', flipkart: 'https://flipkart.com/search?q=l+shaped+sofa', amazon: 'https://amazon.in/s?k=l+shaped+sofa', pepperfry: 'https://pepperfry.com/search?q=l+shaped+sofa' },
  { id: 2, name: 'Wooden Sofa Set', room: 'Living Room', style: 'Traditional Indian', price: 28000, budget_tier: '₹5L–₹15L', flipkart: 'https://flipkart.com/search?q=wooden+sofa+set', amazon: 'https://amazon.in/s?k=wooden+sofa+set', pepperfry: 'https://pepperfry.com/search?q=wooden+sofa' },
  { id: 3, name: 'Minimalist Coffee Table', room: 'Living Room', style: 'Minimalist', price: 8500, budget_tier: 'Under ₹5L', flipkart: 'https://flipkart.com/search?q=coffee+table', amazon: 'https://amazon.in/s?k=coffee+table', pepperfry: 'https://pepperfry.com/search?q=coffee+table' },
  { id: 4, name: 'Royal TV Cabinet', room: 'Living Room', style: 'Royal/Heritage', price: 55000, budget_tier: '₹30L+', flipkart: 'https://flipkart.com/search?q=royal+tv+cabinet', amazon: 'https://amazon.in/s?k=royal+tv+unit', pepperfry: 'https://pepperfry.com/search?q=tv+unit' },
  // Bedroom
  { id: 5, name: 'King Size Bed with Storage', room: 'Master Bedroom', style: 'Modern', price: 45000, budget_tier: '₹15L–₹30L', flipkart: 'https://flipkart.com/search?q=king+size+bed', amazon: 'https://amazon.in/s?k=king+size+bed+storage', pepperfry: 'https://pepperfry.com/search?q=king+bed' },
  { id: 6, name: 'Wooden Almirah', room: 'Master Bedroom', style: 'Traditional Indian', price: 22000, budget_tier: '₹5L–₹15L', flipkart: 'https://flipkart.com/search?q=wooden+almirah', amazon: 'https://amazon.in/s?k=wooden+wardrobe', pepperfry: 'https://pepperfry.com/search?q=almirah' },
  { id: 7, name: 'Dressing Table with Mirror', room: 'Master Bedroom', style: 'Modern', price: 15000, budget_tier: '₹5L–₹15L', flipkart: 'https://flipkart.com/search?q=dressing+table', amazon: 'https://amazon.in/s?k=dressing+table+mirror', pepperfry: 'https://pepperfry.com/search?q=dressing+table' },
  // Kitchen
  { id: 8, name: 'Modular Kitchen Set', room: 'Kitchen', style: 'Modern', price: 150000, budget_tier: '₹15L–₹30L', flipkart: 'https://flipkart.com/search?q=modular+kitchen', amazon: 'https://amazon.in/s?k=modular+kitchen', pepperfry: 'https://pepperfry.com/search?q=kitchen' },
  { id: 9, name: 'Steel Shelving Unit', room: 'Kitchen', style: 'Minimalist', price: 5000, budget_tier: 'Under ₹5L', flipkart: 'https://flipkart.com/search?q=kitchen+shelf', amazon: 'https://amazon.in/s?k=kitchen+shelving', pepperfry: 'https://pepperfry.com/search?q=kitchen+shelf' },
  // Study
  { id: 10, name: 'Study Table with Bookshelf', room: 'Study Room', style: 'Modern', price: 12000, budget_tier: '₹5L–₹15L', flipkart: 'https://flipkart.com/search?q=study+table+bookshelf', amazon: 'https://amazon.in/s?k=study+table', pepperfry: 'https://pepperfry.com/search?q=study+table' },
  // Pooja
  { id: 11, name: 'Carved Pooja Mandir', room: 'Pooja Room', style: 'Traditional Indian', price: 18000, budget_tier: '₹5L–₹15L', flipkart: 'https://flipkart.com/search?q=pooja+mandir+wooden', amazon: 'https://amazon.in/s?k=pooja+mandir', pepperfry: 'https://pepperfry.com/search?q=mandir' },
  { id: 12, name: 'Marble Pooja Unit', room: 'Pooja Room', style: 'Royal/Heritage', price: 65000, budget_tier: '₹30L+', flipkart: 'https://flipkart.com/search?q=marble+pooja+unit', amazon: 'https://amazon.in/s?k=marble+mandir', pepperfry: 'https://pepperfry.com/search?q=marble+mandir' },
];

const BUDGET_MAP = {
  'Under ₹5L': { max: 500000, furnitureMax: 5000 },
  '₹5L–₹15L': { max: 1500000, furnitureMax: 30000 },
  '₹15L–₹30L': { max: 3000000, furnitureMax: 60000 },
  '₹30L+': { max: Infinity, furnitureMax: Infinity },
};

// POST /api/budget/furniture
router.post('/furniture', (req, res) => {
  try {
    const { budget, style, rooms: selectedRooms } = req.body;
    const budgetConfig = BUDGET_MAP[budget] || BUDGET_MAP['₹5L–₹15L'];

    let furniture = FURNITURE_CATALOG.filter(item => {
      const withinBudget = item.price <= budgetConfig.furnitureMax;
      const styleMatch = !style || item.style === style || style === 'Modern';
      const roomMatch = !selectedRooms || selectedRooms.some(r =>
        item.room.toLowerCase().includes(r.toLowerCase()) ||
        r.toLowerCase().includes(item.room.toLowerCase().split(' ')[0])
      );
      return withinBudget && styleMatch && roomMatch;
    });

    const breakdown = {
      construction: Math.round(budgetConfig.max * 0.6),
      interiors: Math.round(budgetConfig.max * 0.25),
      furniture: Math.round(budgetConfig.max * 0.15),
    };

    res.json({ success: true, furniture, breakdown, currency: '₹' });
  } catch (err) {
    res.status(500).json({ error: 'Budget calculation failed' });
  }
});

module.exports = router;
