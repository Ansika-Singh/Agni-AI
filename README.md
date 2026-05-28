# 🔥 Agni AI - Intelligent Architecture & Vastu Assistant

**🚀 [Try the Live Demo!](https://agni-ai-pi.vercel.app)**

Agni AI is a next-generation, fully interactive 3D architectural visualization and interior design application. Built specifically to bridge the gap between modern architectural design and traditional Indian Vastu principles, it empowers users to instantly generate fully-furnished 2D floor plans, explore beautiful real-time 3D environments, and converse with a specialized AI architect to validate their designs.

## ✨ Core Features & Technical Details

### 🤖 Agni Voicebot Assistant
- **Real-time Speech Recognition**: Built using the native Web Speech API for seamless microphone integration.
- **Powered by Gemini 1.5**: Deep integration with Google's Gemini LLM, configured with strict, highly-focused system prompts to act as a professional Indian architectural assistant.
- **Multilingual Support**: Supports English, Hindi, Tamil, and Telugu, allowing users to discuss their home designs in their native language.

### 🏠 Procedural 3D Exteriors & Rendering
- **Dynamic Architecture**: Generates highly realistic 3D building exteriors procedurally. It intelligently renders multi-pane reflective windows, transparent glass balcony railings, wood slatted cladding, and roof pergolas based on the floor plan dimensions.
- **Real-time Engine**: Built on React Three Fiber and Three.js, ensuring 60FPS performance even with complex shadows and hundreds of meshes.
- **Environmental Controls**: Includes an interactive day/night cycle slider that dynamically calculates sun position and directional shadow casting.

### 🌲 Interactive Landscape Decorator
- **Drag-and-Drop Landscaping**: Users can click to instantly drop 3D assets like Palm trees, Banyan trees, Shrubs, Vehicles, and Swimming Pools around their generated house.
- **Smart Plot Sizing**: Automatically adjusts the available land boundary and disables exterior decorations if the user selects "Apartment" mode.

### 📐 Smart Floor Plan Generation
- **Zero-Overlap Algorithm**: Features a custom geometric solver that procedurally generates and aligns rooms (Kitchen, Master Bedroom, Pooja Room, etc.) ensuring they snap together perfectly without intersecting.
- **Dynamic Scaling**: Adjusts room sizes based on the user's budget and total land area preferences.

### 📜 Export, Share, & CAD Integration
- **PDF Brochures**: Automatically generates beautiful, professional PDF brochures of the designed floor plan using `jspdf`, perfect for sharing with contractors or family.
- **DXF Export**: Exports raw structural vectors using `dxf-writer`, allowing the floor plans to be imported directly into professional CAD software like AutoCAD.

### 🧿 Dynamic Vastu Meter
- **Real-time Evaluation**: Evaluates Vastu doshas (energy faults) based on the current layout.
- **Actionable Feedback**: Returns a dynamic score out of 100 and color-coded suggestions (e.g., warning the user if the Kitchen is in the North-East instead of the South-East).

## 🛠️ Technology Stack

**Frontend**
* React.js (Vite)
* Three.js & React Three Fiber
* Tailwind CSS
* i18next
* jspdf & dxf-writer

**Backend**
* Node.js & Express
* Google Generative AI SDK (Gemini 1.5 Flash)
* Custom Procedural Fallback Engine (Hybrid Mode)
* MongoDB (Optional Cloud Persistence)

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key (Available for free from Google AI Studio)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ansika-Singh/Agni-AI.git
   cd Agni-AI
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   # Create a .env file and add: GEMINI_API_KEY=your_api_key_here
   npm start
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Launch:** Open your browser and navigate to `http://localhost:5174`.

## 🌍 Deployment Options

This application is fully container-ready. 
- **Backend Deployment**: Recommended on Render or Railway. Set the Root Directory to `backend`, set the Build Command to `npm install`, Start Command to `node server.js`, and add your `GEMINI_API_KEY` to the environment variables.
- **Frontend Deployment**: Recommended on Vercel or Netlify. Set the Root Directory to `frontend`, choose `Vite` as the framework, and add `VITE_BACKEND_URL` pointing to your deployed backend.
