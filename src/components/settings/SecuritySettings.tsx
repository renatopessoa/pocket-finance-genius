
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('pfg_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function SecuritySettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const { toast } = useToast();

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    // Validações no frontend antes de chamar a API
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos de senha.', variant: 'destructive' });
      return;
    }
    if (passwords.new.length < 8) {
      toast({ title: 'Senha fraca', description: 'A nova senha deve ter ao menos 8 caracteres.', variant: 'destructive' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: 'Senhas não coincidem', description: 'A confirmação de senha não bate com a nova senha.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/me/password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: passwords.current,
          new_password: passwords.new,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Erro ao alterar senha', description: data.error || 'Tente novamente.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Senha alterada ✓', description: 'Sua senha foi atualizada com sucesso.' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch {
      toast({ title: 'Erro de rede', description: 'Não foi possível conectar ao servidor.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Alterar Senha ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alterar Senha</CardTitle>
          <CardDescription>Mantenha sua conta segura com uma senha forte (mínimo 8 caracteres)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => handlePasswordChange('current', e.target.value)}
                disabled={isLoading}
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
              type={showPassword ? 'text' : 'password'}
              value={passwords.new}
              onChange={(e) => handlePasswordChange('new', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={passwords.confirm}
              onChange={(e) => handlePasswordChange('confirm', e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button onClick={handleChangePassword} className="w-full md:w-auto" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Alterando...</>
            ) : (
              <><CheckCircle2 className="mr-2 h-4 w-4" />Alterar Senha</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── 2FA — Em desenvolvimento ── */}
      <Card className="opacity-70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Autenticação de Dois Fatores</CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />Em breve
            </Badge>
          </div>
          <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              A autenticação de dois fatores (2FA) estará disponível em uma próxima versão.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* ── Sessões Ativas — Em desenvolvimento ── */}
      <Card className="opacity-70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Sessões Ativas</CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />Em breve
            </Badge>
          </div>
          <CardDescription>Gerencie dispositivos conectados à sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              O gerenciamento de sessões e revogação de dispositivos estará disponível em breve.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
