
import { useState, Component, ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { EducationHub } from '@/components/education/EducationHub';
import { AIChat } from '@/components/ai-assistant/AIChat';
import { Button } from '@/components/ui/button';
import { Menu, X, AlertTriangle } from 'lucide-react';
import { TransactionsPage } from '@/components/transactions/TransactionsPage';
import { AccountsPage } from '@/components/accounts/AccountsPage';
import { BudgetsPage } from '@/components/budgets/BudgetsPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { SettingsPage } from '@/components/settings/SettingsPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
          <AlertTriangle className="h-12 w-12 text-red-400" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Ocorreu um erro nesta página</h2>
          <pre className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-4 max-w-xl overflow-auto text-left">{this.state.error.message}</pre>
          <Button onClick={() => this.setState({ error: null })}>Tentar novamente</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
              <div className="text-sm text-gray-500">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ExpenseChart />
              <RecentTransactions />
            </div>
          </div>
        );
      case 'transactions':
        return <TransactionsPage />;
      case 'accounts':
        return <AccountsPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'education':
        return <EducationHub />;
      case 'ai-assistant':
        return <AIChat />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex w-full">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:relative z-40 h-screen transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setMobileMenuOpen(false);
            }}
            isCollapsed={sidebarCollapsed}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <Header onThemeToggle={toggleTheme} isDarkMode={isDarkMode} onTabChange={setActiveTab} />

          <main className="flex-1 p-6">
            <ErrorBoundary key={activeTab}>
              {renderContent()}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
