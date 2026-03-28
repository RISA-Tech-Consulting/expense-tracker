import { Router } from 'express';
import db from '../db';
import { Category } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM categories ORDER BY name').all() as Array<{
      id: number;
      name: string;
      taxDeductible: number;
      color: string;
    }>;
    const categories: Category[] = rows.map(row => ({
      ...row,
      taxDeductible: row.taxDeductible === 1,
    }));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
