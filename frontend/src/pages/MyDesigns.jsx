import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function MyDesigns() {
  const { t } = useTranslation();

  return (
    <div className="container mt-4">
      <h2 className="display-md mb-3">{t('nav.myDesigns')}</h2>
      
      <div className="card card-glass flex flex-col items-center justify-center text-center p-4">
        <div className="text-fire mb-2" style={{ fontSize: '3rem' }}>🔒</div>
        <h3 className="font-bold text-lg mb-1">Sign in to save your designs</h3>
        <p className="text-secondary mb-2">Create an account to save your AI-generated floor plans, Vastu scores, and budget plans.</p>
        <button className="btn btn-primary">{t('nav.signIn')}</button>
      </div>
    </div>
  );
}
