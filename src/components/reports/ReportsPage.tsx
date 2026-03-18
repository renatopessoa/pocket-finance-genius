
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText, FileSpreadsheet, TrendingUp, TrendingDown, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCurrentUser, useTransactions, useCategories, useAccounts } from '@/hooks/use-api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 space-y-2">
      <BarChart2 className="h-10 w-10 opacity-30" />
      <p className="text-sm">Nenhuma {label} no período</p>
    </div>
  );
}

export function ReportsPage() {
  const [reportType, setReportType] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');

  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id;
  const { data: allTransactions = [] } = useTransactions(userId);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts(userId);

  const { start, end } = useMemo(() => {
    if (reportType === 'yearly') {
      return { start: startOfYear(selectedDate), end: endOfYear(selectedDate) };
    }
    return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
  }, [reportType, selectedDate]);

  const filteredTransactions = useMemo(() =>
    allTransactions.filter(t => {
      const d = t.date instanceof Date ? t.date : new Date(t.date);
      return d >= start && d <= end
        && (selectedCategory === 'all' || t.categoryId === selectedCategory)
        && (selectedAccount === 'all' || t.accountId === selectedAccount);
    }),
    [allTransactions, start, end, selectedCategory, selectedAccount]
  );

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const expensesByCategory = categories
    .filter(c => c.type === 'expense')
    .map(c => ({
      name: c.name,
      value: filteredTransactions
        .filter(t => t.type === 'expense' && t.categoryId === c.id)
        .reduce((sum, t) => sum + t.amount, 0),
      color: c.color,
    }))
    .filter(x => x.value > 0);

  const incomeByCategory = categories
    .filter(c => c.type === 'income')
    .map(c => ({
      name: c.name,
      value: filteredTransactions
        .filter(t => t.type === 'income' && t.categoryId === c.id)
        .reduce((sum, t) => sum + t.amount, 0),
      color: c.color,
    }))
    .filter(x => x.value > 0);

  const monthlyEvolution = useMemo(() =>
    reportType === 'yearly'
      ? Array.from({ length: 12 }, (_, i) => {
          const monthTxs = allTransactions.filter(t => {
            const d = t.date instanceof Date ? t.date : new Date(t.date);
            return d.getMonth() === i && d.getFullYear() === selectedDate.getFullYear();
          });
          const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          return {
            month: new Date(selectedDate.getFullYear(), i).toLocaleDateString('pt-BR', { month: 'short' }),
            Receitas: income,
            Despesas: expenses,
            Saldo: income - expenses,
          };
        })
      : [],
    [reportType, allTransactions, selectedDate]
  );

  const exportToPDF = () => {
    const content = `RELATÓRIO FINANCEIRO — Meu Financeiro
Período: ${format(start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(end, 'dd/MM/yyyy', { locale: ptBR })}

RESUMO:
Total de Receitas: ${fmt(totalIncome)}
Total de Despesas: ${fmt(totalExpenses)}
Saldo: ${fmt(balance)}

TRANSAÇÕES:
${filteredTransactions.map(t => {
  const d = t.date instanceof Date ? t.date : new Date(t.date);
  return `${format(d, 'dd/MM/yyyy')} - ${t.description} - ${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}`;
}).join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${format(selectedDate, 'yyyy-MM')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor'];
    const rows = filteredTransactions.map(t => {
      const d = t.date instanceof Date ? t.date : new Date(t.date);
      return [
        format(d, 'dd/MM/yyyy'),
        t.description,
        categories.find(c => c.id === t.categoryId)?.name || '',
        accounts.find(a => a.id === t.accountId)?.name || '',
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.amount.toString(),
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(f => `"${f}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes-${format(selectedDate, 'yyyy-MM')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios e Histórico</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar TXT
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Relatório Mensal</SelectItem>
                <SelectItem value="yearly">Relatório Anual</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, reportType === 'monthly' ? 'MMM yyyy' : 'yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger><SelectValue placeholder="Todas as contas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Total de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(totalIncome)}</div>
            <p className="text-xs text-gray-400 mt-1">
              {filteredTransactions.filter(t => t.type === 'income').length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
              Total de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fmt(totalExpenses)}</div>
            <p className="text-xs text-gray-400 mt-1">
              {filteredTransactions.filter(t => t.type === 'expense').length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(balance)}
            </div>
            <p className="text-xs text-gray-400 mt-1">{filteredTransactions.length} transações no total</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-red-500" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => fmt(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="despesa" />
            )}
          </CardContent>
        </Card>

        {/* Receitas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-green-500" />
              Receitas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => fmt(Number(value))} />
                  <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                    {incomeByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="receita" />
            )}
          </CardContent>
        </Card>

        {/* Evolução Mensal — apenas relatório anual */}
        {reportType === 'yearly' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Evolução Mensal — {selectedDate.getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => fmt(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="Receitas" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Despesas" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Saldo" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>
            Histórico de Transações ({filteredTransactions.length}{' '}
            {filteredTransactions.length === 1 ? 'transação' : 'transações'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhuma transação encontrada para este período</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredTransactions.map((transaction) => {
                const category = categories.find(c => c.id === transaction.categoryId);
                const account = accounts.find(a => a.id === transaction.accountId);
                const txDate = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: (category?.color || '#6B7280') + '25' }}
                      >
                        <span className="text-xs font-bold" style={{ color: category?.color || '#6B7280' }}>
                          {category?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(txDate, 'dd/MM/yyyy', { locale: ptBR })}
                          {category && ` • ${category.name}`}
                          {account && ` • ${account.name}`}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{fmt(transaction.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
