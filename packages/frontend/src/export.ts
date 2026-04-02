import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Expense } from './types';

export function exportExpensesCSV(expenses: Expense[]): void {
  const headers = ['Title', 'Category', 'Amount', 'Date', 'Tax Deductible', 'Description'];
  const rows = expenses.map(e => [
    `"${e.title.replace(/"/g, '""')}"`,
    `"${e.category}"`,
    e.amount.toFixed(2),
    e.date,
    e.taxDeductible ? 'Yes' : 'No',
    `"${(e.description ?? '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `expenses-${todayStamp()}.csv`);
}

export function exportExpensesPDF(expenses: Expense[]): void {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Expense Report', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const deductible = expenses.filter(e => e.taxDeductible).reduce((s, e) => s + e.amount, 0);
  doc.text(`Total: $${total.toFixed(2)}  |  Deductible: $${deductible.toFixed(2)}  |  ${expenses.length} expenses`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [['Title', 'Category', 'Amount', 'Date', 'Tax Ded.']],
    body: expenses.map(e => [
      e.title,
      e.category,
      `$${e.amount.toFixed(2)}`,
      e.date,
      e.taxDeductible ? 'Yes' : 'No',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`expenses-${todayStamp()}.pdf`);
}

function todayStamp(): string {
  return new Date().toISOString().split('T')[0];
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
