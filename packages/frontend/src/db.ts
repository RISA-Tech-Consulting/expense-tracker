import Dexie, { type Table } from 'dexie';

export interface ExpenseRecord {
  id?: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  taxDeductible: boolean;
  attachment?: string;
  attachmentName?: string;
}

export interface CategoryRecord {
  id?: number;
  name: string;
  taxDeductible: boolean;
  color: string;
}

class ExpenseTrackerDB extends Dexie {
  expenses!: Table<ExpenseRecord, number>;
  categories!: Table<CategoryRecord, number>;

  constructor() {
    super('ExpenseTrackerDB');
    this.version(1).stores({
      expenses: '++id, category, date, taxDeductible',
      categories: '++id, &name',
    });
  }
}

const db = new ExpenseTrackerDB();

const DEFAULT_CATEGORIES: Omit<CategoryRecord, 'id'>[] = [
  { name: 'Business Travel', taxDeductible: true, color: '#3B82F6' },
  { name: 'Office Supplies', taxDeductible: true, color: '#10B981' },
  { name: 'Meals & Entertainment', taxDeductible: true, color: '#F59E0B' },
  { name: 'Professional Services', taxDeductible: true, color: '#8B5CF6' },
  { name: 'Software & Tools', taxDeductible: true, color: '#EC4899' },
  { name: 'Healthcare', taxDeductible: true, color: '#EF4444' },
  { name: 'Personal', taxDeductible: false, color: '#6B7280' },
  { name: 'Housing', taxDeductible: false, color: '#F97316' },
  { name: 'Others', taxDeductible: false, color: '#9316f9' },
];

export async function seedDefaultCategories(): Promise<void> {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
}

export default db;
