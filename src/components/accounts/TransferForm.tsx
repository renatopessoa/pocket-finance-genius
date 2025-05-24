
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight } from 'lucide-react';

interface TransferFormProps {
  accounts: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function TransferForm({ accounts, onSubmit, onCancel }: TransferFormProps) {
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fromAccountId === formData.toAccountId) {
      alert('Selecione contas diferentes para a transferência');
      return;
    }
    
    const transferData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };
    
    onSubmit(transferData);
  };

  const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
  const availableBalance = fromAccount?.balance || 0;

  // Comprehensive filtering to ensure valid accounts
  const validAccounts = accounts.filter(account => {
    if (!account) return false;
    if (!account.id || typeof account.id !== 'string') return false;
    if (account.id.trim() === '') return false;
    if (!account.name || typeof account.name !== 'string') return false;
    if (account.name.trim() === '') return false;
    if (typeof account.balance !== 'number') return false;
    if (!account.color || typeof account.color !== 'string') return false;
    
    return true;
  });

  console.log('Original accounts:', accounts);
  console.log('Valid accounts for transfer:', validAccounts);
  console.log('From account ID:', formData.fromAccountId);
  console.log('To account ID:', formData.toAccountId);

  // If no valid accounts, show a message
  if (validAccounts.length === 0) {
    return (
      <div>
        <DialogHeader>
          <DialogTitle>Transferir entre Contas</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center text-gray-500">
          Nenhuma conta válida encontrada para transferência.
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  // If less than 2 accounts, cannot transfer
  if (validAccounts.length < 2) {
    return (
      <div>
        <DialogHeader>
          <DialogTitle>Transferir entre Contas</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center text-gray-500">
          É necessário pelo menos 2 contas para realizar transferências.
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Transferir entre Contas</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="fromAccount">Conta de Origem</Label>
          <Select 
            value={formData.fromAccountId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, fromAccountId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta de origem" />
            </SelectTrigger>
            <SelectContent>
              {validAccounts.map(account => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <span>{account.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 ml-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(account.balance)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fromAccount && (
            <p className="text-sm text-gray-500 mt-1">
              Saldo disponível: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(availableBalance)}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-gray-400" />
        </div>

        <div>
          <Label htmlFor="toAccount">Conta de Destino</Label>
          <Select 
            value={formData.toAccountId} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, toAccountId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta de destino" />
            </SelectTrigger>
            <SelectContent>
              {validAccounts
                .filter(account => account.id !== formData.fromAccountId)
                .map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <span>{account.name}</span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Valor da Transferência</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            max={availableBalance}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Input
            id="description"
            placeholder="Motivo da transferência"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Transferir
          </Button>
        </div>
      </form>
    </div>
  );
}
