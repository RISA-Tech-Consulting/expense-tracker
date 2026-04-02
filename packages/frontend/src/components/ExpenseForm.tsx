import { useState, useEffect } from 'react';
import { Expense, Category } from '../types';
import './ExpenseForm.css';

interface Props {
  expense?: Expense;
  categories: Category[];
  existingTags?: string[];
  onSave: (data: Omit<Expense, 'id'>, attachment?: File) => void;
  onClose: () => void;
}

export default function ExpenseForm({ expense, categories, existingTags = [], onSave, onClose }: Props) {
  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [category, setCategory] = useState(expense?.category ?? (categories[0]?.name ?? ''));
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(expense?.description ?? '');
  const [taxDeductible, setTaxDeductible] = useState(expense?.taxDeductible ?? false);
  const [attachment, setAttachment] = useState<File | undefined>();
  const [tags, setTags] = useState<string[]>(expense?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const cat = categories.find(c => c.name === category);
    if (cat && !expense) setTaxDeductible(cat.taxDeductible);
  }, [category, categories, expense]);

  const [errors, setErrors] = useState<string[]>([]);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
    setTagInput('');
    setTagSuggestions([]);
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleTagInputChange = (val: string) => {
    setTagInput(val);
    if (val.trim()) {
      const q = val.toLowerCase();
      setTagSuggestions(existingTags.filter(t => t.includes(q) && !tags.includes(t)).slice(0, 5));
    } else {
      setTagSuggestions([]);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];
    const trimmedTitle = title.trim();
    if (!trimmedTitle) validationErrors.push('Title is required');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) validationErrors.push('Amount must be greater than 0');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) validationErrors.push('A valid date is required');
    if (attachment && attachment.size > 5 * 1024 * 1024) validationErrors.push('Attachment must be under 5 MB');
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    onSave({ title: trimmedTitle, amount: parsedAmount, category, date, description: description || undefined, taxDeductible, tags: tags.length > 0 ? tags : undefined }, attachment);
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
              {errors.length > 0 && (
                <div className="alert alert-danger py-2 mb-3">
                  {errors.map((err, i) => <div key={i} className="small">{err}</div>)}
                </div>
              )}
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
              <div className="mb-3">
                <label className="form-label">Tags</label>
                <div className="d-flex flex-wrap gap-1 mb-1">
                  {tags.map(tag => (
                    <span key={tag} className="badge bg-secondary d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                      {tag}
                      <button type="button" className="btn-close btn-close-white" style={{ fontSize: '0.5rem' }} onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}></button>
                    </span>
                  ))}
                </div>
                <div className="position-relative">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Type and press Enter to add a tag..."
                    value={tagInput}
                    onChange={e => handleTagInputChange(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  {tagSuggestions.length > 0 && (
                    <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 10, top: '100%' }}>
                      {tagSuggestions.map(s => (
                        <li key={s} className="list-group-item list-group-item-action py-1 small" style={{ cursor: 'pointer' }} onClick={() => addTag(s)}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="form-text">Press Enter or comma to add. Backspace to remove last.</div>
              </div>
              <div className="mb-3">
                <label className="form-label">Attachment</label>
                <input
                  className="form-control"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={e => setAttachment(e.target.files?.[0])}
                />
                <div className="form-text">PDF, JPEG, PNG, or WebP (max 5 MB)</div>
                {expense?.attachment && !attachment && (
                  <div className="mt-1">
                    <a href={expense.attachment} target="_blank" rel="noopener noreferrer" className="small">
                      View current attachment
                    </a>
                  </div>
                )}
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
