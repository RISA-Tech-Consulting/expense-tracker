---
name: backend-instructions
description: "Use when working on backend TypeScript (Express.js, SQLite database, API routes, type definitions)"
applyTo: ["packages/backend/src/**/*.ts"]
---

# Backend TypeScript & Express.js Instructions

## Type Safety & Interfaces

### Domain vs. Database Types
- **Always define separate interface for database rows** and domain models
- Use a conversion function to transform database results to domain types
- Example pattern:
  ```typescript
  interface ExpenseRow {
    id: number;
    amount: number;
    taxDeductible: number; // SQLite stores as 0/1
  }
  
  function rowToExpense(row: ExpenseRow): Expense {
    return {
      id: row.id,
      amount: row.amount,
      taxDeductible: row.taxDeductible === 1,
    };
  }
  ```

### Type-cast Database Queries
- Always explicitly cast `db.prepare().get()` and `db.prepare().all()` to the row interface:
  ```typescript
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseRow | undefined;
  const rows = db.prepare('SELECT * FROM expenses').all() as ExpenseRow[];
  ```
- Use `| undefined` for single-row queries; return types are more specific than relying on TypeScript inference

### Request/Response Types
- Type all Express handlers: `(req: Request, res: Response) => void`
- Use typed `req.params`, `req.query` with casting only when necessary:
  ```typescript
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id) as ExpenseRow;
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: 'message' });
    }
  });
  ```

## API Design & Naming

### Route Organization
- Group related endpoints in a single router file (e.g., `routes/expenses.ts`)
- Use RESTful conventions: `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- Mount routers with the resource name: `app.use('/api/expenses', expensesRouter)`

### Response Handling
- Success responses: Send typed objects directly with `res.json(data)`
- Error responses: Always return error objects: `res.status(statusCode).json({ error: 'message' })`
- Use appropriate HTTP status codes (404 for not found, 500 for server error)

### Parameter Validation
- Use **parameterized queries** for all SQL: `db.prepare('...WHERE id = ?').get(value)`
- Never concatenate strings into SQL queries
- Type-cast query parameters when extracting from `req.query` or `req.params`

## Database Patterns

### prepared Statements
- Use `db.prepare()` for all queries and call `.get()` or `.all()` with parameters:
  ```typescript
  const query = db.prepare('SELECT * FROM expenses WHERE category = ? AND date >= ?');
  const rows = query.all(category, startDate) as ExpenseRow[];
  ```

### Dynamic Query Building
- Start with base query and append conditions:
  ```typescript
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params: unknown[] = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  const rows = db.prepare(query).all(...params) as ExpenseRow[];
  ```

### Null Handling
- SQLite stores booleans as 0/1; convert explicitly in row mapping
- Use nullish coalescing for optional fields: `row.description ?? undefined`

## Error Handling

### Try-Catch Pattern
- Wrap all route handlers in try-catch:
  ```typescript
  router.get('/', (req: Request, res: Response) => {
    try {
      // Route logic
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch' });
    }
  });
  ```

### Null/Not Found Checks
- Check for null results before processing:
  ```typescript
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseRow | undefined;
  if (!row) return res.status(404).json({ error: 'Expense not found' });
  ```

## Testing

### Test Environment Setup
- Tests use in-memory SQLite: configured in `db.ts` with `process.env.NODE_ENV === 'test'`
- Use Jest with `--testEnvironment=node` and `supertest` for API testing
- Import and export `app` as default for testing, not just starting the server

### Test Patterns
- Test database queries with fresh data per test
- Test API handlers with supertest: `request(app).get('/api/expenses').expect(200)`
- Use Jest mocks for external dependencies if needed

## Code Style

### Imports & Exports
- Use ES module imports: `import { Router } from 'express'`
- Export routers and database as default: `export default router`, `export default db`
- Group imports by external, then internal

### Variable Naming
- Use camelCase for variables and functions
- Prefix boolean query builder variables with `is`, `has`, or a descriptive name:
  - `isTest`, `hasDescription`, `shouldCache`
- Use descriptive names for unclear parameters: `params`, `rows`, `query`

### Formatting
- Use 2-space indentation
- Indent query builders for readability:
  ```typescript
  let query = 'SELECT * FROM expenses WHERE 1=1';
  if (condition) {
    query += ' AND column = ?';
  }
  ```

