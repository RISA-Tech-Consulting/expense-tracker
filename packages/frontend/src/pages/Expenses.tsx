import { useEffect, useState, useCallback } from 'react';
import { fetchExpenses, fetchCategories, createExpense, updateExpense, deleteExpense } from '../api';
import { Expense, Category } from '../types';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseCard from '../components/ExpenseCard';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | undefined>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [exps, cats] = await Promise.all([
      fetchExpenses({ category: filterCategory || undefined, startDate: filterStart || undefined, endDate: filterEnd || undefined }),
      fetchCategories(),
    ]);
    setExpenses(exps);
    setCategories(cats);
    setLoading(false);
  }, [filterCategory, filterStart, filterEnd]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Omit<Expense, 'id'>) => {
    if (editExpense) {
      await updateExpense(editExpense.id, data);
    } else {
      await createExpense(data);
    }
    setShowForm(false);
    setEditExpense(undefined);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense(id);
    load();
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: 6,
    fontSize: 14,
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: '#1E293B' }}>Expenses</h2>
        <button
          onClick={() => { setEditExpense(undefined); setShowForm(true); }}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#3B82F6', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          + Add Expense
        </button>
      </div>
      <p style={{ margin: '0 0 24px', color: '#64748B' }}>Manage and track your expenses</p>

      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid #E2E8F0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select style={inputStyle} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input style={inputStyle} type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} placeholder="Start date" />
        <input style={inputStyle} type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} placeholder="End date" />
        <button onClick={() => { setFilterCategory(''); setFilterStart(''); setFilterEnd(''); }} style={{ ...inputStyle, cursor: 'pointer', background: '#F1F5F9', border: '1px solid #CBD5E1' }}>
          Clear
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, color: '#94A3B8' }}>Loading...</p>
        ) : expenses.length === 0 ? (
          <p style={{ padding: 24, color: '#94A3B8', textAlign: 'center' }}>No expenses found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['Title', 'Category', 'Amount', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#64748B', fontWeight: 600, borderBottom: '2px solid #E2E8F0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <ExpenseCard key={e.id} expense={e} onEdit={exp => { setEditExpense(exp); setShowForm(true); }} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          expense={editExpense}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditExpense(undefined); }}
        />
      )}
    </div>
  );
}
