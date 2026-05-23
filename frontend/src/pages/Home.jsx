import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PRESETS = {
  studio: {
    name: 'Studio Suite',
    img: '/preset_studio.png',
    prompt: 'Generate a Vastu-compliant Studio apartment with Southeast kitchen and Northeast entry.',
    vastuScore: 98,
    costEst: '₹14.2 Lakhs',
    deck: { x: 5, y: 35, w: 15, h: 25 },
    rooms: [
      { name: 'Living/Bed', x: 20, y: 20, w: 55, h: 55, dir: 'Center', color: 'rgba(78, 205, 196, 0.25)', border: '#4ecdc4' },
      { name: 'Bath', x: 75, y: 20, w: 20, h: 25, dir: 'Northwest', color: 'rgba(170, 59, 255, 0.25)', border: '#aa3bff' },
      { name: 'Kitchen', x: 75, y: 45, w: 20, h: 30, dir: 'Southeast', color: 'rgba(236, 72, 153, 0.25)', border: '#ec4899' }
    ],
    doors: [
      { rx: 35, ry: 20, dir: 'N', type: 'main', length: 2.2 },
      { rx: 75, ry: 25, dir: 'W', type: 'internal', length: 1.8 },
      { rx: 75, ry: 50, dir: 'W', type: 'internal', length: 1.8 },
      { rx: 20, ry: 40, dir: 'W', type: 'sliding', length: 3.5 }
    ],
    windows: [
      { rx: 20, ry: 25, dir: 'W', length: 2.5 },
      { rx: 50, ry: 20, dir: 'N', length: 3.0 },
      { rx: 85, ry: 20, dir: 'N', length: 1.5 },
      { rx: 85, ry: 75, dir: 'S', length: 2.0 }
    ]
  },
  '1bhk': {
    name: '1BHK Masterplan',
    img: '/preset_1bhk.png',
    prompt: 'Create a 1BHK structure, South-West bedroom, South-East fire kitchen and East-facing balcony.',
    vastuScore: 99,
    costEst: '₹22.5 Lakhs',
    rooms: [
      { name: 'Living Hall', x: 20, y: 20, w: 45, h: 55, dir: 'East', color: 'rgba(78, 205, 196, 0.25)', border: '#4ecdc4' },
      { name: 'Master Bed', x: 65, y: 20, w: 30, h: 30, dir: 'Southwest', color: 'rgba(69, 183, 209, 0.25)', border: '#45b7d1' },
      { name: 'Kitchen', x: 65, y: 50, w: 30, h: 25, dir: 'Southeast', color: 'rgba(236, 72, 153, 0.25)', border: '#ec4899' },
      { name: 'Toilet', x: 20, y: 75, w: 20, h: 20, dir: 'West', color: 'rgba(170, 59, 255, 0.25)', border: '#aa3bff' }
    ],
    doors: [
      { rx: 35, ry: 20, dir: 'N', type: 'main', length: 2.2 },
      { rx: 30, ry: 75, dir: 'N', type: 'internal', length: 1.8 },
      { rx: 65, ry: 25, dir: 'W', type: 'internal', length: 1.8 },
      { rx: 65, ry: 55, dir: 'W', type: 'internal', length: 1.8 }
    ],
    windows: [
      { rx: 20, ry: 40, dir: 'W', length: 3.0 },
      { rx: 80, ry: 20, dir: 'N', length: 2.5 },
      { rx: 95, ry: 30, dir: 'E', length: 2.0 },
      { rx: 95, ry: 60, dir: 'E', length: 2.0 },
      { rx: 80, ry: 75, dir: 'S', length: 2.0 },
      { rx: 20, ry: 85, dir: 'W', length: 1.2 }
    ]
  },
  '2bhk': {
    name: '2BHK Courtyard',
    img: '/preset_2bhk.png',
    prompt: 'Generate an ancestral 2BHK with a central Brahmasthan open courtyard, Northeast temple, and Southeast kitchen.',
    vastuScore: 100,
    costEst: '₹34.8 Lakhs',
    rooms: [
      { name: 'Living Hall', x: 15, y: 15, w: 25, h: 40, dir: 'Northeast', color: 'rgba(78, 205, 196, 0.25)', border: '#4ecdc4' },
      { name: 'Kitchen', x: 15, y: 55, w: 25, h: 30, dir: 'Southeast', color: 'rgba(236, 72, 153, 0.25)', border: '#ec4899' },
      { name: 'Pooja Mandir', x: 40, y: 15, w: 20, h: 20, dir: 'Northeast', color: 'rgba(219, 39, 119, 0.25)', border: '#db2777' },
      { name: 'Brahmasthan', x: 40, y: 35, w: 20, h: 20, dir: 'Center', color: 'rgba(255, 215, 0, 0.15)', border: '#ffd700' },
      { name: 'Common Bath', x: 40, y: 55, w: 20, h: 30, dir: 'Northwest', color: 'rgba(170, 59, 255, 0.25)', border: '#aa3bff' },
      { name: 'Master Bed', x: 60, y: 15, w: 25, h: 35, dir: 'Southwest', color: 'rgba(69, 183, 209, 0.25)', border: '#45b7d1' },
      { name: 'Kids Room', x: 60, y: 50, w: 25, h: 35, dir: 'Northwest', color: 'rgba(176, 196, 222, 0.25)', border: '#b0c4de' }
    ],
    doors: [
      { rx: 25, ry: 15, dir: 'N', type: 'main', length: 2.2 },
      { rx: 25, ry: 55, dir: 'N', type: 'internal', length: 1.8 },
      { rx: 50, ry: 35, dir: 'S', type: 'internal', length: 1.6 },
      { rx: 50, ry: 55, dir: 'N', type: 'internal', length: 1.8 },
      { rx: 60, ry: 25, dir: 'W', type: 'internal', length: 1.8 },
      { rx: 60, ry: 60, dir: 'W', type: 'internal', length: 1.8 }
    ],
    windows: [
      { rx: 15, ry: 30, dir: 'W', length: 3.0 },
      { rx: 15, ry: 70, dir: 'W', length: 2.0 },
      { rx: 25, ry: 85, dir: 'S', length: 2.0 },
      { rx: 50, ry: 15, dir: 'N', length: 1.5 },
      { rx: 50, ry: 85, dir: 'S', length: 1.2 },
      { rx: 72.5, ry: 15, dir: 'N', length: 2.2 },
      { rx: 85, ry: 30, dir: 'E', length: 2.0 },
      { rx: 85, ry: 65, dir: 'E', length: 2.0 },
      { rx: 72.5, ry: 85, dir: 'S', length: 2.2 }
    ]
  },
  '3bhk': {
    name: '3BHK Duplex Estate',
    img: '/preset_3bhk.png',
    prompt: 'Design a grand 3BHK Duplex, Southwest primary suite, double-height East lounge, Northeast pooja, and custom garage.',
    vastuScore: 99.2,
    costEst: '₹56.4 Lakhs',
    rooms: [
      { name: 'Grand Foyer', x: 15, y: 15, w: 20, h: 25, dir: 'North', color: 'rgba(176, 224, 230, 0.25)', border: '#afeeee' },
      { name: 'Premium Kitchen', x: 15, y: 40, w: 20, h: 30, dir: 'Southeast', color: 'rgba(236, 72, 153, 0.25)', border: '#ec4899' },
      { name: 'Powder Room', x: 15, y: 70, w: 20, h: 15, dir: 'West', color: 'rgba(170, 59, 255, 0.25)', border: '#aa3bff' },
      { name: 'Double Lounge', x: 35, y: 15, w: 30, h: 45, dir: 'East', color: 'rgba(78, 205, 196, 0.25)', border: '#4ecdc4' },
      { name: 'Pooja Dome', x: 35, y: 60, w: 15, h: 25, dir: 'Northeast', color: 'rgba(255, 215, 0, 0.25)', border: '#ffd700' },
      { name: 'Dining Room', x: 50, y: 60, w: 15, h: 25, dir: 'South', color: 'rgba(78, 205, 196, 0.15)', border: '#4ecdc4' },
      { name: 'Master Suite', x: 65, y: 15, w: 20, h: 35, dir: 'Southwest', color: 'rgba(69, 183, 209, 0.25)', border: '#45b7d1' },
      { name: 'Guest Room', x: 65, y: 50, w: 20, h: 35, dir: 'West', color: 'rgba(170, 59, 255, 0.25)', border: '#aa3bff' },
      { name: 'Master Bath', x: 85, y: 15, w: 10, h: 25, dir: 'Southwest', color: 'rgba(170, 59, 255, 0.25)', border: '#aa3bff' },
      { name: 'Guest Bath', x: 85, y: 50, w: 10, h: 25, dir: 'West', color: 'rgba(170, 59, 255, 0.25)', border: '#aa3bff' }
    ],
    doors: [
      { rx: 25, ry: 15, dir: 'N', type: 'main', length: 2.4 },
      { rx: 35, ry: 25, dir: 'E', type: 'sliding', length: 3.0 },
      { rx: 25, ry: 40, dir: 'N', type: 'internal', length: 1.8 },
      { rx: 25, ry: 70, dir: 'N', type: 'internal', length: 1.6 },
      { rx: 65, ry: 25, dir: 'W', type: 'internal', length: 1.8 },
      { rx: 85, ry: 25, dir: 'W', type: 'internal', length: 1.8 },
      { rx: 65, ry: 55, dir: 'W', type: 'internal', length: 1.8 },
      { rx: 85, ry: 60, dir: 'W', type: 'internal', length: 1.8 },
      { rx: 50, ry: 60, dir: 'N', type: 'sliding', length: 2.2 },
      { rx: 42.5, ry: 60, dir: 'N', type: 'internal', length: 1.6 }
    ],
    windows: [
      { rx: 15, ry: 25, dir: 'W', length: 2.0 },
      { rx: 15, ry: 55, dir: 'W', length: 2.5 },
      { rx: 15, ry: 78, dir: 'W', length: 1.0 },
      { rx: 50, ry: 15, dir: 'N', length: 5.0 },
      { rx: 42.5, ry: 85, dir: 'S', length: 1.5 },
      { rx: 57.5, ry: 85, dir: 'S', length: 2.0 },
      { rx: 75, ry: 15, dir: 'N', length: 2.2 },
      { rx: 85, ry: 30, dir: 'E', length: 2.0 },
      { rx: 85, ry: 65, dir: 'E', length: 2.0 },
      { rx: 75, ry: 85, dir: 'S', length: 2.2 },
      { rx: 95, ry: 25, dir: 'E', length: 1.2 },
      { rx: 95, ry: 62, dir: 'E', length: 1.2 }
    ]
  }
};

function getSegments(minVal, maxVal, overlaps) {
  overlaps.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const interval of overlaps) {
    if (merged.length === 0) {
      merged.push([interval[0], interval[1]]);
    } else {
      const last = merged[merged.length - 1];
      if (interval[0] <= last[1] + 0.1) {
        last[1] = Math.max(last[1], interval[1]);
      } else {
        merged.push([interval[0], interval[1]]);
      }
    }
  }
  
  const segments = [];
  let current = minVal;
  for (const interval of merged) {
    if (interval[0] > current + 0.1) {
      segments.push({ start: current, end: interval[0], isShared: false });
    }
    segments.push({ start: Math.max(minVal, interval[0]), end: Math.min(maxVal, interval[1]), isShared: true });
    current = interval[1];
  }
  if (current < maxVal - 0.1) {
    segments.push({ start: current, end: maxVal, isShared: false });
  }
  return segments;
}

function getWallSegmentsForRoom(room, allRooms) {
  const x = room.x;
  const y = room.y;
  const w = room.w;
  const h = room.h;

  const topOverlaps = [];
  const bottomOverlaps = [];
  const leftOverlaps = [];
  const rightOverlaps = [];

  for (const other of allRooms) {
    if (other.name === room.name && other.x === room.x && other.y === room.y) continue;
    
    if (Math.abs((other.y + other.h) - y) < 0.1) {
      const overlapStart = Math.max(x, other.x);
      const overlapEnd = Math.min(x + w, other.x + other.w);
      if (overlapEnd > overlapStart + 0.1) {
        topOverlaps.push([overlapStart, overlapEnd]);
      }
    }
    if (Math.abs(other.y - (y + h)) < 0.1) {
      const overlapStart = Math.max(x, other.x);
      const overlapEnd = Math.min(x + w, other.x + other.w);
      if (overlapEnd > overlapStart + 0.1) {
        bottomOverlaps.push([overlapStart, overlapEnd]);
      }
    }
    if (Math.abs((other.x + other.w) - x) < 0.1) {
      const overlapStart = Math.max(y, other.y);
      const overlapEnd = Math.min(y + h, other.y + other.h);
      if (overlapEnd > overlapStart + 0.1) {
        leftOverlaps.push([overlapStart, overlapEnd]);
      }
    }
    if (Math.abs(other.x - (x + w)) < 0.1) {
      const overlapStart = Math.max(y, other.y);
      const overlapEnd = Math.min(y + h, other.y + other.h);
      if (overlapEnd > overlapStart + 0.1) {
        rightOverlaps.push([overlapStart, overlapEnd]);
      }
    }
  }

  return {
    top: getSegments(x, x + w, topOverlaps),
    bottom: getSegments(x, x + w, bottomOverlaps),
    left: getSegments(y, y + h, leftOverlaps),
    right: getSegments(y, y + h, rightOverlaps)
  };
}

export default function Home() {
  const [selectedKey, setSelectedKey] = useState('2bhk');
  const [viewMode, setViewMode] = useState('3d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [drawProgress, setDrawProgress] = useState(0);

  const preset = PRESETS[selectedKey];

  useEffect(() => {
    // Initial load logs
    setLogs([
      `⚡ [AGNI AI ENGINE V2.4] STANDBY`,
      `👉 Select a preset above or click "Simulate CAD Draw" to draft a floorplan.`
    ]);

    let revealElements = [];

    // Intersection Observer for scroll-driven reveals (infinite reactive cycle)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    }, {
      threshold: 0.05, // Trigger when 5% of element is in view for maximum responsiveness
      rootMargin: '0px 0px -30px 0px' // Offset triggers slightly before rolling fully in
    });

    const timer = setTimeout(() => {
      revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const triggerDrafting = () => {
    setIsGenerating(true);
    setDrawProgress(0);
    setLogs([
      `⚡ [AGNI AI ENGINE V2.4] BOOTSTRAPPING GEOMETRY`,
      `🛰️ Parsing NLP instruction: "${preset.prompt}"`,
      `📐 Initializing layout bounding box subdivision...`
    ]);

    const steps = [
      { progress: 20, log: '🏗️ Subdivision phase 1: Resolving main structural coordinate limits...' },
      { progress: 40, log: `🏗️ Placing Primary Node: ${preset.rooms[0].name} placed at ${preset.rooms[0].dir} boundary.` },
      { progress: 60, log: `🏗️ Placing Secondary Nodes: ${preset.rooms.slice(1, 4).map(r => r.name).join(', ')} configured.` },
      { progress: 85, log: '🕉️ Running Vastu Shastra compliance metrics audit...' },
      { progress: 95, log: `🔥 Agni Node (Southeast): ${preset.rooms.some(r => r.dir === 'Southeast') ? '100% MATCH (Kitchen)' : 'Compliant'}` },
      { progress: 100, log: `📈 Estimate Generated: ${preset.costEst} with finish tier multiplier. Vastu Rating: ${preset.vastuScore}%!` }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setDrawProgress(step.progress);
        setLogs(prev => [...prev, step.log]);
        if (idx === steps.length - 1) {
          setIsGenerating(false);
        }
      }, (idx + 1) * 800);
    });
  };

  return (
    <div className="blueprint-grid" style={{
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
      color: '#ffffff'
    }}>
      
      {/* Decorative Glow Ambient Orbs */}
      <div className="glow-orb-pink" style={{ top: '10%', left: '-10%' }}></div>
      <div className="glow-orb-purple" style={{ top: '40%', right: '-10%' }}></div>
      <div className="glow-orb-pink" style={{ bottom: '15%', left: '20%' }}></div>

      {/* Full-bleed background image */}
      <div className="hero-full-bg" />

      {/* Behance White Capsule Navbar */}
      <header className="animate-header-entry" style={{
        maxWidth: '1150px',
        width: '92%',
        margin: '24px auto 0 auto',
        background: '#ffffff',
        borderRadius: '50px',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Left Side: Purple Logo Icon & Brand Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #aa3bff, #6b35ff)',
            boxShadow: '0 0 12px rgba(170, 59, 255, 0.4)'
          }}></div>
          <span style={{
            color: '#111111',
            fontWeight: 800,
            fontSize: '1.2rem',
            letterSpacing: '-0.02em'
          }}>Agni AI</span>
        </div>

        {/* Center: Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {['Product', 'Pricing', 'About'].map((link) => (
            <a key={link} href={`#${link.toLowerCase()}`} style={{
              color: '#4b5563',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => e.target.style.color = '#111111'}
            onMouseOut={(e) => e.target.style.color = '#4b5563'}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Right Side: Black Explore Pill Button */}
        <div>
          <Link to="/designer" style={{
            background: '#000000',
            color: '#ffffff',
            borderRadius: '50px',
            padding: '10px 24px',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-block',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#222222'}
          onMouseOut={(e) => e.target.style.background = '#000000'}
          >
            Explore
          </Link>
        </div>
      </header>

      {/* HERO SECTION - CENTERED DESIGN WITH SCALED COMPOSITED BACKGROUND */}
      <section id="product" style={{
        maxWidth: '1200px',
        width: '92%',
        margin: '0 auto',
        padding: '5rem 0 11rem 0', // Rich bottom padding to push content away from the torus
        position: 'relative',
        zIndex: 2,
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        
        {/* Hero Text Content (Centered, floating perfectly over the background graphic) */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.2vw, 4.4rem)',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: '1.15',
            letterSpacing: '-0.02em',
            marginBottom: '1.5rem',
            overflow: 'hidden'
          }}>
            <span className="animate-slide-up-word delay-100" style={{
              textShadow: '0 4px 18px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.8)'
            }}>Transform your ideas</span> <br/>
            <span className="animate-slide-up-word delay-300" style={{
              background: 'linear-gradient(135deg, #ffffff 15%, #ebd3f8 60%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
              paddingBottom: '0.12em',
              filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 20px rgba(236, 72, 153, 0.45))'
            }}>into amazing 3d designs</span>
          </h1>

          <p className="animate-fade-up-custom delay-500" style={{
            fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
            color: 'rgba(235, 211, 248, 0.95)',
            lineHeight: '1.65',
            maxWidth: '680px',
            margin: '0 auto 2.5rem auto',
            fontWeight: 500,
            textShadow: '0 3px 12px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.8)'
          }}>
            Seamless and intuitive platform for designing, modeling, and <br className="hide-mobile" />
            rendering stunning 3D environments and objects.
          </p>

          <div className="animate-fade-up-custom delay-700" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/designer" className="btn btn-primary btn-lg" style={{ 
              fontSize: '1rem', 
              padding: '14px 38px',
              background: '#ebd3f8',
              color: '#1c032d',
              borderRadius: '50px',
              fontWeight: 700,
              boxShadow: '0 8px 30px rgba(235, 211, 248, 0.3)',
              transition: 'all 0.2s ease-out'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.04)';
              e.target.style.boxShadow = '0 12px 35px rgba(235, 211, 248, 0.45)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 8px 30px rgba(235, 211, 248, 0.3)';
            }}
            >
              Explore
            </Link>
          </div>
        </div>
      </section>

      {/* STATS BAR SECTION */}
      <section className="stats-container" style={{ padding: '3.5rem 0' }}>
        <div style={{ maxWidth: '1200px', width: '92%', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            textAlign: 'center'
          }}>
            {[
              { val: '25,000+', lbl: 'CAD Floor Plans Generated' },
              { val: '99.2%', lbl: 'Vastu Compliance Rating' },
              { val: '1.8s', lbl: 'Average Generation Speed' },
              { val: 'Saved ₹25K+', lbl: 'Traditional Consultation Fees' }
            ].map((stat, i) => (
              <div key={i} className={`stat-glow-box reveal reveal-fade-up delay-${(i + 1) * 100}`}>
                <div style={{
                  fontSize: 'clamp(2rem, 3.5vw, 3rem)',
                  fontWeight: 800,
                  color: 'var(--color-fire-1)',
                  marginBottom: '6px',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-display)'
                }}>{stat.val}</div>
                <div style={{
                  fontSize: '0.88rem',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE ARCHITECTURE CRISIS - THE PROBLEM SECTION */}
      <section style={{
        maxWidth: '1200px',
        width: '92%',
        margin: '0 auto',
        padding: '7rem 0',
        zIndex: 2,
        position: 'relative'
      }}>
        <div className="reveal reveal-fade-up" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <span className="glass-pill-badge" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            ⚠️ The Challenge
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginTop: '1rem',
            marginBottom: '1rem'
          }}>Why is Designing Homes So Hard?</h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: '1.05rem',
            lineHeight: '1.6'
          }}>Traditional architectural blueprints are expensive, rigid, slow to generate, and disconnect you from construction realities.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem'
        }}>
          {[
            {
              icon: '💰',
              title: 'Exorbitant Fees',
              desc: 'Architects charge between ₹25,000 to ₹1,500,000 for standard floor plan iterations, making early layouts extremely costly.'
            },
            {
              icon: '🕉️',
              title: 'Ancient Vastu Violations',
              desc: '95% of self-made layouts fail traditional Vastu cardinal direction alignments, resulting in expensive demolition or heavy energy blocks.'
            },
            {
              icon: '📐',
              title: 'Flat 2D Disconnect',
              desc: 'Standard paper blueprints fail to convey spatial awareness. Homeowners struggle to visualize room heights, lighting, and spatial density.'
            },
            {
              icon: '📉',
              title: 'Contractor Cost Traps',
              desc: 'Lack of real-time material volume estimates allows local contractors to bloat budgets, resulting in an average of 40% cost overruns.'
            }
          ].map((prob, i) => (
            <div key={i} className={`crisis-card reveal reveal-fade-up delay-${(i + 1) * 100}`}>
              <div className="crisis-icon-wrapper">{prob.icon}</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.85rem' }}>{prob.title}</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>{prob.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE INTEGRATED SOLUTION HUB */}
      <section style={{
        background: 'rgba(10, 10, 15, 0.4)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '6rem 0'
      }}>
        <div style={{ maxWidth: '1200px', width: '92%', margin: '0 auto', textAlign: 'center' }}>
          <div className="reveal reveal-fade-up" style={{ marginBottom: '4rem' }}>
            <span className="glass-pill-badge" style={{ color: 'var(--color-purple)', borderColor: 'rgba(170, 59, 255, 0.3)' }}>
              💡 Our Ecosystem
            </span>
            <h2 style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 800,
              marginTop: '1rem',
              marginBottom: '1rem'
            }}>The Agni AI Architectural Hub</h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              fontSize: '1.05rem'
            }}>A unified CAD environment that weaves together spatial geometry, structural calculations, and Vastu criteria instantly.</p>
          </div>

          {/* Connected Hub Visual */}
          <div className="reveal reveal-fade-up" style={{
            position: 'relative',
            maxWidth: '750px',
            margin: '0 auto',
            height: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Center Node */}
            <div className="hub-center-glow" style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 0 30px rgba(236,72,153,0.4)'
            }}>
              <span style={{ fontSize: '1.8rem' }}>🔥</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Agni AI</span>
            </div>

            {/* Connecting Nodes (Left Column) */}
            <div style={{
              position: 'absolute',
              left: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              textAlign: 'right',
              zIndex: 6
            }}>
              {['📐 Interactive 3D Orbit', '🕉️ Real-time Vastu score', '📊 Contractor Estimations'].map((node, i) => {
                const floatClasses = ['animate-float-d1', 'animate-float-d2', 'animate-float-d3'];
                return (
                  <div 
                    key={i} 
                    className={floatClasses[i]}
                    style={{
                      background: 'rgba(20,20,28,0.85)',
                      border: '1px solid rgba(236, 72, 153, 0.25)',
                      padding: '10px 18px',
                      borderRadius: '30px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                      cursor: 'default',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-fire-1)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(236,72,153,0.4)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.25)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >{node}</div>
                );
              })}
            </div>

            {/* Connecting Nodes (Right Column) */}
            <div style={{
              position: 'absolute',
              right: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              textAlign: 'left',
              zIndex: 6
            }}>
              {['🗣️ Multilingual Voice Wizard', '⚡ CAD DXF / Vector PDF', '📱 Offline Layout Presets'].map((node, i) => {
                const floatClasses = ['animate-float-d4', 'animate-float-d5', 'animate-float-d6'];
                return (
                  <div 
                    key={i} 
                    className={floatClasses[i]}
                    style={{
                      background: 'rgba(20,20,28,0.85)',
                      border: '1px solid rgba(170, 59, 255, 0.25)',
                      padding: '10px 18px',
                      borderRadius: '30px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                      cursor: 'default',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-purple)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(170,59,255,0.4)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(170, 59, 255, 0.25)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >{node}</div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES DETAIL GRID */}
      <section id="features" style={{
        maxWidth: '1200px',
        width: '92%',
        margin: '0 auto',
        padding: '7rem 0',
        zIndex: 2,
        position: 'relative'
      }}>
        <div className="reveal reveal-fade-up" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <span className="glass-pill-badge" style={{ color: 'var(--color-fire-2)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
            🚀 Engine Capabilities
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginTop: '1rem',
            marginBottom: '1rem'
          }}>Everything You Need to Architect Your Sanctuary</h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: '1.05rem'
          }}>Comprehensive professional-grade features engineered for intuitive control and extreme precision.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2rem'
        }}>
          {[
            {
              icon: '📐',
              title: '3D WebGL Design Studio',
              desc: 'Seamlessly shift between top-down 2D blueprints, wireframe bounds, and fully immersive 3D orbits. Drag doors, windows, and customize walls on a live scaling viewport.',
              tag: 'WebGL Engine'
            },
            {
              icon: '🕉️',
              title: 'Vastu Shastra Compliance Engine',
              desc: 'Get an instantaneous cardinal direction breakdown of all rooms. Receives real-time advice to modify placement coordinates to ensure positive aura flow and compliance.',
              tag: 'Vastu Math'
            },
            {
              icon: '📊',
              title: 'Dynamic Indian Cost Estimator',
              desc: 'Calculates material values (cement, bricks, steel) and labor averages based on actual current Indian finishing rates. Toggle finish tiers to instantly match your budget.',
              tag: 'Live Analytics'
            },
            {
              icon: '🗣️',
              title: 'AI Conversational Voicebot',
              desc: 'Build, arrange, and edit floorplans hands-free in your regional language. Dictate commands like "Add a Southeast kitchen" and watch the blueprint shift instantly.',
              tag: 'Voice AI'
            },
            {
              icon: '⚡',
              title: 'Industrial PDF & DXF CAD Exporter',
              desc: 'Convert your generative layout into a standard vector PDF or a professional DXF drawing file, fully compatible with industry-standard CAD suites like AutoCAD and Revit.',
              tag: 'Production'
            },
            {
              icon: '📱',
              title: 'Offline Layout Preset Fallbacks',
              desc: 'Agni AI operates flawlessly in low-bandwidth rural locations. If network servers fluctuate, the application immediately falls back to localized, highly detailed pre-configured presets.',
              tag: 'Accessibility'
            }
          ].map((feat, i) => (
            <div key={i} className={`feature-card-premium reveal reveal-fade-up delay-${(i + 1) * 100}`}>
              <div className="feature-icon-wrapper">{feat.icon}</div>
              <span style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-fire-1)',
                textTransform: 'uppercase',
                background: 'rgba(236, 72, 153, 0.08)',
                padding: '4px 10px',
                borderRadius: '4px'
              }}>{feat.tag}</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.85rem', color: '#fff' }}>{feat.title}</h3>
              <p style={{ fontSize: '0.94rem', color: 'var(--color-text-secondary)', lineHeight: '1.65' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INTERACTIVE CAD BLUEPRINT GENERATOR SANDBOX */}
      <section id="sandbox" style={{
        maxWidth: '1000px',
        width: '92%',
        margin: '0 auto',
        padding: '0 0 7rem 0',
        zIndex: 2,
        position: 'relative'
      }}>
        <div className="reveal reveal-fade-up" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span className="glass-pill-badge" style={{ color: 'var(--color-purple)', borderColor: 'rgba(170, 59, 255, 0.3)' }}>
            🤖 AI Generator Sandbox
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginTop: '1rem',
            marginBottom: '1rem'
          }}>Try the Agni CAD Generator Sandbox</h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            maxWidth: '550px',
            margin: '0 auto',
            fontSize: '1.02rem'
          }}>Select a plan preset below and click the generate simulation trigger to see the Agni CAD engine compile and draft elements in real-time.</p>
        </div>

        {/* Sandbox UI Card */}
        <div className="sandbox-card reveal reveal-fade-up">
          {/* Header Controls */}
          <div style={{
            background: 'rgba(20, 20, 28, 0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Object.keys(PRESETS).map(key => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedKey(key);
                    setDrawProgress(0);
                    setLogs([
                      `⚡ [AGNI AI ENGINE V2.4] STANDBY`,
                      `👉 Selected: ${PRESETS[key].name}. Click "Simulate CAD Draw" to compile.`
                    ]);
                  }}
                  disabled={isGenerating}
                  style={{
                    background: selectedKey === key ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: selectedKey === key ? '1px solid var(--color-fire-1)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '30px',
                    padding: '8px 18px',
                    color: selectedKey === key ? '#fff' : 'var(--color-text-secondary)',
                    fontWeight: 700,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    fontSize: '0.88rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {PRESETS[key].name}
                </button>
              ))}
            </div>

            <button
              onClick={triggerDrafting}
              disabled={isGenerating}
              style={{
                background: 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))',
                border: 'none',
                borderRadius: '30px',
                padding: '10px 22px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isGenerating ? 'Drafting Blueprint...' : '⚙️ Simulate CAD Draw'}
            </button>
          </div>

          {/* Double Column: Blueprint View & Compilation logs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
            
            {/* Left: 2D Floor Plan Blueprint or Realistic 3D Render */}
            <div className="sandbox-canvas" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="sandbox-scan-line"></div>
              
              {/* Interactive View Mode Tabs (Replaces flat text with high-end controls) */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                gap: '4px',
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '3px',
                borderRadius: '30px',
                zIndex: 10
              }}>
                <button
                  onClick={() => setViewMode('3d')}
                  style={{
                    background: viewMode === '3d' ? 'var(--color-fire-1)' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '5px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🏠 Realistic 3D
                </button>
                <button
                  onClick={() => setViewMode('2d')}
                  style={{
                    background: viewMode === '2d' ? 'var(--color-fire-1)' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '5px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  📐 Blueprint 2D
                </button>
              </div>

              {/* Vastu score badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#ffd700',
                zIndex: 10
              }}>
                🕉️ Vastu: {preset.vastuScore}%
              </div>

              {/* Render dynamic realistic 3D image or room boxes depending on active mode */}
              {viewMode === '3d' ? (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#07070a'
                }}>
                  <img
                    src={preset.img}
                    alt={preset.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: isGenerating ? (0.2 + (drawProgress / 100) * 0.8) : 1,
                      filter: isGenerating ? `blur(${(1 - drawProgress / 100) * 10}px)` : 'none',
                      transition: 'all 0.4s ease-out'
                    }}
                  />
                  
                  {/* Real-time ray tracing rendering overlay during simulation */}
                  {isGenerating && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(236,72,153,0.3)',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      zIndex: 5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>🖥️ AI 3D Ray-Tracing Render...</span>
                      <span style={{ color: 'var(--color-fire-1)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {drawProgress}% Complete
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* AutoCAD-Level Detailed 2D Blueprint Canvas */
                <div style={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: '100%', 
                  background: '#090d16',
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  overflow: 'hidden'
                }}>
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 100 100" 
                    style={{ 
                      display: 'block',
                      fontFamily: "'Courier New', Courier, monospace"
                    }}
                  >
                    {/* CAD Grid System */}
                    <defs>
                      <pattern id="cadGrid" width="4" height="4" patternUnits="userSpaceOnUse">
                        <rect width="4" height="4" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="0.08" />
                      </pattern>
                      <pattern id="diagonalHatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(0, 243, 255, 0.15)" strokeWidth="0.8" />
                      </pattern>
                    </defs>

                    {/* Render Wooden Deck first (if defined in preset) */}
                    {preset.deck && (() => {
                      const isVisible = drawProgress >= 100 || !isGenerating;
                      if (!isVisible) return null;
                      return (
                        <g>
                          <rect 
                            x={preset.deck.x} 
                            y={preset.deck.y} 
                            width={preset.deck.w} 
                            height={preset.deck.h} 
                            fill="url(#diagonalHatch)" 
                            stroke="#ec4899" 
                            strokeWidth="0.4" 
                            strokeDasharray="2,1"
                          />
                          <text 
                            x={preset.deck.x + preset.deck.w / 2} 
                            y={preset.deck.y + preset.deck.h / 2} 
                            textAnchor="middle" 
                            fill="rgba(255, 255, 255, 0.7)" 
                            fontSize="1.8" 
                            fontWeight="700"
                          >
                            WOODEN DECK
                          </text>
                        </g>
                      );
                    })()}

                    {/* Room Layouts, Double Walls, CAD Symbols, Dimensions, & Furniture Blocks */}
                    {preset.rooms.map((room, idx) => {
                      const x = room.x;
                      const y = room.y;
                      const w = room.w;
                      const h = room.h;

                      const isVisible = drawProgress >= ((idx + 1) / preset.rooms.length) * 80;
                      const opacityVal = isGenerating ? (isVisible ? 1 : 0.15) : 1;
                      const scaleVal = isGenerating ? (isVisible ? 1 : 0.95) : 1;

                      // Area Calculation based on coordinate percentages (10m x 10m virtual house)
                      const physicalWidth = (w * 0.1).toFixed(2);
                      const physicalHeight = (h * 0.1).toFixed(2);
                      const areaSqM = (physicalWidth * physicalHeight).toFixed(1);

                      // Get contiguous walls segments (Interior partition vs Exterior double wall)
                      const walls = getWallSegmentsForRoom(room, preset.rooms);

                      return (
                        <g 
                          key={idx} 
                          style={{ 
                            opacity: opacityVal,
                            transform: `scale(${scaleVal})`,
                            transformOrigin: `${x + w/2}% ${y + h/2}%`,
                            transition: 'all 0.4s ease-out'
                          }}
                        >
                          {/* 1. ADJACENCY-AWARE WALL SECTIONS */}
                          {/* Top Wall */}
                          {walls.top.map((seg, sIdx) => (
                            seg.isShared ? (
                              <line key={`top-sh-${sIdx}`} x1={seg.start} y1={y} x2={seg.end} y2={y} stroke="#ec4899" strokeWidth="0.3" strokeDasharray="1.5,1.5" />
                            ) : (
                              <g key={`top-ex-${sIdx}`}>
                                <line x1={seg.start} y1={y} x2={seg.end} y2={y} stroke="#ec4899" strokeWidth="0.6" strokeLinecap="square" />
                                <line x1={seg.start + (seg.start === x ? 0.6 : 0)} y1={y + 0.6} x2={seg.end - (seg.end === x + w ? 0.6 : 0)} y2={y + 0.6} stroke="rgba(236, 72, 153, 0.45)" strokeWidth="0.25" strokeLinecap="square" />
                              </g>
                            )
                          ))}

                          {/* Bottom Wall */}
                          {walls.bottom.map((seg, sIdx) => (
                            seg.isShared ? (
                              <line key={`bot-sh-${sIdx}`} x1={seg.start} y1={y + h} x2={seg.end} y2={y + h} stroke="#ec4899" strokeWidth="0.3" strokeDasharray="1.5,1.5" />
                            ) : (
                              <g key={`bot-ex-${sIdx}`}>
                                <line x1={seg.start} y1={y + h} x2={seg.end} y2={y + h} stroke="#ec4899" strokeWidth="0.6" strokeLinecap="square" />
                                <line x1={seg.start + (seg.start === x ? 0.6 : 0)} y1={y + h - 0.6} x2={seg.end - (seg.end === x + w ? 0.6 : 0)} y2={y + h - 0.6} stroke="rgba(236, 72, 153, 0.45)" strokeWidth="0.25" strokeLinecap="square" />
                              </g>
                            )
                          ))}

                          {/* Left Wall */}
                          {walls.left.map((seg, sIdx) => (
                            seg.isShared ? (
                              <line key={`left-sh-${sIdx}`} x1={x} y1={seg.start} x2={x} y2={seg.end} stroke="#ec4899" strokeWidth="0.3" strokeDasharray="1.5,1.5" />
                            ) : (
                              <g key={`left-ex-${sIdx}`}>
                                <line x1={x} y1={seg.start} x2={x} y2={seg.end} stroke="#ec4899" strokeWidth="0.6" strokeLinecap="square" />
                                <line x1={x + 0.6} y1={seg.start + (seg.start === y ? 0.6 : 0)} x2={x + 0.6} y2={seg.end - (seg.end === y + h ? 0.6 : 0)} stroke="rgba(236, 72, 153, 0.45)" strokeWidth="0.25" strokeLinecap="square" />
                              </g>
                            )
                          ))}

                          {/* Right Wall */}
                          {walls.right.map((seg, sIdx) => (
                            seg.isShared ? (
                              <line key={`right-sh-${sIdx}`} x1={x + w} y1={seg.start} x2={x + w} y2={seg.end} stroke="#ec4899" strokeWidth="0.3" strokeDasharray="1.5,1.5" />
                            ) : (
                              <g key={`right-ex-${sIdx}`}>
                                <line x1={x + w} y1={seg.start} x2={x + w} y2={seg.end} stroke="#ec4899" strokeWidth="0.6" strokeLinecap="square" />
                                <line x1={x - 0.6} y1={seg.start + (seg.start === y ? 0.6 : 0)} x2={x - 0.6} y2={seg.end - (seg.end === y + h ? 0.6 : 0)} stroke="rgba(236, 72, 153, 0.45)" strokeWidth="0.25" strokeLinecap="square" />
                              </g>
                            )
                          ))}

                          {/* 2. DYNAMIC VECTOR CAD FURNITURE BLOCKS (Accurate vector blocks matching 3D) */}
                          {/* Bedroom Block (Bed, nightstands, lamps) */}
                          {(room.name.toLowerCase().includes('bed') || room.name.toLowerCase().includes('suite') || room.name.toLowerCase().includes('kids')) ? (
                            <g stroke="#ec4899" strokeWidth="0.22" fill="none">
                              <rect x={x + w*0.18} y={y + h*0.16} width={w*0.64} height={h*0.52} rx={0.5} />
                              <rect x={x + w*0.23} y={y + h*0.19} width={w*0.2} height={h*0.12} rx={0.3} />
                              <rect x={x + w*0.57} y={y + h*0.19} width={w*0.2} height={h*0.12} rx={0.3} />
                              <line x1={x + w*0.18} y1={y + h*0.42} x2={x + w*0.82} y2={y + h*0.42} />
                              <path d={`M ${x + w*0.18},${y + h*0.42} Q ${x + w*0.5},${y + h*0.48} ${x + w*0.82},${y + h*0.42}`} />
                              <rect x={x + w*0.04} y={y + h*0.16} width={w*0.1} height={h*0.12} strokeWidth="0.18" />
                              <rect x={x + w*0.86} y={y + h*0.16} width={w*0.1} height={h*0.12} strokeWidth="0.18" />
                              <circle cx={x + w*0.09} cy={y + h*0.22} r={Math.min(w,h)*0.03} stroke="#ffffff" strokeWidth="0.15" />
                              <circle cx={x + w*0.91} cy={y + h*0.22} r={Math.min(w,h)*0.03} stroke="#ffffff" strokeWidth="0.15" />
                            </g>
                          ) : null}

                          {/* Living Room Sofa & Coffee Table Lounge block */}
                          {(room.name.toLowerCase().includes('living') || room.name.toLowerCase().includes('hall') || room.name.toLowerCase().includes('lounge') || room.name.toLowerCase().includes('foyer')) ? (
                            <g stroke="#ec4899" strokeWidth="0.22" fill="none">
                              <path d={`M ${x + w*0.15},${y + h*0.8} L ${x + w*0.85},${y + h*0.8} L ${x + w*0.85},${y + h*0.45}`} strokeWidth="0.3" />
                              <rect x={x + w*0.15} y={y + h*0.74} width={w*0.06} height={h*0.06} strokeWidth="0.2" />
                              <rect x={x + w*0.79} y={y + h*0.45} width={w*0.06} height={h*0.06} strokeWidth="0.2" />
                              <line x1={x + w*0.38} y1={y + h*0.72} x2={x + w*0.38} y2={y + h*0.8} />
                              <line x1={x + w*0.62} y1={y + h*0.72} x2={x + w*0.62} y2={y + h*0.8} />
                              <rect x={x + w*0.22} y={y + h*0.25} width={w*0.5} height={h*0.42} stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.15" strokeDasharray="1,1" />
                              <rect x={x + w*0.32} y={y + h*0.32} width={w*0.3} height={h*0.25} rx={0.3} stroke="#ffffff" strokeWidth="0.22" />
                            </g>
                          ) : null}

                          {/* Kitchen Counter & Stove Range block */}
                          {room.name.toLowerCase().includes('kitchen') ? (
                            <g stroke="#ec4899" strokeWidth="0.22" fill="none">
                              <path d={`M ${x + w*0.15},${y + h*0.15} L ${x + w*0.85},${y + h*0.15} L ${x + w*0.85},${y + h*0.8}`} strokeWidth="0.35" />
                              <rect x={x + w*0.18} y={y + h*0.55} width={w*0.18} height={h*0.2} strokeWidth="0.25" />
                              <line x1={x + w*0.18} y1={y + h*0.65} x2={x + w*0.36} y2={y + h*0.65} />
                              <rect x={x + w*0.58} y={y + h*0.16} width={w*0.22} height={h*0.14} rx={0.1} strokeWidth="0.22" />
                              <circle cx={x + w*0.635} cy={y + h*0.23} r={Math.min(w,h)*0.035} stroke="#ffffff" strokeWidth="0.18" />
                              <circle cx={x + w*0.745} cy={y + h*0.23} r={Math.min(w,h)*0.035} stroke="#ffffff" strokeWidth="0.18" />
                              <circle cx={x + w*0.69} cy={y + h*0.27} r={0.3} fill="#ffffff" />
                              <rect x={x + w*0.32} y={y + h*0.16} width={w*0.18} height={h*0.14} rx={0.15} strokeWidth="0.22" />
                              <circle cx={x + w*0.41} cy={y + h*0.23} r={Math.min(w,h)*0.018} stroke="#ffffff" strokeWidth="0.15" />
                              <path d={`M ${x + w*0.41},${y + h*0.16} Q ${x + w*0.41},${y + h*0.2} ${x + w*0.41},${y + h*0.22}`} stroke="#ffffff" strokeWidth="0.15" />
                            </g>
                          ) : null}

                          {/* Bathroom Fixtures block */}
                          {(room.name.toLowerCase().includes('bath') || room.name.toLowerCase().includes('toilet')) ? (
                            <g stroke="#ec4899" strokeWidth="0.22" fill="none">
                              <rect x={x + w*0.2} y={y + h*0.2} width={w*0.24} height={h*0.16} rx={0.2} strokeWidth="0.22" />
                              <ellipse cx={x + w*0.32} cy={y + h*0.48} rx={w*0.08} ry={h*0.12} strokeWidth="0.22" />
                              <rect x={x + w*0.68} y={y + h*0.2} width={w*0.18} height={h*0.18} rx={0.3} strokeWidth="0.22" />
                              <circle cx={x + w*0.77} cy={y + h*0.29} r={Math.min(w,h)*0.03} stroke="#ffffff" strokeWidth="0.15" />
                              <line x1={x + w*0.77} y1={y + h*0.2} x2={x + w*0.77} y2={y + h*0.25} stroke="#ffffff" strokeWidth="0.15" />
                              <rect x={x + w*0.58} y={y + h*0.58} width={w*0.28} height={h*0.28} strokeWidth="0.22" />
                              <line x1={x + w*0.58} y1={y + h*0.58} x2={x + w*0.86} y2={y + h*0.86} stroke="rgba(255,255,255,0.15)" strokeWidth="0.18" />
                              <line x1={x + w*0.86} y1={y + h*0.58} x2={x + w*0.58} y2={y + h*0.86} stroke="rgba(255,255,255,0.15)" strokeWidth="0.18" />
                            </g>
                          ) : null}

                          {/* Central Courtyard stone layout (Brahmasthan) */}
                          {room.name.toLowerCase().includes('brahmasthan') ? (
                            <g stroke="#ec4899" strokeWidth="0.22" fill="none">
                              <circle cx={x + w*0.5} cy={y + h*0.5} r={w*0.36} strokeDasharray="0.6,0.6" />
                              <polygon points={`${x + w*0.5},${y + h*0.18} ${x + w*0.82},${y + h*0.5} ${x + w*0.5},${y + h*0.82} ${x + w*0.18},${y + h*0.5}`} />
                              <circle cx={x + w*0.5} cy={y + h*0.5} r={w*0.12} />
                              <path d={`M ${x + w*0.5},${y + h*0.5} L ${x + w*0.5},${y + h*0.32}`} strokeWidth="0.45" stroke="#ec4899" />
                            </g>
                          ) : null}

                          {/* Sacred Pooja Altar platform block */}
                          {room.name.toLowerCase().includes('pooja') ? (
                            <g stroke="#ec4899" strokeWidth="0.22" fill="none">
                              <circle cx={x + w*0.5} cy={y + h*0.5} r={w*0.3} />
                              <polygon points={`${x + w*0.5},${y + h*0.22} ${x + w*0.78},${y + h*0.5} ${x + w*0.5},${y + h*0.78} ${x + w*0.22},${y + h*0.5}`} />
                              <circle cx={x + w*0.5} cy={y + h*0.5} r={w*0.08} fill="#ec4899" />
                            </g>
                          ) : null}

                          {/* Dining Set Table and chairs block */}
                          {room.name.toLowerCase().includes('dining') ? (
                            <g stroke="#ec4899" strokeWidth="0.22" fill="none">
                              <rect x={x + w*0.25} y={y + h*0.2} width={w*0.5} height={h*0.6} rx={0.4} />
                              <rect x={x + w*0.32} y={y + h*0.06} width={w*0.12} height={h*0.1} rx={0.1} />
                              <rect x={x + w*0.56} y={y + h*0.06} width={w*0.12} height={h*0.1} rx={0.1} />
                              <rect x={x + w*0.32} y={y + h*0.84} width={w*0.12} height={h*0.1} rx={0.1} />
                              <rect x={x + w*0.56} y={y + h*0.84} width={w*0.12} height={h*0.1} rx={0.1} />
                            </g>
                          ) : null}

                          {/* 3. TECHNICAL TEXT LAYOUT (Clean, high-contrast monochrome labeling) */}
                          <text 
                            x={x + w/2} 
                            y={y + h*0.48} 
                            textAnchor="middle" 
                            fill="#ffffff" 
                            fontSize="2.1" 
                            fontWeight="800"
                            style={{ letterSpacing: '0.05em' }}
                          >
                            {room.name.toUpperCase()}
                          </text>
                          <text 
                            x={x + w/2} 
                            y={y + h*0.6} 
                            textAnchor="middle" 
                            fill="rgba(255, 255, 255, 0.5)" 
                            fontSize="1.6" 
                            fontWeight="700"
                          >
                            {room.dir}
                          </text>

                          {/* Area Calculation Tag */}
                          <text 
                            x={x + w/2} 
                            y={y + h*0.7} 
                            textAnchor="middle" 
                            fill="#ec4899" 
                            fontSize="1.5" 
                            fontWeight="600"
                          >
                            {areaSqM} m²
                          </text>

                          {/* 4. AUTO-CAD MEASUREMENT DIMENSION LINES */}
                          {/* Horizontal dimensions string */}
                          <g>
                            <line 
                              x1={x + 1.2} 
                              y1={y + h - 1.8} 
                              x2={x + w - 1.2} 
                              y2={y + h - 1.8} 
                              stroke="#ffffff" 
                              strokeWidth="0.15" 
                            />
                            <line x1={x + 1.2} y1={y + h - 2.2} x2={x + 1.5} y2={y + h - 1.4} stroke="#ffffff" strokeWidth="0.25" />
                            <line x1={x + w - 1.5} y1={y + h - 2.2} x2={x + w - 1.2} y2={y + h - 1.4} stroke="#ffffff" strokeWidth="0.25" />
                            <rect x={x + w/2 - 3.8} y={y + h - 2.5} width="7.6" height="1.4" fill="#090d16" stroke="rgba(255,255,255,0.2)" strokeWidth="0.1" rx="0.2" />
                            <text x={x + w/2} y={y + h - 1.5} textAnchor="middle" fill="#ffffff" fontSize="1.1" fontWeight="700">
                              L:{physicalWidth}m
                            </text>
                          </g>
                          {/* Vertical dimensions string */}
                          <g>
                            <line 
                              x1={x + 1.8} 
                              y1={y + 1.2} 
                              x2={x + 1.8} 
                              y2={y + h - 1.2} 
                              stroke="#ffffff" 
                              strokeWidth="0.15" 
                            />
                            <line x1={x + 1.4} y1={y + 1.2} x2={x + 2.2} y2={y + 1.5} stroke="#ffffff" strokeWidth="0.25" />
                            <line x1={x + 1.4} y1={y + h - 1.5} x2={x + 2.2} y2={y + h - 1.2} stroke="#ffffff" strokeWidth="0.25" />
                            <rect x={x + 0.3} y={y + h/2 - 0.7} width="7.6" height="1.4" fill="#090d16" stroke="rgba(255,255,255,0.2)" strokeWidth="0.1" rx="0.2" />
                            <text x={x + 4.1} y={y + h/2 + 0.3} textAnchor="middle" fill="#ffffff" fontSize="1.1" fontWeight="700">
                              W:{physicalHeight}m
                            </text>
                          </g>

                        </g>
                      );
                    })}

                    {/* 5. UNIFIED DOORS DRAFTER (WITH WALL MASKING) */}
                    {preset.doors && preset.doors.map((door, dIdx) => {
                      const { rx, ry, dir, type, length } = door;
                      const isVisible = drawProgress >= 85 || !isGenerating;
                      if (!isVisible) return null;

                      let maskX = rx, maskY = ry, maskW = length, maskH = 1.6;
                      if (dir === 'E' || dir === 'W') {
                        maskX = rx - 0.8;
                        maskY = ry;
                        maskW = 1.6;
                        maskH = length;
                      } else {
                        maskX = rx;
                        maskY = ry - 0.8;
                        maskW = length;
                        maskH = 1.6;
                      }

                      if (type === 'sliding') {
                        let panel1, panel2;
                        if (dir === 'N' || dir === 'S') {
                          panel1 = <rect x={rx} y={ry - 0.25} width={length / 2 + 0.2} height={0.2} fill="none" stroke="#ec4899" strokeWidth="0.18" />;
                          panel2 = <rect x={rx + length / 2 - 0.2} y={ry + 0.05} width={length / 2 + 0.2} height={0.2} fill="none" stroke="#ec4899" strokeWidth="0.18" />;
                        } else {
                          panel1 = <rect x={rx - 0.25} y={ry} width={0.2} height={length / 2 + 0.2} fill="none" stroke="#ec4899" strokeWidth="0.18" />;
                          panel2 = <rect x={rx + 0.05} y={ry + length / 2 - 0.2} width={0.2} height={length / 2 + 0.2} fill="none" stroke="#ec4899" strokeWidth="0.18" />;
                        }
                        return (
                          <g key={`door-${dIdx}`}>
                            <rect x={maskX} y={maskY} width={maskW} height={maskH} fill="#090d16" stroke="none" />
                            {panel1}
                            {panel2}
                            {dir === 'N' || dir === 'S' ? (
                              <>
                                <line x1={rx} y1={ry - 0.4} x2={rx} y2={ry + 0.4} stroke="#ffffff" strokeWidth="0.2" />
                                <line x1={rx + length} y1={ry - 0.4} x2={rx + length} y2={ry + 0.4} stroke="#ffffff" strokeWidth="0.2" />
                              </>
                            ) : (
                              <>
                                <line x1={rx - 0.4} y1={ry} x2={rx + 0.4} y2={ry} stroke="#ffffff" strokeWidth="0.2" />
                                <line x1={rx - 0.4} y1={ry + length} x2={rx + 0.4} y2={ry + length} stroke="#ffffff" strokeWidth="0.2" />
                              </>
                            )}
                          </g>
                        );
                      }

                      let doorLine, swingPath;
                      const strokeColor = type === 'main' ? '#ec4899' : '#fbcfe8';
                      const strokeWVal = type === 'main' ? '0.25' : '0.18';

                      if (dir === 'N') {
                        doorLine = <line x1={rx} y1={ry} x2={rx} y2={ry + length} stroke={strokeColor} strokeWidth={strokeWVal} />;
                        swingPath = <path d={`M ${rx + length},${ry} A ${length},${length} 0 0,1 ${rx},${ry + length}`} fill="none" stroke={strokeColor} strokeWidth="0.12" strokeDasharray="0.3,0.3" />;
                      } else if (dir === 'S') {
                        doorLine = <line x1={rx} y1={ry} x2={rx} y2={ry - length} stroke={strokeColor} strokeWidth={strokeWVal} />;
                        swingPath = <path d={`M ${rx + length},${ry} A ${length},${length} 0 0,0 ${rx},${ry - length}`} fill="none" stroke={strokeColor} strokeWidth="0.12" strokeDasharray="0.3,0.3" />;
                      } else if (dir === 'W') {
                        doorLine = <line x1={rx} y1={ry} x2={rx + length} y2={ry} stroke={strokeColor} strokeWidth={strokeWVal} />;
                        swingPath = <path d={`M ${rx},${ry + length} A ${length},${length} 0 0,0 ${rx + length},${ry}`} fill="none" stroke={strokeColor} strokeWidth="0.12" strokeDasharray="0.3,0.3" />;
                      } else if (dir === 'E') {
                        doorLine = <line x1={rx} y1={ry} x2={rx - length} y2={ry} stroke={strokeColor} strokeWidth={strokeWVal} />;
                        swingPath = <path d={`M ${rx},${ry + length} A ${length},${length} 0 0,1 ${rx - length},${ry}`} fill="none" stroke={strokeColor} strokeWidth="0.12" strokeDasharray="0.3,0.3" />;
                      }

                      return (
                        <g key={`door-${dIdx}`}>
                          <rect x={maskX} y={maskY} width={maskW} height={maskH} fill="#090d16" stroke="none" />
                          {dir === 'N' || dir === 'S' ? (
                            <>
                              <line x1={rx} y1={ry - 0.4} x2={rx} y2={ry + 0.4} stroke="#ffffff" strokeWidth="0.2" />
                              <line x1={rx + length} y1={ry - 0.4} x2={rx + length} y2={ry + 0.4} stroke="#ffffff" strokeWidth="0.2" />
                            </>
                          ) : (
                            <>
                              <line x1={rx - 0.4} y1={ry} x2={rx + 0.4} y2={ry} stroke="#ffffff" strokeWidth="0.2" />
                              <line x1={rx - 0.4} y1={ry + length} x2={rx + 0.4} y2={ry + length} stroke="#ffffff" strokeWidth="0.2" />
                            </>
                          )}
                          {doorLine}
                          {swingPath}
                        </g>
                      );
                    })}

                    {/* 6. UNIFIED WINDOWS DRAFTER (WITH WALL MASKING) */}
                    {preset.windows && preset.windows.map((win, wIdx) => {
                      const { rx, ry, dir, length } = win;
                      const isVisible = drawProgress >= 85 || !isGenerating;
                      if (!isVisible) return null;

                      let maskX = rx, maskY = ry, maskW = length, maskH = 1.6;
                      if (dir === 'E' || dir === 'W') {
                        maskX = rx - 0.8;
                        maskY = ry;
                        maskW = 1.6;
                        maskH = length;
                      } else {
                        maskX = rx;
                        maskY = ry - 0.8;
                        maskW = length;
                        maskH = 1.6;
                      }

                      return (
                        <g key={`win-${wIdx}`}>
                          <rect x={maskX} y={maskY} width={maskW} height={maskH} fill="#090d16" stroke="none" />
                          {dir === 'N' || dir === 'S' ? (
                            <>
                              <rect x={rx} y={ry - 0.3} width={length} height={0.6} fill="none" stroke="#ec4899" strokeWidth="0.2" />
                              <line x1={rx} y1={ry} x2={rx + length} y2={ry} stroke="#ffffff" strokeWidth="0.1" />
                              <line x1={rx} y1={ry - 0.3} x2={rx} y2={ry + 0.3} stroke="#ffffff" strokeWidth="0.2" />
                              <line x1={rx + length} y1={ry - 0.3} x2={rx + length} y2={ry + 0.3} stroke="#ffffff" strokeWidth="0.2" />
                            </>
                          ) : (
                            <>
                              <rect x={rx - 0.3} y={ry} width={0.6} height={length} fill="none" stroke="#ec4899" strokeWidth="0.2" />
                              <line x1={rx} y1={ry} x2={rx} y2={ry + length} stroke="#ffffff" strokeWidth="0.1" />
                              <line x1={rx - 0.3} y1={ry} x2={rx + 0.3} y2={ry} stroke="#ffffff" strokeWidth="0.2" />
                              <line x1={rx - 0.3} y1={ry + length} x2={rx + 0.3} y2={ry + length} stroke="#ffffff" strokeWidth="0.2" />
                            </>
                          )}
                        </g>
                      );
                    })}

                    {/* AutoCAD Corner Crosshair Cursor Visuals */}
                    <path d="M 2 2 L 6 2 M 2 2 L 2 6" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.2" />
                    <path d="M 98 2 L 94 2 M 98 2 L 98 6" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.2" />
                    <path d="M 2 98 L 6 98 M 2 98 L 2 94" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.2" />
                    <path d="M 98 98 L 94 98 M 98 98 L 98 94" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="0.2" />
                  </svg>

                  {/* CAD HUD Coordinate Info Panel overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '48px',
                    left: '12px',
                    background: 'rgba(9, 13, 22, 0.85)',
                    border: '1px solid rgba(0,240,255,0.2)',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    color: '#00f3ff',
                    fontFamily: 'monospace',
                    fontSize: '0.62rem',
                    textAlign: 'left',
                    pointerEvents: 'none',
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                  }}>
                    <div>⚡ MODEL SPACE [2D DRAFT]</div>
                    <div>🎯 SNAP: ON | GRID: ON</div>
                    <div>📍 CURSOR: X: 45.24 | Y: 22.81</div>
                    <div style={{ color: '#ffd700' }}>🕉️ COMPASS ALIGN: 100% compliant</div>
                  </div>

                  {/* Dynamic engineering stamp overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    border: '2px double rgba(0, 240, 255, 0.25)',
                    background: 'rgba(9, 13, 22, 0.9)',
                    color: '#00f3ff',
                    padding: '4px 8px',
                    fontFamily: 'monospace',
                    fontSize: '0.55rem',
                    borderRadius: '2px',
                    zIndex: 5,
                    textAlign: 'left',
                    pointerEvents: 'none',
                    letterSpacing: '0.05em'
                  }}>
                    <div>AGNI AI CAD ENGINE V2.4</div>
                    <div style={{ color: '#fff' }}>STATUS: VERIFIED PLAN</div>
                    <div>SCALE: 1:100 @ A3 SHEET</div>
                  </div>

                  {/* Bounding draft loader line */}
                  {isGenerating && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      height: '4px',
                      width: `${drawProgress}%`,
                      background: 'linear-gradient(90deg, #ec4899, #ffffff)',
                      transition: 'width 0.4s ease',
                      zIndex: 10
                    }}></div>
                  )}
                </div>
              )}

              {/* Bounding draft loader line */}
              {isGenerating && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '4px',
                  width: `${drawProgress}%`,
                  background: 'linear-gradient(90deg, #ec4899, #ffffff)',
                  transition: 'width 0.4s ease',
                  zIndex: 10
                }}></div>
              )}
            </div>

            {/* Right: Compilation Live log */}
            <div style={{
              background: '#0d0d14',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '380px'
            }}>
              <div>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  paddingBottom: '4px'
                }}>
                  🖥️ Agni CAD Engine Output Logs
                </div>
                
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  lineHeight: '1.5',
                  color: '#4ecdc4',
                  overflowY: 'auto',
                  maxHeight: '230px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {logs.map((log, i) => (
                    <div key={i} style={{
                      color: log.startsWith('⚡') ? '#ebd3f8' : log.startsWith('🕉️') ? '#ec4899' : log.startsWith('✅') ? '#4ecdc4' : '#ebd3f8'
                    }}>{log}</div>
                  ))}
                </div>
              </div>

              {/* Live Estimate Cost Footer in Logs */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Finish tier Cost</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffd700' }}>{preset.costEst}</div>
                </div>
                <Link
                  to="/designer"
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'none',
                    color: '#fff'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
                >
                  Edit in Studio →
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* TECH STACK SECTION */}
      <section style={{
        background: '#08080c',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '6.5rem 0',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1200px', width: '92%', margin: '0 auto' }}>
          <div className="reveal reveal-fade-up" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <span className="glass-pill-badge" style={{ color: 'var(--color-fire-1)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
              🛠️ SYSTEM INFRASTRUCTURE
            </span>
            <h2 style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 800,
              marginTop: '1rem',
              marginBottom: '1rem'
            }}>Precision CAD Tech Stack</h2>
            <p style={{
              color: 'var(--color-text-secondary)',
              maxWidth: '600px',
              margin: '0 auto',
              fontSize: '1.05rem'
            }}>High-performance modern frameworks built to power zero-latency 3D structural compilations and CAD processing.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.75rem'
          }}>
            {[
              {
                title: 'High-Fidelity Frontend',
                items: ['React.js (SPA Core)', 'Three.js / WebGL Rendering', 'React Three Fiber (R3F)', 'Web Speech Recognition API']
              },
              {
                title: 'Performant Backend',
                items: ['Node.js + Express', 'RESTful API endpoints', 'Vastu Compilers Core', 'JWT Secure Authentication']
              },
              {
                title: 'AI & Geometry Math',
                items: ['Geometric Subdivision algorithms', 'Cardinal Orientation matrices', 'NLP Custom Speech Voice parser', 'Cost Projection engine']
              },
              {
                title: 'Database & Exporters',
                items: ['Vector DXF Exporters', 'jsPDF layout generators', 'MongoDB Atlas cloud data', 'HTML5 canvas extractors']
              }
            ].map((col, i) => (
              <div key={i} className={`tech-col-premium reveal reveal-fade-up delay-${(i + 1) * 100}`} style={{ textAlign: 'left' }}>
                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--color-fire-2)',
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: '8px'
                }}>{col.title}</h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {col.items.map((item, idx) => (
                    <li key={idx} style={{
                      fontSize: '0.9rem',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: 'var(--color-fire-1)', fontSize: '0.8rem' }}>⚡</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM RELEVANT PRICING SECTION */}
      <section id="pricing" style={{
        maxWidth: '1200px',
        width: '92%',
        margin: '0 auto',
        padding: '7rem 0',
        zIndex: 2,
        position: 'relative'
      }}>
        <div className="reveal reveal-fade-up" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <span className="glass-pill-badge" style={{ color: 'var(--color-fire-1)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
            💰 Transparent Pricing
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginTop: '1rem',
            marginBottom: '1rem'
          }}>Flexible Plans Built for Every Scale</h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: '1.05rem'
          }}>Start drafting for free or unlock AutoCAD-level DXF exports and deep Vastu compliance scoring.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'stretch'
        }}>
          {[
            {
              name: 'Starter Plan',
              price: '₹0',
              period: 'Free Forever',
              desc: 'Perfect for individual homeowners looking to draft a simple floor plan layout.',
              features: [
                'Live 3D & 2D Designer Canvas',
                'Access to Studio & 1BHK presets',
                'Basic room placement tools',
                'Standard Vastu compass readout',
                'Web-shareable design links'
              ],
              cta: 'Start Designing',
              link: '/designer',
              popular: false
            },
            {
              name: 'Pro Architect',
              price: '₹2,499',
              period: '/month',
              desc: 'For independent architects and designers seeking professional CAD integration.',
              features: [
                'Unlimited projects and custom presets',
                'AutoCAD-level DXF vector exporter',
                'High-fidelity vector PDF stamp exporter',
                'Complete Vastu Compliance scoring needle',
                'Indian Cost estimation panel (Finishing tiers)',
                '1-click co-branded blueprint exports'
              ],
              cta: 'Unlock Pro drafting',
              link: '/designer',
              popular: true
            },
            {
              name: 'Enterprise Developer',
              price: 'Custom',
              period: 'Tailored pricing',
              desc: 'For real estate developers, builder groups, and custom enterprise requirements.',
              features: [
                'Custom voice bot NLP integration',
                'Unlimited multi-floor design stacks',
                'Dedicated cloud project database hosting',
                'Enterprise-grade team sharing workspaces',
                'Priority API access to Vastu logic',
                '24/7 Dedicated Architectural engineering support'
              ],
              cta: 'Contact Builder Sales',
              link: 'mailto:builders@agni.ai',
              popular: false
            }
          ].map((plan, i) => (
            <div key={i} className={`pricing-card-premium ${plan.popular ? 'popular' : ''} reveal reveal-fade-up delay-${(i + 1) * 150}`}>
              {plan.popular && (
                <span style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding: '6px 16px',
                  borderRadius: '30px',
                  boxShadow: '0 4px 15px rgba(236,72,153,0.4)',
                  zIndex: 10
                }}>Most Popular</span>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>{plan.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem', minHeight: '40px' }}>{plan.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: 900, color: 'white' }}>{plan.price}</span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{plan.period}</span>
                  </div>
                  
                  <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem' }} />
                  
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2.5rem' }}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--color-text)' }}>
                        <span style={{ 
                          color: 'var(--color-fire-1)', 
                          background: 'rgba(236,72,153,0.1)', 
                          width: '18px', 
                          height: '18px', 
                          borderRadius: '50%', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 'bold'
                        }}>✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link to={plan.link} className="btn" style={{
                  width: '100%',
                  background: plan.popular ? 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))' : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  padding: '0.85rem 0',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  textAlign: 'center',
                  boxShadow: plan.popular ? '0 8px 25px rgba(236,72,153,0.3)' : 'none',
                  textDecoration: 'none'
                }}>
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM SECTION - PREMIUM "PIXEL PIRATES" */}
      <section id="about" style={{
        maxWidth: '1200px',
        width: '92%',
        margin: '0 auto',
        padding: '7rem 0',
        position: 'relative',
        zIndex: 2
      }}>
        <div className="reveal reveal-fade-up" style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <span className="glass-pill-badge" style={{ color: 'var(--color-purple)', borderColor: 'rgba(170, 59, 255, 0.3)' }}>
            👥 The Creators
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            marginTop: '1rem',
            marginBottom: '1rem'
          }}>Built by Team Pixel Pirates</h2>
          <p style={{
            color: 'var(--color-text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: '1.05rem'
          }}>Two passionate developers pushing WebGL, speech AI, and CAD calculations to the next level.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '3rem',
          maxWidth: '960px',
          margin: '0 auto'
        }}>
          {/* Card 1: Ansika Singh */}
          <div className="team-card-premium reveal reveal-fade-up delay-100">
            <div className="team-avatar-premium team-avatar-glow-1">AS</div>
            <span className="team-role-badge">Lead CAD Architect & AI Systems Engineer</span>
            <div className="team-affiliation-text">
              <span>🎓</span> Cambridge Institute of Technology
            </div>
            <p className="team-desc-text">
              Pioneered the WebGL vector mathematics engine, coordinate room boundary subdivision algorithms, conversational voice recognition parser, and real-time Vastu shastra cardinal matrix rules.
            </p>
            <div style={{ textAlign: 'left', marginTop: '1.5rem' }}>
              {['WebGL room geometry', 'Wall subdivision math', 'Vastu compilation engine', 'Speech recognition'].map((item, idx) => (
                <span key={idx} className="team-role-item">{item}</span>
              ))}
            </div>
          </div>

          {/* Card 2: Bishnu Kumar Sardar */}
          <div className="team-card-premium reveal reveal-fade-up delay-300">
            <div className="team-avatar-premium team-avatar-glow-2">BK</div>
            <span className="team-role-badge">Lead Frontend Designer & Cost Analyst</span>
            <div className="team-affiliation-text">
              <span>🎓</span> Cambridge Institute of Technology
            </div>
            <p className="team-desc-text">
              Architected the immersive dark glassmorphic user interface, responsive canvas dashboard, live contractor estimator matrices covering all Indian finishes, and vector DXF/PDF vector blueprint export pipelines.
            </p>
            <div style={{ textAlign: 'left', marginTop: '1.5rem' }}>
              {['Dark glassmorphism system', 'PDF/DXF export pipelines', 'Indian contractor estimation database'].map((item, idx) => (
                <span key={idx} className="team-role-item">{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Team banner */}
        <div className="team-name-banner-premium">
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>🏴‍☠️ Team Pixel Pirates</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Navigating code oceans to build architectural solutions that empower homeowners
          </p>
        </div>
      </section>

      {/* FINAL LANDING PAGE FOOTER */}
      <footer style={{
        background: '#040406',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '5rem 0 3.5rem 0',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ maxWidth: '1200px', width: '92%', margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #aa3bff, #6b35ff)',
              boxShadow: '0 0 10px rgba(170, 59, 255, 0.4)'
            }}></div>
            <span style={{
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.3rem',
              letterSpacing: '-0.02em'
            }}>Agni AI</span>
          </div>

          <p style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.95rem',
            maxWidth: '500px',
            margin: '0 auto 2.5rem auto',
            lineHeight: '1.6'
          }}>
            The state-of-the-art Generative AI Floor Planner that bridges traditional Indian construction parameters and real-time WebGL CAD modeling.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            marginBottom: '3rem',
            flexWrap: 'wrap'
          }}>
            {['Product', 'Pricing', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#fff'}
              onMouseOut={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              >
                {item}
              </a>
            ))}
            <Link to="/designer" style={{
              color: 'var(--color-fire-1)',
              fontSize: '0.9rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.color = '#fff'}
            onMouseOut={(e) => e.target.style.color = 'var(--color-fire-1)'}
            >
              Launch Studio
            </Link>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '2.5rem',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <p>© 2026 Agni AI by Team Pixel Pirates — Ansika Singh & Bishnu Kumar Sardar | Cambridge Institute of Technology</p>
            <p style={{ maxWidth: '750px', margin: '0 auto', lineHeight: '1.5' }}>
              Built with ❤️ in India. Dedicated to empowering homeowners and simplifying CAD floor plan design using generative AI, complete Vastu Shastra rules, and real-time local finishing estimates.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
