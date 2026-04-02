import { useState } from 'react';
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

function isImageDataUri(uri: string): boolean {
  return /^data:image\//i.test(uri);
}

function AttachmentPreview({ dataUri }: { dataUri: string }) {
  const [expanded, setExpanded] = useState(false);

  if (isImageDataUri(dataUri)) {
    return (
      <div className="d-inline-block">
        <img
          src={dataUri}
          alt="Receipt"
          onClick={() => setExpanded(!expanded)}
          style={{
            width: expanded ? 200 : 32,
            height: expanded ? 'auto' : 32,
            objectFit: 'cover',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        />
        {expanded && (
          <div className="mt-1">
            <button className="btn btn-link btn-sm p-0" style={{ fontSize: '0.7rem' }} onClick={() => openAttachment(dataUri)}>
              Open full size
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <a href="#" onClick={(e) => { e.preventDefault(); openAttachment(dataUri); }} className="small">
      <i className="bi bi-file-earmark-pdf"></i> PDF
    </a>
  );
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
        {expense.attachment && isImageDataUri(expense.attachment) && (
          <div className="mb-2">
            <img src={expense.attachment} alt="Receipt" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 4, objectFit: 'cover' }} onClick={() => openAttachment(expense.attachment!)} />
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span
              className={`badge ${expense.taxDeductible ? 'bg-success' : 'bg-danger'}`}
              style={{ fontSize: '0.7rem' }}
            >
              {expense.taxDeductible ? 'Deductible' : 'Non-deductible'}
            </span>
            {expense.tags?.map(tag => (
              <span key={tag} className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>{tag}</span>
            ))}
            {expense.attachment && !isImageDataUri(expense.attachment) && (
              <a href="#" onClick={(e) => { e.preventDefault(); openAttachment(expense.attachment!); }} style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-file-earmark-pdf"></i>
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
        <div className="d-flex flex-wrap gap-1">
          {expense.tags?.map(tag => (
            <span key={tag} className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>{tag}</span>
          ))}
          {(!expense.tags || expense.tags.length === 0) && <span className="text-muted small">—</span>}
        </div>
      </td>
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
          <AttachmentPreview dataUri={expense.attachment} />
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
