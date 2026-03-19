import pool from '../db.js';

/**
 * Returns all account balances for a user.
 */
export async function getAccountBalances(userId) {
    const result = await pool.query(
        `SELECT name, type, balance
         FROM pfg_accounts
         WHERE user_id = $1
         ORDER BY balance DESC`,
        [userId]
    );
    return result.rows;
}

/**
 * Returns transactions for a user within a date range.
 * Limited to the 200 most recent to keep token usage manageable.
 */
export async function getTransactionsByPeriod(userId, startDate, endDate) {
    const result = await pool.query(
        `SELECT t.amount, t.description, t.date::date AS date, t.type,
                c.name AS category
         FROM pfg_transactions t
         LEFT JOIN pfg_categories c ON t.category_id = c.id
         WHERE t.user_id = $1
           AND t.date >= $2
           AND t.date <= $3
         ORDER BY t.date DESC
         LIMIT 200`,
        [userId, startDate, endDate]
    );
    return result.rows;
}

/**
 * Returns budget summary for a specific month/year, including how much was spent.
 */
export async function getBudgetSummary(userId, month, year) {
    const result = await pool.query(
        `SELECT c.name AS category,
                b.amount AS budget_amount,
                b.spent,
                ROUND((b.spent / NULLIF(b.amount, 0)) * 100, 1) AS percent_used
         FROM pfg_budgets b
         LEFT JOIN pfg_categories c ON b.category_id = c.id
         WHERE b.user_id = $1
           AND b.month = $2
           AND b.year = $3
         ORDER BY percent_used DESC NULLS LAST`,
        [userId, month, year]
    );
    return result.rows;
}

/**
 * Returns all financial goals for a user with progress data.
 */
export async function getGoals(userId) {
    const result = await pool.query(
        `SELECT title, description, category,
                target_amount, current_amount,
                deadline::date AS deadline,
                ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) AS progress_percent
         FROM pfg_goals
         WHERE user_id = $1
         ORDER BY deadline ASC`,
        [userId]
    );
    return result.rows;
}

/**
 * Returns total spending grouped by category for a period.
 */
export async function getSpendingByCategory(userId, startDate, endDate) {
    const result = await pool.query(
        `SELECT c.name AS category,
                SUM(t.amount) AS total,
                COUNT(*) AS transaction_count
         FROM pfg_transactions t
         LEFT JOIN pfg_categories c ON t.category_id = c.id
         WHERE t.user_id = $1
           AND t.type = 'expense'
           AND t.date >= $2
           AND t.date <= $3
         GROUP BY c.name
         ORDER BY total DESC`,
        [userId, startDate, endDate]
    );
    return result.rows;
}

/**
 * RF3.1 — Budget burst prediction.
 * Compares % of budget spent vs % of month elapsed.
 * Returns categories at risk of exceeding their budget by end-of-month.
 */
export async function predictBudgetBursts(userId, month, year) {
    const today = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = today.getDate();
    const monthProgress = currentDay / daysInMonth; // 0..1

    const budgets = await pool.query(
        `SELECT c.name AS category,
                b.amount AS budget_amount,
                b.spent,
                ROUND((b.spent / NULLIF(b.amount, 0)) * 100, 1) AS percent_used
         FROM pfg_budgets b
         LEFT JOIN pfg_categories c ON b.category_id = c.id
         WHERE b.user_id = $1
           AND b.month = $2
           AND b.year = $3
           AND b.amount > 0`,
        [userId, month, year]
    );

    return budgets.rows.map(b => {
        const spent = parseFloat(b.spent);
        const budget = parseFloat(b.budget_amount);
        const percentUsed = budget > 0 ? spent / budget : 0;

        // Projected spending by end-of-month based on current pace
        const projectedTotal = monthProgress > 0
            ? spent / monthProgress
            : 0;
        const projectedPercent = budget > 0
            ? Math.round((projectedTotal / budget) * 100)
            : 0;

        // Remaining budget and daily allowance
        const remaining = Math.max(budget - spent, 0);
        const daysLeft = Math.max(daysInMonth - currentDay, 1);
        const dailyAllowance = remaining / daysLeft;

        let status;
        if (percentUsed >= 1) {
            status = 'estourado';
        } else if (projectedPercent > 100) {
            status = 'risco_estouro';
        } else if (percentUsed >= 0.75) {
            status = 'atenção';
        } else {
            status = 'ok';
        }

        return {
            category: b.category,
            budget_amount: budget,
            spent,
            percent_used: parseFloat(b.percent_used),
            projected_total: Math.round(projectedTotal * 100) / 100,
            projected_percent: projectedPercent,
            remaining: Math.round(remaining * 100) / 100,
            daily_allowance: Math.round(dailyAllowance * 100) / 100,
            days_left: daysLeft,
            status,
        };
    }).sort((a, b) => b.projected_percent - a.projected_percent);
}

/**
 * RF3.3 — Goal projection.
 * Calculates required monthly deposit vs current pace and risk assessment.
 */
export async function projectGoals(userId) {
    const today = new Date();

    const goals = await pool.query(
        `SELECT title, description, category,
                target_amount, current_amount,
                deadline::date AS deadline,
                created_at::date AS created_at,
                ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1) AS progress_percent
         FROM pfg_goals
         WHERE user_id = $1
         ORDER BY deadline ASC`,
        [userId]
    );

    return goals.rows.map(g => {
        const target = parseFloat(g.target_amount);
        const current = parseFloat(g.current_amount);
        const remaining = Math.max(target - current, 0);
        const deadline = new Date(g.deadline);
        const created = new Date(g.created_at);

        // Months remaining until deadline
        const msLeft = deadline.getTime() - today.getTime();
        const monthsLeft = Math.max(msLeft / (1000 * 60 * 60 * 24 * 30.44), 0.1);

        // Months elapsed since creation
        const msElapsed = today.getTime() - created.getTime();
        const monthsElapsed = Math.max(msElapsed / (1000 * 60 * 60 * 24 * 30.44), 0.1);

        // Required monthly deposit to reach target on time
        const requiredMonthly = remaining / monthsLeft;

        // Actual monthly pace based on deposits so far
        const actualMonthly = current / monthsElapsed;

        // Will the user make it at this pace?
        const projectedFinal = current + (actualMonthly * monthsLeft);
        const willReachTarget = projectedFinal >= target;

        let risk;
        if (deadline <= today) {
            risk = current >= target ? 'atingida' : 'prazo_vencido';
        } else if (willReachTarget) {
            risk = 'no_caminho';
        } else if (requiredMonthly <= actualMonthly * 1.5) {
            risk = 'atenção';
        } else {
            risk = 'risco_alto';
        }

        return {
            title: g.title,
            category: g.category,
            target_amount: target,
            current_amount: current,
            progress_percent: parseFloat(g.progress_percent),
            deadline: g.deadline,
            months_left: Math.round(monthsLeft * 10) / 10,
            remaining,
            required_monthly: Math.round(requiredMonthly * 100) / 100,
            actual_monthly_pace: Math.round(actualMonthly * 100) / 100,
            projected_final: Math.round(projectedFinal * 100) / 100,
            will_reach_target: willReachTarget,
            risk,
        };
    });
}
