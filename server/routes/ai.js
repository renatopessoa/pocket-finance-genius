import { Router } from 'express';
import OpenAI from 'openai';
import { authenticateToken } from '../middleware/auth.js';
import {
    getAccountBalances,
    getTransactionsByPeriod,
    getBudgetSummary,
    getGoals,
    getSpendingByCategory,
    predictBudgetBursts,
    projectGoals,
    getUpcomingBills,
} from '../services/financialContext.js';

const router = Router();
router.use(authenticateToken);

function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY não configurada. Configure a variável de ambiente no servidor.');
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── 2.2: Financial snapshot injected into system prompt ───────────────────────
async function buildFinancialSnapshot(userId, today) {
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const firstOfMonth = new Date(year, today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [accounts, budgetPredictions, goalProjections, upcomingBills] = await Promise.all([
        getAccountBalances(userId),
        predictBudgetBursts(userId, month, year),
        projectGoals(userId),
        getUpcomingBills(userId, 7),
    ]);

    const lines = [];

    // Account balances
    if (accounts.length) {
        const total = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);
        lines.push(`**Contas:** ${accounts.map(a => `${a.name} (R$ ${parseFloat(a.balance).toFixed(2)})`).join(', ')} — Total: R$ ${total.toFixed(2)}`);
    } else {
        lines.push('**Contas:** nenhuma conta cadastrada.');
    }

    // 3.1: Budget burst predictions
    const critical = budgetPredictions.filter(b => b.status === 'estourado' || b.status === 'risco_estouro');
    const warning = budgetPredictions.filter(b => b.status === 'atenção');
    if (critical.length) {
        lines.push(`🔴 **Orçamentos CRÍTICOS:** ${critical.map(b => `${b.category} — ${b.percent_used}% usado, projeção ${b.projected_percent}% no fim do mês (pode gastar R$ ${b.daily_allowance}/dia nos próximos ${b.days_left} dias)`).join('; ')}`);
    }
    if (warning.length) {
        lines.push(`🟡 **Orçamentos em atenção:** ${warning.map(b => `${b.category} — ${b.percent_used}% usado, projeção ${b.projected_percent}% (R$ ${b.daily_allowance}/dia restantes)`).join('; ')}`);
    }
    if (!critical.length && !warning.length && budgetPredictions.length) {
        lines.push(`🟢 **Orçamentos:** ${budgetPredictions.length} ativo(s), todos dentro do limite.`);
    } else if (!budgetPredictions.length) {
        lines.push('**Orçamentos:** nenhum orçamento definido para este mês.');
    }

    // 3.2: Upcoming bills
    const overdue = upcomingBills.filter(b => b.status === 'overdue');
    const dueSoon = upcomingBills.filter(b => b.status === 'pending');
    if (overdue.length) {
        lines.push(`🔴 **Contas VENCIDAS:** ${overdue.map(b => `${b.title} — R$ ${parseFloat(b.amount).toFixed(2)} (venceu ${new Date(b.due_date).toLocaleDateString('pt-BR')})`).join('; ')}`);
    }
    if (dueSoon.length) {
        lines.push(`🟡 **Contas a vencer (7 dias):** ${dueSoon.map(b => `${b.title} — R$ ${parseFloat(b.amount).toFixed(2)} (${new Date(b.due_date).toLocaleDateString('pt-BR')})`).join('; ')}`);
    }
    if (!overdue.length && !dueSoon.length) {
        lines.push('🟢 **Contas a pagar:** nenhuma pendente nos próximos 7 dias.');
    }

    // 3.3: Goal projections
    const goalsAtRisk = goalProjections.filter(g => g.risk === 'risco_alto' || g.risk === 'prazo_vencido');
    const goalsAttention = goalProjections.filter(g => g.risk === 'atenção');
    if (goalsAtRisk.length) {
        lines.push(`🔴 **Metas em RISCO:** ${goalsAtRisk.map(g => `${g.title} — ${g.progress_percent}% (precisa R$ ${g.required_monthly}/mês, ritmo atual R$ ${g.actual_monthly_pace}/mês, ${g.months_left} meses restantes)`).join('; ')}`);
    }
    if (goalsAttention.length) {
        lines.push(`🟡 **Metas com atenção:** ${goalsAttention.map(g => `${g.title} — ${g.progress_percent}% (precisa R$ ${g.required_monthly}/mês vs ritmo R$ ${g.actual_monthly_pace}/mês)`).join('; ')}`);
    }
    if (!goalsAtRisk.length && !goalsAttention.length && goalProjections.length) {
        lines.push(`🟢 **Metas:** ${goalProjections.length} meta(s) ativa(s), todas no caminho.`);
    } else if (!goalProjections.length) {
        lines.push('**Metas:** nenhuma meta cadastrada.');
    }

    return lines.join('\n');
}

// ── 2.3: Few-shot examples ────────────────────────────────────────────────────
const FEW_SHOT_EXAMPLES = `
## Exemplos de Interação

**Usuário:** Quanto gastei em alimentação este mês?
**Assistente:** Vou verificar suas transações de março. *(chama get_spending_by_category com start_date=2026-03-01, end_date=2026-03-31)*
Com base nos seus dados: você gastou **R$ 850,00** em Alimentação em março de 2026, distribuídos em 12 transações. Isso representa **85%** do seu orçamento de R$ 1.000,00 para essa categoria — atenção, pois ainda restam 12 dias no mês!

**Usuário:** Quanto gastei em abril?
**Assistente:** Abril ainda não ocorreu em 2026, então vou buscar **abril de 2025**. *(chama get_spending_by_category com start_date=2025-04-01, end_date=2025-04-30)*
Em abril de 2025, seus gastos foram: Alimentação R$ 720,00, Transporte R$ 310,00, Lazer R$ 190,00. Total: **R$ 1.220,00**.

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
- Use predict_budget_bursts para alertas detalhados sobre previsão de estouro, mostrando o limite diário restante.
- Use project_goals para avaliar se as metas estão no caminho, mostrando o ritmo necessário vs atual.
- Ao identificar metas com risco_alto, sugira ajustes concretos (ex: aumentar Aporte mensal em R$ X).
- Use emojis moderadamente para destacar alertas (🔴 crítico, 🟡 atenção, 🟢 ok).
- Formate respostas com listas e **negrito** em markdown quando útil.
- Valores sempre em reais (R$).
- Seja direto: máximo 300 palavras por resposta.
- **Regra de datas CRÍTICA:** Quando o usuário mencionar um mês que ainda não ocorreu no ano atual (ex: hoje é março/2026 e ele pergunta sobre abril, maio etc.), interprete sempre como o mesmo mês do ANO ANTERIOR. Exemplo: "gastos de abril" = abril/2025 (start_date=2025-04-01, end_date=2025-04-30). Só use o ano futuro se o usuário especificar explicitamente o ano.

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
    {
        type: 'function',
        function: {
            name: 'predict_budget_bursts',
            description: 'Prevê quais categorias de orçamento podem estourar até o fim do mês. Retorna projeções de gasto, status de risco e limite diário restante para cada categoria.',
            parameters: {
                type: 'object',
                properties: {
                    month: { type: 'integer', description: 'Mês (1-12)' },
                    year: { type: 'integer', description: 'Ano com 4 dígitos' },
                },
                required: ['month', 'year'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'project_goals',
            description: 'Projeta o progresso de todas as metas financeiras do usuário. Calcula ritmo necessário vs real, valor projetado final e nível de risco (no_caminho, atenção, risco_alto, prazo_vencido, atingida).',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_upcoming_bills',
            description: 'Retorna contas a pagar pendentes ou vencidas do usuário nos próximos N dias. Use para alertar sobre pagamentos futuros e vencimentos próximos.',
            parameters: {
                type: 'object',
                properties: {
                    days_ahead: { type: 'integer', description: 'Quantos dias à frente verificar (padrão: 7, máximo recomendado: 30)' },
                },
                required: [],
            },
        },
    },
];

// ── Tool executor ─────────────────────────────────────────────────────────────
// Safety: if dates are in the future, shift them 1 year back (user likely means past data)
function normalizeDateRange(startDate, endDate) {
    const today = new Date().toISOString().split('T')[0];
    if (startDate > today) {
        // Both dates are in the future — shift 1 year back
        const shiftYear = (d) => d.replace(/^(\d{4})/, (y) => String(parseInt(y) - 1));
        return { start_date: shiftYear(startDate), end_date: shiftYear(endDate) };
    }
    return { start_date: startDate, end_date: endDate };
}

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
            const raw = { start_date: args.start_date ?? firstOfMonth, end_date: args.end_date ?? endOfMonth };
            const { start_date, end_date } = normalizeDateRange(raw.start_date, raw.end_date);
            return await getTransactionsByPeriod(userId, start_date, end_date);
        }

        case 'get_budget_summary': {
            const { month = today.getMonth() + 1, year = today.getFullYear() } = args;
            return await getBudgetSummary(userId, month, year);
        }

        case 'get_goals':
            return await getGoals(userId);

        case 'get_spending_by_category': {
            const raw = { start_date: args.start_date ?? firstOfMonth, end_date: args.end_date ?? endOfMonth };
            const { start_date, end_date } = normalizeDateRange(raw.start_date, raw.end_date);
            return await getSpendingByCategory(userId, start_date, end_date);
        }

        case 'predict_budget_bursts': {
            const { month = today.getMonth() + 1, year = today.getFullYear() } = args;
            return await predictBudgetBursts(userId, month, year);
        }

        case 'project_goals':
            return await projectGoals(userId);

        case 'get_upcoming_bills': {
            const { days_ahead = 7 } = args;
            return await getUpcomingBills(userId, days_ahead);
        }

        default:
            return { error: `Função desconhecida: ${name}` };
    }
}

// ── 4.1/4.2: Build visualization from tool results ────────────────────────────
function buildVisualization(toolCallsWithResults) {
    const fmtBRL = (v) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v) || 0);

    // Priority order: most visual-friendly first
    const priority = [
        'get_spending_by_category',
        'predict_budget_bursts',
        'get_budget_summary',
        'get_account_balances',
        'project_goals',
        'get_goals',
        'get_transactions',
    ];

    let best = null;
    for (const name of priority) {
        best = toolCallsWithResults.find(
            (t) => t.name === name && Array.isArray(t.result) && t.result.length > 0
        );
        if (best) break;
    }
    if (!best) return null;

    const { name, result } = best;

    if (name === 'get_spending_by_category') {
        return {
            type: 'pie',
            title: 'Gastos por Categoria',
            data: result
                .map((r) => ({ name: r.category || 'Sem categoria', value: parseFloat(r.total) || 0 }))
                .filter((d) => d.value > 0),
        };
    }

    if (name === 'predict_budget_bursts') {
        return {
            type: 'bar',
            title: 'Previsão de Orçamentos (%)',
            data: result.map((r) => ({
                name: r.category,
                'Utilizado (%)': parseFloat(r.percent_used) || 0,
                'Projetado (%)': Math.min(parseFloat(r.projected_percent) || 0, 150),
            })),
            config: { xKey: 'name', bars: ['Utilizado (%)', 'Projetado (%)'] },
        };
    }

    if (name === 'get_budget_summary') {
        return {
            type: 'bar',
            title: 'Orçamentos do Mês',
            data: result.map((r) => ({
                name: r.category,
                Orçado: parseFloat(r.budget_amount) || 0,
                Gasto: parseFloat(r.spent) || 0,
            })),
            config: { xKey: 'name', bars: ['Orçado', 'Gasto'] },
        };
    }

    if (name === 'get_account_balances') {
        return {
            type: 'table',
            title: 'Saldos das Contas',
            columns: ['Conta', 'Tipo', 'Saldo'],
            data: result.map((r) => [r.name, r.type, fmtBRL(r.balance)]),
        };
    }

    if (name === 'project_goals') {
        const riskLabel = (r) =>
            r === 'no_caminho' ? '🟢 No caminho'
                : r === 'atenção' ? '🟡 Atenção'
                    : r === 'risco_alto' ? '🔴 Risco alto'
                        : r === 'prazo_vencido' ? '🔴 Vencida'
                            : r === 'atingida' ? '✅ Atingida'
                                : r;
        return {
            type: 'table',
            title: 'Projeção de Metas',
            columns: ['Meta', 'Progresso', 'Ritmo Necessário/mês', 'Status'],
            data: result.map((r) => [
                r.title,
                `${r.progress_percent}%`,
                fmtBRL(r.required_monthly),
                riskLabel(r.risk),
            ]),
        };
    }

    if (name === 'get_goals') {
        return {
            type: 'table',
            title: 'Metas Financeiras',
            columns: ['Meta', 'Atual', 'Alvo', 'Progresso'],
            data: result.map((r) => [
                r.title,
                fmtBRL(r.current_amount),
                fmtBRL(r.target_amount),
                `${parseFloat(r.progress_percent || 0).toFixed(0)}%`,
            ]),
        };
    }

    if (name === 'get_transactions') {
        return {
            type: 'table',
            title: 'Transações Recentes',
            columns: ['Data', 'Descrição', 'Categoria', 'Valor'],
            data: result.slice(0, 10).map((r) => [
                new Date(r.date).toLocaleDateString('pt-BR'),
                r.description || '-',
                r.category || '-',
                fmtBRL(r.amount),
            ]),
        };
    }

    return null;
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
        const toolCallsWithResults = []; // 4.1/4.2: track results for visualization
        const openai = getOpenAIClient();

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
                    toolCallsWithResults.push({ name: toolName, result: toolResult });
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

        // 4.1/4.2: attach visualization if any tool returned chart-worthy data
        const visualization = buildVisualization(toolCallsWithResults);

        res.json({ response, ...(visualization ? { visualization } : {}) });
    } catch (err) {
        console.error('Erro na API de IA:', err);
        if (err.message?.includes('OPENAI_API_KEY')) {
            return res.status(503).json({ error: 'Serviço de IA indisponível: chave de API não configurada.' });
        }
        res.status(500).json({ error: 'Erro ao processar solicitação de IA' });
    }
});

export default router;
