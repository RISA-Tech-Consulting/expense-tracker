import { Router, Request, Response } from 'express';
import db from '../db';
import { Expense } from '../types';

const router = Router();

interface ExpenseRow {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  taxDeductible: number;
}

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    category: row.category,
    date: row.date,
    description: row.description ?? undefined,
    taxDeductible: row.taxDeductible === 1,
  };
}

router.get('/', (req: Request, res: Response) => {
  try {
    const { category, startDate, endDate } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params: unknown[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';
    const rows = db.prepare(query).all(...params) as ExpenseRow[];
    res.json(rows.map(rowToExpense));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id) as ExpenseRow | undefined;
    if (!row) return res.status(404).json({ error: 'Expense not found' });
    res.json(rowToExpense(row));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { title, amount, category, date, description, taxDeductible } = req.body as {
      title: string;
      amount: number;
      category: string;
      date: string;
      description?: string;
      taxDeductible?: boolean;
    };
    const missing = [
      !title && 'title',
      amount === undefined && 'amount',
      !category && 'category',
      !date && 'date',
    ].filter(Boolean);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    const result = db.prepare(
      'INSERT INTO expenses (title, amount, category, date, description, taxDeductible) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(title, amount, category, date, description ?? null, taxDeductible ? 1 : 0);

    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid) as ExpenseRow;
    res.status(201).json(rowToExpense(newExpense));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { title, amount, category, date, description, taxDeductible } = req.body as {
      title?: string;
      amount?: number;
      category?: string;
      date?: string;
      description?: string;
      taxDeductible?: boolean;
    };
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id) as ExpenseRow | undefined;
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    db.prepare(
      'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ?, description = ?, taxDeductible = ? WHERE id = ?'
    ).run(
      title ?? existing.title,
      amount ?? existing.amount,
      category ?? existing.category,
      date ?? existing.date,
      description !== undefined ? description : existing.description,
      taxDeductible !== undefined ? (taxDeductible ? 1 : 0) : existing.taxDeductible,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id) as ExpenseRow;
    res.json(rowToExpense(updated));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
