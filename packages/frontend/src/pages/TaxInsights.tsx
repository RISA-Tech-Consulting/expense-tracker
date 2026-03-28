import { useEffect, useState } from 'react';
import { fetchInsights } from '../api';
import { InsightsSummary } from '../types';

export default function TaxInsights() {
  const [insights, setInsights] = useState<InsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights().then(data => { setInsights(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748B' }}>Loading...</div>;

  const estimatedSavings = (insights?.totalDeductible ?? 0) * 0.30;
  const maxCat = Math.max(...(insights?.byCategory.map(c => c.total) ?? [1]), 1);
  const maxMonth = Math.max(...(insights?.byMonth.map(m => m.total) ?? [1]), 1);

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 24, color: '#1E293B' }}>Tax Insights</h2>
      <p style={{ margin: '0 0 32px', color: '#64748B' }}>Tax deductible breakdown and savings estimates</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Deductible', value: `$${(insights?.totalDeductible ?? 0).toFixed(2)}`, color: '#10B981', bg: '#F0FDF4' },
          { label: 'Non-Deductible', value: `$${(insights?.totalNonDeductible ?? 0).toFixed(2)}`, color: '#EF4444', bg: '#FFF1F2' },
          { label: 'Est. Tax Savings (30%)', value: `$${estimatedSavings.toFixed(2)}`, color: '#8B5CF6', bg: '#F5F3FF' },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: 24, border: `1px solid ${card.color}22` }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748B' }}>{card.label}</p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#1E293B' }}>Deductible vs Non-Deductible</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
            {(insights?.deductiblePercentage ?? 0).toFixed(1)}% of expenses are tax deductible
          </p>
          <div style={{ display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ background: '#10B981', width: `${insights?.deductiblePercentage ?? 0}%`, transition: 'width 0.3s' }} />
            <div style={{ background: '#EF4444', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <span style={{ color: '#10B981' }}>● Deductible: ${(insights?.totalDeductible ?? 0).toFixed(2)}</span>
            <span style={{ color: '#EF4444' }}>● Non-deductible: ${(insights?.totalNonDeductible ?? 0).toFixed(2)}</span>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1E293B' }}>Tax Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {[
                ['Total Expenses', `$${(insights?.totalExpenses ?? 0).toFixed(2)}`],
                ['Deductible Expenses', `$${(insights?.totalDeductible ?? 0).toFixed(2)}`],
                ['Deductible %', `${(insights?.deductiblePercentage ?? 0).toFixed(1)}%`],
                ['Assumed Tax Rate', '30%'],
                ['Estimated Savings', `$${estimatedSavings.toFixed(2)}`],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 0', color: '#64748B' }}>{label}</td>
                  <td style={{ padding: '10px 0', fontWeight: 600, textAlign: 'right', color: '#1E293B' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1E293B' }}>By Category</h3>
          {(insights?.byCategory ?? []).length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: 14 }}>No data yet.</p>
          ) : (
            insights?.byCategory.map(cat => (
              <div key={cat.category} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>
                    {cat.category}
                    <span style={{
                      marginLeft: 6,
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 8,
                      background: cat.taxDeductible ? '#DCFCE7' : '#FEE2E2',
                      color: cat.taxDeductible ? '#16A34A' : '#DC2626',
                    }}>
                      {cat.taxDeductible ? 'Deductible' : 'Non-deductible'}
                    </span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>${cat.total.toFixed(2)}</span>
                </div>
                <div style={{ background: '#F1F5F9', borderRadius: 4, height: 8 }}>
                  <div style={{
                    height: 8,
                    borderRadius: 4,
                    background: cat.taxDeductible ? '#10B981' : '#EF4444',
                    width: `${(cat.total / maxCat) * 100}%`,
                  }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1E293B' }}>Monthly Trend</h3>
          {(insights?.byMonth ?? []).length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: 14 }}>No data yet.</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
              {insights?.byMonth.map(m => (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>${m.total.toFixed(0)}</span>
                  <div style={{
                    width: '100%',
                    background: '#3B82F6',
                    borderRadius: '4px 4px 0 0',
                    height: `${(m.total / maxMonth) * 100}px`,
                    minHeight: 4,
                  }} />
                  <span style={{ fontSize: 10, color: '#94A3B8', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
