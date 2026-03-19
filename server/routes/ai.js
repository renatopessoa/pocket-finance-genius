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

// ── 2.2: Financial snapshot injected into system prompt ───────────────────────
async function buildFinancialSnapshot(userId, today) {
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const firstOfMonth = new Date(year, today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [accounts, budgets, goals] = await Promise.all([
        getAccountBalances(userId),
        getBudgetSummary(userId, month, year),
        getGoals(userId),
    ]);

    const lines = [];

    // Account balances
    if (accounts.length) {
        const total = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);
        lines.push(`**Contas:** ${accounts.map(a => `${a.name} (R$ ${parseFloat(a.balance).toFixed(2)})`).join(', ')} — Total: R$ ${total.toFixed(2)}`);
    } else {
        lines.push('**Contas:** nenhuma conta cadastrada.');
    }

    // Budgets at risk (>= 75% used) or already exceeded
    const atRisk = budgets.filter(b => parseFloat(b.percent_used ?? 0) >= 75);
    if (atRisk.length) {
        lines.push(`**Orçamentos em alerta:** ${atRisk.map(b => `${b.category} (${b.percent_used}% de R$ ${parseFloat(b.budget_amount).toFixed(2)} usados)`).join('; ')}`);
    } else if (budgets.length) {
        lines.push(`**Orçamentos:** ${budgets.length} ativo(s), nenhum em risco de estouro.`);
    } else {
        lines.push('**Orçamentos:** nenhum orçamento definido para este mês.');
    }

    // Goals behind schedule or near deadline (< 50% progress with deadline ≤ 90 days)
    const today90 = new Date(today); today90.setDate(today90.getDate() + 90);
    const urgentGoals = goals.filter(g => {
        const deadline = new Date(g.deadline);
        const progress = parseFloat(g.progress_percent ?? 0);
        return deadline <= today90 && progress < 80;
    });
    if (urgentGoals.length) {
        lines.push(`**Metas com atenção:** ${urgentGoals.map(g => `${g.title} (${g.progress_percent}% — prazo: ${g.deadline})`).join('; ')}`);
    } else if (goals.length) {
        lines.push(`**Metas:** ${goals.length} meta(s) ativa(s), todas dentro do prazo.`);
    } else {
        lines.push('**Metas:** nenhuma meta cadastrada.');
    }

    return lines.join('\n');
}

// ── 2.3: Few-shot examples ────────────────────────────────────────────────────
const FEW_SHOT_EXAMPLES = `
## Exemplos de Interação

**Usuário:** Quanto gastei em alimentação este mês?
**Assistente:** Vou verificar suas transações de março. *(chama get_spending_by_category)*
Com base nos seus dados: você gastou **R$ 850,00** em Alimentação em março de 2026, distribuídos em 12 transações. Isso representa **85%** do seu orçamento de R$ 1.000,00 para essa categoria — atenção, pois ainda restam 12 dias no mês!

**Usuário:** Meus orçamentos estão bem?
**Assistente:** *(chama get_budget_summary)* De acordo com seus orçamentos de março:
- 🔴 **Lazer:** 92% utilizado (R$ 460 de R$ 500) — risco de estouro
- 🟡 **Transporte:** 74% utilizado (R$ 370 de R$ 500) — atenção
- 🟢 **Alimentação:** 45% utilizado (R$ 450 de R$ 1.000) — dentro do limite
Recomendo reduzir gastos com lazer pelo restante do mês.

**Usuário:** Como estão minhas metas?
**Assistente:** *(chama get_goals)* Você tem 2 metas ativas:
- **Reserva de emergência:** 60% concluída (R$ 6.000 de R$ 10.000) — prazo em agosto/2026. Precisaria depositar ~R$ 800/mês para chegar a tempo.
- **Viagem Europa:** 22% concluída (R$ 2.200 de R$ 10.000) — prazo em dezembro/2026. No ritmo atual, pode não chegar ao valor. Sugestão: revisar aportes mensais.

**Usuário:** Qual é meu saldo total?
**Assistente:** *(chama get_account_balances)* Seu patrimônio atual:
- Conta Corrente Nubank: **R$ 3.200,00**
- Poupança: **R$ 8.500,00**
- Carteira: **R$ 150,00**
**Total: R$ 11.850,00**

**Usuário:** O que posso fazer para economizar mais?
**Assistente:** *(chama get_spending_by_category para o mês atual)* Analisando seus gastos reais, as maiores oportunidades de economia são: *(analisa os dados e sugere ações específicas baseadas nas categorias com maior gasto)*
`;

const SYSTEM_PROMPT_TEMPLATE = `Você é um assistente financeiro pessoal brasileiro altamente contextualizado chamado PFG Assistant.
Você tem acesso às ferramentas de consulta de dados financeiros reais do usuário. Use-as SEMPRE que a pergunta envolver dados específicos (saldos, gastos, orçamentos, metas, tendências ou comparações).
Sua função principal é fornecer análises personalizadas baseadas nos dados reais, alertar sobre orçamentos em risco, acompanhar metas e sugerir ações concretas e acionáveis.

**Regras de comportamento:**
- Sempre use dados reais antes de dar recomendações financeiras.
- Ao identificar orçamentos acima de 75% de uso, alerte proativamente.
- Ao identificar metas com menos de 50% de progresso e prazo próximo (< 90 dias), alerte e sugira ajustes.
- Use emojis moderadamente para destacar alertas (🔴 crítico, 🟡 atenção, 🟢 ok).
- Formate respostas com listas e **negrito** em markdown quando útil.
- Valores sempre em reais (R$).
- Seja direto: máximo 300 palavras por resposta.

**Data de hoje:** {CURRENT_DATE}

## Contexto Financeiro Atual do Usuário (snapshot ao iniciar a conversa)
{FINANCIAL_SNAPSHOT}
${FEW_SHOT_EXAMPLES}`;

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

        // 2.2: Build financial snapshot in parallel with no extra latency
        const financialSnapshot = await buildFinancialSnapshot(userId, today);

        const systemContent = SYSTEM_PROMPT_TEMPLATE
            .replace('{CURRENT_DATE}', currentDate)
            .replace('{FINANCIAL_SNAPSHOT}', financialSnapshot);

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
