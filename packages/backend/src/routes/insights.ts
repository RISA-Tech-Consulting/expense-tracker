import { Router } from 'express';
import db from '../db';
import { InsightsSummary } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const allExpenses = db.prepare('SELECT * FROM expenses').all() as Array<{
      id: number;
      amount: number;
      category: string;
      date: string;
      taxDeductible: number;
    }>;

    const categories = db.prepare('SELECT name, taxDeductible FROM categories').all() as Array<{
      name: string;
      taxDeductible: number;
    }>;
    const categoryTaxMap = new Map<string, boolean>(
      categories.map(c => [c.name, c.taxDeductible === 1])
    );

    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductible = allExpenses
      .filter(e => e.taxDeductible === 1)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalNonDeductible = totalExpenses - totalDeductible;

    const categoryMap = new Map<string, { total: number; taxDeductible: boolean }>();
    for (const e of allExpenses) {
      const existing = categoryMap.get(e.category);
      // Use category metadata for taxDeductible status; fall back to expense-level flag
      const isTaxDeductible = categoryTaxMap.get(e.category) ?? (e.taxDeductible === 1);
      if (existing) {
        existing.total += e.amount;
      } else {
        categoryMap.set(e.category, { total: e.amount, taxDeductible: isTaxDeductible });
      }
    }
    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      taxDeductible: data.taxDeductible,
    }));

    const monthMap = new Map<string, number>();
    for (const e of allExpenses) {
      const month = e.date.substring(0, 7); // YYYY-MM
      monthMap.set(month, (monthMap.get(month) ?? 0) + e.amount);
    }
    const byMonth = Array.from(monthMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const deductiblePercentage = totalExpenses > 0 ? (totalDeductible / totalExpenses) * 100 : 0;

    const summary: InsightsSummary = {
      totalExpenses,
      totalDeductible,
      totalNonDeductible,
      byCategory,
      byMonth,
      deductiblePercentage,
    };

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

export default router;
