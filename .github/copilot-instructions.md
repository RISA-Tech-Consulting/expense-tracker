---
name: expense-tracker-instructions
description: "Monorepo-wide conventions for expense-tracker. Use when working on any part of the project."
---

# Expense Tracker Monorepo Instructions

## Project Overview

**expense-tracker** is a full-stack TypeScript monorepo for tracking personal expenses and generating tax insights.

- **Backend**: Express.js + SQLite (better-sqlite3) API in `packages/backend/`
- **Frontend**: React 18 + Vite in `packages/frontend/`
- **Testing**: Jest (backend only) with supertest for API tests
- **Build**: Monorepo with npm workspaces; single build output per package

## Shared Conventions

### TypeScript Strictness
- **Always use strong TypeScript typing** throughout both backend and frontend
- Avoid `any` types; use explicit types or generics
- Use `| undefined` or optional (`?`) for potentially missing values
- Prefer interfaces over types for object shapes that might need extension

### Project Structure
- **Backend**: `packages/backend/src/` with subdirectories:
  - `routes/` — Express routers (one router per resource: expenses, categories, insights)
  - `types.ts` — Shared domain interfaces (Expense, Category, InsightsSummary)
  - `db.ts` — Database initialization and schema
  - `index.ts` — Express app setup and server start

- **Frontend**: `packages/frontend/src/` with subdirectories:
  - `components/` — Reusable UI components
  - `pages/` — Full-page components (Dashboard, Expenses, TaxInsights)
  - `types.ts` — Shared domain interfaces (mirrors backend)
  - `api.ts` — API methods and fetch helpers
  - `App.tsx` — Root routing setup
  - `main.tsx` — Entry point

### TypeScript Configuration
- Both packages use `tsconfig.json` with strict mode
- Frontend: Vite + TypeScript compilation
- Backend: Express types via `@types/express` and `@types/node`

## Development Workflow

### Running Locally
```sh
npm run dev              # Start both backend (port 3001) and frontend (port 3000) concurrently
npm run build           # Build both packages
npm run test            # Run backend tests only
```

### Adding Dependencies
- Install in the specific workspace: `npm install --workspace=packages/backend <package>`
- Do NOT install at root level unless it's a dev tool shared by all (e.g., `concurrently`, TypeScript)

### Commits & Changes
- TypeScript compilation must succeed before running code
- Backend tests should pass before committing

## Naming Conventions

### API Resources
- Plural resource names: `/api/expenses`, `/api/categories`, `/api/insights`
- RESTful endpoints: `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`

### Component/Function Names
- Components: PascalCase (ExpenseForm, Dashboard)
- Hooks/utilities: camelCase (useExpenses, formatDate)
- Constants: UPPER_SNAKE_CASE (DEFAULT_TAX_RATE, MAX_ITEMS)

### Database Tables & Columns
- Table names: lowercase plural (expenses, categories)
- Column names: camelCase in app code, lowercase in SQL (amount, taxDeductible)
- Foreign keys: resource_id format (category_id)

## API Contract

### Request/Response Format
- All requests with JSON payloads must include `Content-Type: application/json`
- All responses are JSON objects
- Errors always include an `error` field: `{ error: 'message' }`

### Common Status Codes
- `200 OK` — Successful GET, PUT, DELETE
- `201 Created` — Successful POST
- `400 Bad Request` — Invalid input
- `404 Not Found` — Resource does not exist
- `500 Internal Server Error` — Server-side error

### Rate Limiting
- Backend applies rate limiter on `/api/` routes
- Limit: 200 requests per 15 minutes per IP
- Headers: `RateLimit-*` included in responses

## Testing Standards

### Backend (Jest + Supertest)
- Test files in `packages/backend/tests/`
- Environment setup in `packages/backend/tests/setup.ts`
- Write tests for API routes: `request(app).get('/api/expenses').expect(200)`
- Always test error cases: 404, 400, 500 responses

### Frontend
- No testing configured yet; optional for future enhancements

## Database Access & Queries

### Safety
- **Always use parameterized queries**: `db.prepare('... WHERE id = ?').get(value)`
- Never concatenate user input into SQL strings
- Type-cast database results explicitly

### Transactions & Consistency
- Use `db.exec()` for schema setup (CREATE TABLE IF NOT EXISTS)
- Use `db.prepare()` + `.run()` or `.get()` for data operations
- Avoid manual transaction management unless needed

## Error Handling Expectations

### Backend
- All route handlers must have try-catch
- Log errors (or use middleware for centralized logging)
- Return JSON error responses with appropriate status codes

### Frontend
- Use try-catch around async API calls
- Show user-friendly error messages in UI
- Console logging for development/debugging only

## Performance Considerations

- **Backend**: SQLite queries are synchronous; avoid N+1 patterns by batch-loading or using joins
- **Frontend**: Use `useEffect` dependencies correctly to avoid unnecessary re-renders
- Both: Lazy-load resources where possible (pagination for expenses list)

## Future Enhancements

- Frontend testing with React Testing Library
- API authentication (JWT or OAuth)
- Data persistence across sessions (currently in-memory in tests)
- More sophisticated tax insights algorithms
- Mobile-friendly responsive design

