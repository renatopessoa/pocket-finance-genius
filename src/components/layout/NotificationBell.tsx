import { useState } from 'react';
import { Bell, AlertTriangle, Target, Receipt, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAlerts, type AppAlert } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
    onTabChange: (tab: string) => void;
}

const typeIcon = {
    budget: AlertTriangle,
    bill: Receipt,
    goal: Target,
};

const severityClass = {
    critical: 'text-red-500 dark:text-red-400',
    warning: 'text-amber-500 dark:text-amber-400',
};

const severityBg = {
    critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
};

export function NotificationBell({ onTabChange }: NotificationBellProps) {
    const { data: alerts = [] } = useAlerts();
    const [open, setOpen] = useState(false);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visible = alerts.filter((a) => !dismissed.has(a.id));
    const critical = visible.filter((a) => a.severity === 'critical').length;
    const badgeCount = visible.length;

    const handleClick = (alert: AppAlert) => {
        setOpen(false);
        onTabChange(alert.tab);
    };

    const dismiss = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDismissed((prev) => new Set(prev).add(id));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative" aria-label="Notificações">
                    <Bell className={cn('h-4 w-4', badgeCount > 0 && 'text-amber-500')} />
                    {badgeCount > 0 && (
                        <span
                            className={cn(
                                'absolute -top-1 -right-1 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold',
                                critical > 0 ? 'bg-red-500' : 'bg-amber-500'
                            )}
                        >
                            {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        Alertas
                    </span>
                    {badgeCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {badgeCount} {badgeCount === 1 ? 'alerta' : 'alertas'}
                        </Badge>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {visible.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 px-4">
                            Nenhum alerta no momento. Suas finanças estão em dia! 🎉
                        </p>
                    ) : (
                        visible.map((alert) => {
                            const Icon = typeIcon[alert.type] ?? Bell;
                            return (
                                <div
                                    key={alert.id}
                                    onClick={() => handleClick(alert)}
                                    className={cn(
                                        'flex items-start gap-3 p-3 m-2 rounded-lg border cursor-pointer transition-opacity hover:opacity-80',
                                        severityBg[alert.severity]
                                    )}
                                >
                                    <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', severityClass[alert.severity])} />
                                    <p className="text-xs text-gray-800 dark:text-gray-200 flex-1 leading-relaxed">
                                        {alert.message}
                                    </p>
                                    <button
                                        onClick={(e) => dismiss(e, alert.id)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                                        aria-label="Dispensar"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
