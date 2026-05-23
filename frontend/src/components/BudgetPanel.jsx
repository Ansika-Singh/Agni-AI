import { useTranslation } from 'react-i18next';

export default function BudgetPanel({ budgetData }) {
  const { t } = useTranslation();
  
  if (!budgetData) return null;
  
  const { breakdown, furniture, currency } = budgetData;
  
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount).replace('₹', currency);
  };

  return (
    <div className="card">
      <h3 className="font-bold text-md mb-4 flex items-center gap-1">
        <span className="text-gold">💰</span> {t('budget.title')}
      </h3>
      
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="p-3 rounded-md text-center flex flex-col gap-1 border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border-subtle)' }}>
          <div className="text-xs text-secondary mb-1">{t('budget.construction')}</div>
          <div style={{ height: '3px', background: '#8b5cf6', borderRadius: '2px', width: '90%', margin: '0 auto' }}></div>
          <div className="font-bold text-md mt-1 text-white">₹{(breakdown.construction / 100000).toFixed(0)}L</div>
        </div>
        <div className="p-3 rounded-md text-center flex flex-col gap-1 border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border-subtle)' }}>
          <div className="text-xs text-secondary mb-1">{t('budget.interiors')}</div>
          <div style={{ height: '3px', background: '#14b8a6', borderRadius: '2px', width: '90%', margin: '0 auto' }}></div>
          <div className="font-bold text-md mt-1 text-white">₹{(breakdown.interiors / 100000).toFixed(0)}L</div>
        </div>
        <div className="p-3 rounded-md text-center flex flex-col gap-1 border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border-subtle)' }}>
          <div className="text-xs text-secondary mb-1">{t('budget.furniture')}</div>
          <div style={{ height: '3px', background: '#f59e0b', borderRadius: '2px', width: '90%', margin: '0 auto' }}></div>
          <div className="font-bold text-md mt-1 text-white">₹{(breakdown.furniture / 100000).toFixed(0)}L</div>
        </div>
      </div>

      {furniture && furniture.length > 0 && (
        <div className="mt-4 border-top" style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1.25rem' }}>
          <h4 className="text-sm font-bold text-secondary mb-3 flex items-center gap-1">
            🛋️ Recommended Furniture & Decor
          </h4>
          <div className="scroll-panel flex flex-col gap-2" style={{ maxHeight: '180px', paddingRight: '8px' }}>
            {furniture.map((item) => (
              <div 
                key={item.id} 
                className="flex justify-between items-center p-2 px-3 rounded-md border" 
                style={{ 
                  background: 'var(--color-surface-2)', 
                  borderColor: 'var(--color-border-subtle)',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <div className="font-bold text-white" style={{ fontSize: '0.85rem' }}>{item.name}</div>
                  <div className="text-xs text-secondary" style={{ fontSize: '0.75rem' }}>{item.room} • {item.style}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-bold text-gradient">{formatMoney(item.price)}</div>
                  <div className="flex gap-1">
                    {item.amazon && (
                      <a 
                        href={item.amazon} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="badge" 
                        style={{ 
                          background: 'rgba(255, 153, 0, 0.12)', 
                          color: '#ff9900', 
                          border: '1px solid rgba(255, 153, 0, 0.3)', 
                          textDecoration: 'none', 
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.7rem' 
                        }}
                      >
                        Amazon
                      </a>
                    )}
                    {item.flipkart && (
                      <a 
                        href={item.flipkart} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="badge" 
                        style={{ 
                          background: 'rgba(40, 116, 240, 0.12)', 
                          color: '#2874f0', 
                          border: '1px solid rgba(40, 116, 240, 0.3)', 
                          textDecoration: 'none', 
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.7rem' 
                        }}
                      >
                        Flipkart
                      </a>
                    )}
                    {item.pepperfry && (
                      <a 
                        href={item.pepperfry} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="badge" 
                        style={{ 
                          background: 'rgba(236, 72, 153, 0.12)', 
                          color: 'var(--color-fire-1)', 
                          border: '1px solid rgba(236, 72, 153, 0.3)', 
                          textDecoration: 'none', 
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.7rem' 
                        }}
                      >
                        Pepperfry
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
