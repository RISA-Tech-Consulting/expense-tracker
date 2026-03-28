import request from 'supertest';
import app from '../src/index';

describe('Categories API', () => {
  it('GET /api/categories returns default categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('taxDeductible');
  });
});

describe('Expenses API', () => {
  let createdId: number;

  it('POST /api/expenses creates expense', async () => {
    const res = await request(app).post('/api/expenses').send({
      title: 'Test Expense',
      amount: 100.50,
      category: 'Office Supplies',
      date: '2024-03-15',
      description: 'Test description',
      taxDeductible: true,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Expense');
    expect(res.body.amount).toBe(100.50);
    expect(res.body.taxDeductible).toBe(true);
    createdId = res.body.id;
  });

  it('GET /api/expenses returns list with created expense', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((e: { id: number }) => e.id === createdId);
    expect(found).toBeDefined();
  });

  it('GET /api/expenses/:id returns the expense', async () => {
    const res = await request(app).get(`/api/expenses/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
    expect(res.body.title).toBe('Test Expense');
  });

  it('PUT /api/expenses/:id updates the expense', async () => {
    const res = await request(app).put(`/api/expenses/${createdId}`).send({
      title: 'Updated Expense',
      amount: 200.00,
      category: 'Office Supplies',
      date: '2024-03-15',
      taxDeductible: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Expense');
    expect(res.body.amount).toBe(200.00);
  });

  it('DELETE /api/expenses/:id deletes the expense', async () => {
    const res = await request(app).delete(`/api/expenses/${createdId}`);
    expect(res.status).toBe(204);
    const checkRes = await request(app).get(`/api/expenses/${createdId}`);
    expect(checkRes.status).toBe(404);
  });
});

describe('Insights API', () => {
  beforeAll(async () => {
    await request(app).post('/api/expenses').send({
      title: 'Insight Test',
      amount: 500,
      category: 'Business Travel',
      date: '2024-03-20',
      taxDeductible: true,
    });
  });

  it('GET /api/insights returns summary', async () => {
    const res = await request(app).get('/api/insights');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalExpenses');
    expect(res.body).toHaveProperty('totalDeductible');
    expect(res.body).toHaveProperty('totalNonDeductible');
    expect(res.body).toHaveProperty('byCategory');
    expect(res.body).toHaveProperty('byMonth');
    expect(res.body).toHaveProperty('deductiblePercentage');
    expect(res.body.totalExpenses).toBeGreaterThan(0);
  });
});
