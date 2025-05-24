
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  Target, 
  CreditCard, 
  PieChart, 
  BookOpen, 
  MessageCircle,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações', icon: ArrowUpDown },
  { id: 'accounts', label: 'Contas', icon: CreditCard },
  { id: 'budgets', label: 'Orçamentos', icon: Target },
  { id: 'reports', label: 'Relatórios', icon: PieChart },
  { id: 'education', label: 'Educação', icon: BookOpen },
  { id: 'ai-assistant', label: 'Assistente IA', icon: MessageCircle },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange, isCollapsed }: SidebarProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200",
                isCollapsed && "px-2",
                activeTab === item.id && "bg-gradient-to-r from-blue-600 to-green-600 text-white"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
