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
