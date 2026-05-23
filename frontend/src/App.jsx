import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Designer from './pages/Designer';
import MyDesigns from './pages/MyDesigns';
import Header from './components/Header';
import { Suspense } from 'react';

function AppContent() {
  const location = useLocation();
  const isDesigner = location.pathname === '/designer';
  const isHome = location.pathname === '/';

  return (
    <>
      {!isDesigner && !isHome && <Header />}
      <main style={{ paddingTop: (isDesigner || isHome) ? '0px' : '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/designer" element={<Designer />} />
          <Route path="/designs" element={<MyDesigns />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="spinner"></div></div>}>
        <AppContent />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
