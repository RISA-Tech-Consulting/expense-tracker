---
name: frontend-instructions
description: "Use when working on frontend TypeScript + React (components, pages, hooks, types, styling)"
applyTo: ["packages/frontend/src/**/*.tsx", "packages/frontend/src/**/*.ts"]
---

# Frontend TypeScript & React Instructions

## Component Structure & Typing

### Functional Components with Props Interface
- **Always define a Props interface** before the component:
  ```typescript
  interface Props {
    expense?: Expense;
    categories: Category[];
    onSave: (data: Omit<Expense, 'id'>) => void;
    onClose: () => void;
  }
  
  export default function ExpenseForm({ expense, categories, onSave, onClose }: Props) {
    // ...
  }
  ```

### Destructure Props
- Destructure all props in the function signature for clarity and type safety
- Use optional chaining (`?.`) and nullish coalescing (`??`) for optional props:
  ```typescript
  const [title, setTitle] = useState(expense?.title ?? '');
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().split('T')[0]);
  ```

### Export Pattern
- Export component as default: `export default function ComponentName(...)`
- Page components live in `src/pages/`, UI components in `src/components/`

## State Management & Hooks

### useState for Form State
- Use separate `useState` calls for each form field:
  ```typescript
  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [taxDeductible, setTaxDeductible] = useState(expense?.taxDeductible ?? false);
  ```

### useEffect for Side Effects
- Use `useEffect` for auto-derived state (e.g., category-based defaulting):
  ```typescript
  useEffect(() => {
    const cat = categories.find(c => c.name === category);
    if (cat && !expense) setTaxDeductible(cat.taxDeductible);
  }, [category, categories, expense]);
  ```
- Always include dependency array to avoid infinite loops
- Only auto-set state on initial load (check `!expense` or similar guard)

## Styling

### Inline React.CSSProperties
- Use inline styles with `React.CSSProperties` type:
  ```typescript
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #CBD5E1',
    borderRadius: 6,
    fontSize: 14,
    boxSizing: 'border-box',
  };
  
  return <input style={inputStyle} />;
  ```

### Consistent Color Palette
- Use Tailwind-like neutral palette for consistent styling:
  - Text colors: `#1E293B` (dark), `#374151` (medium), `#6B7280` (light)
  - Borders: `#CBD5E1`
  - Backgrounds: `#fff`
  - Accent colors: `#3B82F6` (blue), `#10B981` (green), etc.

### Layout Patterns
- Use flexbox for layout:
  ```typescript
  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }
  ```
- Use `position: 'fixed'` with `inset: 0` for full-screen overlays:
  ```typescript
  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
  ```

## Form Handling

### Form Submission Pattern
- Use form `onSubmit` handler with `e.preventDefault()`:
  ```typescript
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, amount: parseFloat(amount), category, date, description: description || undefined, taxDeductible });
  };
  ```

### Input Binding
- Bind input values and onChange handlers:
  ```typescript
  <input 
    style={inputStyle} 
    value={title} 
    onChange={e => setTitle(e.target.value)} 
    required 
  />
  ```

### Type Coercion
- Parse numeric inputs explicitly: `parseFloat(amount)`
- Convert optional fields: `description: description || undefined`
- Handle checkboxes: `e.target.checked`

## Routing & Navigation

### React Router Structure
- Use `BrowserRouter`, `Routes`, and `Route` for navigation:
  ```typescript
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
  ```

### Layout Wrapper
- Use a shared `Layout` component that wraps all pages with navigation, sidebar, etc.
- Pass pages as child routes via `<Outlet />`

### Catch-All Route
- Always include a catch-all `<Route path="*" element={<Navigate to="/" replace />} />`

## Type Definitions & Imports

### Shared Types
- Import domain types from `src/types.ts`: `import { Expense, Category } from '../types'`
- Keep all type definitions in the types file, not scattered in components
- Example types:
  ```typescript
  export interface Expense {
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    description?: string;
    taxDeductible: boolean;
  }
  ```

### API Integration
- API calls defined in `src/api.ts`
- Import fetch helpers/methods as needed: `import { fetchExpenses } from '../api'`

## Code Style

### Imports & Exports
- Use ES module imports: `import { useState } from 'react'`
- Import typed components: `import ExpenseForm from '../components/ExpenseForm'`
- Group imports: React/third-party first, then relative imports

### Variable Naming
- Use camelCase for variables and functions
- Naming conventions:
  - State setters: `[value, setValue]`
  - Callbacks: `onSave`, `onClose`, `handleSubmit`
  - Computed/derived: `formattedDate`, `isValid`

### Formatting
- Use 2-space indentation
- Keep component JSX readable with line breaks for complex props:
  ```typescript
  <input 
    style={inputStyle} 
    value={title} 
    onChange={e => setTitle(e.target.value)} 
    required 
  />
  ```

## Component Organization

### Directory Structure
```
src/
  components/       # Reusable UI components
  pages/            # Page-level/full-screen components
  App.tsx           # Root routing
  main.tsx          # Entry point
  types.ts          # Shared interfaces
  api.ts            # API methods
```

### Component Naming
- Page components: PascalCase, e.g., `Dashboard.tsx`, `Expenses.tsx`
- UI components: PascalCase, e.g., `ExpenseForm.tsx`, `ExpenseCard.tsx`
- One component per file

