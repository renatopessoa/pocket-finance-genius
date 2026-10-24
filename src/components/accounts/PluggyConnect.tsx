import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, RefreshCw, Trash2, Link } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  usePluggyItems,
  useCreatePluggyConnectToken,
  useSavePluggyItem,
  useSyncPluggyItem,
  useDeletePluggyItem,
} from '@/hooks/use-api';

const PLUGGY_CONNECT_URL = 'https://connect.pluggy.ai';

export function PluggyConnect() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: items = [], isLoading } = usePluggyItems();
  const createToken = useCreatePluggyConnectToken();
  const saveItem = useSavePluggyItem();
  const syncItem = useSyncPluggyItem();
  const deleteItem = useDeletePluggyItem();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { accessToken } = await createToken.mutateAsync();

      // Abre o widget Pluggy Connect em uma nova janela
      const width = 500;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        `${PLUGGY_CONNECT_URL}?connect_token=${accessToken}`,
        'pluggy-connect',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Escuta a mensagem de callback do widget
      const handler = async (event: MessageEvent) => {
        if (event.origin !== 'https://connect.pluggy.ai') return;

        const data = event.data;
        if (data?.event === 'close' || data?.event === 'error') {
          window.removeEventListener('message', handler);
          popup?.close();
          setIsConnecting(false);
          if (data?.event === 'error') {
            toast({ title: 'Erro na conexão', description: 'Não foi possível conectar ao banco.', variant: 'destructive' });
          }
          return;
        }

        if (data?.event === 'success' && data?.itemId) {
          window.removeEventListener('message', handler);
          popup?.close();

          // Salva o item e sincroniza
          await saveItem.mutateAsync(data.itemId);
          await syncItem.mutateAsync(data.itemId);

          toast({ title: 'Banco conectado!', description: 'Suas contas e transações foram sincronizadas.' });
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handler);

      // Fallback: se a janela for fechada sem callback
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handler);
          setIsConnecting(false);
        }
      }, 1000);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível iniciar a conexão.', variant: 'destructive' });
      setIsConnecting(false);
    }
  };

  const handleSync = (itemId: string) =>
    syncItem.mutate(itemId, {
      onSuccess: () => toast({ title: 'Sincronizado!', description: 'Dados bancários atualizados.' }),
      onError: () => toast({ title: 'Erro ao sincronizar', variant: 'destructive' }),
    });

  const handleDelete = (itemId: string) =>
    deleteItem.mutate(itemId, {
      onSuccess: () => toast({ title: 'Conexão removida.' }),
      onError: () => toast({ title: 'Erro ao remover conexão', variant: 'destructive' }),
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Open Banking</h3>
        <Button onClick={handleConnect} disabled={isConnecting}>
          <Link className="h-4 w-4 mr-2" />
          {isConnecting ? 'Conectando...' : 'Conectar Banco'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Nenhum banco conectado ainda.</p>
            <p className="text-sm text-gray-400 mt-1">
              Conecte sua conta bancária para importar transações automaticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item: { id: string; item_id: string; connector_name: string; status: string }) => (
            <Card key={item.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-base">{item.connector_name}</CardTitle>
                      <Badge variant={item.status === 'UPDATED' ? 'default' : 'secondary'} className="text-xs mt-1">
                        {item.status === 'UPDATED' ? 'Atualizado' : item.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSync(item.item_id)}
                      disabled={syncItem.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncItem.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.item_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
