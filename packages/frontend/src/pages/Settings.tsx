import { useEffect, useState, useCallback } from 'react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTaxRate,
  setTaxRate,
} from '../api';
import { Category } from '../types';

export default function Settings() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxRate, setTaxRateState] = useState(30);
  const [loading, setLoading] = useState(true);

  // Category form state
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [taxDeductible, setTaxDeductible] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [cats, rate] = await Promise.all([fetchCategories(), getTaxRate()]);
    setCategories(cats);
    setTaxRateState(rate);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditId(null);
    setName('');
    setColor('#6B7280');
    setTaxDeductible(false);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await updateCategory(editId, { name: name.trim(), color, taxDeductible });
      } else {
        await createCategory({ name: name.trim(), color, taxDeductible });
      }
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditId(cat.id);
    setName(cat.name);
    setColor(cat.color);
    setTaxDeductible(cat.taxDeductible);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await deleteCategory(id);
    if (editId === id) resetForm();
    await load();
  };

  const handleTaxRateChange = async (value: string) => {
    const rate = parseFloat(value);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    setTaxRateState(rate);
    await setTaxRate(rate);
  };

  if (loading) {
    return (
      <div className="p-5 text-muted">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        Loading...
      </div>
    );
  }

  return (
    <div className="p-3 p-md-5">
      <h2 className="mb-2">Settings</h2>
      <p className="text-muted mb-4 mb-md-5">Manage categories and tax configuration</p>

      <div className="row g-4">
        {/* Tax Rate */}
        <div className="col-12 col-lg-4">
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Tax Rate</h5>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                Set the assumed tax rate used to estimate tax savings on the Tax Insights page.
              </p>
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="100"
                  step="1"
                  value={taxRate}
                  onChange={e => handleTaxRateChange(e.target.value)}
                />
                <span className="input-group-text">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Form */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 mb-4">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">{editId !== null ? 'Edit Category' : 'Add Category'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveCategory}>
                <div className="row g-2 align-items-end">
                  <div className="col-12 col-sm-4">
                    <label className="form-label small">Name</label>
                    <input
                      className="form-control form-control-sm"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Category name"
                    />
                  </div>
                  <div className="col-6 col-sm-2">
                    <label className="form-label small">Color</label>
                    <input
                      className="form-control form-control-sm form-control-color w-100"
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                    />
                  </div>
                  <div className="col-6 col-sm-3 d-flex align-items-end pb-1">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="catTaxDeductible"
                        checked={taxDeductible}
                        onChange={e => setTaxDeductible(e.target.checked)}
                      />
                      <label className="form-check-label small" htmlFor="catTaxDeductible">
                        Tax Deductible
                      </label>
                    </div>
                  </div>
                  <div className="col-12 col-sm-3 d-flex gap-2">
                    <button type="submit" className="btn btn-primary btn-sm flex-grow-1" disabled={saving}>
                      {editId !== null ? 'Update' : 'Add'}
                    </button>
                    {editId !== null && (
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Categories List */}
          <div className="card border-0">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0">Categories</h5>
            </div>
            <div className="card-body p-0">
              {categories.length === 0 ? (
                <p className="p-4 text-center text-muted mb-0">No categories yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="small">Color</th>
                        <th className="small">Name</th>
                        <th className="small">Tax Deductible</th>
                        <th className="small">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id}>
                          <td>
                            <span
                              className="d-inline-block rounded-circle"
                              style={{ width: 18, height: 18, backgroundColor: cat.color }}
                            />
                          </td>
                          <td className="small">{cat.name}</td>
                          <td>
                            <span className={`badge ${cat.taxDeductible ? 'bg-success' : 'bg-danger'} small`}>
                              {cat.taxDeductible ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary btn-sm" onClick={() => handleEdit(cat)}>
                                Edit
                              </button>
                              <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(cat.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
