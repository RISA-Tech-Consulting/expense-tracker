import { useEffect, useState } from 'react';
import { fetchInsights, getTaxRate } from '../api';
import { InsightsSummary } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import './TaxInsights.css';

const COLORS_DEDUCTIBLE = '#10b981';
const COLORS_NON_DEDUCTIBLE = '#ef4444';
const BAR_COLOR = '#3b82f6';

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

  const pieData = [
    { name: 'Deductible', value: insights?.totalDeductible ?? 0 },
    { name: 'Non-Deductible', value: insights?.totalNonDeductible ?? 0 },
  ].filter(d => d.value > 0);

  const categoryData = (insights?.byCategory ?? []).map(c => ({
    name: c.category,
    total: c.total,
    fill: c.taxDeductible ? COLORS_DEDUCTIBLE : COLORS_NON_DEDUCTIBLE,
  }));

  const monthlyData = (insights?.byMonth ?? []).map(m => ({
    month: m.month,
    total: m.total,
  }));

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

      {/* Deductible vs Non-Deductible Pie & Tax Summary */}
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
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      <Cell fill={COLORS_DEDUCTIBLE} />
                      <Cell fill={COLORS_NON_DEDUCTIBLE} />
                    </Pie>
                    <Tooltip formatter={(val) => `$${Number(val).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted">No data yet.</p>
              )}
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

      {/* By Category & Monthly Trend - Bar Charts */}
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">By Category</h5>
            </div>
            <div className="card-body">
              {categoryData.length === 0 ? (
                <p className="text-muted mb-0">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, categoryData.length * 40)}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" tickFormatter={(v: number) => `$${v}`} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(val) => `$${Number(val).toFixed(2)}`} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
              {monthlyData.length === 0 ? (
                <p className="text-muted mb-0">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData} margin={{ left: 10, right: 10, bottom: 20 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" />
                    <YAxis tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip formatter={(val) => `$${Number(val).toFixed(2)}`} />
                    <Bar dataKey="total" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
