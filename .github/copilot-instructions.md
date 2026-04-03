---
name: expense-tracker-instructions
description: "Conventions for expense-tracker frontend project."
---

# Expense Tracker Instructions

## Project Overview

**expense-tracker** is a TypeScript React application for tracking personal expenses and generating tax insights.

- **Frontend**: React 18 + Vite in `packages/frontend/`
- **Build**: Monorepo with npm workspaces; single build output

## Shared Conventions

### TypeScript Strictness
- **Always use strong TypeScript typing**
- Avoid `any` types; use explicit types or generics
- Use `| undefined` or optional (`?`) for potentially missing values
- Prefer interfaces over types for object shapes that might need extension

### Project Structure
- **Frontend**: `packages/frontend/src/` with subdirectories:
  - `components/` — Reusable UI components
  - `pages/` — Full-page components (Dashboard, Expenses, TaxInsights)
  - `types.ts` — Shared domain interfaces
  - `api.ts` — API methods and fetch helpers
  - `App.tsx` — Root routing setup
  - `main.tsx` — Entry point

### TypeScript Configuration
- Frontend: Vite + TypeScript compilation with strict mode

## Development Workflow

### Running Locally
```sh
npm run dev              # Start frontend (port 3000)
npm run build           # Build frontend
```

### Adding Dependencies
- Install in the specific workspace: `npm install --workspace=packages/frontend <package>`
- Do NOT install at root level unless it's a dev tool shared by all

## Naming Conventions

### Component/Function Names
- Components: PascalCase (ExpenseForm, Dashboard)
- Hooks/utilities: camelCase (useExpenses, formatDate)
- Constants: UPPER_SNAKE_CASE (DEFAULT_TAX_RATE, MAX_ITEMS)

## Error Handling Expectations

### Frontend
- Use try-catch around async API calls
- Show user-friendly error messages in UI
- Console logging for development/debugging only

## Performance Considerations

- **Frontend**: Use `useEffect` dependencies correctly to avoid unnecessary re-renders
- Lazy-load resources where possible (pagination for expenses list)

## Future Enhancements

- Frontend testing with React Testing Library
- API authentication (JWT or OAuth)
- More sophisticated tax insights algorithms
- Mobile-friendly responsive design

