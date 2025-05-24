import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Lightbulb } from 'lucide-react';
import OpenAI from 'openai';

// Initialize OpenAI client
// Access environment variables properly in a browser context
const openaiApiKey = typeof window !== 'undefined'
  ? window.__NEXT_DATA__?.props?.pageProps?.openaiApiKey || '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'
  : '';

const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true // Note: For production, use server-side API calls instead
});

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Olá! Sou seu assistente financeiro pessoal. Como posso ajudá-lo hoje? Posso analisar seus gastos, sugerir formas de economizar ou ajudar com planejamento financeiro.',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = [
    "Como posso economizar mais este mês?",
    "Onde estou gastando mais dinheiro?",
    "Monte um plano para quitar minhas dívidas",
    "Como criar uma reserva de emergência?"
  ];

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
      // Get conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.isUser ? ('user' as const) : ('assistant' as const),
        content: msg.content
      }));

      // Add current message
      conversationHistory.push({
        role: 'user' as const,
        content: inputMessage
      });

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um assistente financeiro pessoal brasileiro. Forneça conselhos personalizados sobre finanças pessoais, orçamentos, economias e investimentos. Use linguagem amigável e exemplos práticos com valores em reais (R$). Seja conciso e direto."
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      // Get AI response
      const aiResponseContent = response.choices[0]?.message?.content ||
        "Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde.";

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseContent,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error calling OpenAI API:", error);

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
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Bot className="h-4 w-4" />
          <span>Powered by AI</span>
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
                      <p className="text-sm">{message.content}</p>
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
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
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
