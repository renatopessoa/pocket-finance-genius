
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCategories, useAccounts, useCurrentUser } from '@/hooks/use-api';

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

  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [installmentValue, setInstallmentValue] = useState('');

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
      setIsInstallment(false);
    }
  }, [transaction]);

  useEffect(() => {
    if (formData.amount && installmentsCount > 0 && isInstallment) {
      const val = (parseFloat(formData.amount) / installmentsCount).toFixed(2);
      setInstallmentValue(val);
    } else {
      setInstallmentValue('');
    }
  }, [formData.amount, installmentsCount, isInstallment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseTransaction = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
    };

    if (isInstallment && formData.type === 'expense') {
      const transactions = [];
      const instValue = parseFloat(installmentValue) || (parseFloat(formData.amount) / installmentsCount);

      for (let i = 0; i < installmentsCount; i++) {
        const installmentDate = new Date(formData.date);
        installmentDate.setMonth(installmentDate.getMonth() + i);

        transactions.push({
          ...baseTransaction,
          amount: parseFloat(instValue.toFixed(2)),
          description: `${formData.description} (${i + 1}/${installmentsCount})`,
          date: installmentDate,
        });
      }

      onSubmit(transactions);
    } else {
      onSubmit({
        ...baseTransaction,
        amount: parseFloat(formData.amount),
      });
    }
  };

  const { data: currentUser } = useCurrentUser();
  const { data: allCategories = [] } = useCategories();
  const { data: allAccounts = [] } = useAccounts(currentUser?.id);

  const filteredCategories = allCategories.filter(c => c.type === formData.type);
  const validAccounts = allAccounts;

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

        {formData.type === 'expense' && !transaction && (
          <div className="flex items-center space-x-2">
            <Switch
              id="installment"
              checked={isInstallment}
              onCheckedChange={setIsInstallment}
            />
            <Label htmlFor="installment">Parcelado</Label>
          </div>
        )}

        {isInstallment && formData.type === 'expense' && !transaction && (
          <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-muted/50">
            <div>
              <Label htmlFor="installmentsCount">Número de parcelas</Label>
              <Input
                id="installmentsCount"
                type="number"
                min="2"
                step="1"
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 2)}
                required
              />
            </div>
            <div>
              <Label htmlFor="installmentValue">Valor das parcelas</Label>
              <Input
                id="installmentValue"
                type="number"
                step="0.01"
                value={installmentValue}
                onChange={(e) => {
                  setInstallmentValue(e.target.value);
                  if (e.target.value && installmentsCount > 0) {
                    setFormData(prev => ({ ...prev, amount: (parseFloat(e.target.value) * installmentsCount).toFixed(2) }));
                  }
                }}
                required
              />
            </div>
            <div className="col-span-2 text-sm text-muted-foreground">
              A primeira parcela será em <strong>{formData.date ? format(formData.date, 'dd/MM/yyyy', { locale: ptBR }) : "--"}</strong> e as demais nos meses seguintes.
            </div>
          </div>
        )}

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
