import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchExpenses, fetchCategories, createExpense, updateExpense, deleteExpense } from '../api';
import { Expense, Category } from '../types';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseCard from '../components/ExpenseCard';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | undefined>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let startDate = filterStart || undefined;
    let endDate = filterEnd || undefined;
    if (filterYear) {
      startDate = startDate || `${filterYear}-01-01`;
      endDate = endDate || `${filterYear}-12-31`;
    }
    const [exps, cats] = await Promise.all([
      fetchExpenses({ category: filterCategory || undefined, startDate, endDate }),
      fetchCategories(),
    ]);
    setExpenses(exps);
    setCategories(cats);
    setLoading(false);
  }, [filterCategory, filterYear, filterStart, filterEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: Omit<Expense, 'id'>, attachment?: File) => {
    if (editExpense) {
      await updateExpense(editExpense.id, data, attachment);
    } else {
      await createExpense(data, attachment);
    }
    setShowForm(false);
    setEditExpense(undefined);
    load();
  };

  const handleDelete = async (id: number) => {
    const expense = expenses.find(e => e.id === id);
    if (!confirm(`Delete "${expense?.title ?? 'this expense'}"?`)) return;
    await deleteExpense(id);
    load();
  };

  return (
    <div className="p-3 p-md-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 gap-3">
        <div>
          <h2 className="mb-2">Expenses</h2>
          <p className="text-muted mb-0">Manage and track your expenses · <Link to="/dashboard" className="text-decoration-none"><i className="bi bi-speedometer2 me-1"></i>Dashboard</Link></p>
        </div>
        <button
          onClick={() => {
            setEditExpense(undefined);
            setShowForm(true);
          }}
          className="btn btn-primary btn-sm"
        >
          <i className="bi bi-plus-lg me-1"></i>Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-6 col-sm-4 col-lg-2">
              <select className="form-select form-select-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-sm-4 col-lg-2">
              <select className="form-select form-select-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="">All Years</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-sm-4 col-lg-3">
              <input className="form-control form-control-sm" type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
            </div>
            <div className="col-6 col-sm-4 col-lg-3">
              <input className="form-control form-control-sm" type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
            </div>
            <div className="col-12 col-sm-4 col-lg-2">
              <button
                onClick={() => {
                  setFilterCategory('');
                  setFilterYear('');
                  setFilterStart('');
                  setFilterEnd('');
                }}
                className="btn btn-outline-secondary btn-sm w-100"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2 mb-0">Loading...</p>
            </div>
          ) : expenses.length === 0 ? (
            <p className="p-4 text-center text-muted mb-0">No expenses found.</p>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="small">Title</th>
                      <th className="small">Category</th>
                      <th className="small">Amount</th>
                      <th className="small">Date</th>
                      <th className="small">Status</th>
                      <th className="small">Attachment</th>
                      <th className="small">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <ExpenseCard
                        key={e.id}
                        expense={e}
                        onEdit={exp => {
                          setEditExpense(exp);
                          setShowForm(true);
                        }}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card view */}
              <div className="d-md-none">
                {expenses.map(e => (
                  <ExpenseCard
                    key={e.id}
                    expense={e}
                    variant="card"
                    onEdit={exp => {
                      setEditExpense(exp);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <ExpenseForm
          expense={editExpense}
          categories={categories}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditExpense(undefined);
          }}
        />
      )}
    </div>
  );
}
