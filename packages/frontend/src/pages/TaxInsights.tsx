import { useEffect, useState } from 'react';
import { fetchInsights } from '../api';
import { InsightsSummary } from '../types';

export default function TaxInsights() {
  const [insights, setInsights] = useState<InsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights()
      .then(data => {
        setInsights(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const estimatedSavings = (insights?.totalDeductible ?? 0) * 0.3;
  const maxCat = Math.max(...(insights?.byCategory.map(c => c.total) ?? [1]), 1);
  const maxMonth = Math.max(...(insights?.byMonth.map(m => m.total) ?? [1]), 1);

  return (
    <div className="p-3 p-md-5">
      <h2 className="mb-2">Tax Insights</h2>
      <p className="text-muted mb-4 mb-md-5">Tax deductible breakdown and savings estimates</p>

      {/* Summary Cards */}
      <div className="row g-3 mb-4 mb-md-5">
        {[
          { label: 'Total Deductible', value: `$${(insights?.totalDeductible ?? 0).toFixed(2)}`, color: '#10B981', bg: '#F0FDF4' },
          { label: 'Non-Deductible', value: `$${(insights?.totalNonDeductible ?? 0).toFixed(2)}`, color: '#EF4444', bg: '#FFF1F2' },
          { label: 'Est. Tax Savings (30%)', value: `$${estimatedSavings.toFixed(2)}`, color: '#8B5CF6', bg: '#F5F3FF' },
        ].map(card => (
          <div key={card.label} className="col-12 col-sm-6 col-lg-4">
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

      {/* Deductible vs Non-Deductible & Tax Summary */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Deductible vs Non-Deductible</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                {(insights?.deductiblePercentage ?? 0).toFixed(1)}% of expenses are tax deductible
              </p>
              <div className="progress mb-3" style={{ height: '24px' }}>
                <div
                  className="progress-bar"
                  style={{
                    width: `${insights?.deductiblePercentage ?? 0}%`,
                    background: '#10B981',
                  }}
                ></div>
                <div
                  className="progress-bar"
                  style={{
                    width: `${100 - (insights?.deductiblePercentage ?? 0)}%`,
                    background: '#EF4444',
                  }}
                ></div>
              </div>
              <div className="small">
                <div className="mb-2">
                  <span style={{ color: '#10B981' }}>● Deductible: ${(insights?.totalDeductible ?? 0).toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ color: '#EF4444' }}>● Non-deductible: ${(insights?.totalNonDeductible ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Tax Summary</h5>
            </div>
            <div className="card-body">
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  {[
                    ['Total Expenses', `$${(insights?.totalExpenses ?? 0).toFixed(2)}`],
                    ['Deductible Expenses', `$${(insights?.totalDeductible ?? 0).toFixed(2)}`],
                    ['Deductible %', `${(insights?.deductiblePercentage ?? 0).toFixed(1)}%`],
                    ['Assumed Tax Rate', '30%'],
                    ['Estimated Savings', `$${estimatedSavings.toFixed(2)}`],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="text-muted">{label}</td>
                      <td className="text-end fw-bold">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* By Category & Monthly Trend */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">By Category</h5>
            </div>
            <div className="card-body">
              {(insights?.byCategory ?? []).length === 0 ? (
                <p className="text-muted mb-0">No data yet.</p>
              ) : (
                insights?.byCategory.map(cat => (
                  <div key={cat.category} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1 small">
                      <span className="fw-500">
                        {cat.category}
                        <span
                          className={`badge ms-2 ${cat.taxDeductible ? 'bg-success' : 'bg-danger'}`}
                        >
                          {cat.taxDeductible ? 'Deductible' : 'Non-deductible'}
                        </span>
                      </span>
                      <span className="fw-bold">${cat.total.toFixed(2)}</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${(cat.total / maxCat) * 100}%`,
                          background: cat.taxDeductible ? '#10B981' : '#EF4444',
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Monthly Trend</h5>
            </div>
            <div className="card-body">
              {(insights?.byMonth ?? []).length === 0 ? (
                <p className="text-muted mb-0">No data yet.</p>
              ) : (
                <div className="d-flex align-items-end gap-2" style={{ height: '160px' }}>
                  {insights?.byMonth.map(m => (
                    <div key={m.month} className="flex-grow-1 d-flex flex-column align-items-center gap-1">
                      <small className="text-muted">${m.total.toFixed(0)}</small>
                      <div
                        style={{
                          width: '100%',
                          background: '#0d6efd',
                          borderRadius: '4px 4px 0 0',
                          height: `${(m.total / maxMonth) * 100}px`,
                          minHeight: '4px',
                        }}
                      ></div>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {m.month}
                      </small>
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
