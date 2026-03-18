
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Save, Palette, Globe, Calculator, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PreferencesSettings() {
  const [preferences, setPreferences] = useState({
    currency: 'BRL',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
    theme: 'system',
    autoBackup: true,
    compactView: false,
    showDecimals: true,
    defaultTransactionType: 'expense',
    chartColorTheme: 'pastel',
    chartViewMode: 'standard',
    chartAnimations: true,
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Preferências salvas",
      description: "Suas configurações foram atualizadas com sucesso."
    });
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localização e Idioma
          </CardTitle>
          <CardDescription>Configure formatos regionais e idioma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select value={preferences.currency} onValueChange={(value) => updatePreference('currency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                  <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">Libra Esterlina (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select value={preferences.language} onValueChange={(value) => updatePreference('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Formato de Data</Label>
            <Select value={preferences.dateFormat} onValueChange={(value) => updatePreference('dateFormat', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>Personalize a aparência do aplicativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Tema</Label>
            <RadioGroup 
              value={preferences.theme} 
              onValueChange={(value) => updatePreference('theme', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Claro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">Escuro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system">Automático (Sistema)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Visualização Compacta</Label>
              <p className="text-sm text-gray-500">Reduzir espaçamento entre elementos</p>
            </div>
            <Switch
              checked={preferences.compactView}
              onCheckedChange={(checked) => updatePreference('compactView', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Configurações do Dashboard
          </CardTitle>
          <CardDescription>Personalize a visualização dos gráficos e relatórios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chartColorTheme">Paleta de Cores dos Gráficos</Label>
            <Select value={preferences.chartColorTheme} onValueChange={(value) => updatePreference('chartColorTheme', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a paleta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão</SelectItem>
                <SelectItem value="pastel">Pastel</SelectItem>
                <SelectItem value="vibrant">Vibrante</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chartViewMode">Modo de Visualização</Label>
            <Select value={preferences.chartViewMode} onValueChange={(value) => updatePreference('chartViewMode', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="detailed">Detalhado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Animações dos Gráficos</Label>
              <p className="text-sm text-gray-500">Ativar animações de transição nos gráficos</p>
            </div>
            <Switch
              checked={preferences.chartAnimations}
              onCheckedChange={(checked) => updatePreference('chartAnimations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Configurações Financeiras
          </CardTitle>
          <CardDescription>Personalize como os valores são exibidos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mostrar Casas Decimais</Label>
              <p className="text-sm text-gray-500">Exibir centavos nos valores</p>
            </div>
            <Switch
              checked={preferences.showDecimals}
              onCheckedChange={(checked) => updatePreference('showDecimals', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultType">Tipo de Transação Padrão</Label>
            <Select value={preferences.defaultTransactionType} onValueChange={(value) => updatePreference('defaultTransactionType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Automático</Label>
              <p className="text-sm text-gray-500">Fazer backup dos dados automaticamente</p>
            </div>
            <Switch
              checked={preferences.autoBackup}
              onCheckedChange={(checked) => updatePreference('autoBackup', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full md:w-auto">
        <Save className="mr-2 h-4 w-4" />
        Salvar Preferências
      </Button>
    </div>
  );
}

