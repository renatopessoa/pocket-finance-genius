import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Area, AreaChart
} from 'recharts';
import { useCurrentUser, useTransactions, useCategories } from '@/hooks/use-api';
import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon,
  LineChartIcon, Filter, Calendar, ArrowUpRight, ArrowDownRight,
  Eye, EyeOff, Zap, Target, AlertTriangle, Sparkles, Info,
  ChevronDown, ChevronUp, Palette, Settings, Download,
  Share2, Heart, Star, Bell, RefreshCw
} from 'lucide-react';

export function ExpenseChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isAnimated, setIsAnimated] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'detailed' | 'minimal'>('standard');
  const [colorTheme, setColorTheme] = useState<'default' | 'pastel' | 'vibrant'>('pastel');
  const [favorites, setFavorites] = useState<string[]>([]);

  const { data: currentUser } = useCurrentUser();
  const { data: transactions = [] } = useTransactions(currentUser?.id);
  const { data: categories = [] } = useCategories();

  // Soft color palettes
  const colorPalettes = {
    pastel: [
      '#FFB5D6', '#C7A9FF', '#A8E6CF', '#FFD3A5', '#FFC3A0',
      '#D4B5FF', '#B5E7A0', '#FFABAB', '#85E3FF', '#FFC7FF'
    ],
    vibrant: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ],
    default: [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88',
      '#0088fe', '#ff0040', '#ffbb28', '#ff8042', '#8dd1e1'
    ]
  };

  // Memoized calculations for better performance
  const { expensesByCategory, totalExpenses, pieChartData, lineChartData, uniqueCategories, trends } = useMemo(() => {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = categories.find(c => c.id === transaction.categoryId);
        if (category) {
          acc[category.name] = {
            amount: (acc[category.name]?.amount || 0) + transaction.amount,
            color: category.color,
            icon: category.icon,
            transactions: (acc[category.name]?.transactions || 0) + 1
          };
        }
        return acc;
      }, {} as Record<string, { amount: number; color: string; icon: string; transactions: number }>);

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, cat) => sum + cat.amount, 0);

    // Calculate trends for each category
    const trends = Object.entries(expensesByCategory).reduce((acc, [name, data]) => {
      // Simplified trend calculation - in real app, compare with previous period
      const trend = Math.random() > 0.5 ? 'up' : 'down';
      const percentage = (Math.random() * 20).toFixed(1);
      acc[name] = { trend, percentage };
      return acc;
    }, {} as Record<string, { trend: 'up' | 'down'; percentage: string }>);

    const pieChartData = Object.entries(expensesByCategory)
      .map(([name, data]) => ({
        name,
        value: data.amount,
        color: data.color,
        percentage: ((data.amount / totalExpenses) * 100).toFixed(1),
        transactions: data.transactions
      }))
      .sort((a, b) => b.value - a.value);

    // Group transactions by time period for line chart
    const expensesByDate = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        const key = selectedPeriod === 'month'
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          : date.getFullYear().toString();

        if (!acc[key]) {
          acc[key] = {};
          categories.forEach(category => {
            acc[key][category.name] = 0;
          });
        }

        const category = categories.find(c => c.id === transaction.categoryId);
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

    const uniqueCategories = categories
      .filter(c => transactions.some(t => t.categoryId === c.id && t.type === 'expense'))
      .map(c => ({ name: c.name, color: c.color }));

    return { expensesByCategory, totalExpenses, pieChartData, lineChartData, uniqueCategories, trends };
  }, [selectedPeriod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const toggleCategoryVisibility = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (parseFloat(percentage) < 5) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
        className="drop-shadow-lg"
      >
        {`${percentage}%`}
      </text>
    );
  };

  // Enhanced loading simulation
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const toggleFavorite = (categoryName: string) => {
    setFavorites(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  // Enhanced CustomTooltip with soft styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-5 border-0 rounded-2xl shadow-2xl border-gray-100/50 max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
            <p className="font-semibold text-gray-800 text-sm">{label}</p>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 mb-2 last:mb-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 font-medium">{entry.dataKey}</span>
              </div>
              <span className="font-bold text-gray-800 text-sm">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          <Separator className="my-2 opacity-50" />
          <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>Dados em tempo real</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="col-span-1 lg:col-span-2 space-y-6">
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Button
          size="sm"
          className="rounded-full w-12 h-12 shadow-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-blue-500/25 transition-all duration-300 hover:scale-110"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full w-12 h-12 shadow-lg bg-white/80 backdrop-blur-sm border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full w-12 h-12 shadow-lg bg-white/80 backdrop-blur-sm border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30">
        <CardHeader className="bg-gradient-to-r from-slate-50/80 via-blue-50/50 to-indigo-50/80 backdrop-blur-sm border-b border-gray-100/50">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <CardTitle className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Análise Inteligente
                  </span>
                  <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                </div>
                <p className="text-sm text-gray-500 font-normal flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Insights personalizados dos seus gastos
                </p>
              </div>
            </CardTitle>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Advanced Options Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Settings className="h-4 w-4 mr-1" />
                {showAdvancedOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>

              {/* Period Selection */}
              <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full p-1 border border-gray-200/50 shadow-sm">
                <Button
                  variant={selectedPeriod === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPeriod('month')}
                  className={`rounded-full transition-all duration-300 ${selectedPeriod === 'month'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Mensal
                </Button>
                <Button
                  variant={selectedPeriod === 'year' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPeriod('year')}
                  className={`rounded-full transition-all duration-300 ${selectedPeriod === 'year'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Anual
                </Button>
              </div>

              {/* Animation Toggle */}
              {/* <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-2 border border-gray-200/50">
                <Zap className="h-3 w-3 text-yellow-500" />
                <Switch
                  checked={isAnimated}
                  onCheckedChange={setIsAnimated}
                  className="scale-75"
                />
              </div> */}
            </div>
          </div>

          {/* Advanced Options Panel */}
          {showAdvancedOptions && (
            <div className="mt-6 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* View Mode */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Modo de Visualização
                  </label>
                  <div className="flex gap-1">
                    {['minimal', 'standard', 'detailed'].map((mode) => (
                      <Button
                        key={mode}
                        variant={viewMode === mode ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode(mode as any)}
                        className="text-xs capitalize"
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color Theme */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Tema de Cores
                  </label>
                  <div className="flex gap-1">
                    {Object.keys(colorPalettes).map((theme) => (
                      <Button
                        key={theme}
                        variant={colorTheme === theme ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setColorTheme(theme as any)}
                        className="text-xs capitalize"
                      >
                        {theme === 'default' ? 'padrão' : theme}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Notificações
                  </label>
                  <div className="flex items-center gap-2">
                    <Switch className="scale-75" />
                    <span className="text-xs text-gray-500">Alertas de gastos</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Statistics Cards with Skeleton Loading */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 bg-white/80 rounded-2xl border border-gray-200/50">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))
            ) : (
              <>
                <div className="group relative p-5 bg-gradient-to-br from-white to-blue-50/50 rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium">Total Gasto</p>
                        <p className="text-xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
                      </div>
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-center text-xs mb-2">
                      <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                      <span className="text-emerald-600 font-medium">+5.2%</span>
                      <span className="text-gray-400 ml-1">vs mês anterior</span>
                    </div>
                    <Progress value={75} className="h-1.5 bg-gray-100" />
                  </div>
                </div>

                <div className="group relative p-5 bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium">Categorias Ativas</p>
                        <p className="text-xl font-bold text-gray-800">{Object.keys(expensesByCategory).length}</p>
                      </div>
                      <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <Filter className="h-5 w-5 text-emerald-600" />
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {uniqueCategories.length} disponíveis
                    </Badge>
                  </div>
                </div>

                <div className="group relative p-5 bg-gradient-to-br from-white to-purple-50/50 rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium">Maior Categoria</p>
                        <p className="text-lg font-bold text-gray-800">{pieChartData[0]?.name || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <ArrowUpRight className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <Progress
                      value={parseFloat(pieChartData[0]?.percentage || '0')}
                      className="h-2 bg-purple-50"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-purple-600 font-medium">
                        {pieChartData[0]?.percentage}% do total
                      </span>
                      <Heart
                        className={`h-3 w-3 cursor-pointer transition-colors ${favorites.includes(pieChartData[0]?.name || '')
                          ? 'text-red-500 fill-current'
                          : 'text-gray-400'
                          }`}
                        onClick={() => toggleFavorite(pieChartData[0]?.name || '')}
                      />
                    </div>
                  </div>
                </div>

                <div className="group relative p-5 bg-gradient-to-br from-white to-orange-50/50 rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium">Média por Categoria</p>
                        <p className="text-lg font-bold text-gray-800">
                          {formatCurrency(totalExpenses / Object.keys(expensesByCategory).length)}
                        </p>
                      </div>
                      <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex items-center text-xs mb-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                      <span className="text-amber-600 font-medium">Meta: R$ 500</span>
                    </div>
                    <Progress value={65} className="h-1.5 bg-orange-50" />
                  </div>
                </div>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-8 bg-gradient-to-br from-gray-50/30 to-white">
          <Tabs defaultValue="pie" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm rounded-2xl p-1">
              <TabsTrigger
                value="pie"
                className="flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <PieChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Distribuição</span>
              </TabsTrigger>
              <TabsTrigger
                value="bar"
                className="flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Comparação</span>
              </TabsTrigger>
              <TabsTrigger
                value="line"
                className="flex items-center gap-2 rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <LineChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Tendência</span>
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Pie Chart Tab */}
            <TabsContent value="pie" className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={pieChartData.map((item, index) => ({
                          ...item,
                          color: colorPalettes[colorTheme][index % colorPalettes[colorTheme].length]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={CustomPieLabel}
                        outerRadius={120}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={isAnimated ? 1200 : 0}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={colorPalettes[colorTheme][index % colorPalettes[colorTheme].length]}
                            className="hover:opacity-80 transition-all duration-300 cursor-pointer drop-shadow-lg"
                            onClick={() => setHoveredCategory(entry.name)}
                            style={{ filter: hoveredCategory === entry.name ? 'brightness(1.1)' : 'none' }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Enhanced center label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">Total Geral</p>
                      <p className="text-xs font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Category Details with soft styling */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Detalhamento Inteligente
                    </h4>
                    <Badge variant="outline" className="text-xs bg-white/80 border-gray-200">
                      {pieChartData.length} categorias
                    </Badge>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {pieChartData.map((item, index) => (
                      <div
                        key={index}
                        className={`group relative p-5 rounded-2xl border-0 transition-all duration-500 cursor-pointer ${hoveredCategory === item.name
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 shadow-xl scale-[1.02] border border-blue-200/50'
                          : 'bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border border-gray-200/50'
                          }`}
                        onMouseEnter={() => setHoveredCategory(item.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        onClick={() => toggleCategoryVisibility(item.name)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full ring-2 ring-white shadow-lg group-hover:scale-125 transition-transform duration-300"
                              style={{ backgroundColor: colorPalettes[colorTheme][index % colorPalettes[colorTheme].length] }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">{item.name}</span>
                                <Heart
                                  className={`h-3 w-3 cursor-pointer transition-all duration-300 ${favorites.includes(item.name)
                                    ? 'text-red-500 fill-current scale-110'
                                    : 'text-gray-300 hover:text-red-400'
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(item.name);
                                  }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {item.transactions} transações
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-gray-800 text-lg">
                              {formatCurrency(item.value)}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600">
                                {item.percentage}%
                              </span>
                              {trends[item.name] && (
                                <div className="flex items-center gap-1">
                                  {trends[item.name].trend === 'up' ? (
                                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                  )}
                                  <span className={`text-xs font-medium ${trends[item.name].trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                                    }`}>
                                    {trends[item.name].percentage}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <Progress
                          value={parseFloat(item.percentage)}
                          className="h-2 bg-gray-100"
                        />

                        {/* Micro-interaction feedback */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/10 to-purple-400/10 opacity-0 transition-opacity duration-300 ${hoveredCategory === item.name ? 'opacity-100' : ''
                          }`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Enhanced Bar Chart and Line Chart tabs with similar soft styling... */}
            {/* ...existing code for other tabs... */}
            {/* Enhanced Bar Chart */}
            <TabsContent value="bar">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Comparação entre Categorias
                  </h4>
                  <div className="flex gap-2">
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCategories([])}
                        className="text-xs"
                      >
                        Limpar Filtros ({selectedCategories.length})
                      </Button>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {pieChartData.length} categorias
                    </Badge>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-2 p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    Filtrar por categoria:
                  </span>
                  {pieChartData.map((category, index) => (
                    <Button
                      key={category.name}
                      variant={selectedCategories.includes(category.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategoryVisibility(category.name)}
                      className={`text-xs rounded-full transition-all duration-300 ${selectedCategories.includes(category.name)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105'
                        : 'hover:scale-105'
                        }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: colorPalettes[colorTheme][index % colorPalettes[colorTheme].length] }}
                      />
                      {category.name}
                    </Button>
                  ))}
                </div>

                {/* Enhanced Bar Chart */}
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart
                      data={pieChartData
                        .filter(item => selectedCategories.length === 0 || selectedCategories.includes(item.name))
                        .map((item, index) => ({
                          ...item,
                          color: colorPalettes[colorTheme][index % colorPalettes[colorTheme].length]
                        }))
                      }
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={11}
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis
                        tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        fill="#8884d8"
                        radius={[8, 8, 0, 0]}
                        animationDuration={isAnimated ? 1000 : 0}
                      >
                        {pieChartData
                          .filter(item => selectedCategories.length === 0 || selectedCategories.includes(item.name))
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={colorPalettes[colorTheme][index % colorPalettes[colorTheme].length]}
                              className="hover:opacity-80 transition-all duration-300 drop-shadow-sm"
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Comparison Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Maior Gasto</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">{pieChartData[0]?.name}</p>
                    <p className="text-sm text-blue-700">{formatCurrency(pieChartData[0]?.value || 0)}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Mais Transações</span>
                    </div>
                    <p className="text-lg font-bold text-green-900">
                      {pieChartData.sort((a, b) => b.transactions - a.transactions)[0]?.name}
                    </p>
                    <p className="text-sm text-green-700">
                      {pieChartData.sort((a, b) => b.transactions - a.transactions)[0]?.transactions} transações
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Ticket Médio</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">
                      {pieChartData[0] ? (pieChartData[0].value / pieChartData[0].transactions).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0'}
                    </p>
                    <p className="text-sm text-purple-700">por transação</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Enhanced Line Chart */}
            <TabsContent value="line">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4 text-indigo-500" />
                    Análise de Tendências Temporais
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Período:</span>
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {selectedPeriod === 'month' ? 'Mensal' : 'Anual'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Pontos:</span>
                      <Badge variant="outline" className="text-xs">
                        {lineChartData.length} períodos
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Trend Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">CRESCIMENTO</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-900">+12.5%</p>
                    <p className="text-xs text-emerald-700">vs período anterior</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">PICO</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">
                      {formatCurrency(Math.max(...lineChartData.map(d => d.Total)))}
                    </p>
                    <p className="text-xs text-blue-700">maior valor mensal</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                      <span className="text-xs text-orange-600 font-medium">MÉDIA</span>
                    </div>
                    <p className="text-lg font-bold text-orange-900">
                      {formatCurrency(lineChartData.reduce((sum, d) => sum + d.Total, 0) / lineChartData.length)}
                    </p>
                    <p className="text-xs text-orange-700">por período</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <span className="text-xs text-purple-600 font-medium">PROJEÇÃO</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">
                      {formatCurrency(lineChartData[lineChartData.length - 1]?.Total * 1.125 || 0)}
                    </p>
                    <p className="text-xs text-purple-700">próximo período</p>
                  </div>
                </div>

                {/* Enhanced Line Chart */}
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                  <ResponsiveContainer width="100%" height={450}>
                    <AreaChart data={lineChartData}>
                      <defs>
                        <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                        {uniqueCategories.map((category, index) => (
                          <linearGradient key={category.name} id={`gradient-${category.name}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colorPalettes[colorTheme][index % colorPalettes[colorTheme].length]} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={colorPalettes[colorTheme][index % colorPalettes[colorTheme].length]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        tickFormatter={(value) => {
                          if (selectedPeriod === 'month') {
                            const [year, month] = value.split('-');
                            return `${month}/${year.slice(2)}`;
                          }
                          return value;
                        }}
                      />
                      <YAxis
                        tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />

                      {/* Total Area */}
                      <Area
                        type="monotone"
                        dataKey="Total"
                        stroke="#6366F1"
                        fillOpacity={1}
                        fill="url(#totalGradient)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                        animationDuration={isAnimated ? 1500 : 0}
                      />

                      {/* Category Lines */}
                      {uniqueCategories.map((category, index) => (
                        <Line
                          key={category.name}
                          type="monotone"
                          dataKey={category.name}
                          stroke={colorPalettes[colorTheme][index % colorPalettes[colorTheme].length]}
                          strokeWidth={2}
                          dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                          animationDuration={isAnimated ? 1200 + (index * 200) : 0}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Trend Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                    <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Categorias em Crescimento
                    </h5>
                    <div className="space-y-3">
                      {Object.entries(trends)
                        .filter(([_, trend]) => trend.trend === 'up')
                        .slice(0, 3)
                        .map(([name, trend], index) => (
                          <div key={name} className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colorPalettes[colorTheme][index % colorPalettes[colorTheme].length] }}
                              />
                              <span className="text-sm font-medium text-gray-700">{name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-green-600">
                              <TrendingUp className="h-3 w-3" />
                              <span className="text-sm font-bold">+{trend.percentage}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                    <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      Categorias em Declínio
                    </h5>
                    <div className="space-y-3">
                      {Object.entries(trends)
                        .filter(([_, trend]) => trend.trend === 'down')
                        .slice(0, 3)
                        .map(([name, trend], index) => (
                          <div key={name} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colorPalettes[colorTheme][index % colorPalettes[colorTheme].length] }}
                              />
                              <span className="text-sm font-medium text-gray-700">{name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-red-600">
                              <TrendingDown className="h-3 w-3" />
                              <span className="text-sm font-bold">-{trend.percentage}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
