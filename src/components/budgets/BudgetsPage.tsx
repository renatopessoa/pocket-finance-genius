
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, CheckCircle, Target, Edit, Trash2 } from 'lucide-react';
import { BudgetForm } from './BudgetForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { mockCategories, mockTransactions } from '@/lib/mockData';

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
  userId: string;
}

export function BudgetsPage() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [budgets, setBudgets] = useState<Budget[]>([
    {
      id: '1',
      categoryId: '1',
      amount: 1500,
      spent: 1200,
      month: currentMonth,
      year: currentYear,
      userId: '1'
    },
    {
      id: '2',
      categoryId: '2',
      amount: 500,
      spent: 750,
      month: currentMonth,
      year: currentYear,
      userId: '1'
    },
    {
      id: '3',
      categoryId: '3',
      amount: 800,
      spent: 450,
      month: currentMonth,
      year: currentYear,
      userId: '1'
    }
  ]);

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);

  // Calcular gastos reais baseado nas transações
  const getSpentAmount = (categoryId: string) => {
    return mockTransactions
      .filter(t => 
        t.type === 'expense' && 
        t.categoryId === categoryId &&
        t.date.getMonth() + 1 === currentMonth &&
        t.date.getFullYear() === currentYear
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Atualizar gastos nos orçamentos
  const budgetsWithCurrentSpent = budgets.map(budget => ({
    ...budget,
    spent: getSpentAmount(budget.categoryId)
  }));

  const handleAddBudget = (budgetData: any) => {
    const newBudget: Budget = {
      ...budgetData,
      id: Date.now().toString(),
      spent: getSpentAmount(budgetData.categoryId),
      month: currentMonth,
      year: currentYear,
      userId: '1',
    };
    setBudgets(prev => [...prev, newBudget]);
    setIsBudgetFormOpen(false);
  };

  const handleEditBudget = (budgetData: any) => {
    setBudgets(prev => 
      prev.map(b => b.id === editingBudget?.id ? { 
        ...budgetData, 
        id: editingBudget.id,
        spent: getSpentAmount(budgetData.categoryId)
      } : b)
    );
    setEditingBudget(null);
    setIsBudgetFormOpen(false);
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = (budget.spent / budget.amount) * 100;
    
    if (percentage >= 100) return { status: 'exceeded', color: 'text-red-600', icon: AlertTriangle };
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-600', icon: CheckCircle };
  };

  const totalBudget = budgetsWithCurrentSpent.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetsWithCurrentSpent.reduce((sum, b) => sum + b.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Orçamentos e Metas</h2>
        <Dialog open={isBudgetFormOpen} onOpenChange={setIsBudgetFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBudget(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <BudgetForm
              budget={editingBudget}
              onSubmit={editingBudget ? handleEditBudget : handleAddBudget}
              onCancel={() => setIsBudgetFormOpen(false)}
              existingBudgets={budgets}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Orçamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalBudget)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Gasto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalSpent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Restante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(remainingBudget)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Orçamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgetsWithCurrentSpent.map((budget) => {
          const category = mockCategories.find(c => c.id === budget.categoryId);
          const { status, color, icon: StatusIcon } = getBudgetStatus(budget);
          const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
          const remaining = budget.amount - budget.spent;
          
          return (
            <Card key={budget.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: category?.color + '20' }}
                    >
                      <Target className="h-5 w-5" style={{ color: category?.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category?.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <StatusIcon className={`h-4 w-4 ${color}`} />
                        <Badge variant={status === 'exceeded' ? 'destructive' : status === 'warning' ? 'secondary' : 'default'}>
                          {percentage.toFixed(0)}% usado
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingBudget(budget);
                        setIsBudgetFormOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Gasto:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(budget.spent)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Orçamento:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(budget.amount)}
                    </span>
                  </div>

                  <Progress 
                    value={percentage} 
                    className="w-full"
                    color={status === 'exceeded' ? 'red' : status === 'warning' ? 'yellow' : 'green'}
                  />

                  <div className="flex justify-between text-sm">
                    <span>Restante:</span>
                    <span className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(remaining)}
                    </span>
                  </div>

                  {status === 'exceeded' && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        ⚠️ Orçamento ultrapassado! Revise seus gastos nesta categoria.
                      </p>
                    </div>
                  )}

                  {status === 'warning' && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        ⚠️ Atenção: você já gastou 80% do orçamento desta categoria.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
