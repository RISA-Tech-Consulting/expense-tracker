import { useEffect, useState } from 'react';
import { fetchInsights, getTaxRate } from '../api';
import { InsightsSummary } from '../types';
import './TaxInsights.css';

export default function TaxInsights() {
  const [insights, setInsights] = useState<InsightsSummary | null>(null);
  const [taxRate, setTaxRate] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchInsights(), getTaxRate()])
      .then(([data, rate]) => {
        setInsights(data);
        setTaxRate(rate);
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

  const estimatedSavings = (insights?.totalDeductible ?? 0) * (taxRate / 100);
  const maxCat = Math.max(...(insights?.byCategory.map(c => c.total) ?? [1]), 1);
  const maxMonth = Math.max(...(insights?.byMonth.map(m => m.total) ?? [1]), 1);

  return (
    <div className="p-3 p-md-5">
      <h2 className="mb-2">Tax Insights</h2>
      <p className="text-muted mb-4 mb-md-5">Tax deductible breakdown and savings estimates</p>

      {/* Summary Cards */}
      <div className="row g-3 mb-4 mb-md-5">
        {[
          { label: 'Total Deductible', value: `$${(insights?.totalDeductible ?? 0).toFixed(2)}`, tone: 'deductible' },
          { label: 'Non-Deductible', value: `$${(insights?.totalNonDeductible ?? 0).toFixed(2)}`, tone: 'non-deductible' },
          { label: `Est. Tax Savings (${taxRate}%)`, value: `$${estimatedSavings.toFixed(2)}`, tone: 'savings' },
        ].map(card => (
          <div key={card.label} className="col-12 col-sm-6 col-lg-4">
            <div className={`card border-0 h-100 tax-summary-card tax-summary-card-${card.tone}`}>
              <div className="card-body">
                <p className="card-text text-muted small mb-2">{card.label}</p>
                <p className={`fw-bold fs-4 tax-summary-value tax-summary-value-${card.tone}`}>
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
              <div className="tax-deductibility-track mb-3" role="img" aria-label="Deductible vs non-deductible split">
                <svg className="tax-deductibility-svg" viewBox="0 0 100 24" preserveAspectRatio="none">
                  <rect
                    x="0"
                    y="0"
                    width={Math.max(0, Math.min(100, insights?.deductiblePercentage ?? 0))}
                    height="24"
                    className="tax-deductibility-fill-deductible"
                  />
                  <rect
                    x={Math.max(0, Math.min(100, insights?.deductiblePercentage ?? 0))}
                    y="0"
                    width={Math.max(0, Math.min(100, 100 - (insights?.deductiblePercentage ?? 0)))}
                    height="24"
                    className="tax-deductibility-fill-non-deductible"
                  />
                </svg>
              </div>
              <div className="small">
                <div className="mb-2">
                  <span className="tax-legend-deductible">● Deductible: ${(insights?.totalDeductible ?? 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="tax-legend-non-deductible">● Non-deductible: ${(insights?.totalNonDeductible ?? 0).toFixed(2)}</span>
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
                    ['Assumed Tax Rate', `${taxRate}%`],
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
                    <div className="tax-category-track" role="img" aria-label={`${cat.category} total`}>
                      <svg className="tax-category-svg" viewBox="0 0 100 8" preserveAspectRatio="none">
                        <rect
                          x="0"
                          y="0"
                          width={Math.max(0, Math.min(100, (cat.total / maxCat) * 100))}
                          height="8"
                          className={cat.taxDeductible ? 'tax-category-fill-deductible' : 'tax-category-fill-non-deductible'}
                        />
                      </svg>
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
                <div className="d-flex align-items-end gap-2 tax-months-chart">
                  {insights?.byMonth.map(m => (
                    <div key={m.month} className="flex-grow-1 d-flex flex-column align-items-center gap-1">
                      <small className="text-muted">${m.total.toFixed(0)}</small>
                      <svg className="tax-month-bar" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${m.month} monthly total`}>
                        <rect
                          x="0"
                          y={100 - Math.max(4, Math.min(100, (m.total / maxMonth) * 100))}
                          width="100"
                          height={Math.max(4, Math.min(100, (m.total / maxMonth) * 100))}
                          className="tax-month-bar-fill"
                        />
                      </svg>
                      <small className="text-muted tax-month-label">
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
