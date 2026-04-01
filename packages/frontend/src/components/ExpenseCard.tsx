import { Expense } from '../types';

interface Props {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

export default function ExpenseCard({ expense, onEdit, onDelete }: Props) {
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
          <a href={expense.attachment} target="_blank" rel="noopener noreferrer" className="small">
            View
          </a>
        ) : (
          <span className="text-muted small">—</span>
        )}
      </td>
      <td>
        <div className="btn-group btn-group-sm" role="group">
          <button
            onClick={() => onEdit(expense)}
            className="btn btn-outline-primary btn-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="btn btn-outline-danger btn-sm"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
