# Documento de Requisitos de Produto (PRD): Inteligência Financeira Contextual

**Autor:** Manus AI
**Data:** 18 de Março de 2026
**Versão:** 1.0

## 1. Visão Geral

O objetivo desta funcionalidade é transformar o Assistente Financeiro IA do Pocket Finance Genius de um consultor genérico para um **conselheiro financeiro pessoal altamente contextualizado e proativo**. Ao integrar profundamente os dados financeiros do usuário (transações, orçamentos, metas, etc.), a IA será capaz de fornecer insights personalizados, análises preditivas e recomendações acionáveis, elevando significativamente o valor percebido e a utilidade da aplicação para o usuário.

## 2. Metas do Produto

*   Aumentar o engajamento do usuário com o Assistente Financeiro IA em X%.
*   Melhorar a satisfação do usuário com a relevância das recomendações da IA em Y%.
*   Reduzir a taxa de estouro de orçamento dos usuários em Z% através de alertas proativos.
*   Facilitar a tomada de decisões financeiras informadas pelos usuários.

## 3. Histórias de Usuário

Como usuário, eu quero:

*   ...receber alertas proativos sobre possíveis estouros de orçamento, para que eu possa ajustar meus gastos a tempo.
*   ...perguntar ao assistente de IA sobre meu desempenho financeiro em uma categoria específica e receber uma análise baseada nos meus dados reais.
*   ...obter recomendações personalizadas sobre como economizar ou investir, considerando minhas metas e meu perfil de gastos.
*   ...entender onde estou gastando mais dinheiro em comparação com meus orçamentos e receber sugestões de otimização.
*   ...solicitar um resumo do meu fluxo de caixa para um período específico, com base nas minhas transações.

## 4. Requisitos Funcionais

### 4.1. Integração de Dados em Tempo Real

*   **RF1.1:** O Assistente Financeiro IA deve ter acesso seguro e em tempo real aos dados de transações, contas, categorias, orçamentos e metas do usuário.
*   **RF1.2:** A IA deve ser capaz de processar e interpretar o histórico de dados financeiros do usuário para identificar padrões e tendências.

### 4.2. Análise Contextual e Personalização

*   **RF2.1:** A IA deve ser capaz de responder a perguntas do usuário com base em seus dados financeiros específicos (ex: "Quanto gastei em alimentação este mês?").
*   **RF2.2:** A IA deve fornecer insights sobre o desempenho do usuário em relação aos seus orçamentos (ex: "Você já gastou 80% do seu orçamento de lazer para este mês.").
*   **RF2.3:** A IA deve oferecer recomendações personalizadas para otimização de gastos e economia, baseadas no comportamento financeiro do usuário.

### 4.3. Análise Preditiva e Alertas Proativos

*   **RF3.1:** A IA deve ser capaz de prever possíveis estouros de orçamento com base nos padrões de gastos atuais e alertar o usuário proativamente.
*   **RF3.2:** A IA deve alertar o usuário sobre pagamentos futuros importantes ou vencimentos de contas.
*   **RF3.3:** A IA deve projetar o progresso do usuário em relação às suas metas financeiras, alertando sobre possíveis atrasos.

### 4.4. Geração de Relatórios e Visualizações

*   **RF4.1:** O usuário deve ser capaz de solicitar relatórios financeiros específicos através da interface de chat da IA (ex: "Relatório de despesas por categoria no último trimestre").
*   **RF4.2:** A IA deve ser capaz de gerar visualizações simples (gráficos de barras, pizza) para ilustrar os dados financeiros solicitados, se aplicável.

## 5. Requisitos Não Funcionais

*   **Performance:** As respostas da IA devem ser rápidas, com tempo de resposta máximo de 3 segundos para consultas simples e 10 segundos para análises complexas.
*   **Segurança:** Todos os dados financeiros do usuário acessados pela IA devem ser criptografados e protegidos de acordo com as melhores práticas de segurança e privacidade (LGPD).
*   **Escalabilidade:** A solução deve ser capaz de lidar com um número crescente de usuários e volume de dados sem degradação de performance.
*   **Usabilidade:** A interação com o assistente de IA deve ser intuitiva e as informações apresentadas devem ser claras e fáceis de entender.

## 6. Arquitetura Técnica (Alto Nível)

*   **Backend:** Extensão da API existente para permitir que o modelo de IA acesse dados financeiros do usuário de forma segura.
*   **Frontend:** Atualização do componente `AIChat.tsx` para enviar consultas mais ricas em contexto e exibir respostas personalizadas, incluindo visualizações de dados.
*   **Modelo de IA:** Utilização de um modelo de linguagem (LLM) configurado com prompts de sistema que o orientem a atuar como um assistente financeiro contextualizado, com acesso a funções para consulta de dados.

## 7. Métricas de Sucesso

*   **Taxa de Engajamento:** Número de interações por usuário com o Assistente IA por semana/mês.
*   **Taxa de Resolução:** Percentual de perguntas respondidas pela IA que o usuário considera úteis e relevantes.
*   **Redução de Gastos Excessivos:** Acompanhamento da diminuição de gastos acima do orçamento em categorias específicas.
*   **Atingimento de Metas:** Percentual de usuários que atingem suas metas financeiras com o auxílio da IA.

## 8. Próximos Passos

1.  Definição detalhada dos prompts de sistema e funções para o modelo de IA.
2.  Desenvolvimento da camada de integração de dados no backend.
3.  Implementação das atualizações no frontend para o `AIChat.tsx`.
4.  Testes de segurança, performance e usabilidade.
5.  Lançamento e monitoramento das métricas de sucesso.

## 9. Prompts de Comando Detalhados para Implementação

Esta seção detalha os prompts de comando que podem ser utilizados para guiar a implementação de cada requisito funcional, divididos por área de atuação (Backend, Frontend, IA/LLM).

### 9.1. Backend: Integração de Dados em Tempo Real

**Objetivo:** Criar endpoints seguros para que o modelo de IA possa consultar dados financeiros do usuário.

**Prompts Sugeridos:**

1.  **`Crie um novo endpoint na API para buscar todas as transações de um usuário específico em um determinado período. O endpoint deve aceitar `userId`, `startDate` e `endDate` como parâmetros e retornar uma lista de objetos `Transaction`. Garanta que a autenticação do usuário seja verificada.`**
2.  **`Desenvolva um endpoint para recuperar os orçamentos de um usuário, incluindo o valor orçado e o valor já gasto para cada categoria em um mês/ano específico. O endpoint deve aceitar `userId`, `month` e `year` como parâmetros.`**
3.  **`Implemente um endpoint para buscar as metas financeiras de um usuário, incluindo `targetAmount`, `currentAmount` e `deadline`.`**
4.  **`Crie um serviço ou função que agregue dados de transações para calcular o total de receitas e despesas por categoria e por conta em um período. Este serviço será consumido pelos endpoints da IA.`**
5.  **`Garanta que todos os novos endpoints utilizem as políticas de segurança e autorização existentes para proteger os dados do usuário.`**

### 9.2. Frontend: Atualização do Componente AIChat.tsx

**Objetivo:** Aprimorar a interface do chat para enviar contexto adicional à IA e exibir respostas mais ricas.

**Prompts Sugeridos:**

1.  **`Modifique o componente `AIChat.tsx` para incluir automaticamente o `userId` do usuário logado em todas as requisições enviadas ao backend da IA.`**
2.  **`Atualize a função `handleSendMessage` em `AIChat.tsx` para que, antes de enviar a mensagem do usuário para a IA, ela também envie um resumo do contexto financeiro atual do usuário (ex: saldo atual, orçamentos ativos, metas principais).`**
3.  **`Implemente a capacidade de exibir diferentes tipos de resposta da IA no `AIChat.tsx`, incluindo texto formatado, listas e, futuramente, pequenos gráficos. Crie componentes de UI reutilizáveis para isso.`**
4.  **`Adicione um indicador visual no `AIChat.tsx` que mostre quando a IA está processando uma consulta complexa, como uma análise de dados, para melhorar a experiência do usuário.`**
5.  **`Desenvolva a lógica para que, ao receber uma resposta da IA que inclua dados para um gráfico (ex: despesas por categoria), o `AIChat.tsx` possa renderizar um gráfico simples (ex: gráfico de barras ou pizza) diretamente na interface.`**

### 9.3. IA/LLM: Configuração do Modelo e Funções

**Objetivo:** Configurar o modelo de linguagem para atuar como um assistente financeiro contextualizado, utilizando as novas capacidades de consulta de dados.

**Prompts Sugeridos:**

1.  **`Atualize o prompt de sistema do modelo de IA para reforçar seu papel como assistente financeiro pessoal brasileiro, com foco em análise de dados do usuário e recomendações proativas. Inclua instruções para que ele utilize as funções de consulta de dados disponíveis.`**
    *   **Exemplo de System Prompt:** `Você é um assistente financeiro pessoal brasileiro. Sua principal função é analisar os dados financeiros do usuário (transações, orçamentos, metas) para fornecer conselhos personalizados, análises preditivas e recomendações acionáveis. Sempre que possível, utilize as ferramentas de consulta de dados disponíveis para obter informações precisas e contextualizadas. Responda de forma clara, amigável e com foco em ajudar o usuário a tomar melhores decisões financeiras. Use valores em reais (R$).`
2.  **`Defina as `tools` (funções) que o modelo de IA pode chamar para interagir com o backend. Inclua funções como `get_transactions(userId, startDate, endDate)`, `get_budgets(userId, month, year)`, `get_goals(userId)`, e `get_aggregated_data(userId, period, type)`.`**
3.  **`Crie exemplos de `few-shot learning` para o modelo de IA, demonstrando como ele deve interpretar perguntas do usuário, chamar as funções apropriadas, e formatar as respostas com base nos dados retornados.`**
    *   **Exemplo de User Prompt:** `Quanto gastei com alimentação no mês passado?`
    *   **Exemplo de AI Response (após chamar a função):** `No mês passado (Fevereiro de 2026), você gastou um total de R$ 850,00 na categoria Alimentação. Isso representa X% do seu orçamento para essa categoria. Gostaria de ver um detalhamento ou dicas para economizar?`
4.  **`Instrua o modelo de IA a identificar padrões de gastos e a alertar o usuário sobre possíveis estouros de orçamento. Por exemplo, se o usuário já gastou 70% do orçamento de uma categoria na primeira semana do mês, a IA deve alertar.`**
5.  **`Configure o modelo para que, ao identificar uma meta financeira em risco (ex: `currentAmount` muito abaixo do `targetAmount` com `deadline` próxima), ele possa sugerir ações corretivas ou ajustes no orçamento.`**

Este PRD serve como um guia abrangente para o desenvolvimento da funcionalidade de Inteligência Financeira Contextual, garantindo que a equipe de desenvolvimento tenha todas as informações necessárias para implementar a feature com sucesso.
