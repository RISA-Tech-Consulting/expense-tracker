import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db';
import { Expense } from '../types';

const uploadsDir = path.join(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, PNG, and WebP files are allowed'));
    }
  },
});

const router = Router();

interface ExpenseRow {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  taxDeductible: number;
  attachment: string | null;
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
    attachment: row.attachment ?? undefined,
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

router.post('/', upload.single('attachment'), (req: Request, res: Response) => {
  try {
    const { title, amount, category, date, description, taxDeductible } = req.body;
    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    const isTaxDeductible = typeof taxDeductible === 'boolean'
      ? taxDeductible
      : (taxDeductible === 'true' || taxDeductible === '1');
    const errors: string[] = [];
    if (!title || typeof title !== 'string' || !title.trim()) errors.push('title is required');
    if (isNaN(parsedAmount) || parsedAmount <= 0) errors.push('amount must be a positive number');
    if (!category || typeof category !== 'string') errors.push('category is required');
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('date must be in YYYY-MM-DD format');
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    const attachment = req.file ? req.file.filename : null;
    const result = db.prepare(
      'INSERT INTO expenses (title, amount, category, date, description, taxDeductible, attachment) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(title, parsedAmount, category, date, description ?? null, isTaxDeductible ? 1 : 0, attachment);

    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid) as ExpenseRow;
    res.status(201).json(rowToExpense(newExpense));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.put('/:id', upload.single('attachment'), (req: Request, res: Response) => {
  try {
    const { title, amount, category, date, description, taxDeductible } = req.body;
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id) as ExpenseRow | undefined;
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    const parsedAmount = amount !== undefined
      ? (typeof amount === 'number' ? amount : parseFloat(amount))
      : undefined;
    const isTaxDeductible = taxDeductible !== undefined
      ? (typeof taxDeductible === 'boolean' ? taxDeductible : (taxDeductible === 'true' || taxDeductible === '1'))
      : undefined;
    const attachment = req.file ? req.file.filename : undefined;

    // Delete old attachment if a new one is uploaded
    if (attachment && existing.attachment) {
      const oldPath = path.join(uploadsDir, existing.attachment);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    db.prepare(
      'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ?, description = ?, taxDeductible = ?, attachment = ? WHERE id = ?'
    ).run(
      title ?? existing.title,
      parsedAmount ?? existing.amount,
      category ?? existing.category,
      date ?? existing.date,
      description !== undefined ? description : existing.description,
      isTaxDeductible !== undefined ? (isTaxDeductible ? 1 : 0) : existing.taxDeductible,
      attachment ?? existing.attachment,
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
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id) as ExpenseRow | undefined;
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    // Delete the attachment file if it exists
    if (existing.attachment) {
      const filePath = path.join(uploadsDir, existing.attachment);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
