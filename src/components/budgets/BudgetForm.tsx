
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCategories } from '@/hooks/use-api';

interface BudgetFormProps {
  budget?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  existingBudgets: any[];
}

export function BudgetForm({ budget, onSubmit, onCancel, existingBudgets }: BudgetFormProps) {
  const [formData, setFormData] = useState({ categoryId: '', amount: '' });

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: allCategories = [] } = useCategories();

  useEffect(() => {
    if (budget) {
      setFormData({
        categoryId: budget.categoryId,
        amount: budget.amount.toString(),
      });
    }
  }, [budget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se já existe orçamento para esta categoria no mês atual
    const existingBudget = existingBudgets.find(b =>
      b.categoryId === formData.categoryId &&
      b.month === currentMonth &&
      b.year === currentYear &&
      b.id !== budget?.id
    );

    if (existingBudget) {
      alert('Já existe um orçamento para esta categoria no mês atual');
      return;
    }

    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    onSubmit(budgetData);
  };

  // Filtrar apenas categorias de despesa que ainda não têm orçamento (exceto a que está sendo editada)
  const availableCategories = allCategories.filter(category => {
    if (category.type !== 'expense') return false;
    const hasExistingBudget = existingBudgets.some(b =>
      b.categoryId === category.id &&
      b.month === currentMonth &&
      b.year === currentYear &&
      b.id !== budget?.id
    );
    return !hasExistingBudget;
  });

  return (
    <div>
      <DialogHeader>
        <DialogTitle>
          {budget ? 'Editar Orçamento' : 'Novo Orçamento'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {budget && budget.categoryId && (
                <SelectItem value={budget.categoryId}>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: allCategories.find(c => c.id === budget.categoryId)?.color }}
                    />
                    <span>{allCategories.find(c => c.id === budget.categoryId)?.name}</span>
                  </div>
                </SelectItem>
              )}
              {availableCategories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Valor do Orçamento</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>

        <div className="text-sm text-gray-500">
          Este orçamento será válido para {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {budget ? 'Atualizar' : 'Criar Orçamento'}
          </Button>
        </div>
      </form>
    </div>
  );
}
