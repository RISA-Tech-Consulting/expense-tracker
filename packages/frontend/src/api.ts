import { Expense, Category, InsightsSummary } from './types';
import db, { seedDefaultCategories, type ExpenseRecord, type RecurringFrequency, type RecurringExpenseRecord } from './db';

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

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 1920;
const COMPRESS_QUALITY = 0.7;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', COMPRESS_QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

async function processAttachment(file: File): Promise<string> {
  if (IMAGE_MIME_TYPES.includes(file.type)) {
    try {
      return await compressImage(file);
    } catch {
      // Fall back to raw data URI if compression fails
      return fileToDataURI(file);
    }
  }
  return fileToDataURI(file);
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
    tags: r.tags,
  }));
}

export async function createExpense(data: Omit<Expense, 'id'>, attachment?: File): Promise<Expense> {
  await ready;
  let attachmentData: string | undefined = data.attachment;
  if (attachment) {
    attachmentData = await processAttachment(attachment);
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
    tags: data.tags ?? [],
  });
  return { ...data, id: id as number, attachment: attachmentData };
}

export async function updateExpense(id: number, data: Partial<Omit<Expense, 'id'>>, attachment?: File): Promise<Expense> {
  await ready;
  const updates: Partial<ExpenseRecord> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.amount !== undefined) updates.amount = data.amount;
  if (data.category !== undefined) updates.category = data.category;
  if (data.date !== undefined) updates.date = data.date;
  if (data.description !== undefined) updates.description = data.description;
  if (data.taxDeductible !== undefined) updates.taxDeductible = data.taxDeductible;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (attachment) {
    updates.attachment = await processAttachment(attachment);
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
    tags: row.tags,
  };
}

export async function deleteExpense(id: number): Promise<void> {
  await ready;
  await db.expenses.delete(id);
}

export async function fetchAllTags(): Promise<string[]> {
  await ready;
  const all = await db.expenses.toArray();
  const tagSet = new Set<string>();
  for (const e of all) {
    if (e.tags) e.tags.forEach(t => tagSet.add(t));
  }
  return Array.from(tagSet).sort();
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
  const cat = await db.categories.get(id);
  if (cat) {
    // Reassign orphaned expenses to 'Others'
    await db.expenses.where('category').equals(cat.name).modify({ category: 'Others' });
  }
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

export async function fetchInsights(year?: string): Promise<InsightsSummary> {
  await ready;
  let allExpenses = await db.expenses.toArray();
  if (year) {
    allExpenses = allExpenses.filter(e => e.date.startsWith(year));
  }
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

// ── Recurring Expenses ──

export interface RecurringExpense {
  id: number;
  title: string;
  amount: number;
  category: string;
  description?: string;
  taxDeductible: boolean;
  frequency: RecurringFrequency;
  nextDate: string;
  enabled: boolean;
}

export async function fetchRecurringExpenses(): Promise<RecurringExpense[]> {
  await ready;
  const rows = await db.recurringExpenses.toArray();
  return rows.map(r => ({ ...r, id: r.id! }));
}

export async function createRecurringExpense(data: Omit<RecurringExpense, 'id'>): Promise<RecurringExpense> {
  await ready;
  const id = await db.recurringExpenses.add(data as RecurringExpenseRecord);
  return { ...data, id: id as number };
}

export async function updateRecurringExpense(id: number, data: Partial<Omit<RecurringExpense, 'id'>>): Promise<void> {
  await ready;
  await db.recurringExpenses.update(id, data);
}

export async function deleteRecurringExpense(id: number): Promise<void> {
  await ready;
  await db.recurringExpenses.delete(id);
}

function advanceDate(dateStr: string, frequency: RecurringFrequency): string {
  const d = new Date(dateStr + 'T00:00:00');
  switch (frequency) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
}

export async function processRecurringExpenses(): Promise<number> {
  await ready;
  const today = new Date().toISOString().split('T')[0];
  const due = await db.recurringExpenses.where('enabled').equals(1).toArray();
  let created = 0;
  for (const rec of due) {
    if (!rec.enabled || rec.nextDate > today) continue;
    // Create expense for each due date up to today
    let next = rec.nextDate;
    while (next <= today) {
      await db.expenses.add({
        title: rec.title,
        amount: rec.amount,
        category: rec.category,
        date: next,
        description: rec.description,
        taxDeductible: rec.taxDeductible,
      });
      next = advanceDate(next, rec.frequency);
      created++;
    }
    await db.recurringExpenses.update(rec.id!, { nextDate: next });
  }
  return created;
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

function validateBackupData(data: BackupData): string[] {
  const errors: string[] = [];
  if (data.version !== 1) errors.push('Unsupported backup version');
  if (!Array.isArray(data.expenses)) errors.push('Missing expenses array');
  if (!Array.isArray(data.categories)) errors.push('Missing categories array');
  for (let i = 0; i < (data.expenses?.length ?? 0); i++) {
    const e = data.expenses[i];
    if (!e.title || typeof e.title !== 'string') errors.push(`Expense ${i}: invalid title`);
    if (typeof e.amount !== 'number' || isNaN(e.amount) || e.amount < 0) errors.push(`Expense ${i}: invalid amount`);
    if (!e.date || typeof e.date !== 'string') errors.push(`Expense ${i}: invalid date`);
    if (!e.category || typeof e.category !== 'string') errors.push(`Expense ${i}: invalid category`);
    if (errors.length >= 10) break; // Limit error messages
  }
  for (let i = 0; i < (data.categories?.length ?? 0); i++) {
    const c = data.categories[i];
    if (!c.name || typeof c.name !== 'string') errors.push(`Category ${i}: invalid name`);
    if (errors.length >= 10) break;
  }
  return errors;
}

export async function importBackup(data: BackupData): Promise<void> {
  const validationErrors = validateBackupData(data);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid backup: ${validationErrors.join('; ')}`);
  }
  await ready;
  await db.transaction('rw', db.expenses, db.categories, db.settings, async () => {
    await db.expenses.clear();
    await db.categories.clear();
    await db.settings.clear();
    if (data.categories.length) await db.categories.bulkAdd(data.categories);
    if (data.expenses.length) await db.expenses.bulkAdd(data.expenses);
    if (data.settings?.length) await db.settings.bulkPut(data.settings);
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
