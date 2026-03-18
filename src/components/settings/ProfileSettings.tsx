
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProfileSettings() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Simular salvamento
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/avatar.jpg" alt="Foto do perfil" />
            <AvatarFallback className="text-lg">JS</AvatarFallback>
          </Avatar>
          <Button 
            size="sm" 
            variant="outline" 
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <h3 className="text-lg font-medium">Foto do Perfil</h3>
          <p className="text-sm text-gray-500">Clique no ícone da câmera para alterar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Conte um pouco sobre você..."
        />
      </div>

      <Button onClick={handleSave} className="w-full md:w-auto">
        <Save className="mr-2 h-4 w-4" />
        Salvar Alterações
      </Button>
    </div>
  );
}
