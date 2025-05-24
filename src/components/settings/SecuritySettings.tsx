
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, Smartphone, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SecuritySettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const { toast } = useToast();

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Senha alterada",
      description: "Sua senha foi atualizada com sucesso."
    });

    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleTwoFactorToggle = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    toast({
      title: enabled ? "2FA Ativado" : "2FA Desativado",
      description: enabled 
        ? "Autenticação de dois fatores foi ativada." 
        : "Autenticação de dois fatores foi desativada."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alterar Senha</CardTitle>
          <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => handlePasswordChange('current', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={passwords.new}
              onChange={(e) => handlePasswordChange('new', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={passwords.confirm}
              onChange={(e) => handlePasswordChange('confirm', e.target.value)}
            />
          </div>

          <Button onClick={handleChangePassword} className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Autenticação de Dois Fatores</CardTitle>
          <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <Label>Ativar 2FA</Label>
              </div>
              <p className="text-sm text-gray-500">
                Use um aplicativo autenticador para gerar códigos de segurança
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
            />
          </div>

          {twoFactorEnabled && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Configure seu aplicativo autenticador escaneando o QR code que será enviado por email.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Autenticação Biométrica</CardTitle>
          <CardDescription>Use impressão digital ou reconhecimento facial quando disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar Biometria</Label>
              <p className="text-sm text-gray-500">
                Login rápido e seguro usando dados biométricos
              </p>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={setBiometricEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sessões Ativas</CardTitle>
          <CardDescription>Gerencie dispositivos conectados à sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Navegador Atual</p>
              <p className="text-sm text-gray-500">Chrome • São Paulo, SP • Agora</p>
            </div>
            <Button variant="outline" size="sm">
              Atual
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">iPhone</p>
              <p className="text-sm text-gray-500">Safari • Rio de Janeiro, RJ • 2 horas atrás</p>
            </div>
            <Button variant="outline" size="sm">
              Revogar
            </Button>
          </div>

          <Button variant="destructive" className="w-full">
            Desconectar Todos os Dispositivos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
