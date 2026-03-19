
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Plus, X, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCategories, useAccounts, useCreateCategory, useCreateAccount } from '@/hooks/use-api';
import { useToast } from '@/components/ui/use-toast';

interface TransactionFormProps {
  transaction?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const COLOR_SWATCHES = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1',
  '#22C55E', '#F97316', '#14B8A6', '#A3A3A3',
];

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [installmentValue, setInstallmentValue] = useState('');

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [isSavingCat, setIsSavingCat] = useState(false);

  // --- New Account mini-form state ---
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('checking');
  const [newAccColor, setNewAccColor] = useState('#3B82F6');
  const [isSavingAcc, setIsSavingAcc] = useState(false);

  const { toast } = useToast();
  const createCategory = useCreateCategory();
  const createAccount = useCreateAccount();

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
      setIsRecurring(transaction.isRecurring || false);
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

    if (!formData.accountId) {
      toast({ title: 'Conta obrigatória', description: 'Selecione ou crie uma conta para a transação.', variant: 'destructive' });
      return;
    }
    if (!formData.categoryId) {
      toast({ title: 'Categoria obrigatória', description: 'Selecione ou crie uma categoria para a transação.', variant: 'destructive' });
      return;
    }

    const baseTransaction = {
      ...formData,
      isRecurring,
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

  const handleSaveNewCategory = async () => {
    if (!newCatName.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Informe o nome da nova categoria.', variant: 'destructive' });
      return;
    }
    setIsSavingCat(true);
    createCategory.mutate(
      {
        name: newCatName.trim(),
        color: newCatColor,
        icon: 'MoreHorizontal',
        type: formData.type as 'income' | 'expense',
      },
      {
        onSuccess: (saved) => {
          toast({ title: 'Categoria criada!', description: `"${saved.name}" foi adicionada.` });
          setFormData(prev => ({ ...prev, categoryId: saved.id }));
          setShowNewCategory(false);
          setNewCatName('');
          setNewCatColor('#3B82F6');
          setIsSavingCat(false);
        },
        onError: () => {
          toast({ title: 'Erro', description: 'Não foi possível criar a categoria.', variant: 'destructive' });
          setIsSavingCat(false);
        },
      }
    );
  };

  const handleSaveNewAccount = async () => {
    if (!newAccName.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Informe o nome da nova conta.', variant: 'destructive' });
      return;
    }
    setIsSavingAcc(true);
    createAccount.mutate(
      {
        name: newAccName.trim(),
        color: newAccColor,
        type: newAccType,
        balance: 0,
        icon: 'Wallet',
      },
      {
        onSuccess: (saved) => {
          toast({ title: 'Conta criada!', description: `"${saved.name}" foi adicionada.` });
          setFormData(prev => ({ ...prev, accountId: saved.id }));
          setShowNewAccount(false);
          setNewAccName('');
          setNewAccType('checking');
          setNewAccColor('#3B82F6');
          setIsSavingAcc(false);
        },
        onError: () => {
          toast({ title: 'Erro', description: 'Não foi possível criar a conta.', variant: 'destructive' });
          setIsSavingAcc(false);
        },
      }
    );
  };

  const { data: allCategories = [] } = useCategories();
  const { data: allAccounts = [] } = useAccounts();

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

        <div className="flex items-center gap-6">
          {formData.type === 'expense' && !transaction && (
            <div className="flex items-center space-x-2">
              <Switch
                id="installment"
                checked={isInstallment}
                onCheckedChange={(checked) => {
                  setIsInstallment(checked);
                  if (checked) setIsRecurring(false);
                }}
              />
              <Label htmlFor="installment">Parcelado</Label>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => {
                setIsRecurring(checked);
                if (checked) setIsInstallment(false);
              }}
            />
            <Label htmlFor="recurring">Recorrente</Label>
          </div>
        </div>

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

            {/* Botão Nova Conta */}
            {!showNewAccount && (
              <button
                type="button"
                onClick={() => setShowNewAccount(true)}
                className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none"
              >
                <Plus className="h-3 w-3" />
                Nova conta
              </button>
            )}

            {/* Mini-form inline */}
            {showNewAccount && (
              <div className="mt-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Nova conta
                </p>

                <div>
                  <Label htmlFor="newAccName" className="text-xs">Nome</Label>
                  <Input
                    id="newAccName"
                    placeholder="ex: Conta Corrente, Nubank..."
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="newAccType" className="text-xs">Tipo de Conta</Label>
                  <Select value={newAccType} onValueChange={setNewAccType}>
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Conta Corrente</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="wallet">Carteira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Cor</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewAccColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                          newAccColor === color ? 'border-foreground scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={isSavingAcc || !newAccName.trim()}
                    onClick={handleSaveNewAccount}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {isSavingAcc ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => { setShowNewAccount(false); setNewAccName(''); setNewAccColor('#3B82F6'); setNewAccType('checking'); }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Categoria ── */}
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

          {/* Botão Nova Categoria */}
          {!showNewCategory && (
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none"
            >
              <Plus className="h-3 w-3" />
              Nova categoria
            </button>
          )}

          {/* Mini-form inline */}
          {showNewCategory && (
            <div className="mt-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                Nova categoria — {formData.type === 'expense' ? 'Despesa' : 'Receita'}
              </p>

              <div>
                <Label htmlFor="newCatName" className="text-xs">Nome</Label>
                <Input
                  id="newCatName"
                  placeholder="ex: Pets, Viagem..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-xs">Cor</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                        newCatColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={isSavingCat || !newCatName.trim()}
                  onClick={handleSaveNewCategory}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {isSavingCat ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => { setShowNewCategory(false); setNewCatName(''); setNewCatColor('#3B82F6'); }}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
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
