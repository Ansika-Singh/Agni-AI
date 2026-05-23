import { useState, useEffect } from 'react';

export default function VastuMeter({ data }) {
  const [activeTab, setActiveTab] = useState('score'); // 'score', 'analysis', 'remedies'
  const [appliedRemedies, setAppliedRemedies] = useState(new Set());
  const [pulsing, setPulsing] = useState(false);
  const [compassAngle, setCompassAngle] = useState(0);

  // Trigger pulse animation and rotate compass on score update
  useEffect(() => {
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 800);
    // Dynamic slight rotation change based on the score to represent active energetic re-orientation
    if (data?.score) {
      setCompassAngle((data.score * 3.6) % 360);
    }
    return () => clearTimeout(t);
  }, [data?.score]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center" style={{ minHeight: '280px', fontFamily: 'Outfit, sans-serif' }}>
        <div className="spinner mb-3" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></div>
        <p className="text-secondary text-xs font-semibold uppercase tracking-wider">Analyzing Vastu Geometry...</p>
      </div>
    );
  }

  const { score: baseScore, grade: baseGrade, suggestions } = data;

  // Gamified compliance: applying remedies boosts the layout score reactively
  const displayScore = Math.min(100, baseScore + appliedRemedies.size * 5);
  
  // Custom premium grades with glowing markers
  let displayGrade = 'Fair 🔧';
  if (displayScore >= 85) displayGrade = 'Excellent ✨';
  else if (displayScore >= 70) displayGrade = 'Good 👍';

  const getScoreColor = (val = displayScore) => {
    if (val >= 80) return '#00e676'; // Emerald compliant green
    if (val >= 60) return '#ffb347'; // Warm amber warning
    return '#ff5252'; // Fire red critical
  };

  const getZoneMeta = (dir) => {
    const d = dir ? dir.toUpperCase() : '';
    if (d === 'NE') return { element: 'Water', name: 'Ishaan (Divine)', color: '#60a5fa', icon: '❄️' };
    if (d === 'SE') return { element: 'Fire', name: 'Agni (Fire)', color: '#f97316', icon: '🔥' };
    if (d === 'SW') return { element: 'Earth', name: 'Nairutya (Stability)', color: '#84cc16', icon: '🪵' };
    if (d === 'NW') return { element: 'Air', name: 'Vayu (Wind)', color: '#06b6d4', icon: '🌪️' };
    if (d === 'N') return { element: 'Water', name: 'Wealth (Kubera)', color: '#60a5fa', icon: '💧' };
    if (d === 'E') return { element: 'Solar', name: 'Health (Indra)', color: '#ffd700', icon: '☀️' };
    if (d === 'S') return { element: 'Fire', name: 'Yama (Decline)', color: '#ef4444', icon: '🔥' };
    if (d === 'W') return { element: 'Space', name: 'Varun (Water)', color: '#a855f7', icon: '🌌' };
    return { element: 'Space', name: 'Akash (Brahmasthan)', color: '#d1d5db', icon: '✦' };
  };

  const getRemedyAdvice = (room, dir) => {
    const rName = room.toLowerCase();
    
    if (rName.includes('kitchen')) {
      return {
        title: "Agni (Fire) Crystal Balance",
        remedy: "Place a small copper pyramid or a brass bowl of yellow rice in the kitchen's South-East corner to balance the Fire element.",
        color: "#f97316",
        icon: "🔥"
      };
    }
    if (rName.includes('pooja')) {
      return {
        title: "Ishaan (Divine) Water Pot",
        remedy: "Keep a copper pot filled with Ganga Jal (sacred water) and fresh camphor pieces in the North-East sector to attract positive flow.",
        color: "#60a5fa",
        icon: "🕉️"
      };
    }
    if (rName.includes('bedroom')) {
      return {
        title: "Nairutya (Earth) Stability Weight",
        remedy: "Place a heavy brass item or a dark amethyst cluster in the South-West corner of the master bedroom. Ensure bed head points South.",
        color: "#84cc16",
        icon: "🪵"
      };
    }
    if (rName.includes('bathroom') || rName.includes('bath') || rName.includes('toilet')) {
      return {
        title: "Vayu (Air) Sea-Salt Purifier",
        remedy: "Place a glass bowl containing natural unrefined sea-salt crystals in the bathroom corner. Replace every Saturday to neutralize moisture toxins.",
        color: "#06b6d4",
        icon: "🌪️"
      };
    }
    return {
      title: "Universal Vastu Crystal Harmonizer",
      remedy: "Hang an octagonal crystal pendulum near the center of the room to diffuse colliding energies and promote peace.",
      color: "#ffd700",
      icon: "💎"
    };
  };

  const misalignedRooms = suggestions ? suggestions.filter(s => s.status !== 'good') : [];

  const handleToggleRemedy = (idx) => {
    const updated = new Set(appliedRemedies);
    if (updated.has(idx)) {
      updated.delete(idx);
    } else {
      updated.add(idx);
    }
    setAppliedRemedies(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Integrated Instrument Header - Flush & Borderless */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <span style={{ fontSize: '1.1rem', animation: 'spin 30s linear infinite' }}>🧭</span> Vastu Shastra Advisor
        </h3>
        <span 
          style={{
            background: displayScore >= 80 ? 'rgba(0, 230, 118, 0.12)' : displayScore >= 60 ? 'rgba(255, 179, 71, 0.12)' : 'rgba(255, 82, 82, 0.12)',
            color: getScoreColor(displayScore),
            border: `1px solid ${getScoreColor(displayScore)}35`,
            padding: '3px 9px',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: `0 0 12px ${getScoreColor(displayScore)}22`
          }}
        >
          {displayGrade}
        </span>
      </div>

      {/* High-End Tab Selectors - Glassmorphic Pill Capsule */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '3px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          padding: '3px', 
          borderRadius: '10px', 
          border: '1px solid rgba(255, 255, 255, 0.04)' 
        }}
      >
        {[
          { key: 'score', label: 'Score Meter' },
          { key: 'analysis', label: 'Zone Analysis' },
          { key: 'remedies', label: `Remedies ${misalignedRooms.length > 0 ? `(${misalignedRooms.length - appliedRemedies.size})` : ''}` }
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(219,39,119,0.15))' : 'transparent',
                color: isActive ? 'white' : 'var(--color-text-secondary)',
                border: isActive ? '1px solid rgba(236,72,153,0.3)' : '1px solid transparent',
                borderRadius: '8px',
                padding: '6px 2px',
                fontSize: '0.72rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isActive ? '0 2px 10px rgba(236,72,153,0.08)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Content Panels */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '190px', justifyContent: 'center' }}>
        
        {/* SCORE METER PANEL - FULL HOLOGRAPHIC COMPASS INSTRUMENT */}
        {activeTab === 'score' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* The Navigational Dial Outer Frame */}
            <div 
              style={{
                position: 'relative',
                width: '170px',
                height: '170px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 17, 28, 0.95) 0%, rgba(9, 10, 16, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.95), 0 10px 40px rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0.25rem auto'
              }}
            >
              
              {/* Complex SVG Radar Dial & Degree Ticks */}
              <svg 
                style={{ 
                  position: 'absolute',
                  top: '-5px', 
                  left: '-5px',
                  width: '180px',
                  height: '180px',
                  pointerEvents: 'none'
                }} 
                viewBox="0 0 120 120"
              >
                {/* Circular tick marks (instrument-style dots) */}
                <circle 
                  cx="60" cy="60" r="54" 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="0.8" 
                  strokeDasharray="2 3"
                />
                
                {/* Degree tick lines around the inner face */}
                <circle 
                  cx="60" cy="60" r="51" 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.03)" 
                  strokeWidth="1.5" 
                  strokeDasharray="0.5 4"
                />

                {/* Inner coordinate grid lines (cosmic alignment axes) */}
                <line x1="60" y1="9" x2="60" y2="111" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.5" />
                <line x1="9" y1="60" x2="111" y2="60" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.5" />
                
                {/* Active Glowing Score Sweeper Arc */}
                <circle 
                  cx="60" cy="60" r="54" 
                  fill="none" 
                  stroke={getScoreColor(displayScore)} 
                  strokeWidth="2.5"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - displayScore / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ 
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.8s ease',
                    filter: `drop-shadow(0 0 8px ${getScoreColor(displayScore)}aa)`
                  }}
                />

                {/* High-Fidelity SVG Compass Star Rose (Rotates on score changes) */}
                <g 
                  transform={`rotate(${compassAngle} 60 60)`} 
                  style={{ 
                    transition: 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: 0.18
                  }}
                >
                  {/* North pointer (Pink) */}
                  <polygon points="60,20 57,60 60,57" fill="#ec4899" />
                  <polygon points="60,20 63,60 60,57" fill="#ebd3f8" />
                  {/* South pointer (Red) */}
                  <polygon points="60,100 57,60 60,63" fill="#ef4444" />
                  <polygon points="60,100 63,60 60,63" fill="#ff8a8a" />
                  {/* East pointer (Gold) */}
                  <polygon points="100,60 60,57 63,60" fill="#ffd700" />
                  <polygon points="100,60 60,63 63,60" fill="#ffe57f" />
                  {/* West pointer (Purple) */}
                  <polygon points="20,60 60,57 57,60" fill="#a855f7" />
                  <polygon points="20,60 60,63 57,60" fill="#d6a4ff" />
                </g>
              </svg>

              {/* Floating Cardinal Directions in Elemental Theme Colors */}
              <div style={{ position: 'absolute', top: '10px', fontSize: '9px', fontWeight: '800', color: '#60a5fa', opacity: 0.8, letterSpacing: '0.5px' }}>N</div>
              <div style={{ position: 'absolute', right: '12px', fontSize: '9px', fontWeight: '800', color: '#ffd700', opacity: 0.8, letterSpacing: '0.5px' }}>E</div>
              <div style={{ position: 'absolute', bottom: '10px', fontSize: '9px', fontWeight: '800', color: '#ef4444', opacity: 0.8, letterSpacing: '0.5px' }}>S</div>
              <div style={{ position: 'absolute', left: '12px', fontSize: '9px', fontWeight: '800', color: '#a855f7', opacity: 0.8, letterSpacing: '0.5px' }}>W</div>

              {/* Floating Ordinal directions (small indicators) */}
              <div style={{ position: 'absolute', top: '24px', right: '28px', fontSize: '7px', fontWeight: '700', color: 'rgba(255,255,255,0.25)' }}>NE</div>
              <div style={{ position: 'absolute', bottom: '24px', right: '28px', fontSize: '7px', fontWeight: '700', color: 'rgba(255,255,255,0.25)' }}>SE</div>
              <div style={{ position: 'absolute', bottom: '24px', left: '28px', fontSize: '7px', fontWeight: '700', color: 'rgba(255,255,255,0.25)' }}>SW</div>
              <div style={{ position: 'absolute', top: '24px', left: '28px', fontSize: '7px', fontWeight: '700', color: 'rgba(255,255,255,0.25)' }}>NW</div>

              {/* Central Glowing Digital Readings */}
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  zIndex: 2,
                  transform: pulsing ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div 
                  style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 900, 
                    lineHeight: 1, 
                    fontFamily: 'Outfit, sans-serif',
                    color: getScoreColor(displayScore),
                    textShadow: `0 0 18px ${getScoreColor(displayScore)}77`,
                    letterSpacing: '-0.5px'
                  }}
                >
                  {displayScore}%
                </div>
                <div 
                  style={{ 
                    fontSize: '7.5px', 
                    fontWeight: '800', 
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    marginTop: '5px',
                    opacity: 0.65
                  }}
                >
                  Compliance
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ZONE ANALYSIS PANEL - HIGH TECH TELEMETRY ITEMS */}
        {activeTab === 'analysis' && (
          <div className="animate-fade-in scroll-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', paddingRight: '4px', overflowY: 'auto' }}>
            {suggestions && suggestions.map((sugg, i) => {
              const zone = getZoneMeta(sugg.direction);
              const isGood = sugg.status === 'good';
              return (
                <div 
                  key={i} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderLeft: `3px solid ${zone.color}`,
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'transform 0.2s ease',
                    cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem' }}>{zone.icon}</span>
                      <span style={{ fontWeight: '800', color: 'white', fontSize: '0.8rem' }}>{sugg.room}</span>
                    </div>
                    <span 
                      style={{ 
                        fontSize: '7.5px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isGood ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 179, 71, 0.1)',
                        color: isGood ? '#00e676' : '#ffb347'
                      }}
                    >
                      {isGood ? 'Optimal' : 'Imbalanced'}
                    </span>
                  </div>

                  <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Zone:</span> 
                    <strong style={{ color: zone.color }}>{sugg.direction || 'Center'}</strong>
                    <span style={{ opacity: 0.5 }}>· {zone.name} · ({zone.element})</span>
                  </div>

                  <p style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.35', marginTop: '2px' }}>
                    {sugg.tip}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* REMEDIES PANEL - DYNAMIC ACTIONABLE PANELS */}
        {activeTab === 'remedies' && (
          <div className="animate-fade-in scroll-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', paddingRight: '4px', overflowY: 'auto' }}>
            {misalignedRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '2.2rem', animation: 'float 3s ease-in-out infinite' }}>✨</span>
                <div style={{ fontWeight: '800', color: 'white', fontSize: '0.825rem' }}>Brahmasthan Harmony Achieved</div>
                <p style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  No spatial defects detected. Your layouts completely match the dynamic grid laws of traditional Vastu Shastra.
                </p>
              </div>
            ) : (
              misalignedRooms.map((sugg, i) => {
                const remedyInfo = getRemedyAdvice(sugg.room, sugg.direction);
                const isApplied = appliedRemedies.has(i);
                
                return (
                  <div 
                    key={i} 
                    style={{ 
                      background: isApplied ? 'rgba(0, 230, 118, 0.03)' : 'rgba(255, 255, 255, 0.015)', 
                      border: `1px solid ${isApplied ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.04)'}`,
                      borderLeft: `3px solid ${isApplied ? '#00e676' : remedyInfo.color}`,
                      borderRadius: '8px',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{remedyInfo.icon}</span>
                        <strong style={{ fontSize: '0.78rem', color: 'white' }}>{remedyInfo.title}</strong>
                      </div>
                      <button
                        onClick={() => handleToggleRemedy(i)}
                        style={{
                          border: 'none',
                          background: isApplied ? '#00e676' : 'rgba(255, 255, 255, 0.04)',
                          color: isApplied ? '#0d111d' : 'var(--color-text-secondary)',
                          border: `1px solid ${isApplied ? '#00e676' : 'rgba(255,255,255,0.08)'}`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '8.5px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          transition: 'all 0.2s ease',
                          boxShadow: isApplied ? '0 0 10px rgba(0, 230, 118, 0.4)' : 'none'
                        }}
                      >
                        {isApplied ? '✓ Remedy Active' : '⚡ Apply Remedy'}
                      </button>
                    </div>

                    <div style={{ fontSize: '8.5px', color: 'var(--color-text-secondary)', fontWeight: '600', opacity: 0.7 }}>
                      Defect: {sugg.room} misaligned in {sugg.direction} sector
                    </div>

                    <p 
                      style={{ 
                        fontSize: '10.5px', 
                        color: 'var(--color-text-secondary)', 
                        lineHeight: '1.4',
                        borderLeft: `1.5px solid ${isApplied ? '#00e676' : remedyInfo.color}`,
                        paddingLeft: '8px',
                        margin: 0
                      }}
                    >
                      {remedyInfo.remedy}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

    </div>
  );
}
