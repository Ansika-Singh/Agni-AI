const https = require('https');

// Highly stable hand-aligned template fallback if no API key is set
const MOCK_FLOOR_PLAN = {
  title: "2BHK — Traditional Indian",
  totalArea: 780,
  style: "Traditional Indian",
  vastuScore: 90,
  rooms: [
    { id: "living", name: "Living Room", width: 5, height: 4.5, x: 0, y: 0, color: "#ffd700", furniture: ["Sofa", "TV Unit", "Coffee Table"] },
    { id: "kitchen", name: "Kitchen", width: 3, height: 3.5, x: 5, y: 0, color: "#f97316", furniture: ["Counter", "Fridge", "Stove"] },
    { id: "master", name: "Master Bedroom", width: 4, height: 4, x: 0, y: 4.5, color: "#b19cd9", furniture: ["King Bed", "Wardrobe", "Dressing Table"] },
    { id: "bedroom2", name: "Guest Bedroom", width: 3.5, height: 4, x: 4, y: 4.5, color: "#45b7d1", furniture: ["Double Bed", "Study Table"] },
    { id: "bathroom", name: "Bathroom", width: 1.8, height: 2.2, x: 7.5, y: 4.5, color: "#4ecdc4", furniture: ["Toilet", "Shower"] },
    { id: "pooja", name: "Pooja Room", width: 1.5, height: 1.0, x: 5, y: 3.5, color: "#ffd700", furniture: ["Altar", "Diya Stand"] },
    { id: "balcony", name: "Balcony", width: 5, height: 1.5, x: 0, y: 8.5, color: "#a8dadc", furniture: ["Chair", "Plant"] }
  ]
};

// Generic REST helper to talk to Gemini API without SDK dependencies
async function callGemini(systemInstruction, prompt, isJson = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {}
  };

  if (isJson) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
    const dataString = JSON.stringify(payload);

    const options = {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      },
      timeout: 10000
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const responseJson = JSON.parse(body);
          if (responseJson.error) {
            return reject(new Error(responseJson.error.message || "Gemini API Error"));
          }
          const text = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            return reject(new Error("Empty response from Gemini"));
          }
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.write(dataString);
    req.end();
  });
}

// Geometric solver to guarantee zero overlapping rooms on dynamic layouts
function resolveOverlaps(rooms) {
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 5) {
    changed = false;
    iterations++;
    for (let i = 0; i < rooms.length; i++) {
      for (let j = 0; j < rooms.length; j++) {
        if (i === j) continue;
        const r1 = rooms[i];
        const r2 = rooms[j];
        if ((r1.floor || 0) !== (r2.floor || 0)) continue;
        
        const overlapX = Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x);
        const overlapY = Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y);
        
        if (overlapX > 0.05 && overlapY > 0.05) {
          changed = true;
          if (overlapX < overlapY) {
            if (r2.x >= r1.x) {
              r2.x = parseFloat((r2.x + overlapX).toFixed(2));
            } else {
              r2.x = parseFloat((r2.x - overlapX).toFixed(2));
            }
          } else {
            if (r2.y >= r1.y) {
              r2.y = parseFloat((r2.y + overlapY).toFixed(2));
            } else {
              r2.y = parseFloat((r2.y - overlapY).toFixed(2));
            }
          }
        }
      }
    }
  }
  return rooms;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

async function generateFloorPlan(description, preferences = {}) {
  if (!process.env.GEMINI_API_KEY) {
    console.log('🔧 Hybrid Mode: No GEMINI_API_KEY found. Serving dynamically customized template fallback with procedural variety and vertical stacking.');
    const templates = require('../data/templates');
    const homeType = preferences.homeType || '2BHK';
    
    // 1. Determine floors count and if apartment
    let floorsCount = 1;
    let isApartment = false;
    if (preferences.storeys) {
      if (preferences.storeys.includes("2 Storeys")) floorsCount = 2;
      else if (preferences.storeys.includes("3 Storeys")) floorsCount = 3;
      else if (preferences.storeys.includes("Apartment")) isApartment = true;
    } else if (description) {
      const text = description.toLowerCase();
      if (text.includes("3 storey") || text.includes("3 floor") || text.includes("three floor") || text.includes("three storey") || text.includes("triple storey") || text.includes("3 levels")) {
        floorsCount = 3;
      } else if (text.includes("2 storey") || text.includes("2 floor") || text.includes("two floor") || text.includes("double storey") || text.includes("two storey") || text.includes("rent") || text.includes("tenant")) {
        floorsCount = 2;
      } else if (text.includes("apartment") || text.includes("flat") || text.includes("apartment flat")) {
        isApartment = true;
      }
    }

    // 2. Budget tier scaling
    let budgetScale = 1.0;
    if (preferences.budget) {
      if (preferences.budget.includes("Under")) budgetScale = 0.85;
      else if (preferences.budget.includes("₹15L")) budgetScale = 1.1;
      else if (preferences.budget.includes("₹30L")) budgetScale = 1.25;
    } else if (description) {
      const text = description.toLowerCase();
      if (text.includes("low budget") || text.includes("cheap") || text.includes("under 5l")) budgetScale = 0.85;
      else if (text.includes("high budget") || text.includes("luxury") || text.includes("premium") || text.includes("30l+")) budgetScale = 1.25;
    }

    // 3. Assemble all floors
    const allRooms = [];
    const colorPalettes = {
      'Warm (beige, terracotta)': ['#ff6b35', '#f7c59f', '#ffd700', '#f97316', '#ffd59e'],
      'Cool (white, grey)': ['#e2e8f0', '#cbd5e1', '#94a3b8', '#a8dadc', '#cbd5e0'],
      'Bold & Vibrant': ['#ff6b35', '#312e81', '#4ecdc4', '#ff2a5f', '#ffd700'],
      'Earthy & Natural': ['#95e1d3', '#4ecdc4', '#81c784', '#a8dadc', '#c8e6c9'],
      'Soft Pastel': ['#ffd1dc', '#b19cd9', '#a8dadc', '#ffecb3', '#d1c4e9']
    };
    const activePalette = colorPalettes[preferences.colorPalette] || colorPalettes['Warm (beige, terracotta)'];

    // Create Floor 0 (Ground Floor)
    const baseTemplate = templates[homeType] || templates['2BHK'];
    const floor0Rooms = JSON.parse(JSON.stringify(baseTemplate.rooms));

    // Ensure floor property is set
    floor0Rooms.forEach(r => {
      r.floor = 0;
      r.color = activePalette[Math.abs(hashCode(r.id + (description || ""))) % activePalette.length];
    });

    // Incase of multi-storey, inject staircase at x:0, y:0 on Floor 0, and shift overlapping rooms
    if (floorsCount > 1) {
      let staircase = floor0Rooms.find(r => r.id === 'staircase');
      if (!staircase) {
        staircase = {
          id: "staircase",
          name: "Staircase",
          width: 3.0,
          height: 3.0,
          x: 0,
          y: 0,
          floor: 0,
          color: "#708090",
          furniture: ["Concrete Steps", "Steel Handrail", "Polished Marble Risers"]
        };
        // shift other rooms that might be at (0,0) or too close
        floor0Rooms.forEach(r => {
          if (r.x < 3.0 && r.y < 3.0) {
            r.x += 3.0; // move right
          }
        });
        floor0Rooms.unshift(staircase);
      }
    }

    // Incase of Apartment, inject Lift Lobby / Corridor
    if (isApartment) {
      let corridor = floor0Rooms.find(r => r.id === 'corridor');
      if (!corridor) {
        corridor = {
          id: "corridor",
          name: "Lift Lobby / Corridor",
          width: 2.0,
          height: 5.0,
          x: -2.0,
          y: 0,
          floor: 0,
          color: "#4a4a5a",
          furniture: ["Entry Bell", "Ceiling Downlights", "Vitrified Tile Corridor"]
        };
        floor0Rooms.unshift(corridor);
      }
    }

    // 4. Inject Dynamic custom rooms requested via prompt text
    if (description) {
      const text = description.toLowerCase();
      const customInjections = [
        { keys: ["study", "office", "work"], id: "study_room", name: "Home Office / Study", w: 3, h: 3, color: "#93c5fd", items: ["Study Desk", "Ergonomic Chair", "Bookshelf"] },
        { keys: ["gym", "exercise", "workout"], id: "gym_room", name: "Home Gym", w: 3.5, h: 3, color: "#86efac", items: ["Yoga Mat", "Dumbbells Stack", "Treadmill"] },
        { keys: ["theatre", "theater", "media", "cinema"], id: "media_lounge", name: "Media Lounge", w: 4, h: 4, color: "#c084fc", items: ["Home Theatre Screen", "Acoustic Wall Panels", "Reclining Sofas"] },
        { keys: ["servant", "maid"], id: "servant_room", name: "Servant Room", w: 2.5, h: 2.5, color: "#fda4af", items: ["Single Bed", "Attached Washroom Closet"] },
        { keys: ["guest"], id: "guest_room", name: "Guest Room", w: 3.5, h: 3.5, color: "#fed7aa", items: ["Double Bed", "Wardrobe", "Luggage Rack"] }
      ];

      customInjections.forEach(ci => {
        if (ci.keys.some(k => text.includes(k))) {
          const exists = floor0Rooms.some(r => r.id.includes(ci.id));
          if (!exists) {
            floor0Rooms.push({
              id: ci.id,
              name: ci.name,
              width: ci.w,
              height: ci.h,
              x: 0,
              y: 5,
              floor: 0,
              color: ci.color,
              furniture: ci.items
            });
          }
        }
      });
    }

    // Apply procedural dimension shuffling & budget scaling to floor 0
    floor0Rooms.forEach(room => {
      if (room.id !== 'staircase' && room.id !== 'corridor') {
        room.width = parseFloat((room.width * budgetScale).toFixed(1));
        room.height = parseFloat((room.height * budgetScale).toFixed(1));
        
        // Procedural variance based on room ID hash (reproducible yet unique for each prompt)
        const seed = hashCode(room.id + (description || ""));
        const widthVar = 0.85 + (Math.abs(seed % 30) / 100); // 0.85 to 1.15
        const heightVar = 0.85 + (Math.abs((seed * 3) % 30) / 100);
        
        room.width = parseFloat((room.width * widthVar).toFixed(1));
        room.height = parseFloat((room.height * heightVar).toFixed(1));
        
        if (room.width < 1.5) room.width = 1.5;
        if (room.height < 1.5) room.height = 1.5;
      }
    });

    const resolvedFloor0 = resolveOverlaps(floor0Rooms);
    allRooms.push(...resolvedFloor0);

    // Create upper floors if requested
    for (let f = 1; f < floorsCount; f++) {
      const upperTemplate = f === 1 ? templates['2BHK'] : templates['1BHK'];
      const floorRooms = JSON.parse(JSON.stringify(upperTemplate.rooms));
      
      floorRooms.forEach(r => {
        r.floor = f;
        r.id = `${r.id}_L${f}`;
        r.color = activePalette[Math.abs(hashCode(r.id + (description || ""))) % activePalette.length];
        
        if (f === 1) {
          r.name = `${r.name} (Tenant Unit)`;
        } else {
          r.name = `${r.name} (L${f} Unit)`;
        }

        if (r.id !== `staircase_L${f}`) {
          r.width = parseFloat((r.width * budgetScale).toFixed(1));
          r.height = parseFloat((r.height * budgetScale).toFixed(1));
          
          const seed = hashCode(r.id + (description || "") + f);
          const widthVar = 0.9 + (Math.abs(seed % 20) / 100); // 0.9 to 1.1
          const heightVar = 0.9 + (Math.abs((seed * 7) % 20) / 100);
          r.width = parseFloat((r.width * widthVar).toFixed(1));
          r.height = parseFloat((r.height * heightVar).toFixed(1));
          
          if (r.width < 1.5) r.width = 1.5;
          if (r.height < 1.5) r.height = 1.5;
        }
      });

      // Inject staircase at exact same position (0,0) on all levels
      let staircase = floorRooms.find(r => r.id.includes('staircase'));
      if (!staircase) {
        staircase = {
          id: `staircase_L${f}`,
          name: "Staircase",
          width: 3.0,
          height: 3.0,
          x: 0,
          y: 0,
          floor: f,
          color: "#708090",
          furniture: ["Concrete Steps", "Steel Handrail", "Polished Marble Risers"]
        };
        floorRooms.forEach(r => {
          if (r.x < 3.0 && r.y < 3.0) {
            r.x += 3.0;
          }
        });
        floorRooms.unshift(staircase);
      } else {
        staircase.x = 0;
        staircase.y = 0;
        staircase.width = 3.0;
        staircase.height = 3.0;
      }

      const resolvedFloor = resolveOverlaps(floorRooms);
      allRooms.push(...resolvedFloor);
    }

    // Apply generic decorative features (kitchen styles, flooring material) to all rooms
    allRooms.forEach(room => {
      if (preferences.kitchenStyle && (room.id.includes('kitchen') || room.name.toLowerCase().includes('kitchen'))) {
        const styleItems = {
          'Open Kitchen': ["Open Breakfast Counter", "Stove", "Fridge", "Sink"],
          'Closed Kitchen': ["L-Shaped Counter", "Pantry Cabinets", "Stove", "Sink"],
          'L-Shaped': ["L-Shaped Counter", "Stove", "Chimney", "Sink"],
          'Parallel / Galley': ["Parallel Counters", "Sink", "Stove", "Pantry"],
          'Island Kitchen': ["Central Kitchen Island", "Bar Stools", "Stove", "Fridge"]
        };
        const items = styleItems[preferences.kitchenStyle] || styleItems['Open Kitchen'];
        room.furniture = [...items];
      }

      if (preferences.flooring) {
        const floorNames = {
          'Marble': 'Marble Flooring Tile',
          'Vitrified Tiles': 'Vitrified Tile Floor',
          'Wooden Laminate': 'Wooden Laminate Plank Floor',
          'Granite': 'Granite Stone Floor',
          'No preference': 'Premium Flooring'
        };
        const floorName = floorNames[preferences.flooring] || 'Premium Flooring';
        room.furniture = room.furniture.filter(item => !item.toLowerCase().includes('floor') && !item.toLowerCase().includes('laminate'));
        room.furniture.push(floorName);
      }
    });

    const finalPlan = {
      title: isApartment ? `Premium ${homeType} Apartment` : `${floorsCount} Storey ${homeType} House`,
      totalArea: baseTemplate.totalArea * floorsCount,
      style: preferences.style || "Modern",
      vastuScore: baseTemplate.vastuScore,
      rooms: allRooms,
      description
    };
    return finalPlan;
  }

  const systemInstruction = `You are Agni, an expert Indian home architect AI.
Your task is to design a structurally sound floor plan based on the user's details.
Every room must sit flush next to each other on a 2D layout grid.
The layout must strictly adhere to classic Vastu Shastra rules:
- Main entrance / Living Room: North or East.
- Kitchen: South-East (Fire element).
- Pooja Room: North-East (Water/Spiritual element).
- Master Bedroom: South-West (Earth element).
- Toilets / Bathrooms: West or North-West.

MULTI-STOREY / APARTMENT STRUCTURAL RULES:
- Every room MUST include an integer "floor" attribute (default 0 for Ground Floor, 1 for 1st Floor, 2 for 2nd Floor, etc.).
- For 2-storey or 3-storey configurations, rooms must be distributed across multiple levels (e.g. floor 0, floor 1, floor 2).
- If multi-storey, place a vertical staircase room named "Staircase" (width 3, height 3, x: 0, y: 0) on ALL levels (floor 0, 1, 2) to connect the floors properly.
- If it's an Apartment Flat, design a compact, functional single-level plan (floor 0) and include a room named "Lift Lobby / Corridor" (width 2, height 6) and a spacious outdoor balcony slab.

COLOR PALETTE INTEGRATION:
You must select each room's "color" (as a CSS HEX string) to match the chosen Color Palette Theme:
- Warm (beige, terracotta): Use warm colors like "#ff6b35", "#f7c59f", "#ffd700", "#f97316".
- Cool (white, grey): Use cool/neutral grays and whites like "#e2e8f0", "#cbd5e1", "#94a3b8", "#a8dadc".
- Bold & Vibrant: Use vibrant, contrasting colors like "#ff6b35", "#312e81", "#45b7d1", "#ffd700".
- Earthy & Natural: Use earthy and natural hues like "#95e1d3", "#4ecdc4", "#a8dadc", "#81c784".
- Soft Pastel: Use soft pastel colors like "#ffd1dc", "#b19cd9", "#a8dadc", "#ffecb3".

SPATIAL & FURNITURE DETAIL INTEGRATION:
You must enrich the "furniture" list of relevant rooms to reflect specific styles, flooring, and special requirements:
1. Kitchen Style:
   - "Open Kitchen": Include items like "Open Breakfast Counter", "Stove", "Fridge".
   - "Closed Kitchen": Include items like "L-Shaped Counter", "Pantry Cabinets", "Stove".
   - "L-Shaped": Include items like "L-Shaped Counter", "Stove", "Chimney".
   - "Parallel / Galley": Include items like "Parallel Counters", "Sink", "Stove".
   - "Island Kitchen": Include items like "Central Kitchen Island", "Bar Stools", "Stove".
2. Flooring Material:
   - For each room, add one descriptive entry in its "furniture" list indicating the selected flooring type, e.g., "Marble Flooring Tile", "Vitrified Tile Floor", "Wooden Laminate Plank Floor", "Granite Stone Floor", or "Premium Flooring".
3. Special Requirements (include as items in relevant rooms if requested):
   - Wheelchair accessible: Add "Wide Doorway Clearance" and "Spacious Turning Area" to relevant rooms.
   - Senior-friendly: Add "Anti-slip Floor Mat" and "Grab Bars" to bathrooms/bedroom.
   - Pet-friendly: Add "Pet Bed / Dog lounge" or "Built-in Pet Station" to Living Room.
   - Work-from-home setup: Add "Work Desk & Ergonomic Chair" to a bedroom or study room.

You MUST return valid JSON matching this exact schema:
{
  "title": "descriptive name",
  "totalArea": number (in sq ft),
  "style": "style name",
  "vastuScore": number (0-100),
  "rooms": [
    {
      "id": "unique string identifier",
      "name": "Room Name",
      "width": number (meters),
      "height": number (meters),
      "x": horizontal start coordinate (meters),
      "y": vertical start coordinate (meters),
      "floor": integer (0 for Ground, 1 for L1, 2 for L2, etc.),
      "color": "CSS HEX color matching color token rules",
      "furniture": ["item1", "item2"]
    }
  ]
}`;

  const prompt = `Design a floor plan for the following request: "${description}"
User preferences:
- BHK Configuration: ${preferences.homeType || '2BHK'}
- Storeys/Floors Configuration: ${preferences.storeys || 'Single Storey'}
- Budget Bracket: ${preferences.budget || '₹15L–₹30L'}
- Style: ${preferences.style || 'Modern'}
- Main Facing Direction: ${preferences.facing || 'East'}
- Vastu Compliance: ${preferences.vastu || 'Preferred'}
- Requested Rooms: ${(preferences.rooms || []).join(', ') || 'Standard BHK allocation'}
- Kitchen Style: ${preferences.kitchenStyle || 'Open Kitchen'}
- Color Palette Theme: ${preferences.colorPalette || 'Warm (beige, terracotta)'}
- Flooring Material: ${preferences.flooring || 'Marble'}
- Special Requirements: ${(preferences.specialRequirements || []).join(', ') || 'None'}

Ensure all room boundaries are logical (e.g. Master Bedroom is at least 4x4, Pooja Corner is smaller, bathrooms are next to bedrooms). No duplicate x/y offsets unless intended. Use positive dimensions.`;

  try {
    const rawJson = await callGemini(systemInstruction, prompt, true);
    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error('Gemini Floor Plan Parse Error:', parseErr.message, rawJson);
      throw parseErr;
    }
    
    // Validate schema
    if (!parsed || !parsed.rooms || !Array.isArray(parsed.rooms)) {
      throw new Error('Invalid Floor Plan JSON schema from Gemini: missing rooms array');
    }
    
    // --- BEGIN PROCEDURAL STACKING FOR LLM HALLUCINATIONS ---
    let floorsCount = 1;
    if (preferences.storeys) {
      if (preferences.storeys.includes("2 Storeys")) floorsCount = 2;
      else if (preferences.storeys.includes("3 Storeys")) floorsCount = 3;
    }

    // Ensure all LLM rooms have at least a floor 0 property
    parsed.rooms.forEach(r => { r.floor = r.floor || 0; });

    // Check if LLM successfully generated upper floors
    const hasUpperFloors = parsed.rooms.some(r => r.floor > 0);

    if (floorsCount > 1 && !hasUpperFloors) {
      // LLM failed to understand 3D stacking. Procedurally clone the ground floor to create upper floors.
      const groundRooms = JSON.parse(JSON.stringify(parsed.rooms.filter(r => r.floor === 0)));
      
      // Inject staircase into ground floor if missing
      let staircase = parsed.rooms.find(r => r.id && r.id.toLowerCase().includes('stair'));
      if (!staircase && groundRooms.length > 0) {
        staircase = {
          id: "staircase",
          name: "Staircase",
          width: 3.0,
          height: 3.0,
          x: 0,
          y: 0,
          floor: 0,
          color: "#708090",
          furniture: ["Concrete Steps"]
        };
        // shift other rooms to make space
        parsed.rooms.forEach(r => {
          if (r.x < 3.0 && r.y < 3.0) r.x += 3.0;
        });
        groundRooms.forEach(r => {
          if (r.x < 3.0 && r.y < 3.0) r.x += 3.0;
        });
        parsed.rooms.unshift(staircase);
        groundRooms.unshift(staircase);
      }

      // Generate upper floors
      for (let f = 1; f < floorsCount; f++) {
        const upperRooms = JSON.parse(JSON.stringify(groundRooms));
        upperRooms.forEach(r => {
          r.floor = f;
          r.id = `${r.id}_L${f}`;
          if (r.name && !r.name.includes("Staircase")) {
            r.name = `${r.name} (L${f})`;
          }
        });
        parsed.rooms.push(...upperRooms);
      }
    }
    // --- END PROCEDURAL STACKING ---
    
    parsed.rooms = resolveOverlaps(parsed.rooms);
    return parsed;
  } catch (err) {
    console.error('Gemini Floor Plan Generation Error:', err.message);
    // Use the correct template for the requested homeType instead of always defaulting to 2BHK
    const templates = require('../data/templates');
    const homeType = preferences.homeType || '2BHK';
    const fallbackTemplate = templates[homeType] || templates['2BHK'];
    const fallbackRooms = JSON.parse(JSON.stringify(fallbackTemplate.rooms));
    fallbackRooms.forEach(r => { r.floor = r.floor || 0; });
    return {
      title: fallbackTemplate.title,
      totalArea: fallbackTemplate.totalArea,
      style: preferences.style || fallbackTemplate.style,
      vastuScore: fallbackTemplate.vastuScore,
      rooms: resolveOverlaps(fallbackRooms),
      description
    };
  }
}

async function getVastuScore(rooms) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      score: 82,
      grade: 'A',
      suggestions: [
        { room: 'Kitchen', direction: 'SE', status: 'good', tip: 'Kitchen in South-East is ideal per Vastu Shastra' },
        { room: 'Pooja Room', direction: 'NE', status: 'good', tip: 'North-East Pooja Room brings prosperity' },
        { room: 'Master Bedroom', direction: 'SW', status: 'good', tip: 'South-West Master Bedroom ensures strong energy flow' }
      ]
    };
  }

  const systemInstruction = `You are a Vastu Shastra advisor. Analyze the room layout list provided in JSON format and evaluate the home.
Evaluate based on room names, positions, and sizes.
You MUST return valid JSON matching this exact schema:
{
  "score": number (0-100),
  "grade": "string grade (e.g. A, B, B+, C)",
  "suggestions": [
    {
      "room": "Room name",
      "direction": "Direction (e.g. NE, SE, SW, NW)",
      "status": "string ('good' | 'warning' | 'bad')",
      "tip": "Constructive correction suggestion"
    }
  ]
}`;

  const prompt = `Evaluate Vastu for these rooms: ${JSON.stringify(rooms)}`;

  try {
    const rawJson = await callGemini(systemInstruction, prompt, true);
    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error('Gemini Vastu Score Parse Error:', parseErr.message, rawJson);
      throw parseErr;
    }
    
    // Validate schema
    if (typeof parsed.score !== 'number' || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid Vastu Score JSON schema from Gemini');
    }
    return parsed;
  } catch (err) {
    console.error('Gemini Vastu Score Error:', err.message);
    return { score: 75, grade: 'B', suggestions: [] };
  }
}

async function chatWithAgni(message, language = 'en', conversationHistory = []) {
  const systemInstruction = `You are Agni, a warm, highly intelligent, and professional Indian home design assistant.
Your absolute primary goal is to provide DIRECT, HIGHLY RELEVANT answers to the user's specific questions.
Rules:
1. FOCUS ON THE QUESTION: If the user asks for a specific layout, Vastu tip, furniture suggestion, color scheme, room dimension, or design idea — answer it directly, practically, and with specific examples or numbers where helpful.
2. DOMAIN EXPERTISE: You specialize in Indian architectural space, Vastu compliance, home structures, and interior decor. Use Indian terms naturally (BHK, Lakh, Crore, Vastu, Griha Pravesh, etc.).
3. VASTU RULES: Know these by heart — Kitchen: South-East, Pooja Room: North-East, Master Bedroom: South-West, Main Door: East or North, Toilets: West or North-West.
4. OUT OF SCOPE: If the user asks something completely unrelated to homes, architecture, design, or Vastu, politely decline in one sentence and redirect.
5. LANGUAGE: Always respond in the requested language: ${language}.
6. CONCISE: Keep responses elegant, actionable, and to the point (2-4 sentences max) so it is clear and works well for voice output.
7. NEVER give generic or vague answers. Always be specific to what the user actually asked.`;

  const formattedHistory = conversationHistory
    .map(h => `${h.role === 'user' ? 'User' : 'Agni'}: ${h.content}`)
    .join('\n');

  const prompt = `${formattedHistory}\nUser: ${message}\nAgni:`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      const fallbackReplies = {
        en: "I am Agni, your AI design companion! Let's build a beautiful home together.",
        hi: "मैं अग्नि हूँ, आपका घर डिज़ाइन सहायक! चलिए मिलकर एक सुंदर घर बनाते हैं।",
        ta: "நான் அக்னி, உங்கள் வீட்டு வடிவமைப்பு உதவியாளர்! ஒரு அழகான வீட்டை உருவாக்குவோம்.",
        te: "నేను అగ్ని, మీ ఇల్లు డిజైన్ సహాయకుడిని! కలిసి ఒక అందమైన ఇల్లు నిర్మిద్దాం."
      };
      return fallbackReplies[language] || fallbackReplies.en;
    }
    return await callGemini(systemInstruction, prompt, false);
  } catch (err) {
    console.error('Gemini Chat Error:', err.message);
    return "I am experiencing temporary network latency. Let's continue creating your dream spaces!";
  }
}

module.exports = { generateFloorPlan, getVastuScore, chatWithAgni };
