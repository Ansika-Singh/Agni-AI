import { useState, useEffect, useRef } from 'react';
import Wizard from '../components/Wizard';
import ThreeViewer from '../components/ThreeViewer';
import LandscapePreview from '../components/LandscapePreview';
import VastuMeter from '../components/VastuMeter';
import VoiceBot from '../components/VoiceBot';
import { exportToDXF } from '../utils/dxfExporter';
import { exportBlueprintPDF, exportEstimatePDF } from '../utils/pdfGenerator';

export default function Designer() {
  const [floorPlan, setFloorPlan] = useState(null);
  const [vastuData, setVastuData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // UI Layout States
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [hoveredRoom, setHoveredRoom] = useState(null);
  const [placeMode, setPlaceMode] = useState('select'); // 'select', 'door', 'window'
  const [viewMode, setViewMode] = useState('3D');
  const [wireframeMode, setWireframeMode] = useState(false);
  const [showVastuOverlay, setShowVastuOverlay] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const [showInspector, setShowInspector] = useState(false);
  useEffect(() => {
    // Check backend health on mount
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/health`)
      .then(res => res.json())
      .then(data => console.log("Backend Health:", data))
      .catch(err => {
        console.error("Backend Health Check Failed:", err);
        showToast(`Backend Unreachable: ${err.message}`, 'error');
      });
  }, []);

  const [activeFloor, setActiveFloor] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // ─── CHAT DRAWER STATES ─────────────────────────────────────────────────────
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "Namaste! 🙏 I'm your Agni AI assistant. Ask me anything about your home design, Vastu tips, or furniture suggestions!" }
  ]);
  const [chatMicOn, setChatMicOn] = useState(false);
  const [isChatThinking, setIsChatThinking] = useState(false);

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ─── NEW CAD FEATURE STATES ───────────────────────────────────────────────
  const [blueprintMode, setBlueprintMode] = useState(false);
  const [structureLayer, setStructureLayer] = useState(true);
  const [electricalLayer, setElectricalLayer] = useState(false);
  const [plumbingLayer, setPlumbingLayer] = useState(false);
  const [furnitureLayer, setFurnitureLayer] = useState(true);
  const [sunTime, setSunTime] = useState(12);
  const [plotFacing, setPlotFacing] = useState('East');
  const [unit, setUnit] = useState('m');
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [finishTier, setFinishTier] = useState('Standard');
  const [showCadPanel, setShowCadPanel] = useState(false);
  const [showLandscapePreview, setShowLandscapePreview] = useState(false);
  const [landscapePreferences, setLandscapePreferences] = useState(null);

  // PREMIUM SOFTWARE PLAN ENFORCEMENT & SIMULATOR
  const [currentPlan, setCurrentPlan] = useState('Starter');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState('dxf'); // 'dxf', 'pdf', 'estimate', 'preset', 'voice', 'billing'
  const [pendingAction, setPendingAction] = useState(null);

  const checkPlanAndTrigger = (feature, requiredPlan, action) => {
    if (currentPlan === 'Enterprise' || currentPlan === requiredPlan || (requiredPlan === 'Pro' && currentPlan === 'Pro')) {
      if (action) action();
      return;
    }
    setUpgradeModalType(feature);
    setPendingAction(() => action);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = (targetPlan) => {
    setCurrentPlan(targetPlan);
    setShowUpgradeModal(false);
    showToast(`🎉 Plan upgraded to ${targetPlan}! Premium features unlocked.`);
    
    // Execute pending action if any
    if (pendingAction) {
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 300);
    }
  };

  const canvasRef = useRef(null);

  const FALLBACK_LAYOUTS = {
    "1BHK": [
      { id: "r1", name: "Living Room", width: 4, height: 4, x: 0, y: 0, color: "#FF6B35", floor: 0 },
      { id: "r2", name: "Kitchen", width: 3, height: 2.5, x: 4, y: 0, color: "#F7C59F", floor: 0 },
      { id: "r3", name: "Pooja Corner", width: 3, height: 1.5, x: 4, y: 2.5, color: "#FFD700", floor: 0 },
      { id: "r4", name: "Bedroom", width: 4, height: 4, x: 0, y: 4, color: "#4ECDC4", floor: 0 },
      { id: "r5", name: "Bathroom", width: 3, height: 4, x: 4, y: 4, color: "#A8DADC", floor: 0 }
    ],
    "2BHK": [
      { id: "r1", name: "Living Room", width: 5, height: 4.5, x: 0, y: 0, color: "#ffd700", floor: 0 },
      { id: "r2", name: "Kitchen", width: 3, height: 3.5, x: 5, y: 0, color: "#f97316", floor: 0 },
      { id: "r6", name: "Pooja Room", width: 3, height: 1.0, x: 5, y: 3.5, color: "#ffd700", floor: 0 },
      { id: "r3", name: "Master Bedroom", width: 3.5, height: 4, x: 0, y: 4.5, color: "#b19cd9", floor: 0 },
      { id: "r4", name: "Guest Bedroom", width: 3.0, height: 4, x: 3.5, y: 4.5, color: "#45b7d1", floor: 0 },
      { id: "r5", name: "Bathroom", width: 1.5, height: 4, x: 6.5, y: 4.5, color: "#4ecdc4", floor: 0 },
      { id: "r7", name: "Balcony", width: 8, height: 1.5, x: 0, y: 8.5, color: "#a8dadc", floor: 0 }
    ],
    "3BHK": [
      { id: "r1", name: "Living Room", width: 6, height: 6, x: 0, y: 0, color: "#FF6B35", floor: 0 },
      { id: "r2", name: "Dining Room", width: 4, height: 6, x: 6, y: 0, color: "#FFA07A", floor: 0 },
      { id: "r3", name: "Kitchen", width: 4, height: 6, x: 10, y: 0, color: "#F7C59F", floor: 0 },
      { id: "r4", name: "Master Bedroom", width: 5, height: 5, x: 0, y: 6, color: "#4ECDC4", floor: 0 },
      { id: "r5", name: "Bedroom 2", width: 4, height: 5, x: 5, y: 6, color: "#45B7D1", floor: 0 },
      { id: "r6", name: "Bedroom 3", width: 5, height: 5, x: 9, y: 6, color: "#7EC8E3", floor: 0 },
      { id: "r7", name: "Pooja Room", width: 2.5, height: 3, x: 0, y: 11, color: "#FFD700", floor: 0 },
      { id: "r8", name: "Study Room", width: 2.5, height: 3, x: 2.5, y: 11, color: "#DDA0DD", floor: 0 },
      { id: "r9", name: "Master Bath", width: 3, height: 3, x: 5, y: 11, color: "#A8DADC", floor: 0 },
      { id: "r10", name: "Bathroom 2", width: 3, height: 3, x: 8, y: 11, color: "#A8DADC", floor: 0 },
      { id: "r11", name: "Bathroom 3", width: 3, height: 3, x: 11, y: 11, color: "#A8DADC", floor: 0 },
      { id: "r12", name: "Main Balcony", width: 14, height: 2, x: 0, y: 14, color: "#95E1D3", floor: 0 }
    ],
    "Villa": [
      { id: "r1", name: "Grand Living Room", width: 8, height: 6, x: 0, y: 0, color: "#FF6B35", floor: 0 },
      { id: "r2", name: "Formal Dining", width: 6, height: 6, x: 8, y: 0, color: "#FFA07A", floor: 0 },
      { id: "r3", name: "Master Suite", width: 6, height: 6, x: 0, y: 6, color: "#4ECDC4", floor: 0 },
      { id: "r4", name: "Pooja Room", width: 2, height: 6, x: 6, y: 6, color: "#FFD700", floor: 0 },
      { id: "r5", name: "Modular Kitchen", width: 6, height: 6, x: 8, y: 6, color: "#F7C59F", floor: 0 },
      { id: "r6", name: "Family Lounge", width: 7, height: 5, x: 0, y: 12, color: "#DDA0DD", floor: 0 },
      { id: "r7", name: "Home Gym", width: 7, height: 5, x: 7, y: 12, color: "#98FB98", floor: 0 }
    ],
    "Studio": [
      { id: "r1", name: "Studio Space", width: 5, height: 4, x: 0, y: 0, color: "#FF6B35", floor: 0 },
      { id: "r2", name: "Kitchenette", width: 3, height: 4, x: 5, y: 0, color: "#F7C59F", floor: 0 },
      { id: "r3", name: "Bathroom", width: 3, height: 2, x: 5, y: 4, color: "#A8DADC", floor: 0 },
      { id: "r4", name: "Balcony", width: 5, height: 2, x: 0, y: 4, color: "#95E1D3", floor: 0 }
    ]
  };

  const handleWizardComplete = async (preferences) => {
    setLoading(true);
    
    // Initialize dynamic plan based on selected layout preset
    const selectedHome = preferences.homeType || '';
    const isProPreset = selectedHome === '2BHK' || selectedHome === '3BHK' || selectedHome === 'Villa' || 
                        (preferences.isAI && (preferences.description?.toLowerCase().includes('2bhk') || preferences.description?.toLowerCase().includes('3bhk') || preferences.description?.toLowerCase().includes('villa')));
    
    if (isProPreset) {
      setCurrentPlan('Pro');
    } else {
      setCurrentPlan('Starter');
    }

    try {
      const bodyPayload = preferences.isAI 
        ? {
            description: preferences.description,
            preferences: {
              storeys: preferences.storeys,
              homeType: preferences.homeType,
              style: preferences.style,
              budget: preferences.budget,
              vastu: preferences.vastu,
              facing: preferences.facing,
              colorPalette: preferences.colorPalette,
              flooring: preferences.flooring,
              kitchenStyle: preferences.kitchenStyle,
              specialRequirements: preferences.specialRequirements,
            }
          }
        : { preferences };

      const backendUrl = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;
      const response = await fetch(`${backendUrl}/api/floorplan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await response.json();
      
      if (data.success) {
        data.floorPlan.landArea = preferences.landArea;
        data.floorPlan.homeType = preferences.homeType;
        console.log('Received floorPlan from backend with rooms:', data.floorPlan.rooms.length);
        const floors = [...new Set(data.floorPlan.rooms.map(r => r.floor || 0))];
        console.log('Extracted floors from rooms:', floors);
        setFloorPlan(data.floorPlan);
        setActiveFloor('all');
        fetchVastu(data.floorPlan.rooms);
        
        const budgetPayload = preferences.isAI 
          ? { budget: '₹15L–₹30L', style: 'Modern', rooms: data.floorPlan.rooms.map(r => r.name) }
          : preferences;
        fetchBudget(budgetPayload);
      } else {
        throw new Error(data.message || 'API failed to generate floorplan');
      }
    } catch (err) {
      console.error('API Error, falling back to local presets:', err);
      // Fallback logic
      const layoutType = FALLBACK_LAYOUTS[preferences.homeType] ? preferences.homeType : '2BHK';
      const fallbackRooms = FALLBACK_LAYOUTS[layoutType];
      const fallbackPlan = {
        title: `${layoutType} (Offline Mode)`,
        rooms: fallbackRooms,
        vastuScore: 78,
        landArea: preferences.landArea,
        homeType: preferences.homeType
      };
      showToast(`Offline Mode - Error: ${err.message}`);
      setFloorPlan(fallbackPlan);
      setActiveFloor('all');
      showToast('Offline Mode: Loaded Preset Layout');
      // Set dummy vastu and budget
      setVastuData({ score: 78, grade: 'B', details: { compliance: 78 }, suggestions: [] });
      setBudgetData({
        totalMin: 1500000,
        totalMax: 3000000,
        categories: [
          { name: 'Living Room', min: 450000, max: 900000 },
          { name: 'Kitchen', min: 300000, max: 600000 },
          { name: 'Bedroom', min: 300000, max: 600000 }
        ],
        shoppingList: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVastu = async (rooms) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vastu/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms })
      });
      const data = await res.json();
      if (data.success) setVastuData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBudget = async (prefs) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/budget/furniture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      const data = await res.json();
      if (data.success) setBudgetData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRoom = (roomId, fields) => {
    if (!floorPlan) return;
    
    const updatedRooms = floorPlan.rooms.map(room => {
      if (room.id === roomId) {
        const updated = { ...room, ...fields };
        if (typeof fields.x !== 'undefined') updated.x = parseFloat(fields.x);
        if (typeof fields.y !== 'undefined') updated.y = parseFloat(fields.y);
        if (typeof fields.width !== 'undefined') {
          updated.width = parseFloat(fields.width);
          updated.w = parseFloat(fields.width);
        }
        if (typeof fields.height !== 'undefined') {
          updated.height = parseFloat(fields.height);
          updated.d = parseFloat(fields.height);
        }
        return updated;
      }
      return room;
    });

    setFloorPlan({ ...floorPlan, rooms: updatedRooms });
    fetchVastu(updatedRooms);
  };

  const handleAddOpening = (roomId, wallName, type) => {
    if (!floorPlan) return;
    const room = floorPlan.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const newOpening = {
      id: Math.random().toString(36).substr(2, 9),
      type, // 'door' or 'window'
      wall: wallName,
      offset: (wallName === 'front' || wallName === 'back') ? room.width / 2 - 0.4 : room.height / 2 - 0.4,
      width: type === 'door' ? 0.9 : 1.2
    };

    const updatedOpenings = [...(room.openings || []), newOpening];
    handleUpdateRoom(roomId, { openings: updatedOpenings });
    showToast(`Placed ${type} on ${wallName} wall of ${room.name}`);
    setPlaceMode('select'); // auto-revert to select mode after placing one element
  };

  // Automatically open the Right Inspector when a room is selected
  useEffect(() => {
    if (selectedRoomId) {
      setShowInspector(true);
      setShowChatDrawer(false); // Mutual exclusion
    }
  }, [selectedRoomId]);

  // Auto-scroll chat drawer
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatDrawer]);

  const openChatDrawer = (e) => {
    if(e) { e.stopPropagation(); e.preventDefault(); }
    setShowChatDrawer(true);
    setShowInspector(false); // Mutual exclusion
  };

  const openInspector = () => {
    setShowInspector(true);
    setShowChatDrawer(false); // Mutual exclusion
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const generateLocalChatResponse = (text) => {
    const query = text.toLowerCase();
    const currentScore = vastuData?.score || floorPlan?.vastuScore || 78;
    const currentBudget = floorPlan?.budgetRange || '₹15L–₹30L';

    if (query.includes('vastu') && (query.includes('score') || query.includes('rating'))) {
      return `Your current Vastu score is ${currentScore}/100. ${currentScore >= 85 ? 'Excellent! Your layout follows Vastu principles very well.' : currentScore >= 70 ? 'Good score! Moving toilets to West/NW can boost it further.' : 'Moderate. Ensure kitchen is South-East and main entrance faces East or North.'} 🙏`;
    }
    if (query.includes('vastu') && query.includes('kitchen')) {
      return 'Per Vastu, the kitchen must be in the South-East (Agni corner). North-West is an alternative. Avoid North-East or South-West as it causes health and financial issues. 🍳';
    }
    if (query.includes('vastu') && (query.includes('bedroom') || query.includes('master'))) {
      return 'Master Bedroom in South-West is the strongest Vastu placement — the earth element zone for stability and deep sleep. Children rooms face East or North-West. 🛏';
    }
    if (query.includes('vastu') || query.includes('score')) {
      return `Vastu score: ${currentScore}/100. Key placements — Kitchen: South-East 🔥, Pooja Room: North-East 🙏, Master Bedroom: South-West 🌍, Main Door: East/North ☀️, Toilets: West/North-West 💧.`;
    }
    if (query.includes('kitchen') || query.includes('rasoi') || query.includes('cook')) {
      return 'Your kitchen faces South-East — the ideal Vastu direction (Agni corner). For efficiency, choose an L-shaped counter or island layout. Modular kitchens from Livspace or HomeLane cost Rs1.5L-Rs4L for a 3x3m kitchen. 🍳';
    }
    if (query.includes('master bedroom') || query.includes('master room')) {
      return 'Master bedroom in South-West is perfect per Vastu. Ideal size 4x4m or larger. Place bed head pointing South or West. Blackout curtains improve sleep quality significantly. 🛏';
    }
    if (query.includes('bedroom') || query.includes('room size') || query.includes('room dimension') || query.includes('room')) {
      return `For a ${homeType}: Master Bedroom min 4x4m, secondary bedrooms 3.5x3.5m. Children rooms should face East for morning sunlight. Do not place bedrooms directly above the kitchen. 📐`;
    }
    if (query.includes('budget') || query.includes('price') || query.includes('cost') || query.includes('estimate') || query.includes('lakh')) {
      return `For a ${homeType} at ${currentBudget}: ~35% structure and civil, ~25% interior finishing, ~20% furniture and fixtures, ~10% electrical and plumbing, ~10% contingency. See the Budget Breakdown panel on the left for details! 💰`;
    }
    if (query.includes('pooja') || query.includes('puja') || query.includes('mandir') || query.includes('prayer')) {
      return 'Pooja Room in North-East (Ishaan corner) is the most spiritually auspicious direction. Keep it bright, clean, and at least 1.5x1.5m. Use white marble or granite for the altar platform. 🪔';
    }
    if (query.includes('bathroom') || query.includes('toilet') || query.includes('washroom')) {
      return 'Bathrooms and toilets belong in West or North-West per Vastu. Never in North-East. Standard size 1.8x2.2m; attached master bath 2.5x3m minimum. Always include a ventilation window or exhaust fan. 🚿';
    }
    if (query.includes('living room') || query.includes('hall') || query.includes('drawing room')) {
      return 'Living room should face North or East for natural light. 2BHK standard: 4.5x5m; 3BHK: 5x6m+. TV on South or East wall, sofa facing North or East. Use warm 3000K lighting for a cozy feel. 🛋';
    }
    if (query.includes('balcony') || query.includes('terrace') || query.includes('outdoor')) {
      return 'North or East-facing balcony is ideal for morning sunlight and positive energy. Minimum 1.5m width. Add potted plants (Tulsi in NE is auspicious!), string lights, and a small bistro set. 🌿';
    }
    if (query.includes('dining') || query.includes('eat')) {
      return 'Dining area should be West or North-West. Head of family faces East while eating. Minimum 3x4m for a 6-seater. Warm pendant lighting (2700K) above the table creates the perfect ambiance. 🍽';
    }
    if (query.includes('flooring') || query.includes('floor') || query.includes('tile') || query.includes('marble')) {
      return 'Top picks: Marble (Rs80-Rs300/sqft), Vitrified Tiles (Rs40-Rs120/sqft), Wooden Laminate (Rs50-Rs150/sqft, warmest feel), Granite (Rs60-Rs200/sqft). For bedrooms, wooden laminate feels the most premium. 🪨';
    }
    if (query.includes('color') || query.includes('paint') || query.includes('palette')) {
      return 'Living Room: warm cream or beige, Bedroom: calm lavender or blue-grey, Kitchen: bright white or light yellow, Pooja Room: golden yellow. Avoid black or dark red in bedrooms per Vastu. 🎨';
    }
    if (query.includes('staircase') || query.includes('stairs')) {
      return 'Staircase belongs in South, West, or South-West per Vastu. Odd number of steps is auspicious (11, 13, 17). Standard: 1-1.2m width, 20cm rise, 25cm tread. Add a feature wall with stone cladding for a premium look. 🏗';
    }
    if (query.includes('exterior') || query.includes('facade') || query.includes('elevation')) {
      return 'Trending: exposed brick or stone cladding, flat roofs with glass railings, large windows. Use anti-algae paint (Asian Paints Apex or Berger WeatherCoat) in terracotta or off-white. Add a covered porch or pergola. 🏠';
    }
    if (query.includes('garden') || query.includes('landscape') || query.includes('plant') || query.includes('tree')) {
      return 'Use the Landscape Preview button (bottom left panel) to decorate your exterior! Vastu tip: Tulsi in North-East, Banana trees in East, avoid thorny plants indoors. Coconut and Neem in South-West bring stability. 🌿';
    }
    if (query.includes('hello') || query.includes('hi') || query.includes('namaste') || query.includes('hey')) {
      return 'Namaste! I am Agni, your AI home design assistant. Ask me about Vastu tips, room dimensions, furniture picks, color palettes, budget estimates, or anything about your home! 🙏';
    }
    if (query.includes('furniture') || query.includes('sofa') || query.includes('buy') || query.includes('shop')) {
      return 'Top furniture brands: Urban Ladder and Pepperfry (mid-range, Rs15K-Rs80K sofas), IKEA (budget-modern), Godrej Interio (durable). Buy beds with storage drawers to maximize space in smaller BHKs. 🛋';
    }
    return `I can help you with specific questions about your ${homeType}: Vastu tips for any room 🙏, ideal room sizes and dimensions 📐, budget estimates 💰, furniture and material picks 🛋, color palette suggestions 🎨, kitchen and bathroom design tips. What would you like to know?`;
  };

  const toggleChatMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    if (chatMicOn) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setChatMicOn(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => {
        setChatMicOn(true);
        setShowChatDrawer(true);
        setShowInspector(false);
      };

      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setChatInput(text);
        handleSendChatMessage(text);
        setChatMicOn(false);
      };

      rec.onerror = (err) => {
        console.error(err);
        setChatMicOn(false);
      };

      rec.onend = () => {
        setChatMicOn(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error(e);
      setChatMicOn(false);
    }
  };

  const handleSendChatMessage = async (msgText) => {
    const text = msgText || chatInput;
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatThinking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();
      if (data.success) {
        setChatMessages([...updatedMessages, { role: 'assistant', content: data.response }]);
        speakText(data.response);
      } else {
        throw new Error(data.message || 'API failed');
      }
    } catch (err) {
      console.warn("API failed, falling back to local chat rules:", err);
      setTimeout(() => {
        const localResponse = generateLocalChatResponse(text);
        setChatMessages([...updatedMessages, { role: 'assistant', content: localResponse }]);
        speakText(localResponse);
      }, 600);
    } finally {
      setIsChatThinking(false);
    }
  };

  // ─── EXPORT HANDLERS ──────────────────────────────────────────────────────
  const handleExportDXF = () => {
    if (!floorPlan) return;
    const dxfContent = exportToDXF(floorPlan, { unit });
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(floorPlan.title || 'agni-floorplan').replace(/\s+/g, '_')}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateEstimate = () => {
    if (!floorPlan) return { totalSqFt: 0, total: 0, items: [] };
    const totalSqFt = floorPlan.rooms.reduce((acc, r) => acc + (r.width * 3.28084) * (r.height * 3.28084), 0);
    
    let multiplier = 1800; // Standard INR/sqft
    if (finishTier === 'Premium') multiplier = 2500;
    if (finishTier === 'Luxury') multiplier = 3500;

    const baseCost = totalSqFt * multiplier;
    
    return {
      totalSqFt: Math.round(totalSqFt),
      total: baseCost,
      items: [
        { name: 'Civil & Structure', cost: baseCost * 0.4 },
        { name: 'Finishing & Interior', cost: baseCost * 0.35 },
        { name: 'MEP (Electrical & Plumbing)', cost: baseCost * 0.15 },
        { name: 'Contingency & Fees', cost: baseCost * 0.1 }
      ]
    };
  };
  const estimateData = calculateEstimate();

  const handleExportPDF = async () => {
    if (!floorPlan) return;
    // Capture canvas WebGL screenshot via the canvas element
    const canvas = document.querySelector('canvas');
    let imageDataUrl = null;
    if (canvas) {
      imageDataUrl = canvas.toDataURL('image/png');
    }
    await exportBlueprintPDF(floorPlan, imageDataUrl, {
      unit,
      vastuScore: vastuData?.score || floorPlan.vastuScore || 78,
      plotFacing
    });
    showToast('PDF Exported Successfully');
  };

  const handleExportPNG = () => {
    if (!floorPlan) return;
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const imageDataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imageDataUrl;
      a.download = `${(floorPlan.title || 'agni-render').replace(/\s+/g, '_')}.png`;
      a.click();
      showToast('PNG Exported Successfully');
    }
  };

  const handleExportEstimate = async () => {
    if (!floorPlan) return;
    await exportEstimatePDF(floorPlan, { finishTier });
    setShowEstimateModal(false);
  };

  if (loading) {
    const loadingMsgs = [
      "Analyzing architectural preferences...",
      "Applying Vastu Shastra principles...",
      "Optimizing room dimensions...",
      "Drafting 3D floor plan...",
      "Calculating estimated budget...",
      "Finalizing design..."
    ];
    
    // Simple inline component to handle cycling
    const LoadingScreen = () => {
      const [msgIdx, setMsgIdx] = useState(0);
      useEffect(() => {
        const interval = setInterval(() => {
          setMsgIdx(prev => (prev + 1) % loadingMsgs.length);
        }, 1500);
        return () => clearInterval(interval);
      }, []);

      return (
        <div className="container flex flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
          <div style={{ fontSize: '4rem', animation: 'flicker 1.5s infinite', filter: 'drop-shadow(0 0 20px rgba(255,107,53,0.6))' }}>
            🔥
          </div>
          <h2 className="display-md text-gradient mt-2 mb-1" style={{ animation: 'pulse 2s infinite' }}>
            {loadingMsgs[msgIdx]}
          </h2>
          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: i === 0 ? '#ec4899' : i === 1 ? '#ffd700' : '#4ecdc4',
                animation: `bounce 0.6s infinite alternate`,
                animationDelay: `${i * 0.15}s`
              }} />
            ))}
          </div>
        </div>
      );
    };
    return <LoadingScreen />;
  }

  if (!floorPlan) {
    return (
      <div className="container mt-4 mb-4 animate-fade-in">
        <Wizard onComplete={handleWizardComplete} />
      </div>
    );
  }

  const selectedRoom = floorPlan.rooms.find(r => r.id === selectedRoomId);
  const colorPalette = [
    '#ec4899', '#ebd3f8', '#ffd700', '#312e81',
    '#4ecdc4', '#45b7d1', '#95e1d3', '#a8dadc'
  ];

  const formatPriceToK = (price) => {
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    if (num >= 100000) return `₹${(num / 100000).toFixed(0)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
    return `₹${num}`;
  };

  // ── Room-aware shopping catalog with verified official Indian retailer links ──
  // Full master catalog — every item verified live (HTTP 200)
  const FURNITURE_CATALOG = [
    // Living Room
    {
      id: 'sofa',
      name: 'L-Shape Sectional Sofa',
      price: 35000,
      site: 'Pepperfry',
      siteColor: '#f97316',
      link: 'https://www.pepperfry.com/category/sofas.html',
      emoji: '🛋️',
      rooms: ['living', 'hall', 'lounge', 'drawing']
    },
    {
      id: 'tv-unit',
      name: 'TV Unit & Media Cabinet',
      price: 14000,
      site: 'Pepperfry',
      siteColor: '#f97316',
      link: 'https://www.pepperfry.com/category/tv-units.html',
      emoji: '📺',
      rooms: ['living', 'hall', 'bedroom', 'lounge']
    },
    {
      id: 'coffee-table',
      name: 'Coffee / Centre Table',
      price: 9500,
      site: 'Urban Ladder',
      siteColor: '#10b981',
      link: 'https://www.urbanladder.com/categories/coffee-and-centre-tables',
      emoji: '☕',
      rooms: ['living', 'hall', 'lounge', 'drawing']
    },
    // Bedroom
    {
      id: 'king-bed',
      name: 'King Size Bed (with storage)',
      price: 32000,
      site: 'Urban Ladder',
      siteColor: '#10b981',
      link: 'https://www.urbanladder.com/categories/beds',
      emoji: '🛏️',
      rooms: ['master bedroom', 'bedroom', 'bed']
    },
    {
      id: 'wardrobe',
      name: 'Wardrobe — 3 Door Sliding',
      price: 22000,
      site: 'Pepperfry',
      siteColor: '#f97316',
      link: 'https://www.pepperfry.com/category/wardrobes.html',
      emoji: '🪞',
      rooms: ['bedroom', 'master bedroom', 'dressing', 'bed']
    },
    {
      id: 'study-desk',
      name: 'Study / Work-From-Home Desk',
      price: 8500,
      site: 'IKEA India',
      siteColor: '#0058a3',
      link: 'https://www.ikea.com/in/en/cat/desks-fu003/',
      emoji: '💼',
      rooms: ['study', 'office', 'bedroom', 'guest']
    },
    // Dining
    {
      id: 'dining-table',
      name: 'Dining Table — 6 Seater',
      price: 18000,
      site: 'Pepperfry',
      siteColor: '#f97316',
      link: 'https://www.pepperfry.com/category/dining-tables.html',
      emoji: '🍽️',
      rooms: ['dining', 'kitchen', 'hall', 'living']
    },
    {
      id: 'dining-chairs',
      name: 'Dining Chairs (Set of 4)',
      price: 11000,
      site: 'Urban Ladder',
      siteColor: '#10b981',
      link: 'https://www.urbanladder.com/categories/dining-chairs',
      emoji: '🪑',
      rooms: ['dining', 'kitchen', 'hall']
    },
    // Kitchen
    {
      id: 'kitchen',
      name: 'Modular Kitchen System',
      price: 120000,
      site: 'IKEA India',
      siteColor: '#0058a3',
      link: 'https://www.ikea.com/in/en/cat/kitchen-furniture-kf002/',
      emoji: '🍳',
      rooms: ['kitchen', 'modular kitchen', 'open kitchen']
    },
    {
      id: 'kitchen-shelves',
      name: 'Kitchen Storage Shelves',
      price: 4500,
      site: 'IKEA India',
      siteColor: '#0058a3',
      link: 'https://www.ikea.com/in/en/cat/shelving-units-10326/',
      emoji: '🗄️',
      rooms: ['kitchen', 'utility', 'store']
    },
    // Bathroom
    {
      id: 'bathroom-fittings',
      name: 'Bathroom Vanity & Fittings',
      price: 12000,
      site: 'Flipkart',
      siteColor: '#2874f0',
      link: 'https://www.flipkart.com/search?q=bathroom+vanity+fittings',
      emoji: '🚿',
      rooms: ['bathroom', 'toilet', 'bath', 'washroom']
    },
    // Generic / Whole-home
    {
      id: 'ceiling-fan',
      name: 'BLDC Ceiling Fan (5-star)',
      price: 3200,
      site: 'Flipkart',
      siteColor: '#2874f0',
      link: 'https://www.flipkart.com/search?q=BLDC+ceiling+fan+5+star',
      emoji: '🌀',
      rooms: ['bedroom', 'living', 'hall', 'dining', 'kitchen', 'all']
    },
    {
      id: 'ac',
      name: 'Split AC — 1.5 Ton 5 Star',
      price: 38000,
      site: 'Flipkart',
      siteColor: '#2874f0',
      link: 'https://www.flipkart.com/search?q=1.5+ton+5+star+split+ac',
      emoji: '❄️',
      rooms: ['bedroom', 'living', 'hall', 'master bedroom']
    },
    {
      id: 'bookshelf',
      name: 'Bookshelf / Display Unit',
      price: 7500,
      site: 'Pepperfry',
      siteColor: '#f97316',
      link: 'https://www.pepperfry.com/category/bookshelves.html',
      emoji: '📚',
      rooms: ['study', 'living', 'hall', 'office', 'library']
    },
    {
      id: 'pooja-unit',
      name: 'Pooja Mandir / Temple Unit',
      price: 9000,
      site: 'Pepperfry',
      siteColor: '#f97316',
      link: 'https://www.pepperfry.com/category/pooja-mandirs.html',
      emoji: '🪔',
      rooms: ['pooja', 'puja', 'prayer', 'temple', 'mandir']
    }
  ];

  // Build smart list: match items to actual rooms in the floor plan
  const roomNames = floorPlan.rooms.map(r => r.name.toLowerCase());
  const smartList = [];
  const seen = new Set();

  // First pass: add room-matched items
  FURNITURE_CATALOG.forEach(item => {
    if (seen.has(item.id)) return;
    const matched = item.rooms.some(keyword =>
      roomNames.some(rn => rn.includes(keyword) || keyword === 'all')
    );
    if (matched) {
      smartList.push(item);
      seen.add(item.id);
    }
  });

  // Second pass: fill up to 8 items with unmatched high-value items
  FURNITURE_CATALOG.forEach(item => {
    if (seen.has(item.id) || smartList.length >= 8) return;
    smartList.push(item);
    seen.add(item.id);
  });

  const shoppingList = budgetData?.furniture?.slice(0, 8).map((item, i) => ({
    ...item,
    site: smartList[i]?.site || 'Pepperfry',
    siteColor: smartList[i]?.siteColor || '#f97316',
    link: smartList[i]?.link || 'https://www.pepperfry.com',
    emoji: smartList[i]?.emoji || '🛋️'
  })) || smartList;

  const vastuSuggestions = vastuData?.suggestions || [
    { room: 'Pooja room', status: 'good', direction: 'NE', tip: 'Optimal' },
    { room: 'Main entrance', status: 'warning', direction: 'East', tip: 'Consider NE entrance' }
  ];

  const vastuScore = vastuData?.score || floorPlan.vastuScore || 78;
  const vastuGrade = vastuData?.grade || (vastuScore >= 85 ? 'Excellent ✨' : vastuScore >= 70 ? 'Good 👍' : 'Fair 🔧');

  const availableFloors = floorPlan && floorPlan.rooms
    ? [...new Set(floorPlan.rooms.map(r => r.floor || 0))].sort((a, b) => a - b)
    : [0];

  // Sun time label helper
  const sunTimeLabel = () => {
    if (sunTime <= 6) return '6:00 AM';
    if (sunTime >= 18) return '6:00 PM';
    const h = Math.floor(sunTime);
    const m = Math.round((sunTime - h) * 60);
    const suffix = h < 12 ? 'AM' : 'PM';
    const displayH = h > 12 ? h - 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const cadToggleStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 10px',
    borderRadius: '8px',
    background: active ? 'rgba(78,205,196,0.12)' : 'rgba(23,23,29,0.4)',
    border: active ? '1px solid #4ecdc4' : '1px solid rgba(255,255,255,0.07)',
    color: active ? '#4ecdc4' : 'var(--color-text-secondary)',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 0 8px rgba(78,205,196,0.25)' : 'none',
    letterSpacing: '0.03em'
  });

  return (
    <div className="studio-workspace relative w-full overflow-hidden" style={{ height: '100vh', background: '#0d1122' }}>

      {/* 🏡 LANDSCAPE PREVIEW MODE — full-screen overlay */}
      {showLandscapePreview && (
        <LandscapePreview
          floorPlan={floorPlan}
          preferences={landscapePreferences}
          onClose={() => setShowLandscapePreview(false)}
        />
      )}

      {/* 3D WebGL Canvas Layer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 }}>
        {blueprintMode && <div className="bp-scanline" />}
        <ThreeViewer 
          floorPlan={floorPlan} 
          selectedRoomId={selectedRoomId} 
          onSelectRoom={setSelectedRoomId}
          onHoverRoom={setHoveredRoom}
          viewMode={viewMode}
          wireframeMode={wireframeMode}
          showVastuOverlay={showVastuOverlay}
          resetCounter={resetCounter}
          activeFloor={activeFloor}

          // NEW CAD feature props
          blueprintMode={blueprintMode}
          electricalLayer={electricalLayer}
          plumbingLayer={plumbingLayer}
          structureLayer={structureLayer}
          furnitureLayer={furnitureLayer}
          sunTime={sunTime}
          plotFacing={plotFacing}
          unit={unit}
          placeMode={placeMode}
          onAddOpening={handleAddOpening}
          canvasRef={canvasRef}
        />
      </div>

      {/* Floating View Mode Badge */}
      {blueprintMode && (
        <div style={{
          position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(12, 26, 48, 0.85)', border: '1px solid #4ecdc4',
          color: '#4ecdc4', padding: '6px 16px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 'bold', zIndex: 10,
          boxShadow: '0 4px 15px rgba(78,205,196,0.2)', backdropFilter: 'blur(10px)',
          letterSpacing: '0.05em'
        }}>
          📐 BLUEPRINT MODE — 1:100
        </div>
      )}

      {/* Room Hover Tooltip */}
      {hoveredRoom && (
        <div style={{
          position: 'absolute', bottom: '6rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10, 11, 18, 0.95)', border: `1px solid ${hoveredRoom.color || '#ec4899'}`,
          padding: '10px 16px', borderRadius: '12px', zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: '4px',
          boxShadow: `0 8px 32px ${hoveredRoom.color ? hoveredRoom.color + '33' : 'rgba(236,72,153,0.2)'}`,
          pointerEvents: 'none', minWidth: '180px', animation: 'slideUp 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: hoveredRoom.color }} />
            <span style={{ color: 'white', fontWeight: 800, fontSize: '13px' }}>{hoveredRoom.name}</span>
          </div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', fontFamily: 'monospace' }}>
            {unit === 'ft' 
              ? `${(hoveredRoom.width * 3.28084).toFixed(1)}' × ${(hoveredRoom.height * 3.28084).toFixed(1)}'`
              : `${hoveredRoom.width.toFixed(1)}m × ${hoveredRoom.height.toFixed(1)}m`
            }
            {' • '}{hoveredRoom.floor === 0 ? 'GF' : `L${hoveredRoom.floor || 0}`}
          </div>
        </div>
      )}

      {/* Floating Floor Selector HUD */}
      {floorPlan && availableFloors.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(10, 11, 18, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          boxShadow: '0 8px 32px rgba(236, 72, 153, 0.15), 0 0 20px rgba(0,0,0,0.6)',
          borderRadius: '16px',
          padding: '6px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          fontFamily: 'Outfit, sans-serif'
        }}>
          {availableFloors.map((floorNum) => (
            <button
              key={floorNum}
              onClick={() => {
                setActiveFloor(floorNum);
                setSelectedRoomId(null);
              }}
              style={{
                background: activeFloor === floorNum 
                  ? 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))' 
                  : 'transparent',
                border: 'none',
                color: activeFloor === floorNum ? 'white' : 'var(--color-text-secondary)',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: activeFloor === floorNum ? '0 2px 10px rgba(255,107,53,0.4)' : 'none'
              }}
            >
              {floorNum === 0 ? 'Ground Floor (GF)' : `Floor ${floorNum} (L${floorNum})`}
            </button>
          ))}
          <button
            onClick={() => setActiveFloor('all')}
            style={{
              background: activeFloor === 'all' 
                ? 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))' 
                : 'transparent',
              border: 'none',
              color: activeFloor === 'all' ? 'white' : 'var(--color-text-secondary)',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: activeFloor === 'all' ? '0 2px 10px rgba(255,107,53,0.4)' : 'none'
            }}
          >
            🏢 Stack View (All)
          </button>
        </div>
      )}

      {/* Floating Canvas Top-Left Title Pill */}
      <div style={{
             position: 'absolute',
             top: '1rem',
             left: 'calc(320px + 2rem)',
             zIndex: 10,
             padding: '0.75rem 1rem',
             borderRadius: '12px',
             background: 'rgba(10, 11, 18, 0.8)',
             backdropFilter: 'blur(15px)',
             border: blueprintMode ? '1px solid rgba(78,205,196,0.45)' : '1px solid rgba(236, 72, 153, 0.25)',
             boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
             fontFamily: 'Outfit, sans-serif',
             display: 'flex',
             flexDirection: 'column',
             gap: '2px'
           }}>
        <h2 className="text-white" style={{ fontSize: '0.875rem', fontWeight: '800', letterSpacing: '0.5px' }}>
          {blueprintMode ? '📐 ' : ''}{floorPlan.title || '2BHK — Traditional Indian'}
        </h2>
        <span className="text-secondary" style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase' }}>
          {floorPlan.rooms?.length || 7} rooms · Budget: {floorPlan.budgetRange || '₹5L–₹10L'} · Unit: {unit === 'm' ? 'Metric' : 'Imperial'}
        </span>
      </div>

      {/* Floating Canvas Top-Right Instruction Tag */}
      <div className="text-secondary"
           style={{
             position: 'absolute',
             top: '1.5rem',
             zIndex: 10,
             fontSize: '11px',
             fontWeight: '600',
             letterSpacing: '0.05em',
             pointerEvents: 'none',
             right: showInspector ? 'calc(340px + 2.5rem)' : '2rem',
             textShadow: '0 2px 4px rgba(0,0,0,0.9)',
             fontFamily: 'Plus Jakarta Sans, sans-serif',
             transition: 'right 0.3s ease'
           }}>
        {blueprintMode ? '📐 Blueprint Mode Active — Professional CAD View' : '🖱 Left drag · orbit  ·  Right drag · pan  ·  Scroll · zoom'}
      </div>

      {/* 3D Camera Controls Legend — bottom-center */}
      {viewMode === '3D' && !blueprintMode && (
        <div style={{
          position: 'absolute',
          bottom: '4.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
          background: 'rgba(6, 7, 13, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '24px',
          padding: '6px 14px',
        }}>
          {[
            { icon: '🖱', label: 'Drag', sub: 'Orbit 360°' },
            { icon: '↕', label: 'Scroll', sub: 'Zoom' },
            { icon: '⇧ Drag', label: 'Right-drag', sub: 'Pan' },
          ].map((c, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0 8px',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <span style={{ fontSize: '13px', opacity: 0.9 }}>{c.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.3px' }}>{c.sub}</span>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>{c.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}


          {/* Floating Collapsible Right Inspector Toggle Button */}
      {!showInspector && (
        <button 
          onClick={openInspector}
          className="btn"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '2rem',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(10, 11, 18, 0.8)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(236, 72, 153, 0.25)',
            color: 'white',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.75rem',
            fontWeight: '700',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            cursor: 'pointer'
          }}
        >
          ⚙️ Open Inspector
        </button>
      )}

      {/* Floating Collapsible Right Chat Drawer Trigger Button */}
      {!showChatDrawer && (
        <button 
          onClick={openChatDrawer}
          className="btn"
          style={{
            position: 'absolute',
            top: showInspector ? '1rem' : '4rem',
            right: showInspector ? 'calc(340px + 2rem)' : '2rem',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(10, 11, 18, 0.8)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            color: 'white',
            borderRadius: '12px',
            padding: '8px 16px',
            fontSize: '0.75rem',
            fontWeight: '700',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          💬 Ask Agni AI
        </button>
      )}

      {/* FLOATING LEFT SIDEBAR OVERLAY */}
      <div style={{
             position: 'absolute',
             left: 0,
             top: 0,
             bottom: 0,
             width: '320px',
             zIndex: 10,
             display: 'flex',
             flexDirection: 'column',
             justifyContent: 'space-between',
             background: 'rgba(10, 11, 18, 0.85)',
             backdropFilter: 'blur(25px)',
             borderRight: '1px solid rgba(236, 72, 153, 0.2)',
             boxShadow: '3px 0 25px rgba(236, 72, 153, 0.15), 0 0 35px rgba(0,0,0,0.85)',
             padding: '1.5rem 1.25rem 1.25rem',
             overflow: 'hidden'
           }}>
        
        {/* Glow Line Accent on Right Border */}
        <div className="absolute right-0 top-0 bottom-0"
             style={{
               width: '2px',
               background: blueprintMode
                 ? 'linear-gradient(to bottom, transparent, #4ecdc4, transparent)'
                 : 'linear-gradient(to bottom, transparent, #ec4899, transparent)',
               boxShadow: blueprintMode ? '0 0 10px rgba(78,205,196,0.65)' : '0 0 10px rgba(236, 72, 153, 0.65)'
             }}
        />

        {/* Scrollable High-Density Panel Body */}
        <div className="scroll-panel" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '6px', paddingBottom: '1rem' }}>
          
          {/* Brand Header */}
          <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.4rem', animation: 'flame 1.5s ease infinite' }}>🔥</span>
                <span className="font-display font-extrabold text-white text-md tracking-wider">Agni AI</span>
              </div>
              <button 
                onClick={() => setFloorPlan(null)}
                className="btn btn-ghost btn-sm"
                style={{
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  color: '#ec4899',
                  background: 'rgba(236, 72, 153, 0.05)',
                  cursor: 'pointer'
                }}
              >
                + New
              </button>
            </div>
            {/* Dynamic Active Plan Pill & Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: currentPlan === 'Starter' ? '#cbd5e1' : currentPlan === 'Pro' ? '#ec4899' : '#00D4AA',
                  boxShadow: currentPlan === 'Starter' ? 'none' : currentPlan === 'Pro' ? '0 0 8px #ec4899' : '0 0 8px #00D4AA'
                }} />
                <span style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: '800', 
                  textTransform: 'uppercase',
                  color: currentPlan === 'Starter' ? '#cbd5e1' : currentPlan === 'Pro' ? '#ec4899' : '#00D4AA',
                  letterSpacing: '0.05em'
                }}>
                  {currentPlan === 'Starter' ? 'Starter Plan' : currentPlan === 'Pro' ? 'Pro Architect' : 'Enterprise Developer'}
                </span>
              </div>
              <button 
                onClick={() => {
                  setUpgradeModalType('billing');
                  setShowUpgradeModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#b347ff',
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#c084fc'}
                onMouseLeave={e => e.currentTarget.style.color = '#b347ff'}
              >
                [Change Plan]
              </button>
            </div>
          </div>

          {/* ROOMS LISTING */}
          <div>
            <h4 className="text-secondary mb-2" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Rooms {activeFloor !== 'all' ? `(Floor ${activeFloor})` : '(All)'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {floorPlan.rooms
                .filter(room => activeFloor === 'all' || (room.floor || 0) === activeFloor)
                .map(room => (
                  <div 
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedRoomId === room.id ? 'rgba(236,72,153,0.1)' : 'var(--color-surface-2)',
                      border: selectedRoomId === room.id ? '1px solid #ec4899' : '1px solid var(--color-border-subtle)',
                      transition: 'all 0.2s ease',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: room.color,
                          boxShadow: '0 0 6px ' + room.color
                        }}
                      />
                      <span className="font-bold text-white">{room.name}</span>
                    </div>
                    <span className="text-secondary" style={{ fontSize: '10px', fontFamily: 'var(--mono)' }}>
                      {unit === 'ft'
                        ? `${(room.width * 3.28084).toFixed(1)}×${(room.height * 3.28084).toFixed(1)}ft`
                        : `${room.width.toFixed(1)}×${room.height.toFixed(1)}m`}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* ─── CAD TOOLS SECTION ──────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
              <h4 className="text-secondary" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>CAD Tools</h4>
              <button
                onClick={() => setShowCadPanel(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '700'
                }}
              >
                {showCadPanel ? '▲ Hide' : '▼ Show'}
              </button>
            </div>

            {showCadPanel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Blueprint Mode Big Toggle */}
                <button
                  onClick={() => {
                    setBlueprintMode(p => !p);
                    if (!blueprintMode) setViewMode('2D');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: blueprintMode ? 'rgba(78,205,196,0.12)' : 'rgba(23,23,29,0.5)',
                    border: blueprintMode ? '1px solid #4ecdc4' : '1px solid rgba(255,255,255,0.08)',
                    color: blueprintMode ? '#4ecdc4' : 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: blueprintMode ? '0 0 16px rgba(78,205,196,0.3), inset 0 0 20px rgba(78,205,196,0.05)' : 'none',
                    letterSpacing: '0.04em'
                  }}
                >
                  <span>📐 Blueprint Mode</span>
                  <span style={{
                    width: '30px', height: '16px', borderRadius: '8px',
                    background: blueprintMode ? '#4ecdc4' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center',
                    padding: '2px',
                    transition: 'background 0.2s ease'
                  }}>
                    <span style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      background: 'white',
                      transform: blueprintMode ? 'translateX(14px)' : 'translateX(0)',
                      transition: 'transform 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                    }} />
                  </span>
                </button>

                {/* Layers Grid */}
                <div>
                  <div className="text-secondary" style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Layers</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button onClick={() => setStructureLayer(p => !p)} style={cadToggleStyle(structureLayer)}>
                      🏗️ Structure
                    </button>
                    <button onClick={() => setElectricalLayer(p => !p)} style={cadToggleStyle(electricalLayer)}>
                      ⚡ Electrical
                    </button>
                    <button onClick={() => setPlumbingLayer(p => !p)} style={cadToggleStyle(plumbingLayer)}>
                      💧 Plumbing
                    </button>
                    <button onClick={() => setFurnitureLayer(p => !p)} style={cadToggleStyle(furnitureLayer)}>
                      🛋️ Furniture
                    </button>
                  </div>
                </div>

                {/* Unit Toggle */}
                <div>
                  <div className="text-secondary" style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Measurement Unit</div>
                  <div style={{ display: 'flex', background: 'rgba(23,23,29,0.5)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {['m', 'ft'].map(u => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          border: 'none',
                          background: unit === u ? 'rgba(236,72,153,0.85)' : 'transparent',
                          color: unit === u ? 'white' : 'var(--color-text-secondary)',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {u === 'm' ? 'Meters (m)' : 'Feet (ft)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vastu Compass Toggle */}
                <button
                  onClick={() => setShowVastuOverlay(p => !p)}
                  style={cadToggleStyle(showVastuOverlay)}
                >
                  🧭 Vastu Compass Overlay
                </button>

                {/* Door / Window Placement Tool */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(23,23,29,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div className="text-secondary mb-2" style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    🔨 Place Elements
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setPlaceMode('select')}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '6px',
                        background: placeMode === 'select' ? 'rgba(78,205,196,0.2)' : 'transparent',
                        border: placeMode === 'select' ? '1px solid #4ecdc4' : '1px solid rgba(255,255,255,0.1)',
                        color: placeMode === 'select' ? '#4ecdc4' : 'var(--color-text-secondary)',
                        fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      👆 Select
                    </button>
                    <button
                      onClick={() => setPlaceMode('door')}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '6px',
                        background: placeMode === 'door' ? 'rgba(236,72,153,0.2)' : 'transparent',
                        border: placeMode === 'door' ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                        color: placeMode === 'door' ? '#ec4899' : 'var(--color-text-secondary)',
                        fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      🚪 Door
                    </button>
                    <button
                      onClick={() => setPlaceMode('window')}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '6px',
                        background: placeMode === 'window' ? 'rgba(255,215,0,0.2)' : 'transparent',
                        border: placeMode === 'window' ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                        color: placeMode === 'window' ? '#ffd700' : 'var(--color-text-secondary)',
                        fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      🪟 Window
                    </button>
                  </div>
                  {placeMode !== 'select' && (
                    <div style={{ marginTop: '8px', fontSize: '10px', color: '#ffb347', fontWeight: 600 }}>
                      Hint: Click on any wall in the 3D/Blueprint view to place a {placeMode}.
                    </div>
                  )}
                </div>

                {/* Sun Light Simulator */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(23,23,29,0.5)',
                  border: '1px solid rgba(255,179,71,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#ffb347', letterSpacing: '0.04em' }}>
                      ☀️ Sun Simulator
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#ffb347', fontWeight: '700' }}>
                      {sunTimeLabel()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="18"
                    step="0.25"
                    value={sunTime}
                    onChange={e => setSunTime(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#ffb347' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['North', 'South', 'East', 'West'].map(dir => (
                      <button
                        key={dir}
                        onClick={() => setPlotFacing(dir)}
                        style={{
                          flex: 1,
                          padding: '4px 2px',
                          borderRadius: '6px',
                          border: plotFacing === dir ? '1px solid #ffb347' : '1px solid rgba(255,255,255,0.07)',
                          background: plotFacing === dir ? 'rgba(255,179,71,0.15)' : 'transparent',
                          color: plotFacing === dir ? '#ffb347' : 'var(--color-text-secondary)',
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {dir[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Buttons */}
                <div>
                  <div className="text-secondary" style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Export</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => checkPlanAndTrigger('dxf', 'Pro', handleExportDXF)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(78,205,196,0.1)',
                        border: '1px solid rgba(78,205,196,0.4)',
                        color: '#4ecdc4',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.04em'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(78,205,196,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(78,205,196,0.1)'}
                    >
                      ⬇️ Export DXF (AutoCAD)
                    </button>
                    <button
                      onClick={() => checkPlanAndTrigger('pdf', 'Pro', handleExportPDF)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(236,72,153,0.1)',
                        border: '1px solid rgba(236,72,153,0.4)',
                        color: '#ec4899',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.04em'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(236,72,153,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(236,72,153,0.1)'}
                    >
                      🖨️ Export Blueprint PDF
                    </button>
                    <button
                      onClick={handleExportPNG}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,215,0,0.1)',
                        border: '1px solid rgba(255,215,0,0.4)',
                        color: '#ffd700',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.04em'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,215,0,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,215,0,0.1)'}
                    >
                      🖼️ Export PNG
                    </button>
                    <button
                      onClick={() => setShowEstimateModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(179,71,255,0.1)',
                        border: '1px solid rgba(179,71,255,0.4)',
                        color: '#b347ff',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.04em'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(179,71,255,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(179,71,255,0.1)'}
                    >
                      🏷️ Contractor Estimate PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* VASTU SCORE MINI DIAL & CHECKLIST */}
          <div>
            <h4 className="text-secondary mb-2" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Vastu Score</h4>
            
            <div className="mb-3"
                 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-surface-2)', padding: '0.75rem' }}>
              
              {/* Pie Circle Score track */}
              <div style={{ position: 'relative', width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg className="absolute w-full h-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.91" fill="none" stroke="#00e676" strokeWidth="3.5"
                          strokeDasharray={`${vastuScore} ${100 - vastuScore}`}
                          strokeDashoffset="25"
                          style={{ transition: 'stroke-dasharray 0.5s ease', filter: 'drop-shadow(0 0 4px #00e676dd)' }} />
                </svg>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '10px', color: 'white' }}>{vastuScore}%</span>
              </div>
              
              <div>
                <div className="text-xs mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  {vastuGrade}
                </div>
                <div className="text-secondary" style={{ fontSize: '9px', lineHeight: 1.25, fontWeight: 500 }}>
                  {vastuScore >= 75 ? 'Your layout is Vastu compliant' : 'Your layout has spatial warnings'}
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {vastuSuggestions.map((sugg, idx) => {
                const isGood = sugg.status === 'good';
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.5rem', borderRadius: '8px', border: '1px solid ' + (isGood ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 179, 71, 0.1)'), background: 'rgba(23, 23, 29, 0.3)', fontSize: '11px' }}>
                    <div className="font-bold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', lineHeight: 'normal' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: isGood ? '#00e676' : '#ffb347' }}>●</span>
                        <span>{sugg.room} {isGood ? 'in ' + sugg.direction : 'faces ' + sugg.direction}</span>
                      </div>
                      <span style={{ color: isGood ? '#00e676' : '#ffb347', fontWeight: 'bold' }}>
                        {isGood ? '✓' : '→'}
                      </span>
                    </div>
                    {!isGood && sugg.tip && (
                      <div className="text-secondary" style={{ fontSize: '9px', fontWeight: 500, marginLeft: '0.75rem', marginTop: '2px', lineHeight: 1.25 }}>
                        {sugg.tip}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONTRACTOR COST ESTIMATE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
              <h4 className="text-secondary" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Contractor Cost Estimate
              </h4>
              <select 
                value={finishTier} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Premium' || val === 'Luxury') {
                    checkPlanAndTrigger('estimate', 'Pro', () => setFinishTier(val));
                  } else {
                    setFinishTier(val);
                  }
                }}
                style={{
                  background: 'rgba(23,23,29,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '9px',
                  borderRadius: '4px',
                  padding: '2px 4px',
                  outline: 'none'
                }}
              >
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>
            
            <div style={{ background: 'var(--color-surface-2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span className="text-secondary" style={{ fontSize: '11px', fontWeight: '500' }}>Total Est. Cost</span>
                <span style={{ color: 'white', fontWeight: '800', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>
                  ₹{(estimateData.total / 100000).toFixed(2)}L
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {estimateData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span className="text-secondary">{item.name}</span>
                    <span style={{ color: 'white', fontFamily: 'var(--font-mono)' }}>₹{(item.cost / 100000).toFixed(2)}L</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BUDGET BREAKDOWN CATEGORIES */}
          <div>
            <h4 className="text-secondary" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>Budget Breakdown</h4>
            <div className="flex flex-col gap-2">
              {[
                { name: 'Living Room', pct: 30, col: '#ec4899' },
                { name: 'Bedrooms', pct: 25, col: '#b19cd9' },
                { name: 'Kitchen', pct: 25, col: '#f97316' },
                { name: 'Others', pct: 20, col: '#4ecdc4' }
              ].map((bar, i) => (
                <div key={i}>
                  <div className="font-semibold mb-1" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span className="text-secondary">{bar.name}</span>
                    <span style={{ color: 'white' }}>{bar.pct}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                       width: `${bar.pct}%`,
                       height: '100%',
                       background: bar.col,
                       borderRadius: '2px',
                       boxShadow: `0 0 6px ${bar.col}dd`
                     }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SHOPPING LIST OVERLAY */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 className="text-secondary" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                🛒 Smart Shopping List
              </h4>
              <span style={{
                fontSize: '9px', fontWeight: '700',
                color: '#4ecdc4',
                background: 'rgba(78,205,196,0.1)',
                border: '1px solid rgba(78,205,196,0.3)',
                borderRadius: '4px', padding: '1px 6px'
              }}>
                {shoppingList.length} items · Official links ✓
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {shoppingList.map((item, idx) => {
                const siteColor = item.siteColor || '#4ecdc4';
                const emoji = item.emoji || '🛋️';

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border-subtle)',
                      background: 'var(--color-surface-2)',
                      fontSize: '11px',
                      transition: 'border-color 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = siteColor + '55'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
                  >
                    {/* Row 1: Emoji + Name + Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'white', fontWeight: '700', fontSize: '11px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '13px', flexShrink: 0 }}>{emoji}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', color: '#ec4899', fontWeight: '800', fontSize: '11px', flexShrink: 0 }}>
                        {formatPriceToK(item.price)}
                      </span>
                    </div>

                    {/* Row 2: Site badge + Buy link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Site name badge */}
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        color: siteColor,
                        background: siteColor + '18',
                        border: `1px solid ${siteColor}44`,
                        borderRadius: '4px',
                        padding: '1px 6px',
                        letterSpacing: '0.03em'
                      }}>
                        {item.site || 'Official Store'}
                      </span>

                      {/* Real Buy link */}
                      <a
                        href={item.link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: '#4ecdc4',
                          fontWeight: '800',
                          fontSize: '10px',
                          textDecoration: 'none',
                          padding: '2px 8px',
                          borderRadius: '5px',
                          background: 'rgba(78,205,196,0.08)',
                          border: '1px solid rgba(78,205,196,0.25)',
                          transition: 'all 0.18s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(78,205,196,0.18)';
                          e.currentTarget.style.borderColor = 'rgba(78,205,196,0.6)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(78,205,196,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(78,205,196,0.25)';
                        }}
                      >
                        Buy →
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.7 }}>
                          <path d="M1 9L9 1M9 1H3M9 1V7" stroke="#4ecdc4" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* BOTTOM DECK VIEW CONTROLS */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem' }}>
          <h4 className="text-secondary mb-2" style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>View</h4>
          <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button 
              onClick={() => { setViewMode('3D'); setWireframeMode(false); }}
              style={{
                background: (viewMode === '3D' && !wireframeMode) ? 'rgba(236,72,153,0.15)' : 'rgba(23,23,29,0.4)',
                border: (viewMode === '3D' && !wireframeMode) ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.06)',
                color: (viewMode === '3D' && !wireframeMode) ? 'white' : 'var(--color-text-secondary)',
                padding: '7px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: (viewMode === '3D' && !wireframeMode) ? '0 0 8px rgba(236,72,153,0.3)' : 'none'
              }}
            >
              🗳️ 3D View
            </button>
            <button 
              onClick={() => { setViewMode('2D'); setWireframeMode(false); }}
              style={{
                background: (viewMode === '2D' && !wireframeMode) ? 'rgba(236,72,153,0.15)' : 'rgba(23,23,29,0.4)',
                border: (viewMode === '2D' && !wireframeMode) ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.06)',
                color: (viewMode === '2D' && !wireframeMode) ? 'white' : 'var(--color-text-secondary)',
                padding: '7px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: (viewMode === '2D' && !wireframeMode) ? '0 0 8px rgba(236,72,153,0.3)' : 'none'
              }}
            >
              📐 Top View
            </button>
            <button 
              onClick={() => setResetCounter(prev => prev + 1)}
              style={{
                background: 'rgba(23,23,29,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--color-text-secondary)',
                padding: '7px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🔄 Reset
            </button>
            <button 
              onClick={() => setWireframeMode(prev => !prev)}
              style={{
                background: wireframeMode ? 'rgba(236,72,153,0.15)' : 'rgba(23,23,29,0.4)',
                border: wireframeMode ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.06)',
                color: wireframeMode ? 'white' : 'var(--color-text-secondary)',
                padding: '7px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: wireframeMode ? '0 0 8px rgba(236,72,153,0.3)' : 'none'
              }}
            >
              ⎔ Wireframe
            </button>
          </div>
        </div>

        {/* LANDSCAPE PREVIEW BUTTON */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => {
              setLandscapePreferences({ style: floorPlan?.style, colorPalette: floorPlan?.colorPalette, landArea: floorPlan?.landArea });
              setShowLandscapePreview(true);
            }}
            disabled={!floorPlan}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(78,205,196,0.35)',
              background: floorPlan ? 'rgba(78,205,196,0.08)' : 'rgba(255,255,255,0.02)',
              color: floorPlan ? '#4ecdc4' : 'rgba(255,255,255,0.2)',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: floorPlan ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              boxShadow: floorPlan ? '0 0 14px rgba(78,205,196,0.12)' : 'none',
            }}
            onMouseEnter={e => { if (floorPlan) { e.currentTarget.style.background = 'rgba(78,205,196,0.15)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.6)'; } }}
            onMouseLeave={e => { if (floorPlan) { e.currentTarget.style.background = 'rgba(78,205,196,0.08)'; e.currentTarget.style.borderColor = 'rgba(78,205,196,0.35)'; } }}
          >
            <span style={{ fontSize: '1rem' }}>🏡</span>
            <span>Landscape Preview</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: '600' }}>FUTURISTIC</span>
          </button>
          {!floorPlan && (
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: '4px' }}>
              Generate a floor plan first
            </div>
          )}
        </div>

      </div>

      {/* COLLAPSIBLE RIGHT SIDEBAR PANEL (Inspector Overlay) */}
      <div style={{
             position: 'absolute',
             top: 0,
             bottom: 0,
             zIndex: 10,
             display: 'flex',
             flexDirection: 'column',
             gap: '2rem',
             right: showInspector ? '0' : '-360px',
             width: '340px',
             background: 'rgba(10, 11, 18, 0.85)',
             backdropFilter: 'blur(25px)',
             borderLeft: '1px solid rgba(236, 72, 153, 0.2)',
             boxShadow: '-3px 0 25px rgba(236, 72, 153, 0.15), 0 0 35px rgba(0,0,0,0.85)',
             padding: '1.5rem 1.25rem',
             transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
             overflowY: 'auto'
           }}>
        
        {/* Glow Line Accent on Left Border */}
        <div className="absolute left-0 top-0 bottom-0"
             style={{
               width: '2px',
               background: 'linear-gradient(to bottom, transparent, #ec4899, transparent)',
               boxShadow: '0 0 10px rgba(236, 72, 153, 0.65)'
             }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h3 className="text-sm" style={{ fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)' }}>🛠️ Inspector</h3>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={(e) => { 
              e.stopPropagation(); 
              e.preventDefault(); 
              console.log("Inspector Close button clicked!");
              setSelectedRoomId(null); 
              setShowInspector(false); 
            }}
            style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer', position: 'relative', zIndex: 9999 }}
          >
            Close ✕
          </button>
        </div>

        {selectedRoom ? (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-secondary mb-1" style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Selected Room</div>
              <div className="text-white" style={{ fontWeight: '800', fontSize: '1.125rem' }}>{selectedRoom.name}</div>
              {blueprintMode && (
                <div style={{ marginTop: '4px', fontSize: '10px', fontFamily: 'monospace', color: '#4ecdc4' }}>
                  {unit === 'ft'
                    ? `${(selectedRoom.width * 3.28084).toFixed(2)}ft × ${(selectedRoom.height * 3.28084).toFixed(2)}ft`
                    : `${(selectedRoom.width * 1000).toFixed(0)}mm × ${(selectedRoom.height * 1000).toFixed(0)}mm`
                  }
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {/* Position X Slider */}
              <div>
                <div className="mb-1" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span className="text-secondary" style={{ fontWeight: 500 }}>Horizontal Offset (X)</span>
                  <span className="font-bold font-mono" style={{ color: 'white' }}>{selectedRoom.x.toFixed(1)}m</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="12" 
                  step="0.5" 
                  value={selectedRoom.x}
                  onChange={(e) => handleUpdateRoom(selectedRoom.id, { x: e.target.value })}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
              </div>

              {/* Position Y Slider */}
              <div>
                <div className="mb-1" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span className="text-secondary" style={{ fontWeight: 500 }}>Depth Offset (Y)</span>
                  <span className="font-bold font-mono" style={{ color: 'white' }}>{selectedRoom.y.toFixed(1)}m</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="12" 
                  step="0.5" 
                  value={selectedRoom.y}
                  onChange={(e) => handleUpdateRoom(selectedRoom.id, { y: e.target.value })}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
              </div>

              {/* Width Slider */}
              <div>
                <div className="mb-1" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span className="text-secondary" style={{ fontWeight: 500 }}>Room Width</span>
                  <span className="font-bold font-mono" style={{ color: 'white' }}>{selectedRoom.width.toFixed(1)}m</span>
                </div>
                <input 
                  type="range" 
                  min="1.5" 
                  max="8" 
                  step="0.5" 
                  value={selectedRoom.width}
                  onChange={(e) => handleUpdateRoom(selectedRoom.id, { width: e.target.value })}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
              </div>

              {/* Height Slider */}
              <div>
                <div className="mb-1" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span className="text-secondary" style={{ fontWeight: 500 }}>Room Depth</span>
                  <span className="font-bold font-mono" style={{ color: 'white' }}>{selectedRoom.height.toFixed(1)}m</span>
                </div>
                <input 
                  type="range" 
                  min="1.5" 
                  max="8" 
                  step="0.5" 
                  value={selectedRoom.height}
                  onChange={(e) => handleUpdateRoom(selectedRoom.id, { height: e.target.value })}
                  style={{ width: '100%', accentColor: '#ec4899' }}
                />
              </div>

              {/* Colors Grid Selector */}
              <div>
                <div className="text-secondary mb-2" style={{ fontSize: '11px', fontWeight: 500 }}>Room Color Accent</div>
                <div className="flex gap-2 flex-wrap">
                  {colorPalette.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUpdateRoom(selectedRoom.id, { color: col })}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: col,
                        border: selectedRoom.color === col ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: selectedRoom.color === col ? '0 0 8px ' + col : 'none',
                        cursor: 'pointer',
                        transform: selectedRoom.color === col ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                      title={col}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-secondary font-medium">
            Select a room slab on the 3D Canvas or from the left Room checklist index to customize dimensions, offsets, and styles in real-time.
          </div>
        )}

        {/* Vastumeter & Remedies Dashboard inside Right Inspector */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
          <VastuMeter data={vastuData} />
        </div>

      </div>

      {/* CHAT BACKDROP — closes drawer when clicking outside */}
      {showChatDrawer && (
        <div
          onClick={() => setShowChatDrawer(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 18,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* COLLAPSIBLE RIGHT CHAT DRAWER PANEL */}
      <div style={{
             position: 'absolute',
             top: 0,
             bottom: 0,
             zIndex: 20,
             display: 'flex',
             flexDirection: 'column',
             right: showChatDrawer ? (showInspector ? '340px' : '0') : '-360px',
             width: '340px',
             background: 'rgba(10, 11, 18, 0.92)',
             backdropFilter: 'blur(25px)',
             borderLeft: '1px solid rgba(0, 212, 170, 0.3)',
             boxShadow: '-3px 0 25px rgba(0, 212, 170, 0.15), 0 0 35px rgba(0,0,0,0.85)',
             padding: '1.5rem 1.25rem',
             transition: 'right 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
             overflow: 'hidden',
             pointerEvents: showChatDrawer ? 'all' : 'none'
           }}>
        
        {/* Glow Line Accent on Left Border - Teal color for Chat */}
        <div className="absolute left-0 top-0 bottom-0"
             style={{
               width: '2px',
               background: 'linear-gradient(to bottom, transparent, #00D4AA, transparent)',
               boxShadow: '0 0 10px rgba(0, 212, 170, 0.65)'
             }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h3 className="text-sm" style={{ fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>💬</span> Ask Agni AI
          </h3>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowChatDrawer(false); }}
            style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}
          >
            Close ✕
          </button>
        </div>

        {/* Message scrolling panel */}
        <div className="scroll-panel" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0.25rem', margin: '0.5rem 0' }}>
          {chatMessages.map((msg, i) => (
            <div 
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '0.65rem 0.95rem',
                borderRadius: msg.role === 'user' ? '1rem 0 1rem 1rem' : '0 1rem 1rem 1rem',
                fontSize: '0.8rem',
                lineHeight: 1.4,
                background: msg.role === 'user' ? 'rgba(236,72,153,0.12)' : 'rgba(0,201,167,0.1)',
                border: msg.role === 'user' ? '1px solid rgba(236,72,153,0.25)' : '1px solid rgba(0,201,167,0.2)',
                color: 'white'
              }}
            >
              {msg.content}
            </div>
          ))}
          {isChatThinking && (
            <div 
              style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                padding: '0.65rem 0.95rem',
                borderRadius: '0 1rem 1rem 1rem',
                fontSize: '0.8rem',
                background: 'rgba(0,201,167,0.06)',
                border: '1px solid rgba(0,201,167,0.15)',
                color: '#6B75A8',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Thinking
              <span className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box section */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => checkPlanAndTrigger('voice', 'Enterprise', toggleChatMic)}
            className={`btn ${chatMicOn ? 'animate-pulse' : ''}`}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: chatMicOn ? '#FF4757' : 'rgba(236,72,153,0.12)',
              border: chatMicOn ? '1px solid #FF4757' : '1px solid rgba(236,72,153,0.25)',
              color: chatMicOn ? 'white' : '#ec4899',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title={chatMicOn ? "Stop Listening" : "Start Dictation"}
          >
            🎤
          </button>
          
          <input 
            type="text" 
            placeholder="Ask anything about design..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />

          <button 
            onClick={() => handleSendChatMessage()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4AA, #009980)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,212,170,0.3)'
            }}
          >
            ➤
          </button>
        </div>
      </div>

      {/* ─── CONTRACTOR ESTIMATE MODAL ─────────────────────────────────────── */}
      {showEstimateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={() => setShowEstimateModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(13, 17, 34, 0.97)',
              border: '1px solid rgba(179,71,255,0.4)',
              boxShadow: '0 0 60px rgba(179,71,255,0.25), 0 0 120px rgba(0,0,0,0.8)',
              borderRadius: '20px',
              padding: '2rem',
              width: '420px',
              maxWidth: '95vw',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', margin: 0 }}>
                🏷️ Contractor Estimate
              </h2>
              <button onClick={() => setShowEstimateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', margin: 0 }}>
              Choose your finish tier to generate an itemized A4 contractor quote PDF with material, labour, and overhead breakdowns.
            </p>

            {/* Finish Tier Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { tier: 'Budget', desc: 'Basic finishes, economy materials', color: '#4ecdc4', icon: '🟢' },
                { tier: 'Standard', desc: 'Mid-range tiles, good fixtures', color: '#ec4899', icon: '🟡' },
                { tier: 'Premium', desc: 'Italian marble, luxury brand fixtures', color: '#b347ff', icon: '🔴' }
              ].map(({ tier, desc, color, icon }) => (
                <button
                  key={tier}
                  onClick={() => {
                    if (tier === 'Premium') {
                      checkPlanAndTrigger('estimate', 'Pro', () => setFinishTier(tier));
                    } else {
                      setFinishTier(tier);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: finishTier === tier ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                    background: finishTier === tier ? `rgba(${color === '#4ecdc4' ? '78,205,196' : color === '#ec4899' ? '236,72,153' : '179,71,255'},0.12)` : 'rgba(23,23,29,0.4)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: finishTier === tier ? `0 0 16px ${color}33` : 'none'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                  <div>
                    <div style={{ color: 'white', fontWeight: '800', fontSize: '0.85rem' }}>{tier}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem', marginTop: '2px' }}>{desc}</div>
                  </div>
                  {finishTier === tier && (
                    <span style={{ marginLeft: 'auto', color, fontWeight: '800', fontSize: '0.75rem' }}>✓ Selected</span>
                  )}
                </button>
              ))}
            </div>

            {/* Area Summary */}
            <div style={{ 
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(23,23,29,0.6)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem'
            }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Total Built-up Area</span>
              <span style={{ color: 'white', fontWeight: '800', fontFamily: 'monospace' }}>
                {floorPlan.rooms.reduce((sum, r) => sum + r.width * r.height, 0).toFixed(1)} m²
              </span>
            </div>

            <button
              onClick={() => checkPlanAndTrigger('estimate', 'Pro', handleExportEstimate)}
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #b347ff, #7c3aed)',
                border: 'none',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(179,71,255,0.4)',
                transition: 'all 0.2s ease',
                letterSpacing: '0.04em'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ⬇️ Download Contractor Quote PDF
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Glassmorphic Plan Upgrade & Simulated Checkout Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 6, 12, 0.82)',
          backdropFilter: 'blur(16px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.25s ease-out'
        }} onClick={() => setShowUpgradeModal(false)}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
          
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(20, 21, 38, 0.95), rgba(10, 11, 24, 0.98))',
              border: upgradeModalType === 'voice' 
                ? '1px solid rgba(0, 212, 170, 0.35)' 
                : '1px solid rgba(236, 72, 153, 0.35)',
              boxShadow: upgradeModalType === 'voice'
                ? '0 0 50px rgba(0, 212, 170, 0.2), 0 0 100px rgba(0, 0, 0, 0.9)'
                : '0 0 50px rgba(236, 72, 153, 0.2), 0 0 100px rgba(0, 0, 0, 0.9)',
              borderRadius: '24px',
              padding: '2.5rem',
              width: upgradeModalType === 'billing' ? '860px' : '480px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              fontFamily: 'Outfit, sans-serif',
              position: 'relative',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowUpgradeModal(false)} 
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '1rem',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              ✕
            </button>

            {upgradeModalType === 'billing' ? (
              // THREE-COLUMN SUBSCRIPTION GRID
              <>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ color: 'white', fontWeight: '900', fontSize: '1.8rem', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                    Choose Your <span style={{ background: 'linear-gradient(135deg, #ec4899, #b347ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Creative Tier</span>
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto' }}>
                    Select the perfect architectural workflow setup. Unlock advanced vector exports, Vastu compliance diagnostics, and conversational voice engines.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
                  
                  {/* STARTER CARD */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: currentPlan === 'Starter' ? '2px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.3s'
                  }}>
                    {currentPlan === 'Starter' && (
                      <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#475569', color: 'white', fontSize: '0.65rem', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Plan</span>
                    )}
                    <div>
                      <h3 style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', margin: 0 }}>Starter</h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem', marginTop: '4px', minHeight: '32px' }}>Standard drafting tools for personal projects.</p>
                      <div style={{ margin: '1.25rem 0 1rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white' }}>₹0</span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}> / forever</span>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                        <div>✓ Standard 1BHK/Studio Layouts</div>
                        <div>✓ Core 3D Viewer & Placement</div>
                        <div>✓ Offline Preset Library</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)' }}>✗ Vector AutoCAD DXF Exporter</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)' }}>✗ Itemized Estimate PDF</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)' }}>✗ Conversational AI Voice Bot</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConfirmUpgrade('Starter')}
                      disabled={currentPlan === 'Starter'}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'transparent',
                        color: currentPlan === 'Starter' ? 'rgba(255,255,255,0.4)' : 'white',
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        marginTop: '1.5rem',
                        cursor: currentPlan === 'Starter' ? 'default' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {currentPlan === 'Starter' ? 'Current Active' : 'Switch to Starter'}
                    </button>
                  </div>

                  {/* PRO ARCHITECT CARD */}
                  <div style={{
                    background: 'rgba(236,72,153,0.03)',
                    border: currentPlan === 'Pro' ? '2px solid #ec4899' : '1px solid rgba(236,72,153,0.2)',
                    boxShadow: currentPlan === 'Pro' ? '0 0 25px rgba(236,72,153,0.15)' : 'none',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.3s'
                  }}>
                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#ec4899', color: 'white', fontSize: '0.65rem', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {currentPlan === 'Pro' ? 'Active Pro' : 'Recommended'}
                    </span>
                    <div>
                      <h3 style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Pro Architect <span style={{ fontSize: '0.9rem' }}>✨</span>
                      </h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem', marginTop: '4px', minHeight: '32px' }}>Professional CAD integration & dynamic estimators.</p>
                      <div style={{ margin: '1.25rem 0 1rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white' }}>₹2,499</span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}> / mo</span>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(236,72,153,0.15)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                        <div>✓ <b>Unlocks 2BHK/3BHK/Villa Presets</b></div>
                        <div>✓ <b>AutoCAD DXF Exporter (Vector)</b></div>
                        <div>✓ <b>Blueprint High-res PDF Exporter</b></div>
                        <div>✓ <b>Contractor A4 Estimate PDF Downloads</b></div>
                        <div>✓ <b>Premium & Luxury Finish Cost Tiers</b></div>
                        <div style={{ color: 'rgba(255,255,255,0.35)' }}>✗ AI Voice Bot Conversational Suite</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConfirmUpgrade('Pro')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #ec4899, #ec4899)',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '0.78rem',
                        marginTop: '1.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(236,72,153,0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {currentPlan === 'Pro' ? 'Stay Activated' : 'Upgrade to Pro'}
                    </button>
                  </div>

                  {/* ENTERPRISE DEVELOPER CARD */}
                  <div style={{
                    background: 'rgba(0,212,170,0.03)',
                    border: currentPlan === 'Enterprise' ? '2px solid #00D4AA' : '1px solid rgba(0,212,170,0.2)',
                    boxShadow: currentPlan === 'Enterprise' ? '0 0 25px rgba(0,212,170,0.15)' : 'none',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.3s'
                  }}>
                    {currentPlan === 'Enterprise' && (
                      <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#00D4AA', color: 'black', fontSize: '0.65rem', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Enterprise</span>
                    )}
                    <div>
                      <h3 style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Enterprise <span style={{ fontSize: '0.9rem' }}>🚀</span>
                      </h3>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.72rem', marginTop: '4px', minHeight: '32px' }}>AI voice synthesis and custom developer pipeline.</p>
                      <div style={{ margin: '1.25rem 0 1rem' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: '900', color: 'white' }}>Custom</span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}> / volume quote</span>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(0,212,170,0.15)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)' }}>
                        <div>✓ <b>Everything in Pro Architect</b></div>
                        <div>✓ <b>Conversational AI Voice Bot Panel</b></div>
                        <div>✓ <b>Voice Dictation Mic Button</b></div>
                        <div>✓ 24/7 Dedicated Architectural API</div>
                        <div>✓ Multi-story / High-density towers</div>
                        <div>✓ Custom Branding & Watermarks</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConfirmUpgrade('Enterprise')}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #00D4AA, #00b894)',
                        color: 'black',
                        fontWeight: '800',
                        fontSize: '0.78rem',
                        marginTop: '1.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,212,170,0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      {currentPlan === 'Enterprise' ? 'Stay Activated' : 'Activate Enterprise'}
                    </button>
                  </div>

                </div>
              </>
            ) : (
              // FEATURE-SPECIFIC CHECKOUT CARDS
              (() => {
                const getFeatureDetails = () => {
                  switch (upgradeModalType) {
                    case 'dxf':
                      return {
                        title: 'AutoCAD DXF Exporter',
                        icon: '📐',
                        desc: 'Export exact 1:1 vector layouts in standard DXF formatting to modify, print, or integrate into your high-end AutoCAD & Revit pipeline with millimeter precision.',
                        requiredPlan: 'Pro',
                        price: '₹2,499/mo',
                        planName: 'Pro Architect Plan',
                        accent: '#ec4899',
                        bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(0,0,0,0))'
                      };
                    case 'pdf':
                      return {
                        title: 'High-Resolution Blueprint PDF Exporter',
                        icon: '🖨️',
                        desc: 'Generate complete presentation-ready architectural blueprints in standard A3/A4 formats. Includes precise line weights, Vastu orientation charts, and dimension scales.',
                        requiredPlan: 'Pro',
                        price: '₹2,499/mo',
                        planName: 'Pro Architect Plan',
                        accent: '#ec4899',
                        bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(0,0,0,0))'
                      };
                    case 'estimate':
                      return {
                        title: 'Itemized Contractor A4 Quote PDF',
                        icon: '📋',
                        desc: 'Instantly download an A4 contractor-grade price estimate sheet. Unlocks Premium and Luxury finish tiers with separate material quantities, MEP labor pricing, and contingency buffers.',
                        requiredPlan: 'Pro',
                        price: '₹2,499/mo',
                        planName: 'Pro Architect Plan',
                        accent: '#ec4899',
                        bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(0,0,0,0))'
                      };
                    case 'voice':
                    default:
                      return {
                        title: 'Conversational Voice Bot Suite',
                        icon: '🎙️',
                        desc: 'Unlocks the floating AI Voice Bot panel and active voice dictation microphone. Dictate complex design instructions, ask architectural vastu compliance rules, and interact hands-free.',
                        requiredPlan: 'Enterprise',
                        price: 'Enterprise Developer Tier',
                        planName: 'Enterprise Developer Plan',
                        accent: '#00D4AA',
                        bgGradient: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(0,0,0,0))'
                      };
                  }
                };

                const details = getFeatureDetails();

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '16px', 
                      background: `rgba(${details.accent === '#ec4899' ? '236,72,153' : '0,212,170'}, 0.12)`, 
                      border: `1px solid rgba(${details.accent === '#ec4899' ? '236,72,153' : '0,212,170'}, 0.3)`, 
                      fontSize: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.5rem',
                      boxShadow: `0 0 20px rgba(${details.accent === '#ec4899' ? '236,72,153' : '0,212,170'}, 0.15)`
                    }}>
                      {details.icon}
                    </div>

                    <div>
                      <h2 style={{ color: 'white', fontWeight: '950', fontSize: '1.4rem', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
                        Unlock <span style={{ color: details.accent }}>{details.title}</span>
                      </h2>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.45, margin: '0 auto', maxWidth: '400px' }}>
                        {details.desc}
                      </p>
                    </div>

                    <div style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: '12px', 
                      padding: '12px 16px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required Upgrade</div>
                        <div style={{ color: 'white', fontWeight: '800', marginTop: '2px' }}>{details.planName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</div>
                        <div style={{ color: details.accent, fontWeight: '900', fontSize: '0.9rem', marginTop: '2px' }}>{details.price}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleConfirmUpgrade(details.requiredPlan)}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        background: `linear-gradient(135deg, ${details.accent}, ${details.requiredPlan === 'Pro' ? '#b347ff' : '#00b894'})`,
                        color: details.requiredPlan === 'Pro' ? 'white' : 'black',
                        fontSize: '0.88rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: `0 4px 20px rgba(${details.accent === '#ec4899' ? '236,72,153' : '0,212,170'}, 0.35)`,
                        transition: 'all 0.2s ease',
                        marginTop: '0.5rem',
                        letterSpacing: '0.03em'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      🚀 Upgrade & Continue
                    </button>

                    <button 
                      onClick={() => setUpgradeModalType('billing')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#b347ff',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#c084fc'}
                      onMouseLeave={e => e.currentTarget.style.color = '#b347ff'}
                    >
                      Compare all software packages
                    </button>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(236, 72, 153, 0.95)', color: 'white', padding: '12px 24px',
          borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', zIndex: 9999,
          boxShadow: '0 8px 32px rgba(236,72,153,0.4)', animation: 'slideUp 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Floating Chat Trigger Launcher */}
      <div style={{ position: 'absolute', right: '2rem', bottom: '2rem', zIndex: 10 }}>
        <VoiceBot currentPlan={currentPlan} onBlockTrigger={() => checkPlanAndTrigger('voice', 'Enterprise', () => {})} />
      </div>

    </div>
  );
}
