# 🔥 Agni AI - Intelligent Architecture & Vastu Assistant

Agni AI is an advanced, fully interactive 3D architectural visualization and interior design application. It empowers users to instantly generate fully-furnished 2D floor plans, interact with beautiful real-time 3D environments, and converse with a specialized AI architect to validate Vastu compliance.

![Agni AI Interface](frontend/public/agni_hero.png)

## ✨ Key Features

* **🤖 Agni Voicebot Assistant**: Speak naturally to the AI! Built with the Web Speech API and powered by Google Gemini 1.5, the assistant understands context, provides Vastu-shastra validation, and offers actionable interior design tips.
* **🏠 Procedural 3D Exteriors**: Generate highly realistic 3D building exteriors with multi-pane reflective windows, glass railings, wood slatted cladding, and procedural pergolas.
* **🌲 Interactive Landscape Decorator**: Click to drop trees (Palms, Banyans, Pines), vehicles, flower beds, and swimming pools in real-time. Includes an interactive day/night cycle slider with dynamic sun shadows.
* **📐 Smart Floor Plans**: Procedural auto-generation of zero-overlap floor plans. Users can specify land area, budget, and storeys. 
* **📜 Export & Share**: Generate beautiful professional PDF brochures of the designed floor plan using `jspdf`, or export raw structural vectors using `dxf-writer` for CAD software.
* **🧿 Vastu Meter**: Real-time evaluation of Vastu doshas (energy faults) based on the layout, returning a dynamic score and color-coded suggestions.

## 🛠️ Technology Stack

**Frontend (Vite + React)**
* **Three.js & React Three Fiber**: Powers the entire 3D rendering pipeline (lights, shadows, meshes, procedural geometry).
* **Tailwind CSS**: For glassmorphic, ultra-modern UI styling.
* **i18next**: For seamless multi-language support.

**Backend (Node.js + Express)**
* **Google Gemini 1.5 API**: Deeply integrated for intelligent architectural dialogue and JSON-based Vastu scoring.
* **Hybrid Mode**: Fallback procedural template engine ensures the app functions perfectly even without an active AI connection.
* **MongoDB (Optional)**: Cloud persistence for saving user designs.

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key

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
   # Create a .env file and add your GEMINI_API_KEY
   npm start
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5174`.

## 🌍 Deployment
This application is fully container-ready. It is recommended to deploy the backend via Render or Railway, and deploy the Vite frontend via Vercel or Netlify.
