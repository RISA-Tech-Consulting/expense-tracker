import { Expense } from '../types';

interface Props {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}

export default function ExpenseCard({ expense, onEdit, onDelete }: Props) {
  return (
    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
      <td style={{ padding: '12px 16px', fontSize: 14 }}>{expense.title}</td>
      <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748B' }}>{expense.category}</td>
      <td style={{ padding: '12px 16px', fontSize: 14 }}>${expense.amount.toFixed(2)}</td>
      <td style={{ padding: '12px 16px', fontSize: 14, color: '#64748B' }}>{expense.date}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 12,
          fontSize: 12,
          background: expense.taxDeductible ? '#DCFCE7' : '#FEE2E2',
          color: expense.taxDeductible ? '#16A34A' : '#DC2626',
        }}>
          {expense.taxDeductible ? 'Deductible' : 'Non-deductible'}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <button
          onClick={() => onEdit(expense)}
          style={{ marginRight: 8, padding: '4px 12px', borderRadius: 6, border: '1px solid #3B82F6', background: 'white', color: '#3B82F6', cursor: 'pointer', fontSize: 13 }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #EF4444', background: 'white', color: '#EF4444', cursor: 'pointer', fontSize: 13 }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
