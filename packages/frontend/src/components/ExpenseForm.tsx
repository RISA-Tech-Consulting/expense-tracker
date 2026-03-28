import { useState, useEffect } from 'react';
import { Expense, Category } from '../types';

interface Props {
  expense?: Expense;
  categories: Category[];
  onSave: (data: Omit<Expense, 'id'>) => void;
  onClose: () => void;
}

export default function ExpenseForm({ expense, categories, onSave, onClose }: Props) {
  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [category, setCategory] = useState(expense?.category ?? (categories[0]?.name ?? ''));
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(expense?.description ?? '');
  const [taxDeductible, setTaxDeductible] = useState(expense?.taxDeductible ?? false);

  useEffect(() => {
    const cat = categories.find(c => c.name === category);
    if (cat && !expense) setTaxDeductible(cat.taxDeductible);
  }, [category, categories, expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, amount: parseFloat(amount), category, date, description: description || undefined, taxDeductible });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 4,
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 20, color: '#1E293B' }}>
          {expense ? 'Edit Expense' : 'Add Expense'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Amount ($) *</label>
            <input style={inputStyle} type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Category *</label>
            <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Date *</label>
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="taxDeductible" checked={taxDeductible} onChange={e => setTaxDeductible(e.target.checked)} />
            <label htmlFor="taxDeductible" style={{ fontSize: 14, color: '#374151' }}>Tax Deductible</label>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #CBD5E1', background: 'white', cursor: 'pointer', fontSize: 14 }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#3B82F6', color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              {expense ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
