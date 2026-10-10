import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'हिंदी', short: 'HI' },
    { code: 'ta', label: 'தமிழ்', short: 'TA' },
    { code: 'te', label: 'తెలుగు', short: 'TE' }
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setDropdownOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="nav" style={{ borderBottom: '1px solid var(--color-border-subtle)', position: 'relative', zIndex: 100 }}>
      <div className="container flex items-center justify-between relative" style={{ minHeight: '64px' }}>
        <Link to="/" className="flex items-center gap-1" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>
          <div className="text-fire" style={{ fontSize: '1.5rem' }}>🔥</div>
          <div className="font-bold text-xl">Agni <span className="text-white">AI</span></div>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="flex gap-4 hide-mobile items-center justify-center absolute w-full pointer-events-none" style={{ left: 0 }}>
          <Link to="/" className="text-sm font-semibold pointer-events-auto" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{t('nav.home')}</Link>
          <Link to="/designer" className="text-sm font-bold pointer-events-auto" style={{ color: 'var(--color-text)', textDecoration: 'none' }}>{t('nav.designer')}</Link>
          <Link to="/designs" className="text-sm font-semibold pointer-events-auto" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>{t('nav.myDesigns')}</Link>
        </nav>
        
        <div className="flex items-center gap-2 relative z-10">
          {/* Custom Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className="flex items-center gap-1 px-3 py-1 rounded-md" 
              style={{ 
                background: 'var(--color-surface-2)', 
                border: '1px solid var(--color-border-subtle)', 
                fontSize: '0.85rem',
                color: 'white',
                cursor: 'pointer'
              }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {currentLang.short} <span style={{ fontSize: '0.6rem', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
            </button>
            
            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-1 card-glass flex flex-col p-1" 
                style={{ 
                  minWidth: '120px', 
                  zIndex: 200, 
                  boxShadow: 'var(--shadow-fire)',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="btn btn-sm text-left"
                    style={{
                      background: i18n.language === lang.code ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                      color: i18n.language === lang.code ? 'var(--color-fire-1)' : 'var(--color-text-secondary)',
                      width: '100%',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{lang.label}</span>
                    {i18n.language === lang.code && <span style={{ color: 'var(--color-fire-1)', fontSize: '0.7rem' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button className="btn btn-sm hide-mobile" style={{ border: '1px solid var(--color-border-subtle)', background: 'transparent', color: 'white' }}>{t('nav.signIn')}</button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="btn btn-sm hide-desktop"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '6px 10px',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-subtle)',
              color: 'white',
              fontSize: '1.1rem',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div 
          className="hide-desktop"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(10, 11, 18, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--color-border)',
            boxShadow: '0 15px 30px rgba(0,0,0,0.8)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 99
          }}
        >
          <Link 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'var(--color-text)',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            🏠 {t('nav.home')}
          </Link>
          <Link 
            to="/designer" 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'var(--color-fire-1)',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            📐 {t('nav.designer')}
          </Link>
          <Link 
            to="/designs" 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              color: 'var(--color-text)',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            📁 {t('nav.myDesigns')}
          </Link>
          <div style={{ paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Account</span>
            <button className="btn btn-sm btn-primary" style={{ padding: '6px 18px', fontSize: '0.85rem' }}>
              {t('nav.signIn')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

