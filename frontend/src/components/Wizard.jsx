import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Wizard({ onComplete }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('guided'); // 'guided' or 'prompt'
  const [step, setStep] = useState(0);
  const [promptText, setPromptText] = useState('');
  const [preferences, setPreferences] = useState({
    homeType: '',
    landArea: '',
    storeys: '',
    budget: '',
    vastu: '',
    rooms: [],
    kitchenStyle: '',
    style: '',
    colorPalette: '',
    facing: '',
    flooring: '',
    specialRequirements: []
  });

  const questions = [
    { id: 'homeType', icon: '🏠', isMulti: false },
    { id: 'landArea', icon: '📐', isMulti: false },
    { id: 'storeys', icon: '🏢', isMulti: false },
    { id: 'budget', icon: '💰', isMulti: false },
    { id: 'vastu', icon: '🧭', isMulti: false },
    { id: 'rooms', icon: '🛏️', isMulti: true },
    { id: 'kitchenStyle', icon: '🍳', isMulti: false },
    { id: 'style', icon: '✨', isMulti: false },
    { id: 'colorPalette', icon: '🎨', isMulti: false },
    { id: 'facing', icon: '☀️', isMulti: false },
    { id: 'flooring', icon: '🪵', isMulti: false },
    { id: 'specialRequirements', icon: '♿', isMulti: true },
  ];

  const currentQ = questions[step];

  // Core rooms map — derived from homeType choice
  const coreRoomsMap = {
    "1BHK":   ["1 Bedroom", "Kitchen", "Living Room (Hall)"],
    "2BHK":   ["2 Bedrooms", "Kitchen", "Living Room (Hall)"],
    "3BHK":   ["3 Bedrooms", "Kitchen", "Living Room (Hall)"],
    "Villa":  ["3 Bedrooms", "Kitchen", "Living Room (Hall)", "Dining Room"],
    "Studio": ["Studio Suite (All-in-one)"]
  };

  // Extra (optional) rooms always available regardless of BHK
  const extraRooms = [
    "Pooja Room", "Study Room", "Servant Room", "Balcony",
    "Home Office", "Home Gym", "Guest Room", "Dining Room"
  ];

  const getCoreRoomsForType = (type) =>
    coreRoomsMap[type] || ["2 Bedrooms", "Kitchen", "Living Room (Hall)"];

  // All core rooms (for isCoreRoom check across all types)
  const allCoreRoomValues = [
    "1 Bedroom", "2 Bedrooms", "3 Bedrooms", "Bedroom",
    "Kitchen", "Living Room (Hall)", "Dining Room", "Studio Suite (All-in-one)"
  ];

  const isCoreRoom = (opt) => allCoreRoomValues.includes(opt);

  const getQuestionTitle = (qId) => {
    const titles = {
      homeType: "What type of home are you planning?",
      landArea: "What is your total land area?",
      storeys: "How many storeys/floors do you want?",
      budget: "What's your budget?",
      vastu: "Do you want Vastu compliance?",
      rooms: "Your rooms are ready — add extras if needed",
      kitchenStyle: "What kitchen style do you prefer?",
      style: "Preferred interior style?",
      colorPalette: "What color palette do you prefer?",
      facing: "Main facing direction?",
      flooring: "What flooring do you prefer?",
      specialRequirements: "Any special requirements?"
    };
    return t(`wizard.questions.${qId}`, titles[qId]);
  };

  const getQuestionSubtitle = (qId) => {
    const subtitles = {
      homeType: "Answer a few questions to get your personalized floor plan",
      landArea: "This helps us size your garden and landscape. If apartment, select 'No Land'",
      storeys: "Select single storey, stacked rental floors, or an apartment",
      budget: "Select a comfortable budget range for construction",
      vastu: "Vastu principles will guide the orientation of key areas",
      rooms: `Core rooms for your ${preferences.homeType || 'home'} are auto-selected. Add any extras below.`,
      kitchenStyle: "This shapes your kitchen layout in 3D",
      style: "This defines the visual theme of your home interior",
      colorPalette: "This guides wall colors and furniture choices",
      facing: "Main entrance orientation for sunlight and ventilation",
      flooring: "Applied across all rooms in your 3D model",
      specialRequirements: "We'll factor these into your design"
    };
    return t(`wizard.subtitles.${qId}`, subtitles[qId]);
  };

  const getQuestionOptions = (qId) => {
    const fallbacks = {
      homeType: ["1BHK", "2BHK", "3BHK", "Villa", "Studio"],
      landArea: ["Apartment / No Land", "Compact Plot (< 1500 sqft)", "Medium Plot (1500 - 3000 sqft)", "Large Plot (3000 sqft - 1 Acre)", "Estate (> 1 Acre)"],
      storeys: ["Single Storey", "2 Storeys (Owner + Rental)", "3 Storeys (Multi-Family/Rent)", "Apartment Flat"],
      budget: ["Under ₹5L", "₹5L–₹15L", "₹15L–₹30L", "₹30L+"],
      vastu: ["Yes, strictly", "Preferred", "No"],
      // rooms handled separately via getRoomsLayout()
      rooms: [],
      kitchenStyle: ["Open Kitchen", "Closed Kitchen", "L-Shaped", "Parallel / Galley", "Island Kitchen"],
      style: ["Modern", "Traditional Indian", "Minimalist", "Royal/Heritage"],
      colorPalette: ["Warm (beige, terracotta)", "Cool (white, grey)", "Bold & Vibrant", "Earthy & Natural", "Soft Pastel"],
      facing: ["East", "West", "North", "South", "Don't know"],
      flooring: ["Marble", "Vitrified Tiles", "Wooden Laminate", "Granite", "No preference"],
      specialRequirements: ["Wheelchair accessible", "Senior-friendly", "Pet-friendly", "Work-from-home setup", "None of the above"]
    };
    const translated = t(`wizard.options.${qId}`, { returnObjects: true });
    return Array.isArray(translated) ? translated : fallbacks[qId];
  };

  // Returns { coreRooms, extras } for the rooms step
  const getRoomsLayout = () => {
    const core = getCoreRoomsForType(preferences.homeType);
    // extras = extraRooms minus any already in core
    const extras = extraRooms.filter(r => !core.includes(r));
    return { core, extras };
  };

  const getOptionIcon = (questionId, optValue, index, defaultIcon) => {
    if (questionId === 'rooms') {
      const roomIcons = {
        "1 Bedroom": "🛏️",
        "2 Bedrooms": "🛏️",
        "3 Bedrooms": "🛏️",
        "Bedroom": "🛏️",
        "Kitchen": "🍳",
        "Living Room (Hall)": "🛋️",
        "Dining Room": "🍽️",
        "Studio Suite (All-in-one)": "🏢",
        "Pooja Room": "🪔",
        "Study Room": "📚",
        "Servant Room": "🧹",
        "Balcony": "🌅",
        "Home Office": "💻",
        "Home Gym": "🏋️",
        "Guest Room": "🛏️"
      };
      return roomIcons[optValue] || defaultIcon;
    }

    const icons = {
      homeType: ["🚪", "🏠", "🏡", "🏰", "🏢"],
      landArea: ["🏙️", "🏕️", "🏡", "🌳", "🌄"],
      storeys: ["🏡", "🏢", "🏘️", "🏬"],
      budget: ["📉", "💵", "💰", "💎"],
      vastu: ["😇", "👍", "❌"],
      kitchenStyle: ["🔓", "🚪", "📐", "↔️", "🏝️"],
      style: ["✨", "🕌", "🎋", "👑"],
      colorPalette: ["🌅", "❄️", "🎨", "🌳", "🌸"],
      facing: ["🌅", "🌇", "🧭", "☀️", "🤷"],
      flooring: ["⬜", "🔲", "🪵", "🪨", "🎲"],
      specialRequirements: ["♿", "👴", "🐾", "💻", "✅"]
    };
    if (icons[questionId] && icons[questionId][index]) {
      return icons[questionId][index];
    }
    return defaultIcon;
  };

  const options = getQuestionOptions(currentQ.id);

  const aiPresets = [
    "3BHK traditional South Indian home with a small central pooja mandir and a wide balcony",
    "Compact 2BHK modern apartment with modular kitchen and open living room, North-East facing",
    "Spacious 3BHK heritage villa styling with large living area, separate study room, strictly Vastu compliant",
    "Minimalist 1BHK studio apartment optimized for budget and remote-work setup",
    "Royal Rajasthani style 4BHK home with grand master bedroom, open-top courtyard, and servant quarters"
  ];

  const handleSelect = (opt, index) => {
    if (currentQ.isMulti) {
      const current = preferences[currentQ.id] || [];
      let next;

      if (currentQ.id === 'specialRequirements') {
        const noneIdx = getQuestionOptions('specialRequirements').length - 1;
        if (index === noneIdx) {
          next = [opt];
        } else {
          const noneOptionValue = getQuestionOptions('specialRequirements')[noneIdx];
          const filtered = current.filter(x => x !== noneOptionValue);
          next = filtered.includes(opt)
            ? filtered.filter(x => x !== opt)
            : [...filtered, opt];
        }
      } else if (currentQ.id === 'rooms') {
        // Core rooms cannot be deselected
        const { core } = getRoomsLayout();
        if (core.includes(opt)) return; // locked
        next = current.includes(opt)
          ? current.filter(x => x !== opt)
          : [...current, opt];
      } else {
        next = current.includes(opt)
          ? current.filter(x => x !== opt)
          : [...current, opt];
      }
      setPreferences({ ...preferences, [currentQ.id]: next });
    } else {
      if (currentQ.id === 'homeType') {
        const coreRooms = getCoreRoomsForType(opt);
        setPreferences({
          ...preferences,
          homeType: opt,
          rooms: coreRooms   // auto-select core rooms immediately
        });
      } else {
        setPreferences({ ...preferences, [currentQ.id]: opt });
      }

      if (step < questions.length - 1) {
        setTimeout(() => setStep(step + 1), 300);
      }
    }
  };

  // Toggle all EXTRAS (not core rooms) for the rooms step
  // For specialRequirements: toggle all non-"None" options
  const handleToggleSelectAll = () => {
    if (currentQ.id === 'rooms') {
      const { core, extras } = getRoomsLayout();
      const current = preferences.rooms || [];
      const allExtrasSelected = extras.every(r => current.includes(r));

      let next;
      if (allExtrasSelected) {
        // Deselect all extras, keep only core
        next = [...core];
      } else {
        // Select all extras on top of core
        next = [...core, ...extras.filter(r => !core.includes(r))];
      }
      setPreferences({ ...preferences, rooms: next });
    } else {
      // Generic toggle for specialRequirements etc.
      const current = preferences[currentQ.id] || [];
      const allOptions = options;
      const allSelected = allOptions.every(opt => current.includes(opt));
      const next = allSelected ? [] : [...allOptions];
      setPreferences({ ...preferences, [currentQ.id]: next });
    }
  };

  const isSelected = (opt) => {
    if (currentQ.isMulti) {
      return (preferences[currentQ.id] || []).includes(opt);
    }
    return preferences[currentQ.id] === opt;
  };

  const isNextDisabled = () => {
    const val = preferences[currentQ.id];
    if (currentQ.isMulti) {
      return !val || val.length === 0;
    }
    return !val;
  };

  const handleNext = () => {
    if (step < questions.length - 1) setStep(step + 1);
    else onComplete(preferences);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handlePromptSubmit = () => {
    if (!promptText.trim()) return;
    onComplete({ description: promptText, isAI: true });
  };

  // ── Derived state for the "Select all extras" button ──
  const roomsLayout = currentQ.id === 'rooms' ? getRoomsLayout() : null;
  const allExtrasSelected = roomsLayout
    ? roomsLayout.extras.every(r => (preferences.rooms || []).includes(r))
    : false;

  // ── Render a single option card ──
  const renderOptionCard = (opt, i, isCore = false) => {
    const selected = isSelected(opt);
    const locked = isCore; // core rooms can't be toggled off

    return (
      <div
        key={opt}
        onClick={() => !locked && handleSelect(opt, i)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0.95rem 1.25rem',
          background: selected
            ? isCore
              ? 'rgba(78, 205, 196, 0.10)'
              : 'rgba(236, 72, 153, 0.12)'
            : 'rgba(23, 23, 29, 0.45)',
          border: selected
            ? isCore
              ? '1px solid rgba(78, 205, 196, 0.55)'
              : '1px solid var(--color-fire-1)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          cursor: locked ? 'default' : 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: '62px',
          boxShadow: selected
            ? isCore
              ? '0 0 12px rgba(78, 205, 196, 0.18)'
              : '0 0 15px rgba(236, 72, 153, 0.25)'
            : '0 4px 12px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
          justifyContent: 'flex-start',
          textAlign: 'left',
          opacity: locked ? 1 : 1,
        }}
        onMouseEnter={(e) => {
          if (!selected && !locked) {
            e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.45)';
            e.currentTarget.style.background = 'rgba(236, 72, 153, 0.06)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!selected && !locked) {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.background = 'rgba(23, 23, 29, 0.45)';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <div style={{
          fontSize: '1.35rem',
          transition: 'transform 0.25s ease',
          flexShrink: 0
        }}>
          {getOptionIcon(currentQ.id, opt, i, currentQ.icon)}
        </div>
        <div style={{
          color: selected ? 'white' : 'var(--color-text)',
          fontWeight: '600',
          fontSize: '0.95rem',
          lineHeight: '1.3',
          flex: 1
        }}>
          {opt}
        </div>

        {/* Badge area */}
        {isCore ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(78, 205, 196, 0.15)',
            border: '1px solid rgba(78, 205, 196, 0.4)',
            color: '#4ecdc4',
            fontSize: '0.6rem',
            fontWeight: '800',
            padding: '3px 8px',
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            flexShrink: 0
          }}>
            ✓ Auto-selected
          </span>
        ) : selected ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'var(--color-fire-1)',
            color: 'white',
            fontSize: '11px',
            fontWeight: '900',
            flexShrink: 0
          }}>✓</span>
        ) : null}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#06070d',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflowY: 'auto',
      padding: '90px 1.5rem 1.5rem 1.5rem',
      fontFamily: 'var(--font-sans)'
    }}>

      {/* Edge-to-edge Header HUD */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: '#0a0b12',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2rem',
        zIndex: 1010
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.35rem', animation: 'flame 1.5s ease infinite' }}>🔥</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: '800',
            fontSize: '1.25rem',
            background: 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px'
          }}>
            Agni AI
          </span>
        </div>

        {mode === 'guided' && (
          <div style={{
            color: 'var(--color-text-secondary)',
            fontSize: '0.8rem',
            fontWeight: '600',
            fontFamily: 'var(--font-sans)',
            opacity: 0.8
          }}>
            Question {step + 1} of {questions.length}
          </div>
        )}

        <button
          onClick={() => setMode(mode === 'guided' ? 'prompt' : 'guided')}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ec4899',
            fontSize: '1.1rem',
            boxShadow: '0 0 10px rgba(236,72,153,0.1)',
            transition: 'all 0.2s ease'
          }}
          title={mode === 'guided' ? "Switch to AI Prompt Console" : "Switch to Guided Questionnaire"}
        >
          🪄
        </button>
      </div>

      {/* Horizontal Progress Bar Track */}
      {mode === 'guided' && (
        <div style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255,255,255,0.03)',
          zIndex: 1010
        }}>
          <div style={{
            width: `${((step + 1) / questions.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-fire-1), var(--color-fire-2))',
            boxShadow: '0 0 12px rgba(236, 72, 153, 0.65)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>
      )}

      {/* Centered wizard container card */}
      <div className="card animate-fade-up" style={{
        maxWidth: '820px',
        width: '100%',
        padding: '2.5rem',
        background: 'rgba(16, 17, 30, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        transition: 'transform 0.3s ease'
      }}>
        {/* Mode Selector Tabs */}
        <div className="flex gap-2 mb-4 p-1 rounded-full" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)', maxWidth: 'fit-content', margin: '0 auto 2.5rem auto' }}>
          <button
            className="btn btn-sm"
            onClick={() => setMode('guided')}
            style={{
              background: mode === 'guided' ? 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))' : 'transparent',
              color: mode === 'guided' ? 'white' : 'var(--color-text-secondary)',
              boxShadow: mode === 'guided' ? '0 2px 10px rgba(236,72,153,0.3)' : 'none',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🧭 Guided Questionnaire
          </button>
          <button
            className="btn btn-sm"
            onClick={() => setMode('prompt')}
            style={{
              background: mode === 'prompt' ? 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))' : 'transparent',
              color: mode === 'prompt' ? 'white' : 'var(--color-text-secondary)',
              boxShadow: mode === 'prompt' ? '0 2px 10px rgba(236,72,153,0.3)' : 'none',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ✨ AI Prompt Console
          </button>
        </div>

        {mode === 'guided' ? (
          <div className="animate-fade-in">
            {/* Question Header */}
            <div style={{ marginBottom: currentQ.id === 'rooms' ? '1rem' : '1.5rem' }}>
              <div style={{
                color: 'var(--color-fire-1)',
                fontSize: '0.75rem',
                fontWeight: '800',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-display)'
              }}>
                STEP {step + 1} OF {questions.length}
              </div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: 'white', lineHeight: '1.25', fontFamily: 'var(--font-display)' }}>
                {getQuestionTitle(currentQ.id)}
              </h2>
              <p className="text-secondary" style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                {getQuestionSubtitle(currentQ.id)}
              </p>
            </div>

            {/* ════════════════════════════════════════
                ROOMS STEP — special two-section layout
                ════════════════════════════════════════ */}
            {currentQ.id === 'rooms' && roomsLayout ? (
              <div>
                {/* ── Section 1: Core Rooms (locked/auto-selected) ── */}
                <div style={{
                  background: 'rgba(78, 205, 196, 0.04)',
                  border: '1px solid rgba(78, 205, 196, 0.15)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0.9rem'
                  }}>
                    <span style={{ fontSize: '1rem' }}>🏠</span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      color: '#4ecdc4'
                    }}>
                      Core Rooms — Included for {preferences.homeType || 'your home'}
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      background: 'rgba(78, 205, 196, 0.12)',
                      border: '1px solid rgba(78, 205, 196, 0.3)',
                      color: '#4ecdc4',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      padding: '2px 10px',
                      borderRadius: '9999px'
                    }}>
                      Auto-selected ✓
                    </span>
                  </div>
                  <div className="grid" style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '10px'
                  }}>
                    {roomsLayout.core.map((opt, i) => renderOptionCard(opt, i, true))}
                  </div>
                </div>

                {/* ── Section 2: Extra Rooms with toggle button ── */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.9rem',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>➕</span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        letterSpacing: '1.2px',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-secondary)'
                      }}>
                        Additional Rooms (Optional)
                      </span>
                    </div>

                    {/* SELECT ALL EXTRAS button */}
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      style={{
                        background: allExtrasSelected
                          ? 'rgba(236, 72, 153, 0.12)'
                          : 'rgba(78, 205, 196, 0.08)',
                        border: allExtrasSelected
                          ? '1px solid rgba(236, 72, 153, 0.4)'
                          : '1px solid rgba(78, 205, 196, 0.25)',
                        borderRadius: '20px',
                        color: allExtrasSelected ? '#ec4899' : '#4ecdc4',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        padding: '7px 16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        outline: 'none',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = allExtrasSelected
                          ? '0 6px 16px rgba(236, 72, 153, 0.2)'
                          : '0 6px 16px rgba(78, 205, 196, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Animated checkbox */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '15px',
                        height: '15px',
                        borderRadius: '4px',
                        border: allExtrasSelected
                          ? '1.5px solid #ec4899'
                          : '1.5px solid #4ecdc4',
                        background: allExtrasSelected ? '#ec4899' : 'transparent',
                        color: '#06070d',
                        fontSize: '9px',
                        fontWeight: '900',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}>
                        {allExtrasSelected && '✓'}
                      </span>
                      {allExtrasSelected ? 'Deselect all extras' : 'Select all extras'}
                    </button>
                  </div>

                  <div className="grid" style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '10px'
                  }}>
                    {roomsLayout.extras.map((opt, i) => renderOptionCard(opt, i, false))}
                  </div>
                </div>
              </div>
            ) : (
              /* ════════════════════════════════════
                 ALL OTHER STEPS — standard flat grid
                 ════════════════════════════════════ */
              <>
                {/* Generic multi-select toggle for specialRequirements */}
                {currentQ.isMulti && currentQ.id !== 'rooms' && (
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    style={{
                      background: 'rgba(78, 205, 196, 0.08)',
                      border: '1px solid rgba(78, 205, 196, 0.25)',
                      borderRadius: '20px',
                      color: '#4ecdc4',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      marginBottom: '1rem',
                      padding: '8px 16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(78, 205, 196, 0.16)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(78, 205, 196, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '15px',
                      height: '15px',
                      borderRadius: '4px',
                      border: '1.5px solid #4ecdc4',
                      background: options.every(opt => (preferences[currentQ.id] || []).includes(opt)) ? '#4ecdc4' : 'transparent',
                      color: '#06070d',
                      fontSize: '9px',
                      fontWeight: '900',
                      transition: 'all 0.2s ease'
                    }}>
                      {options.every(opt => (preferences[currentQ.id] || []).includes(opt)) && '✓'}
                    </span>
                    {options.every(opt => (preferences[currentQ.id] || []).includes(opt))
                      ? 'Deselect all'
                      : 'Select all that apply'}
                  </button>
                )}

                <div className="grid" style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '14px',
                  margin: '1rem 0 2rem 0'
                }}>
                  {Array.isArray(options) && options.map((opt, i) => (
                    <div
                      key={i}
                      className={`option-card ${isSelected(opt) ? 'selected' : ''}`}
                      onClick={() => handleSelect(opt, i)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '0.95rem 1.25rem',
                        background: isSelected(opt) ? 'rgba(236, 72, 153, 0.12)' : 'rgba(23, 23, 29, 0.45)',
                        border: isSelected(opt)
                          ? '1px solid var(--color-fire-1)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        minHeight: '62px',
                        boxShadow: isSelected(opt)
                          ? '0 0 15px rgba(236, 72, 153, 0.25)'
                          : '0 4px 12px rgba(0,0,0,0.15)',
                        position: 'relative',
                        overflow: 'hidden',
                        justifyContent: 'flex-start',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected(opt)) {
                          e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.45)';
                          e.currentTarget.style.background = 'rgba(236, 72, 153, 0.06)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected(opt)) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.background = 'rgba(23, 23, 29, 0.45)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{
                        fontSize: '1.35rem',
                        transition: 'transform 0.25s ease',
                        flexShrink: 0
                      }}>
                        {getOptionIcon(currentQ.id, opt, i, currentQ.icon)}
                      </div>
                      <div style={{
                        color: isSelected(opt) ? 'white' : 'var(--color-text)',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        lineHeight: '1.3'
                      }}>
                        {opt}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Navigation Buttons Row */}
            <div className="flex justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleBack}
                disabled={step === 0}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: step === 0 ? 'rgba(255,255,255,0.2)' : 'var(--color-text-secondary)',
                  borderRadius: '9999px',
                  padding: '0.65rem 1.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: step === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ← Back
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={handleNext}
                disabled={isNextDisabled()}
                style={{
                  background: isNextDisabled()
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'linear-gradient(135deg, var(--color-fire-1), var(--color-fire-2))',
                  border: isNextDisabled() ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  color: isNextDisabled() ? 'rgba(255,255,255,0.25)' : 'white',
                  boxShadow: isNextDisabled() ? 'none' : '0 4px 20px rgba(236, 72, 153, 0.35)',
                  borderRadius: '9999px',
                  padding: '0.65rem 2.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: isNextDisabled() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {step === questions.length - 1 ? '🔥 Generate My Home' : 'Next →'}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="display-md text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Describe your dream home</h2>
              <p className="text-sm text-secondary">Agni AI will draft a tailored, Vastu-compliant layout based on your text prompts.</p>
            </div>

            <textarea
              className="input w-full"
              rows="5"
              placeholder="Type in detail, e.g.: A 3BHK royal style home with a traditional central Pooja room, South-facing entrance, spacious kitchen with modular setup, and wooden wardrobes in bedroom..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              style={{
                resize: 'none',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 0 20px rgba(236, 72, 153, 0.05)',
                padding: '1rem',
                borderRadius: '12px',
                fontFamily: 'inherit',
                lineHeight: '1.5'
              }}
            />

            <div>
              <div className="text-xs font-bold text-secondary mb-2 uppercase tracking-wide">💡 Or click a preset suggestion chip:</div>
              <div className="scroll-panel flex gap-2 pb-2" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                {aiPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPromptText(preset)}
                    className="tag"
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.4rem 0.9rem',
                      border: '1px solid rgba(236, 72, 153, 0.15)',
                      background: promptText === preset ? 'rgba(236, 72, 153, 0.12)' : 'var(--color-surface-2)',
                      color: promptText === preset ? 'var(--color-fire-1)' : 'var(--color-text-secondary)',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                  >
                    {preset.slice(0, 45)}...
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary w-full mt-2"
              onClick={handlePromptSubmit}
              disabled={!promptText.trim()}
              style={{
                padding: '1rem',
                fontSize: '1rem',
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                fontWeight: '700'
              }}
            >
              ✨ {t('wizard.generate')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
