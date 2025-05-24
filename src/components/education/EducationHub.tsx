
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, TrendingUp, PiggyBank, CreditCard, Target } from 'lucide-react';
import { mockEducationalContent } from '@/lib/mockData';

export function EducationHub() {
  const categories = [
    { id: 'saving', label: 'Economia', icon: PiggyBank, color: 'text-green-600' },
    { id: 'investing', label: 'Investimentos', icon: TrendingUp, color: 'text-blue-600' },
    { id: 'budgeting', label: 'Orçamentos', icon: Target, color: 'text-purple-600' },
    { id: 'debt', label: 'Dívidas', icon: CreditCard, color: 'text-red-600' },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Educação Financeira</h2>
        <Button className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <BookOpen className="mr-2 h-4 w-4" />
          Meu Progresso
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockEducationalContent.map((content) => {
              const category = categories.find(c => c.id === content.category);
              const Icon = category?.icon || BookOpen;

              return (
                <Card key={content.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg bg-${category?.color.split('-')[1]}-50 dark:bg-${category?.color.split('-')[1]}-900/20`}>
                          <Icon className={`h-4 w-4 ${category?.color}`} />
                        </div>
                        <Badge className={getDifficultyColor(content.difficulty)}>
                          {content.difficulty === 'beginner' && 'Iniciante'}
                          {content.difficulty === 'intermediate' && 'Intermediário'}
                          {content.difficulty === 'advanced' && 'Avançado'}
                        </Badge>
                      </div>
                      {content.readTime && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="mr-1 h-3 w-3" />
                          {content.readTime}min
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg">{content.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {content.content}
                    </p>
                    <Button variant="outline" className="w-full">
                      Ler Artigo
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockEducationalContent
                .filter(content => content.category === category.id)
                .map((content) => {
                  const Icon = category.icon;

                  return (
                    <Card key={content.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg bg-${category.color.split('-')[1]}-50 dark:bg-${category.color.split('-')[1]}-900/20`}>
                              <Icon className={`h-4 w-4 ${category.color}`} />
                            </div>
                            <Badge className={getDifficultyColor(content.difficulty)}>
                              {content.difficulty === 'beginner' && 'Iniciante'}
                              {content.difficulty === 'intermediate' && 'Intermediário'}
                              {content.difficulty === 'advanced' && 'Avançado'}
                            </Badge>
                          </div>
                          {content.readTime && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="mr-1 h-3 w-3" />
                              {content.readTime}min
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg">{content.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {content.content}
                        </p>
                        <Button variant="outline" className="w-full">
                          Ler Artigo
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
