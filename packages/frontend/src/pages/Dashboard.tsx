import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchInsights, fetchExpenses } from '../api';
import { InsightsSummary, Expense } from '../types';
import './Dashboard.css';

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
    { label: 'Total Expenses', value: `$${(insights?.totalExpenses ?? 0).toFixed(2)}`, tone: 'total' },
    { label: 'Tax Deductible', value: `$${(insights?.totalDeductible ?? 0).toFixed(2)}`, tone: 'deductible' },
    { label: 'Non-Deductible', value: `$${(insights?.totalNonDeductible ?? 0).toFixed(2)}`, tone: 'non-deductible' },
    { label: '# of Expenses', value: String(totalCount), tone: 'count' },
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
            <div className={`card border-0 h-100 dashboard-card dashboard-card-${card.tone}`}>
              <div className="card-body">
                <p className="card-text text-muted small mb-2">{card.label}</p>
                <p className={`fw-bold fs-4 dashboard-card-value dashboard-card-value-${card.tone}`}>
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
            <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Expenses</h5>
              <Link to="/expenses" className="btn btn-sm btn-outline-primary"><i className="bi bi-list-ul me-1"></i>View All</Link>
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
                        <svg className="dashboard-progress-svg" viewBox="0 0 100 8" preserveAspectRatio="none" role="img" aria-label={`${cat.category} progress`}>
                          <rect
                            x="0"
                            y="0"
                            width={Math.max(0, Math.min(100, (cat.total / maxCat) * 100))}
                            height="8"
                            className={cat.taxDeductible ? 'dashboard-progress-fill-deductible' : 'dashboard-progress-fill-non-deductible'}
                          />
                        </svg>
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
