
import { Account, Transaction, Category, Budget, Goal, EducationalContent } from '@/types/financial';

export const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'Conta Corrente',
    type: 'checking',
    balance: 5420.50,
    userId: '1',
    color: '#3B82F6',
    icon: 'Banknote'
  },
  {
    id: '2',
    name: 'Poupança',
    type: 'savings',
    balance: 12800.00,
    userId: '1',
    color: '#10B981',
    icon: 'PiggyBank'
  },
  {
    id: '3',
    name: 'Cartão de Crédito',
    type: 'credit',
    balance: -850.30,
    userId: '1',
    color: '#EF4444',
    icon: 'CreditCard'
  }
];

export const mockCategories: Category[] = [
  { id: '1', name: 'Alimentação', icon: 'UtensilsCrossed', color: '#F59E0B', type: 'expense' },
  { id: '2', name: 'Transporte', icon: 'Car', color: '#8B5CF6', type: 'expense' },
  { id: '3', name: 'Moradia', icon: 'Home', color: '#EF4444', type: 'expense' },
  { id: '4', name: 'Lazer', icon: 'Gamepad2', color: '#EC4899', type: 'expense' },
  { id: '5', name: 'Salário', icon: 'DollarSign', color: '#10B981', type: 'income' },
  { id: '6', name: 'Freelance', icon: 'Briefcase', color: '#06B6D4', type: 'income' },
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 4500.00,
    description: 'Salário',
    date: new Date('2024-05-01'),
    type: 'income',
    categoryId: '5',
    accountId: '1',
    userId: '1'
  },
  {
    id: '2',
    amount: 450.00,
    description: 'Supermercado',
    date: new Date('2024-05-02'),
    type: 'expense',
    categoryId: '1',
    accountId: '1',
    userId: '1'
  },
  {
    id: '3',
    amount: 120.00,
    description: 'Combustível',
    date: new Date('2024-05-03'),
    type: 'expense',
    categoryId: '2',
    accountId: '1',
    userId: '1'
  },
  {
    id: '4',
    amount: 1200.00,
    description: 'Aluguel',
    date: new Date('2024-05-05'),
    type: 'expense',
    categoryId: '3',
    accountId: '1',
    userId: '1'
  }
];

export const mockBudgets: Budget[] = [
  {
    id: '1',
    categoryId: '1',
    amount: 800.00,
    spent: 450.00,
    month: 5,
    year: 2024,
    userId: '1'
  },
  {
    id: '2',
    categoryId: '2',
    amount: 300.00,
    spent: 120.00,
    month: 5,
    year: 2024,
    userId: '1'
  }
];

export const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Reserva de Emergência',
    description: 'Valor equivalente a 6 meses de gastos',
    targetAmount: 15000.00,
    currentAmount: 8500.00,
    deadline: new Date('2024-12-31'),
    userId: '1',
    category: 'emergency'
  },
  {
    id: '2',
    title: 'Viagem para Europa',
    description: 'Férias de fim de ano',
    targetAmount: 8000.00,
    currentAmount: 2400.00,
    deadline: new Date('2024-11-30'),
    userId: '1',
    category: 'travel'
  }
];

export const mockEducationalContent: EducationalContent[] = [
  {
    id: '1',
    title: 'Como Criar uma Reserva de Emergência',
    content: 'A reserva de emergência é fundamental para sua estabilidade financeira...',
    type: 'article',
    category: 'saving',
    difficulty: 'beginner',
    readTime: 5
  },
  {
    id: '2',
    title: 'Primeiros Passos no Mundo dos Investimentos',
    content: 'Investir pode parecer complicado, mas com as informações certas...',
    type: 'article',
    category: 'investing',
    difficulty: 'beginner',
    readTime: 8
  },
  {
    id: '3',
    title: 'Métodos Eficazes para Quitar Dívidas',
    content: 'Estratégias comprovadas para sair do vermelho...',
    type: 'article',
    category: 'debt',
    difficulty: 'intermediate',
    readTime: 6
  }
];
