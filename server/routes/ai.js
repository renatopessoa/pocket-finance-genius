import { Router } from 'express';
import OpenAI from 'openai';
import { authenticateToken } from '../middleware/auth.js';
import {
    getAccountBalances,
    getTransactionsByPeriod,
    getBudgetSummary,
    getGoals,
    getSpendingByCategory,
} from '../services/financialContext.js';

const router = Router();
router.use(authenticateToken);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Você é um assistente financeiro pessoal brasileiro altamente contextualizado.
Você tem acesso às ferramentas de consulta de dados financeiros reais do usuário e deve usá-las sempre que a pergunta envolver dados específicos (saldos, gastos, orçamentos, metas, etc.).
Sua função é fornecer análises personalizadas, insights sobre padrões de gasto, alertas sobre orçamentos em risco e recomendações acionáveis.
Seja claro, amigável e direto. Use valores em reais (R$). Formate as respostas com listas e destaques em markdown quando útil.
A data de hoje é: {CURRENT_DATE}.`;

// ── OpenAI Tools (Function Calling) ──────────────────────────────────────────
const tools = [
    {
        type: 'function',
        function: {
            name: 'get_account_balances',
            description: 'Retorna os saldos de todas as contas bancárias do usuário (corrente, poupança, crédito, carteira).',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_transactions',
            description: 'Retorna as transações do usuário em um período específico com categoria de cada transação. Use para analisar receitas, despesas e padrões financeiros.',
            parameters: {
                type: 'object',
                properties: {
                    start_date: { type: 'string', description: 'Data inicial no formato YYYY-MM-DD' },
                    end_date: { type: 'string', description: 'Data final no formato YYYY-MM-DD' },
                },
                required: ['start_date', 'end_date'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_budget_summary',
            description: 'Retorna o resumo dos orçamentos do usuário para um mês e ano, incluindo o valor orçado, quanto foi gasto e o percentual utilizado de cada categoria.',
            parameters: {
                type: 'object',
                properties: {
                    month: { type: 'integer', description: 'Mês (1-12)' },
                    year: { type: 'integer', description: 'Ano com 4 dígitos, ex: 2026' },
                },
                required: ['month', 'year'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_goals',
            description: 'Retorna todas as metas financeiras do usuário com o progresso atual, valor alvo e prazo.',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_spending_by_category',
            description: 'Retorna o total de gastos agrupado por categoria em um período. Ideal para identificar onde o usuário mais gasta.',
            parameters: {
                type: 'object',
                properties: {
                    start_date: { type: 'string', description: 'Data inicial no formato YYYY-MM-DD' },
                    end_date: { type: 'string', description: 'Data final no formato YYYY-MM-DD' },
                },
                required: ['start_date', 'end_date'],
            },
        },
    },
];

// ── Tool executor ─────────────────────────────────────────────────────────────
async function executeTool(name, args, userId) {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

    switch (name) {
        case 'get_account_balances':
            return await getAccountBalances(userId);

        case 'get_transactions': {
            const { start_date = firstOfMonth, end_date = endOfMonth } = args;
            return await getTransactionsByPeriod(userId, start_date, end_date);
        }

        case 'get_budget_summary': {
            const { month = today.getMonth() + 1, year = today.getFullYear() } = args;
            return await getBudgetSummary(userId, month, year);
        }

        case 'get_goals':
            return await getGoals(userId);

        case 'get_spending_by_category': {
            const { start_date = firstOfMonth, end_date = endOfMonth } = args;
            return await getSpendingByCategory(userId, start_date, end_date);
        }

        default:
            return { error: `Função desconhecida: ${name}` };
    }
}

// ── POST /chat ────────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        const today = new Date();
        const currentDate = today.toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const systemContent = SYSTEM_PROMPT.replace('{CURRENT_DATE}', currentDate);

        const messages = [
            { role: 'system', content: systemContent },
            ...(Array.isArray(history) ? history : []),
            { role: 'user', content: message },
        ];

        // Tool-calling loop — max 5 iterations to prevent runaway calls
        let iterations = 0;
        let responseMessage;

        while (iterations < 5) {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                tools,
                tool_choice: 'auto',
                temperature: 0.7,
                max_tokens: 1000,
            });

            responseMessage = completion.choices[0]?.message;
            messages.push(responseMessage);

            if (!responseMessage?.tool_calls?.length) break;

            // Execute each requested tool call in parallel
            await Promise.all(
                responseMessage.tool_calls.map(async (toolCall) => {
                    const toolName = toolCall.function.name;
                    let toolArgs = {};
                    try {
                        toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                    } catch {
                        // malformed JSON — proceed with empty args
                    }
                    const toolResult = await executeTool(toolName, toolArgs, userId);
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResult),
                    });
                })
            );

            iterations++;
        }

        const response = responseMessage?.content ||
            'Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde.';

        res.json({ response });
    } catch (err) {
        console.error('Erro na API de IA:', err);
        res.status(500).json({ error: 'Erro ao processar solicitação de IA' });
    }
});

export default router;
