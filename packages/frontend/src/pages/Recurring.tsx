import { useEffect, useState, useCallback } from 'react';
import {
  fetchRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  fetchCategories,
  type RecurringExpense,
} from '../api';
import { Category } from '../types';
import type { RecurringFrequency } from '../db';
import { showToast } from '../components/ToastContainer';

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function Recurring() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<RecurringExpense | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [taxDeductible, setTaxDeductible] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    const [recs, cats] = await Promise.all([fetchRecurringExpenses(), fetchCategories()]);
    setItems(recs);
    setCategories(cats);
    if (!category && cats.length) setCategory(cats[0].name);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditItem(null);
    setTitle('');
    setAmount('');
    setCategory(categories[0]?.name ?? '');
    setDescription('');
    setTaxDeductible(false);
    setFrequency('monthly');
    setNextDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const openEdit = (item: RecurringExpense) => {
    setEditItem(item);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setDescription(item.description ?? '');
    setTaxDeductible(item.taxDeductible);
    setFrequency(item.frequency);
    setNextDate(item.nextDate);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const data = {
      title: title.trim(),
      amount: parsedAmount,
      category,
      description: description || undefined,
      taxDeductible,
      frequency,
      nextDate,
      enabled: true,
    };

    try {
      if (editItem) {
        await updateRecurringExpense(editItem.id, data);
        showToast('Recurring expense updated');
      } else {
        await createRecurringExpense(data);
        showToast('Recurring expense created');
      }
      resetForm();
      load();
    } catch {
      showToast('Failed to save', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    await deleteRecurringExpense(id);
    showToast('Recurring expense deleted', 'warning');
    load();
  };

  const handleToggle = async (item: RecurringExpense) => {
    await updateRecurringExpense(item.id, { enabled: !item.enabled });
    load();
  };

  if (loading) {
    return (
      <div className="p-5 text-muted">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div> Loading...
      </div>
    );
  }

  return (
    <div className="p-3 p-md-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Recurring Expenses</h2>
          <p className="text-muted mb-0">Auto-create expenses on a schedule</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <i className="bi bi-plus-lg me-1"></i>Add Recurring
        </button>
      </div>

      {items.length === 0 && !showForm ? (
        <div className="card border-0">
          <div className="card-body text-center text-muted py-5">
            <i className="bi bi-arrow-repeat fs-1 d-block mb-2"></i>
            No recurring expenses yet.
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {items.map(item => (
            <div key={item.id} className="col-12 col-md-6 col-lg-4">
              <div className={`card border-0 h-100${!item.enabled ? ' opacity-50' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="card-title mb-0">{item.title}</h6>
                    <span className="fw-bold">${item.amount.toFixed(2)}</span>
                  </div>
                  <div className="small text-muted mb-2">{item.category}</div>
                  <div className="d-flex gap-2 mb-2">
                    <span className="badge bg-primary">{FREQUENCY_LABELS[item.frequency]}</span>
                    <span className={`badge ${item.taxDeductible ? 'bg-success' : 'bg-secondary'}`}>
                      {item.taxDeductible ? 'Deductible' : 'Non-deductible'}
                    </span>
                  </div>
                  <div className="small text-muted mb-3">Next: {item.nextDate}</div>
                  <div className="d-flex gap-2">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" checked={item.enabled} onChange={() => handleToggle(item)} />
                      <label className="form-check-label small">{item.enabled ? 'Active' : 'Paused'}</label>
                    </div>
                    <div className="ms-auto d-flex gap-1">
                      <button className="btn btn-outline-primary btn-sm px-2 py-0" onClick={() => openEdit(item)}>
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button className="btn btn-outline-danger btn-sm px-2 py-0" onClick={() => handleDelete(item.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title">{editItem ? 'Edit' : 'Add'} Recurring Expense</h5>
                <button type="button" className="btn-close" onClick={resetForm}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title <span className="text-danger">*</span></label>
                    <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label">Amount ($) <span className="text-danger">*</span></label>
                      <input className="form-control" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Frequency</label>
                      <select className="form-select" value={frequency} onChange={e => setFrequency(e.target.value as RecurringFrequency)}>
                        {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Next Date</label>
                      <input className="form-control" type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div className="form-check mb-3">
                    <input className="form-check-input" type="checkbox" id="recTaxDeductible" checked={taxDeductible} onChange={e => setTaxDeductible(e.target.checked)} />
                    <label className="form-check-label" htmlFor="recTaxDeductible">Tax Deductible</label>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
