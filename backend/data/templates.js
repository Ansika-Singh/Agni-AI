const templates = {
  '1BHK': {
    title: "1BHK Compact Home",
    totalArea: 450,
    style: "Modern",
    vastuScore: 75,
    rooms: [
      { id: "living", name: "Living Room", width: 4, height: 4, x: 0, y: 0, color: "#FF6B35", furniture: ["Sofa", "TV Unit"] },
      { id: "kitchen", name: "Kitchen", width: 3, height: 2.5, x: 4, y: 0, color: "#F7C59F", furniture: ["Counter", "Stove"] },
      { id: "pooja", name: "Pooja Corner", width: 3, height: 1.5, x: 4, y: 2.5, color: "#FFD700", furniture: ["Altar"] },
      { id: "bedroom", name: "Bedroom", width: 4, height: 4, x: 0, y: 4, color: "#4ECDC4", furniture: ["Double Bed", "Wardrobe"] },
      { id: "bathroom", name: "Bathroom", width: 3, height: 4, x: 4, y: 4, color: "#A8DADC", furniture: ["Toilet", "Shower"] }
    ]
  },
  '2BHK': {
    title: "2BHK — Traditional Indian",
    totalArea: 780,
    style: "Traditional Indian",
    vastuScore: 90,
    rooms: [
      { id: "living", name: "Living Room", width: 5, height: 4.5, x: 0, y: 0, color: "#ffd700", furniture: ["Sofa", "TV Unit", "Coffee Table"] },
      { id: "kitchen", name: "Kitchen", width: 3, height: 3.5, x: 5, y: 0, color: "#f97316", furniture: ["Counter", "Fridge", "Stove"] },
      { id: "pooja", name: "Pooja Room", width: 3, height: 1.0, x: 5, y: 3.5, color: "#ffd700", furniture: ["Altar", "Diya Stand"] },
      { id: "master", name: "Master Bedroom", width: 3.5, height: 4, x: 0, y: 4.5, color: "#b19cd9", furniture: ["King Bed", "Wardrobe", "Dressing Table"] },
      { id: "bedroom2", name: "Guest Bedroom", width: 3.0, height: 4, x: 3.5, y: 4.5, color: "#45b7d1", furniture: ["Double Bed", "Study Table"] },
      { id: "bathroom", name: "Bathroom", width: 1.5, height: 4, x: 6.5, y: 4.5, color: "#4ecdc4", furniture: ["Toilet", "Shower"] },
      { id: "balcony", name: "Balcony", width: 8, height: 1.5, x: 0, y: 8.5, color: "#a8dadc", furniture: ["Chair", "Plant"] }
    ]
  },
  '3BHK': {
    title: "3BHK Spacious Family Home",
    totalArea: 1400,
    style: "Modern",
    vastuScore: 82,
    rooms: [
      { id: "living", name: "Living Room", width: 6, height: 6, x: 0, y: 0, color: "#FF6B35", furniture: ["L-Sofa", "TV Cabinet", "Center Table"] },
      { id: "dining", name: "Dining Room", width: 4, height: 6, x: 6, y: 0, color: "#FFA07A", furniture: ["Dining Table", "6 Chairs"] },
      { id: "kitchen", name: "Kitchen", width: 4, height: 6, x: 10, y: 0, color: "#F7C59F", furniture: ["Modular Kitchen", "Fridge"] },
      { id: "master", name: "Master Bedroom", width: 5, height: 5, x: 0, y: 6, color: "#4ECDC4", furniture: ["King Bed", "Walk-in Wardrobe", "Dressing Table"] },
      { id: "bedroom2", name: "Bedroom 2", width: 4, height: 5, x: 5, y: 6, color: "#45B7D1", furniture: ["Double Bed", "Wardrobe"] },
      { id: "bedroom3", name: "Bedroom 3", width: 5, height: 5, x: 9, y: 6, color: "#7EC8E3", furniture: ["Single Bed", "Study Table"] },
      { id: "pooja", name: "Pooja Room", width: 2.5, height: 3, x: 0, y: 11, color: "#FFD700", furniture: ["Mandir", "Diya Stand", "Bell"] },
      { id: "study", name: "Study Room", width: 2.5, height: 3, x: 2.5, y: 11, color: "#DDA0DD", furniture: ["Desk", "Bookshelf", "Chair"] },
      { id: "bathroom1", name: "Master Bath", width: 3, height: 3, x: 5, y: 11, color: "#A8DADC", furniture: ["Bathtub", "Shower", "Sink"] },
      { id: "bathroom2", name: "Bathroom 2", width: 3, height: 3, x: 8, y: 11, color: "#A8DADC", furniture: ["Toilet", "Shower"] },
      { id: "bathroom3", name: "Bathroom 3", width: 3, height: 3, x: 11, y: 11, color: "#A8DADC", furniture: ["Toilet"] },
      { id: "balcony1", name: "Main Balcony", width: 14, height: 2, x: 0, y: 14, color: "#95E1D3", furniture: ["Swing", "Plants"] }
    ]
  },
  'Villa': {
    title: "Luxury Villa",
    totalArea: 3500,
    style: "Royal/Heritage",
    vastuScore: 88,
    rooms: [
      { id: "living", name: "Grand Living Room", width: 8, height: 6, x: 0, y: 0, color: "#FF6B35", furniture: ["Royal Sofa Set", "Grand TV Unit", "Center Table", "Side Tables"] },
      { id: "dining", name: "Formal Dining", width: 6, height: 6, x: 8, y: 0, color: "#FFA07A", furniture: ["12-Seater Table"] },
      { id: "master", name: "Master Suite", width: 6, height: 6, x: 0, y: 6, color: "#4ECDC4", furniture: ["King Bed", "Walk-in Closet", "Lounge Area"] },
      { id: "pooja", name: "Pooja Room", width: 2, height: 6, x: 6, y: 6, color: "#FFD700", furniture: ["Marble Mandir", "Puja Items"] },
      { id: "kitchen", name: "Modular Kitchen", width: 6, height: 6, x: 8, y: 6, color: "#F7C59F", furniture: ["Island Kitchen", "Premium Appliances"] },
      { id: "family", name: "Family Lounge", width: 7, height: 5, x: 0, y: 12, color: "#DDA0DD", furniture: ["Recliners", "Home Theatre"] },
      { id: "gym", name: "Home Gym", width: 7, height: 5, x: 7, y: 12, color: "#98FB98", furniture: ["Treadmill", "Weights", "Mirror"] }
    ]
  },
  'Studio': {
    title: "Smart Studio Apartment",
    totalArea: 350,
    style: "Minimalist",
    vastuScore: 70,
    rooms: [
      { id: "main", name: "Studio Space", width: 5, height: 4, x: 0, y: 0, color: "#FF6B35", furniture: ["Murphy Bed", "Mini Sofa", "Compact TV"] },
      { id: "kitchen", name: "Kitchenette", width: 3, height: 4, x: 5, y: 0, color: "#F7C59F", furniture: ["Counter", "Mini Fridge"] },
      { id: "bathroom", name: "Bathroom", width: 3, height: 2, x: 5, y: 4, color: "#A8DADC", furniture: ["Shower", "Toilet", "Sink"] },
      { id: "balcony", name: "Balcony", width: 5, height: 2, x: 0, y: 4, color: "#95E1D3", furniture: ["Chair"] }
    ]
  }
};

module.exports = templates;
