import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchExpenses, fetchCategories, fetchAllTags, createExpense, updateExpense, deleteExpense } from '../api';
import { Expense, Category } from '../types';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseCard from '../components/ExpenseCard';
import { showToast } from '../components/ToastContainer';
import { exportExpensesCSV, exportExpensesPDF } from '../export';

const PAGE_SIZE = 20;

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    let startDate = filterStart || undefined;
    let endDate = filterEnd || undefined;
    if (filterYear) {
      startDate = startDate || `${filterYear}-01-01`;
      endDate = endDate || `${filterYear}-12-31`;
    }
    const [exps, cats, tags] = await Promise.all([
      fetchExpenses({ category: filterCategory || undefined, startDate, endDate }),
      fetchCategories(),
      fetchAllTags(),
    ]);
    setExpenses(exps);
    setCategories(cats);
    setAllTags(tags);
    setLoading(false);
  }, [filterCategory, filterYear, filterStart, filterEnd]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page when filters/search change
  useEffect(() => { setPage(1); }, [filterCategory, filterYear, filterStart, filterEnd, searchQuery, filterTag]);

  const filtered = useMemo(() => {
    let result = expenses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q))
      );
    }
    if (filterTag) {
      result = result.filter(e => e.tags?.includes(filterTag));
    }
    return result;
  }, [expenses, searchQuery, filterTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSave = async (data: Omit<Expense, 'id'>, attachment?: File) => {
    try {
      if (editExpense) {
        await updateExpense(editExpense.id, data, attachment);
        showToast('Expense updated');
      } else {
        await createExpense(data, attachment);
        showToast('Expense created');
      }
      setShowForm(false);
      setEditExpense(undefined);
      load();
    } catch {
      showToast('Failed to save expense', 'danger');
    }
  };

  const handleDelete = async (id: number) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    // Optimistic delete
    const backup = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== id));

    try {
      await deleteExpense(id);
      showToast(`Deleted "${expense.title}"`, 'warning', async () => {
        // Undo: re-create the expense
        try {
          await createExpense({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            description: expense.description,
            taxDeductible: expense.taxDeductible,
            tags: expense.tags,
          });
          showToast('Expense restored');
          load();
        } catch {
          showToast('Failed to restore expense', 'danger');
        }
      });
    } catch {
      setExpenses(backup);
      showToast('Failed to delete expense', 'danger');
    }
  };

  return (
    <div className="p-3 p-md-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 gap-3">
        <div>
          <h2 className="mb-2">Expenses</h2>
          <p className="text-muted mb-0">Manage and track your expenses · <Link to="/dashboard" className="text-decoration-none"><i className="bi bi-speedometer2 me-1"></i>Dashboard</Link></p>
        </div>
        <div className="d-flex gap-2">
          <div className="dropdown">
            <button className="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <i className="bi bi-download me-1"></i>Export
            </button>
            <ul className="dropdown-menu">
              <li><button className="dropdown-item" onClick={() => exportExpensesCSV(filtered)}>CSV</button></li>
              <li><button className="dropdown-item" onClick={() => exportExpensesPDF(filtered)}>PDF</button></li>
            </ul>
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
      </div>

      {/* Search + Filters */}
      <div className="card border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-lg-4 mb-2 mb-lg-0">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
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
              <select className="form-select form-select-sm" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                <option value="">All Tags</option>
                {allTags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-sm-4 col-lg-1">
              <select className="form-select form-select-sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="">Year</option>
                {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-sm-4 col-lg-2">
              <input className="form-control form-control-sm" type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
            </div>
            <div className="col-6 col-sm-4 col-lg-2">
              <input className="form-control form-control-sm" type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
            </div>
            <div className="col-12 col-sm-4 col-lg-1">
              <button
                onClick={() => {
                  setFilterCategory('');
                  setFilterYear('');
                  setFilterStart('');
                  setFilterEnd('');
                  setSearchQuery('');
                  setFilterTag('');
                }}
                className="btn btn-outline-secondary btn-sm w-100"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-muted">{filtered.length} expense{filtered.length !== 1 ? 's' : ''}</small>
        </div>
      )}

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
          ) : paginated.length === 0 ? (
            <p className="p-4 text-center text-muted mb-0">
              {searchQuery ? `No expenses matching "${searchQuery}".` : 'No expenses found.'}
            </p>
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
                      <th className="small">Tags</th>
                      <th className="small">Status</th>
                      <th className="small">Attachment</th>
                      <th className="small">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(e => (
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
                {paginated.map(e => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-2 p-3">
                  <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <small className="text-muted">Page {page} of {totalPages}</small>
                  <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && (
        <ExpenseForm
          expense={editExpense}
          categories={categories}
          existingTags={allTags}
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
