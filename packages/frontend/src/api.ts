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

export async function createExpense(data: Omit<Expense, 'id'>, attachment?: File): Promise<Expense> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('amount', data.amount.toString());
  formData.append('category', data.category);
  formData.append('date', data.date);
  if (data.description) formData.append('description', data.description);
  formData.append('taxDeductible', data.taxDeductible ? 'true' : 'false');
  if (attachment) formData.append('attachment', attachment);

  const res = await fetch(`${BASE}/expenses`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<Expense>(res);
}

export async function updateExpense(id: number, data: Partial<Omit<Expense, 'id'>>, attachment?: File): Promise<Expense> {
  const formData = new FormData();
  if (data.title !== undefined) formData.append('title', data.title);
  if (data.amount !== undefined) formData.append('amount', data.amount.toString());
  if (data.category !== undefined) formData.append('category', data.category);
  if (data.date !== undefined) formData.append('date', data.date);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.taxDeductible !== undefined) formData.append('taxDeductible', data.taxDeductible ? 'true' : 'false');
  if (attachment) formData.append('attachment', attachment);

  const res = await fetch(`${BASE}/expenses/${id}`, {
    method: 'PUT',
    body: formData,
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
