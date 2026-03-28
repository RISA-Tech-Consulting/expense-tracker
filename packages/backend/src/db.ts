import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isTest = process.env.NODE_ENV === 'test';
const dbPath = isTest ? ':memory:' : path.join(__dirname, '../data/expenses.db');

if (!isTest) {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    taxDeductible INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#6B7280'
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    taxDeductible INTEGER NOT NULL DEFAULT 0
  );
`);

const defaultCategories = [
  { name: 'Business Travel', taxDeductible: 1, color: '#3B82F6' },
  { name: 'Office Supplies', taxDeductible: 1, color: '#10B981' },
  { name: 'Meals & Entertainment', taxDeductible: 1, color: '#F59E0B' },
  { name: 'Professional Services', taxDeductible: 1, color: '#8B5CF6' },
  { name: 'Software & Tools', taxDeductible: 1, color: '#EC4899' },
  { name: 'Healthcare', taxDeductible: 1, color: '#EF4444' },
  { name: 'Personal', taxDeductible: 0, color: '#6B7280' },
  { name: 'Housing', taxDeductible: 0, color: '#F97316' },
];

const insertCategory = db.prepare(
  'INSERT OR IGNORE INTO categories (name, taxDeductible, color) VALUES (?, ?, ?)'
);

for (const cat of defaultCategories) {
  insertCategory.run(cat.name, cat.taxDeductible, cat.color);
}

export default db;
