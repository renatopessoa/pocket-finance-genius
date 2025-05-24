import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { mockTransactions, mockCategories } from '@/lib/mockData';
import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, LineChartIcon } from 'lucide-react';

export function ExpenseChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');

  // Calculate expenses by category for pie/bar charts
  const expensesByCategory = mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = mockCategories.find(c => c.id === transaction.categoryId);
      if (category) {
        acc[category.name] = {
          amount: (acc[category.name]?.amount || 0) + transaction.amount,
          color: category.color,
          icon: category.icon
        };
      }
      return acc;
    }, {} as Record<string, { amount: number; color: string; icon: string }>);

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.amount, 0);

  // Prepare pie chart data
  const pieChartData = Object.entries(expensesByCategory)
    .map(([name, data]) => ({
      name,
      value: data.amount,
      color: data.color,
      percentage: ((data.amount / totalExpenses) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value);

  // Group transactions by time period for line chart
  const expensesByDate = mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const key = selectedPeriod === 'month'
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : date.getFullYear().toString();

      if (!acc[key]) {
        acc[key] = {};
        mockCategories.forEach(category => {
          acc[key][category.name] = 0;
        });
      }

      const category = mockCategories.find(c => c.id === transaction.categoryId);
      if (category) {
        acc[key][category.name] = (acc[key][category.name] || 0) + transaction.amount;
      }

      return acc;
    }, {} as Record<string, Record<string, number>>);

  const lineChartData = Object.entries(expensesByDate)
    .map(([date, categories]) => {
      const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
      return {
        date,
        ...categories,
        Total: total
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const uniqueCategories = mockCategories
    .filter(c => mockTransactions.some(t => t.categoryId === c.id && t.type === 'expense'))
    .map(c => ({ name: c.name, color: c.color }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (parseFloat(percentage) < 5) return null; // Hide labels for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Análise de Despesas por Categoria
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Mensal
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('year')}
            >
              Anual
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-gray-600">Total Gasto</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-gray-600">Categorias Ativas</p>
            <p className="text-lg font-bold text-green-600">{Object.keys(expensesByCategory).length}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-gray-600">Maior Categoria</p>
            <p className="text-lg font-bold text-purple-600">{pieChartData[0]?.name || 'N/A'}</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
            <p className="text-sm text-gray-600">Média por Categoria</p>
            <p className="text-lg font-bold text-orange-600">
              {formatCurrency(totalExpenses / Object.keys(expensesByCategory).length)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pie" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Distribuição
            </TabsTrigger>
            <TabsTrigger value="bar" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Comparação
            </TabsTrigger>
            <TabsTrigger value="line" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Tendência
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pie" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomPieLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Detalhamento por Categoria</h4>
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.value)}</p>
                      <p className="text-sm text-gray-500">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bar">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pieChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `R$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#8884d8">
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="line">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => {
                    if (selectedPeriod === 'month') {
                      const [year, month] = label.split('-');
                      return `${month}/${year}`;
                    }
                    return label;
                  }}
                />
                <Legend />
                <Line
                  key="Total"
                  type="monotone"
                  dataKey="Total"
                  stroke="#000000"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
                {uniqueCategories.map((category) => (
                  <Line
                    key={category.name}
                    type="monotone"
                    dataKey={category.name}
                    stroke={category.color}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
