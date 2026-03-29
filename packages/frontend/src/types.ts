export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  taxDeductible: boolean;
  attachment?: string;
}

export interface Category {
  id: number;
  name: string;
  taxDeductible: boolean;
  color: string;
}

export interface InsightsSummary {
  totalExpenses: number;
  totalDeductible: number;
  totalNonDeductible: number;
  byCategory: { category: string; total: number; taxDeductible: boolean }[];
  byMonth: { month: string; total: number }[];
  deductiblePercentage: number;
}
