import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Lightbulb, Database } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

/** Very light markdown renderer: bold and unordered lists. */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bullet list item
    if (/^[-*•]\s/.test(line)) {
      const content = line.replace(/^[-*•]\s/, '');
      return (
        <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: boldify(content) }} />
      );
    }
    // Empty line = spacing
    if (line.trim() === '') return <br key={i} />;
    return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
  });
}

function boldify(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou seu assistente financeiro pessoal com acesso aos seus dados reais. Posso analisar seus gastos, verificar seus orçamentos, acompanhar suas metas e sugerir maneiras de economizar. Como posso ajudá-lo hoje?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Quanto gastei este mês por categoria?",
    "Como estão meus orçamentos este mês?",
    "Qual é o meu saldo atual em todas as contas?",
    "Estou no caminho certo nas minhas metas financeiras?",
    "Onde posso economizar mais dinheiro?",
    "Analise meus gastos do último mês",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const history = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));

      // Call backend AI endpoint
      const token = localStorage.getItem('pfg_token');
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: inputMessage, history }),
      });

      const data = await res.json();
      const aiResponseContent = res.ok
        ? data.response
        : 'Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde.';

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error calling AI API:", error);

      // Add error message
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assistente Financeiro IA</h2>
        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
          <Database className="h-4 w-4" />
          <span>Acesso aos seus dados financeiros</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <span>Chat com o Assistente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-96 w-full border rounded-lg p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                  >
                    <Avatar className="h-8 w-8">
                      {message.isUser ? (
                        <>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarFallback className="bg-green-100 text-green-600">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.isUser
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                    >
                      {message.isUser ? (
                        <p className="text-sm">{message.content}</p>
                      ) : (
                        <div className="text-sm">{renderMarkdown(message.content)}</div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Database className="h-3 w-3 text-gray-400 animate-pulse" />
                        <span className="text-xs text-gray-500">Consultando seus dados...</span>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua pergunta sobre finanças..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-green-600 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <span>Perguntas Sugeridas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left h-auto p-3 justify-start"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  <span className="text-xs">{question}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
