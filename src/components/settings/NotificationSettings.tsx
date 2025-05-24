
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailTransactions: true,
    emailBudgetAlerts: true,
    emailWeeklyReport: false,
    pushTransactions: true,
    pushBudgetAlerts: true,
    pushGoalReminders: false,
    frequency: 'daily'
  });

  const { toast } = useToast();

  const handleToggle = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas preferências de notificação foram atualizadas."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notificações por Email</CardTitle>
          <CardDescription>Receba atualizações importantes por email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transações</Label>
              <p className="text-sm text-gray-500">Notificações sobre novas transações</p>
            </div>
            <Switch
              checked={notifications.emailTransactions}
              onCheckedChange={(checked) => handleToggle('emailTransactions', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Orçamento</Label>
              <p className="text-sm text-gray-500">Quando você exceder limites de orçamento</p>
            </div>
            <Switch
              checked={notifications.emailBudgetAlerts}
              onCheckedChange={(checked) => handleToggle('emailBudgetAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Relatório Semanal</Label>
              <p className="text-sm text-gray-500">Resumo semanal das suas finanças</p>
            </div>
            <Switch
              checked={notifications.emailWeeklyReport}
              onCheckedChange={(checked) => handleToggle('emailWeeklyReport', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notificações Push</CardTitle>
          <CardDescription>Receba notificações instantâneas no navegador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transações</Label>
              <p className="text-sm text-gray-500">Notificações push para transações</p>
            </div>
            <Switch
              checked={notifications.pushTransactions}
              onCheckedChange={(checked) => handleToggle('pushTransactions', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Orçamento</Label>
              <p className="text-sm text-gray-500">Push para limites de orçamento</p>
            </div>
            <Switch
              checked={notifications.pushBudgetAlerts}
              onCheckedChange={(checked) => handleToggle('pushBudgetAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes de Metas</Label>
              <p className="text-sm text-gray-500">Lembretes sobre suas metas financeiras</p>
            </div>
            <Switch
              checked={notifications.pushGoalReminders}
              onCheckedChange={(checked) => handleToggle('pushGoalReminders', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequência de Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="frequency">Como você prefere receber relatórios?</Label>
            <Select value={notifications.frequency} onValueChange={(value) => setNotifications(prev => ({ ...prev, frequency: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="never">Nunca</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full md:w-auto">
        <Save className="mr-2 h-4 w-4" />
        Salvar Configurações
      </Button>
    </div>
  );
}
