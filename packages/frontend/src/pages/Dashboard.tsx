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

  if (loading)
    return (
      <div className="p-5 text-muted">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        Loading...
      </div>
    );

  const cards = [
    { label: 'Total Expenses', value: `$${(insights?.totalExpenses ?? 0).toFixed(2)}`, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Tax Deductible', value: `$${(insights?.totalDeductible ?? 0).toFixed(2)}`, color: '#10B981', bg: '#F0FDF4' },
    { label: 'Non-Deductible', value: `$${(insights?.totalNonDeductible ?? 0).toFixed(2)}`, color: '#EF4444', bg: '#FFF1F2' },
    { label: '# of Expenses', value: String(totalCount), color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  const maxCat = Math.max(...(insights?.byCategory.map(c => c.total) ?? [1]));

  return (
    <div className="p-3 p-md-5">
      <h2 className="mb-2">Dashboard</h2>
      <p className="text-muted mb-4 mb-md-5">Overview of your expenses and tax insights</p>

      {/* Stat Cards */}
      <div className="row g-3 mb-4 mb-md-5">
        {cards.map(card => (
          <div key={card.label} className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 h-100" style={{ background: card.bg }}>
              <div className="card-body">
                <p className="card-text text-muted small mb-2">{card.label}</p>
                <p className="fw-bold fs-4" style={{ color: card.color }}>
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Expenses & Category Breakdown */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Recent Expenses</h5>
            </div>
            <div className="card-body">
              {recentExpenses.length === 0 ? (
                <p className="text-muted">No expenses yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentExpenses.map(e => (
                        <tr key={e.id}>
                          <td className="fw-500">{e.title}</td>
                          <td className="text-muted">{e.category}</td>
                          <td className="fw-bold">${e.amount.toFixed(2)}</td>
                          <td className="text-muted">{e.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Category Breakdown</h5>
            </div>
            <div className="card-body">
              {(insights?.byCategory ?? []).length === 0 ? (
                <p className="text-muted">No data yet.</p>
              ) : (
                <div>
                  {insights?.byCategory.map(cat => (
                    <div key={cat.category} className="mb-3">
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="fw-500">{cat.category}</span>
                        <span className="fw-bold">${cat.total.toFixed(2)}</span>
                      </div>
                      <div className="progress" role="progressbar">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${(cat.total / maxCat) * 100}%`,
                            background: cat.taxDeductible ? '#0d6efd' : '#6c757d',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
