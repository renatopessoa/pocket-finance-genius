
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AccountFormProps {
  account?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const accountTypes = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'credit', label: 'Cartão de Crédito' },
  { value: 'wallet', label: 'Carteira' },
];

const colors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: '',
    color: colors[0],
    icon: 'Wallet',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        color: account.color,
        icon: account.icon,
      });
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const accountData = {
      ...formData,
      balance: parseFloat(formData.balance) || 0,
    };
    
    onSubmit(accountData);
  };

  console.log('Account types:', accountTypes);
  console.log('Form data type:', formData.type);

  return (
    <div>
      <DialogHeader>
        <DialogTitle>
          {account ? 'Editar Conta' : 'Nova Conta'}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="name">Nome da Conta</Label>
          <Input
            id="name"
            placeholder="Ex: Conta Corrente Banco do Brasil"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Tipo de Conta</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accountTypes.filter(type => type.value && type.value.trim() !== '').map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="balance">Saldo Atual</Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={formData.balance}
            onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label>Cor</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {colors.map(color => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-lg border-2 ${
                  formData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData(prev => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {account ? 'Atualizar' : 'Criar Conta'}
          </Button>
        </div>
      </form>
    </div>
  );
}
