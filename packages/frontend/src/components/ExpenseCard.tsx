import { Expense } from '../types';

function openAttachment(dataUri: string) {
  const [meta, base64] = dataUri.split(',');
  const mime = meta.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  window.open(URL.createObjectURL(blob), '_blank');
}

interface Props {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  variant?: 'row' | 'card';
}

export default function ExpenseCard({ expense, onEdit, onDelete, variant = 'row' }: Props) {
  if (variant === 'card') {
    return (
      <div className="card border-0 border-bottom rounded-0 p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="me-2" style={{ minWidth: 0 }}>
            <div className="fw-semibold small text-truncate">{expense.title}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{expense.category} · {expense.date}</div>
          </div>
          <div className="fw-bold small text-nowrap">${expense.amount.toFixed(2)}</div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge ${expense.taxDeductible ? 'bg-success' : 'bg-danger'}`}
              style={{ fontSize: '0.7rem' }}
            >
              {expense.taxDeductible ? 'Deductible' : 'Non-deductible'}
            </span>
            {expense.attachment && (
              <a href="#" onClick={(e) => { e.preventDefault(); openAttachment(expense.attachment!); }} style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-paperclip"></i>
              </a>
            )}
          </div>
          <div className="d-flex gap-2">
            <button onClick={() => onEdit(expense)} className="btn btn-outline-primary btn-sm px-2 py-1"><i className="bi bi-pencil-square"></i></button>
            <button onClick={() => onDelete(expense.id)} className="btn btn-outline-danger btn-sm px-2 py-1"><i className="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr>
      <td className="small">{expense.title}</td>
      <td className="text-muted small">{expense.category}</td>
      <td className="fw-bold small">${expense.amount.toFixed(2)}</td>
      <td className="text-muted small">{expense.date}</td>
      <td>
        <span
          className={`badge ${
            expense.taxDeductible ? 'bg-success' : 'bg-danger'
          } small`}
        >
          {expense.taxDeductible ? 'Deductible' : 'Non-deductible'}
        </span>
      </td>
      <td>
        {expense.attachment ? (
          <a href="#" onClick={(e) => { e.preventDefault(); openAttachment(expense.attachment!); }} className="small">
            <i className="bi bi-paperclip"></i>
          </a>
        ) : (
          <span className="text-muted small">—</span>
        )}
      </td>
      <td>
        <div className="d-flex gap-2">
          <button
            onClick={() => onEdit(expense)}
            className="btn btn-outline-primary btn-sm px-2 py-1"
          >
            <i className="bi bi-pencil-square"></i>
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="btn btn-outline-danger btn-sm px-2 py-1"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}
