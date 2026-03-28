import { Expense, Category, InsightsSummary } from './types';

const BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchExpenses(filters?: {
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Expense[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  const query = params.toString() ? `?${params}` : '';
  const res = await fetch(`${BASE}/expenses${query}`);
  return handleResponse<Expense[]>(res);
}

export async function createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const res = await fetch(`${BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Expense>(res);
}

export async function updateExpense(id: number, data: Partial<Omit<Expense, 'id'>>): Promise<Expense> {
  const res = await fetch(`${BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Expense>(res);
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await fetch(`${BASE}/expenses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/categories`);
  return handleResponse<Category[]>(res);
}

export async function fetchInsights(): Promise<InsightsSummary> {
  const res = await fetch(`${BASE}/insights`);
  return handleResponse<InsightsSummary>(res);
}
