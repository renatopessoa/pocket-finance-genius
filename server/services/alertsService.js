import pool from '../db.js';

/**
 * Computes proactive alerts for a user:
 *  - Budgets >= 80% spent in the current month
 *  - Bills due within 3 days (pending)
 *  - Goals with deadline <= 30 days and progress < 50%
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getAlerts(userId) {
    const alerts = [];

    // ── Budget alerts ─────────────────────────────────────────────────────────
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Compute actual spending from transactions (the `spent` column in pfg_budgets
    // is never auto-updated, so we aggregate transactions directly — matching
    // the same logic used by the BudgetsPage frontend).
    const budgetResult = await pool.query(
        `SELECT c.name AS category,
                b.amount AS budget_amount,
                COALESCE(tx.spent, 0) AS spent,
                ROUND((COALESCE(tx.spent, 0) / NULLIF(b.amount, 0)) * 100, 1) AS percent_used
         FROM pfg_budgets b
         LEFT JOIN pfg_categories c ON b.category_id = c.id
         LEFT JOIN (
             SELECT category_id, SUM(amount) AS spent
             FROM pfg_transactions
             WHERE user_id = $1
               AND type = 'expense'
               AND EXTRACT(MONTH FROM date) = $2
               AND EXTRACT(YEAR FROM date) = $3
             GROUP BY category_id
         ) tx ON tx.category_id = b.category_id
         WHERE b.user_id = $1
           AND b.month = $2
           AND b.year = $3
           AND b.amount > 0
           AND COALESCE(tx.spent, 0) / NULLIF(b.amount, 0) >= 0.8
         ORDER BY percent_used DESC`,
        [userId, month, year]
    );

    for (const row of budgetResult.rows) {
        const percent = parseFloat(row.percent_used);
        const severity = percent >= 100 ? 'critical' : 'warning';
        const message =
            percent >= 100
                ? `Orçamento de "${row.category}" excedido (${percent}% utilizado)`
                : `Orçamento de "${row.category}" em ${percent}% do limite`;
        alerts.push({
            id: `budget-${row.category}`,
            type: 'budget',
            severity,
            message,
            tab: 'budgets',
        });
    }

    // ── Bill alerts ───────────────────────────────────────────────────────────
    try {
        const tableCheck = await pool.query(`SELECT to_regclass('pfg_bills') AS tbl`);
        if (tableCheck.rows[0].tbl) {
            const today = new Date().toISOString().split('T')[0];
            const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];

            const billsResult = await pool.query(
                `SELECT title, amount, due_date::date AS due_date
                 FROM pfg_bills
                 WHERE user_id = $1
                   AND status = 'pending'
                   AND due_date <= $2
                 ORDER BY due_date ASC`,
                [userId, in3Days]
            );

            for (const row of billsResult.rows) {
                const dueDate = new Date(row.due_date);
                const todayDate = new Date(today);
                const isOverdue = dueDate < todayDate;
                const diffDays = Math.ceil((dueDate - todayDate) / (1000 * 60 * 60 * 24));
                const severity = isOverdue ? 'critical' : 'warning';
                const dueDateStr = dueDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                const message = isOverdue
                    ? `Conta "${row.title}" vencida em ${dueDateStr}`
                    : diffDays === 0
                        ? `Conta "${row.title}" vence hoje`
                        : `Conta "${row.title}" vence em ${diffDays} dia(s)`;

                alerts.push({
                    id: `bill-${row.title}-${row.due_date}`,
                    type: 'bill',
                    severity,
                    message,
                    tab: 'transactions',
                });
            }
        }
    } catch (_err) {
        // pfg_bills não existe ainda — ignora silenciosamente
    }

    // ── Goal alerts ───────────────────────────────────────────────────────────
    try {
        const goalsResult = await pool.query(
            `SELECT title,
                    ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) AS progress_percent,
                    deadline::date AS deadline
             FROM pfg_goals
             WHERE user_id = $1
               AND deadline IS NOT NULL
               AND deadline <= (CURRENT_DATE + INTERVAL '30 days')
               AND (current_amount / NULLIF(target_amount, 0)) < 0.5
             ORDER BY deadline ASC`,
            [userId]
        );

        for (const row of goalsResult.rows) {
            const progress = parseFloat(row.progress_percent) || 0;
            const deadline = new Date(row.deadline).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            alerts.push({
                id: `goal-${row.title}`,
                type: 'goal',
                severity: 'warning',
                message: `Meta "${row.title}" com ${progress}% de progresso — prazo ${deadline}`,
                tab: 'budgets',
            });
        }
    } catch (_err) {
        // pfg_goals não existe ainda — ignora silenciosamente
    }

    return alerts;
}
