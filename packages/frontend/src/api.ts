import { Expense, Category, InsightsSummary } from './types';
import db, { seedDefaultCategories } from './db';

// Ensure default categories exist on first use
const ready = seedDefaultCategories();

function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fetchExpenses(filters?: {
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Expense[]> {
  await ready;
  let results = await db.expenses.orderBy('date').reverse().toArray();

  if (filters?.category) {
    results = results.filter(e => e.category === filters.category);
  }
  if (filters?.startDate) {
    results = results.filter(e => e.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter(e => e.date <= filters.endDate!);
  }

  return results.map(r => ({
    id: r.id!,
    title: r.title,
    amount: r.amount,
    category: r.category,
    date: r.date,
    description: r.description,
    taxDeductible: r.taxDeductible,
    attachment: r.attachment,
  }));
}

export async function createExpense(data: Omit<Expense, 'id'>, attachment?: File): Promise<Expense> {
  await ready;
  let attachmentData: string | undefined;
  if (attachment) {
    attachmentData = await fileToDataURI(attachment);
  }
  const id = await db.expenses.add({
    title: data.title,
    amount: data.amount,
    category: data.category,
    date: data.date,
    description: data.description,
    taxDeductible: data.taxDeductible,
    attachment: attachmentData,
    attachmentName: attachment?.name,
  });
  return { ...data, id: id as number, attachment: attachmentData };
}

export async function updateExpense(id: number, data: Partial<Omit<Expense, 'id'>>, attachment?: File): Promise<Expense> {
  await ready;
  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.amount !== undefined) updates.amount = data.amount;
  if (data.category !== undefined) updates.category = data.category;
  if (data.date !== undefined) updates.date = data.date;
  if (data.description !== undefined) updates.description = data.description;
  if (data.taxDeductible !== undefined) updates.taxDeductible = data.taxDeductible;
  if (attachment) {
    updates.attachment = await fileToDataURI(attachment);
    updates.attachmentName = attachment.name;
  }

  await db.expenses.update(id, updates);
  const row = await db.expenses.get(id);
  if (!row) throw new Error('Expense not found');
  return {
    id: row.id!,
    title: row.title,
    amount: row.amount,
    category: row.category,
    date: row.date,
    description: row.description,
    taxDeductible: row.taxDeductible,
    attachment: row.attachment,
  };
}

export async function deleteExpense(id: number): Promise<void> {
  await ready;
  await db.expenses.delete(id);
}

export async function fetchCategories(): Promise<Category[]> {
  await ready;
  const rows = await db.categories.toArray();
  return rows.map(r => ({
    id: r.id!,
    name: r.name,
    taxDeductible: r.taxDeductible,
    color: r.color,
  }));
}

export async function createCategory(data: Omit<Category, 'id'>): Promise<Category> {
  await ready;
  const id = await db.categories.add({
    name: data.name,
    taxDeductible: data.taxDeductible,
    color: data.color,
  });
  return { ...data, id: id as number };
}

export async function updateCategory(id: number, data: Partial<Omit<Category, 'id'>>): Promise<Category> {
  await ready;
  await db.categories.update(id, data);
  const row = await db.categories.get(id);
  if (!row) throw new Error('Category not found');
  return { id: row.id!, name: row.name, taxDeductible: row.taxDeductible, color: row.color };
}

export async function deleteCategory(id: number): Promise<void> {
  await ready;
  await db.categories.delete(id);
}

export async function getTaxRate(): Promise<number> {
  await ready;
  const row = await db.settings.get('taxRate');
  return row ? parseFloat(row.value) : 30;
}

export async function setTaxRate(rate: number): Promise<void> {
  await ready;
  await db.settings.put({ key: 'taxRate', value: String(rate) });
}

export async function fetchInsights(): Promise<InsightsSummary> {
  await ready;
  const allExpenses = await db.expenses.toArray();
  const categories = await db.categories.toArray();

  const categoryTaxMap = new Map<string, boolean>(
    categories.map(c => [c.name, c.taxDeductible])
  );

  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductible = allExpenses
    .filter(e => e.taxDeductible)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalNonDeductible = totalExpenses - totalDeductible;

  const categoryMap = new Map<string, { total: number; taxDeductible: boolean }>();
  for (const e of allExpenses) {
    const existing = categoryMap.get(e.category);
    const isTaxDeductible = categoryTaxMap.get(e.category) ?? e.taxDeductible;
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
    const month = e.date.substring(0, 7);
    monthMap.set(month, (monthMap.get(month) ?? 0) + e.amount);
  }
  const byMonth = Array.from(monthMap.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const deductiblePercentage = totalExpenses > 0 ? (totalDeductible / totalExpenses) * 100 : 0;

  return {
    totalExpenses,
    totalDeductible,
    totalNonDeductible,
    byCategory,
    byMonth,
    deductiblePercentage,
  };
}

// ── Backup & Restore ──

export interface BackupData {
  version: number;
  createdAt: string;
  expenses: Omit<Expense, 'id'>[];
  categories: Omit<Category, 'id'>[];
  settings: { key: string; value: string }[];
}

export async function exportBackup(): Promise<BackupData> {
  await ready;
  const expenses = (await db.expenses.toArray()).map(({ id, ...rest }) => rest);
  const categories = (await db.categories.toArray()).map(({ id, ...rest }) => rest);
  const settings = await db.settings.toArray();
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    expenses,
    categories,
    settings,
  };
}

export async function importBackup(data: BackupData): Promise<void> {
  await ready;
  await db.transaction('rw', db.expenses, db.categories, db.settings, async () => {
    await db.expenses.clear();
    await db.categories.clear();
    await db.settings.clear();
    if (data.categories.length) await db.categories.bulkAdd(data.categories);
    if (data.expenses.length) await db.expenses.bulkAdd(data.expenses);
    if (data.settings.length) await db.settings.bulkPut(data.settings);
  });
}

export function downloadBackupFile(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expense-tracker-backup-${data.createdAt.slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type BackupSchedule = 'off' | 'daily' | 'weekly' | 'monthly';

export async function getBackupSchedule(): Promise<BackupSchedule> {
  await ready;
  const row = await db.settings.get('backupSchedule');
  return (row?.value as BackupSchedule) || 'off';
}

export async function setBackupSchedule(schedule: BackupSchedule): Promise<void> {
  await ready;
  await db.settings.put({ key: 'backupSchedule', value: schedule });
}

export async function getLastBackupTime(): Promise<string | null> {
  await ready;
  const row = await db.settings.get('lastBackupTime');
  return row?.value ?? null;
}

export async function setLastBackupTime(time: string): Promise<void> {
  await ready;
  await db.settings.put({ key: 'lastBackupTime', value: time });
}

export function isBackupDue(schedule: BackupSchedule, lastBackup: string | null): boolean {
  if (schedule === 'off') return false;
  if (!lastBackup) return true;
  const last = new Date(lastBackup).getTime();
  const now = Date.now();
  const diff = now - last;
  const day = 24 * 60 * 60 * 1000;
  switch (schedule) {
    case 'daily': return diff >= day;
    case 'weekly': return diff >= 7 * day;
    case 'monthly': return diff >= 30 * day;
    default: return false;
  }
}
