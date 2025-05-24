
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  FileText, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DataSettings() {
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { toast } = useToast();

  const handleExportData = async () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simular processo de exportação
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setExportProgress(i);
    }

    setIsExporting(false);
    toast({
      title: "Dados exportados",
      description: "Seus dados foram exportados com sucesso."
    });
  };

  const handleImportData = async () => {
    setIsImporting(true);
    setImportProgress(0);

    // Simular processo de importação
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setImportProgress(i);
    }

    setIsImporting(false);
    toast({
      title: "Dados importados",
      description: "Seus dados foram importados com sucesso."
    });
  };

  const handleDeleteAllData = () => {
    toast({
      title: "Ação necessária",
      description: "Esta funcionalidade requer confirmação adicional por segurança.",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Baixe todos os seus dados financeiros em formato CSV ou JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
              <Database className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exportando dados...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          )}

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              O arquivo de exportação incluirá transações, contas, orçamentos e metas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Dados
          </CardTitle>
          <CardDescription>
            Importe dados de outros aplicativos ou backups anteriores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleImportData} disabled={isImporting}>
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
            <Button variant="outline" onClick={handleImportData} disabled={isImporting}>
              <Upload className="mr-2 h-4 w-4" />
              Importar JSON
            </Button>
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importando dados...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              A importação substituirá dados existentes. Recomendamos fazer backup antes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estatísticas de Uso</CardTitle>
          <CardDescription>Informações sobre seus dados armazenados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">247</div>
              <div className="text-sm text-gray-500">Transações</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-sm text-gray-500">Contas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-500">Orçamentos</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-gray-500">Metas</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Espaço utilizado</span>
              <span>2.3 MB de 100 MB</span>
            </div>
            <Progress value={2.3} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-700 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam permanentemente seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Atenção:</strong> As ações abaixo são permanentes e não podem ser desfeitas.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllData}
              className="w-full md:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Todos os Dados
            </Button>
            <p className="text-sm text-gray-500">
              Remove permanentemente todas as transações, contas, orçamentos e configurações.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
