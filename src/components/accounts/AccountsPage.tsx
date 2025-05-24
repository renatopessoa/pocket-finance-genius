
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard, Wallet, PiggyBank, Building, ArrowRightLeft, Edit, Trash2 } from 'lucide-react';
import { AccountForm } from './AccountForm';
import { TransferForm } from './TransferForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { mockAccounts, mockTransactions } from '@/lib/mockData';

export function AccountsPage() {
  const [accounts, setAccounts] = useState(mockAccounts);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return Building;
      case 'savings': return PiggyBank;
      case 'credit': return CreditCard;
      case 'wallet': return Wallet;
      default: return Wallet;
    }
  };

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'checking': return 'Conta Corrente';
      case 'savings': return 'Poupança';
      case 'credit': return 'Cartão de Crédito';
      case 'wallet': return 'Carteira';
      default: return 'Carteira';
    }
  };

  const handleAddAccount = (accountData: any) => {
    const newAccount = {
      ...accountData,
      id: Date.now().toString(),
      userId: '1',
    };
    setAccounts(prev => [...prev, newAccount]);
    setIsAccountFormOpen(false);
  };

  const handleEditAccount = (accountData: any) => {
    setAccounts(prev => 
      prev.map(a => a.id === editingAccount.id ? { ...accountData, id: editingAccount.id } : a)
    );
    setEditingAccount(null);
    setIsAccountFormOpen(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  const handleTransfer = (transferData: any) => {
    const { fromAccountId, toAccountId, amount } = transferData;
    
    setAccounts(prev => prev.map(account => {
      if (account.id === fromAccountId) {
        return { ...account, balance: account.balance - amount };
      }
      if (account.id === toAccountId) {
        return { ...account, balance: account.balance + amount };
      }
      return account;
    }));
    
    setIsTransferFormOpen(false);
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contas e Cartões</h2>
        <div className="flex space-x-2">
          <Dialog open={isTransferFormOpen} onOpenChange={setIsTransferFormOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transferir
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <TransferForm
                accounts={accounts}
                onSubmit={handleTransfer}
                onCancel={() => setIsTransferFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isAccountFormOpen} onOpenChange={setIsAccountFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingAccount(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <AccountForm
                account={editingAccount}
                onSubmit={editingAccount ? handleEditAccount : handleAddAccount}
                onCancel={() => setIsAccountFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumo Total */}
      <Card>
        <CardHeader>
          <CardTitle>Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(totalBalance)}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Distribuído em {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'}
          </p>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const Icon = getAccountIcon(account.type);
          
          return (
            <Card key={account.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: account.color + '20' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: account.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {getAccountTypeName(account.type)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAccount(account);
                        setIsAccountFormOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(account.balance)}
                  </div>
                  
                  {/* Últimas transações desta conta */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Últimas movimentações
                    </h4>
                    <div className="space-y-1">
                      {mockTransactions
                        .filter(t => t.accountId === account.id)
                        .slice(0, 3)
                        .map(transaction => (
                          <div key={transaction.id} className="flex justify-between text-sm">
                            <span className="truncate">{transaction.description}</span>
                            <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(transaction.amount)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
