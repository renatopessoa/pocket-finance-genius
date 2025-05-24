
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'wallet';
  balance: number;
  userId: string;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  budgetLimit?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  userId: string;
  recurring?: boolean;
  tags?: string[];
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
  userId: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  userId: string;
  category: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'video' | 'quiz';
  category: 'saving' | 'investing' | 'budgeting' | 'debt';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime?: number;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  userId: string;
}
