import { useEffect, useState } from 'react';
import { fetchInsights, fetchExpenses } from '../api';
import { InsightsSummary, Expense } from '../types';

export default function Dashboard() {
  const [insights, setInsights] = useState<InsightsSummary | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchInsights(), fetchExpenses()]).then(([ins, exps]) => {
      setInsights(ins);
      setTotalCount(exps.length);
      setRecentExpenses(exps.slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#64748B' }}>Loading...</div>;

  const cards = [
    { label: 'Total Expenses', value: `$${(insights?.totalExpenses ?? 0).toFixed(2)}`, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Tax Deductible', value: `$${(insights?.totalDeductible ?? 0).toFixed(2)}`, color: '#10B981', bg: '#F0FDF4' },
    { label: 'Non-Deductible', value: `$${(insights?.totalNonDeductible ?? 0).toFixed(2)}`, color: '#EF4444', bg: '#FFF1F2' },
    { label: '# of Expenses', value: String(totalCount), color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  const maxCat = Math.max(...(insights?.byCategory.map(c => c.total) ?? [1]));

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 24, color: '#1E293B' }}>Dashboard</h2>
      <p style={{ margin: '0 0 32px', color: '#64748B' }}>Overview of your expenses and tax insights</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: 24, border: `1px solid ${card.color}22` }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#64748B', fontWeight: 500 }}>{card.label}</p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1E293B' }}>Recent Expenses</h3>
          {recentExpenses.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: 14 }}>No expenses yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                  {['Title', 'Category', 'Amount', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: '#64748B', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontSize: 14 }}>{e.title}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#64748B' }}>{e.category}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>${e.amount.toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#64748B' }}>{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1E293B' }}>Category Breakdown</h3>
          {(insights?.byCategory ?? []).length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: 14 }}>No data yet.</p>
          ) : (
            <div>
              {insights?.byCategory.map(cat => (
                <div key={cat.category} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{cat.category}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>${cat.total.toFixed(2)}</span>
                  </div>
                  <div style={{ background: '#F1F5F9', borderRadius: 4, height: 8 }}>
                    <div style={{
                      height: 8,
                      borderRadius: 4,
                      background: cat.taxDeductible ? '#3B82F6' : '#94A3B8',
                      width: `${(cat.total / maxCat) * 100}%`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
