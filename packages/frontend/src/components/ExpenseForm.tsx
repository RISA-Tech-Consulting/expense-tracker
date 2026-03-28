import { useState, useEffect } from 'react';
import { Expense, Category } from '../types';
import './ExpenseForm.css';

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

  return (
    <div className="modal d-block expense-form-overlay">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-bottom">
            <h5 className="modal-title">{expense ? 'Edit Expense' : 'Add Expense'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">
                  Title <span className="text-danger">*</span>
                </label>
                <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Amount ($) <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Category <span className="text-danger">*</span>
                </label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Date <span className="text-danger">*</span>
                </label>
                <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="taxDeductible"
                  checked={taxDeductible}
                  onChange={e => setTaxDeductible(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="taxDeductible">
                  Tax Deductible
                </label>
              </div>
            </div>
            <div className="modal-footer border-top">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {expense ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
