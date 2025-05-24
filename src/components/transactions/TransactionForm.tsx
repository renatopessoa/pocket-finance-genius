
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { mockCategories, mockAccounts } from '@/lib/mockData';

interface TransactionFormProps {
  transaction?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function TransactionForm({ transaction, onSubmit, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date(),
    type: 'expense',
    categoryId: '',
    accountId: '',
    tags: '',
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        categoryId: transaction.categoryId,
        accountId: transaction.accountId,
        tags: transaction.tags?.join(', ') || '',
      });
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
    };
    
    onSubmit(transactionData);
  };

  // Filter and validate categories
  const filteredCategories = mockCategories.filter(category => {
    return category && 
           category.type === formData.type && 
           category.id && 
           typeof category.id === 'string' && 
           category.id.trim() !== '' &&
           category.name &&
           typeof category.name === 'string' &&
           category.name.trim() !== '';
  });

  // Filter and validate accounts
  const validAccounts = mockAccounts.filter(account => {
    return account && 
           account.id && 
           typeof account.id === 'string' && 
           account.id.trim() !== '' &&
           account.name &&
           typeof account.name === 'string' &&
           account.name.trim() !== '';
  });

  console.log('Filtered categories:', filteredCategories);
  console.log('Valid accounts:', validAccounts);

  return (
    <div>
      <DialogHeader>
        <DialogTitle>
          {transaction ? 'Editar Transação' : 'Nova Transação'}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, categoryId: '' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="amount">Valor</Label>
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
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            placeholder="Descrição da transação"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, 'dd/MM/yyyy', { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="account">Conta</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {validAccounts.length > 0 ? (
                  validAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: account.color || '#666' }}
                        />
                        <span>{account.name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-accounts" disabled>
                    Nenhuma conta disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

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
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color || '#666' }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-categories" disabled>
                  Nenhuma categoria disponível para este tipo
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
          <Input
            id="tags"
            placeholder="casa, supermercado, urgente"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {transaction ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
