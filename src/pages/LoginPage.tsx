import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wallet, Eye, EyeOff, TrendingUp, Shield, Zap } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

      login(data);
      toast({
        title: mode === 'login' ? 'Bem-vindo de volta!' : 'Conta criada com sucesso!',
        description: `Olá, ${data.name}!`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: TrendingUp, title: 'Controle Total', desc: 'Acompanhe receitas e despesas em tempo real' },
    { icon: Shield, title: 'Seguro e Privado', desc: 'Seus dados financeiros protegidos' },
    { icon: Zap, title: 'Inteligência Financeira', desc: 'Insights e orçamentos automáticos' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex-col items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative z-10 max-w-md text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-2xl shadow-purple-500/30">
              <Wallet className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            Meu
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Financeiro
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Sua gestão financeira inteligente, simples e poderosa.
          </p>
        </div>

        <div className="relative z-10 space-y-4 w-full max-w-sm">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors duration-200"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30 shrink-0">
                <Icon className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-gray-950 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg mr-3">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Meu Financeiro</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <p className="text-gray-400 mt-2">
              {mode === 'login'
                ? 'Entre na sua conta para continuar'
                : 'Comece sua jornada financeira hoje'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-xl bg-gray-900 p-1 mb-8 border border-gray-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <Label htmlFor="name" className="text-gray-300 text-sm font-medium">Nome completo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-1.5 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1.5 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 h-11"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Senha</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-gray-500 mt-1.5">Mínimo de 6 caracteres</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 mt-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aguarde...</>
              ) : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            {mode === 'login' ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Entre aqui'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
