import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: 'postgres://postgres:xurOtXYuNOXzV1hVUIEWVfaK1qzLY4I89Q5LEmvemJnFakbFk1GVh1q1pIeynMIE@72.62.137.175:5432/postgres',
});

pool.connect()
    .then(() => console.log('Conectado ao PostgreSQL com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao PostgreSQL:', err));

// ===== USERS =====
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, avatar, created_at FROM pfg_users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { name, email, avatar } = req.body;
        const result = await pool.query(
            'INSERT INTO pfg_users (name, email, avatar) VALUES ($1, $2, $3) RETURNING *',
            [name, email, avatar]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Retorna o primeiro usuário ou cria um padrão
app.post('/api/users/initialize', async (req, res) => {
    try {
        const check = await pool.query('SELECT * FROM pfg_users LIMIT 1');
        if (check.rows.length > 0) return res.json(check.rows[0]);
        const result = await pool.query(
            'INSERT INTO pfg_users (name, email) VALUES ($1, $2) RETURNING *',
            ['Usuário', 'usuario@exemplo.com']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao inicializar usuário' });
    }
});

// ===== ACCOUNTS =====
app.get('/api/accounts', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id obrigatório' });
        const result = await pool.query(
            'SELECT * FROM pfg_accounts WHERE user_id = $1 ORDER BY created_at ASC',
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar contas' });
    }
});

app.post('/api/accounts', async (req, res) => {
    try {
        const { name, type, balance, user_id, color, icon } = req.body;
        const result = await pool.query(
            'INSERT INTO pfg_accounts (name, type, balance, user_id, color, icon) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, type, balance ?? 0, user_id, color, icon]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

app.post('/api/accounts/transfer', async (req, res) => {
    const client = await pool.connect();
    try {
        const { from_account_id, to_account_id, amount } = req.body;
        await client.query('BEGIN');
        await client.query('UPDATE pfg_accounts SET balance = balance - $1 WHERE id = $2', [amount, from_account_id]);
        await client.query('UPDATE pfg_accounts SET balance = balance + $1 WHERE id = $2', [amount, to_account_id]);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao realizar transferência' });
    } finally {
        client.release();
    }
});

app.put('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, balance, color, icon } = req.body;
        const result = await pool.query(
            'UPDATE pfg_accounts SET name=$1, type=$2, balance=$3, color=$4, icon=$5 WHERE id=$6 RETURNING *',
            [name, type, balance, color, icon, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Conta não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar conta' });
    }
});

app.delete('/api/accounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM pfg_accounts WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir conta' });
    }
});

// ===== CATEGORIES =====
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pfg_categories ORDER BY type, name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { name, icon, color, type, budget_limit } = req.body;
        const result = await pool.query(
            'INSERT INTO pfg_categories (name, icon, color, type, budget_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, icon, color, type, budget_limit ?? null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, color, type, budget_limit } = req.body;
        const result = await pool.query(
            'UPDATE pfg_categories SET name=$1, icon=$2, color=$3, type=$4, budget_limit=$5 WHERE id=$6 RETURNING *',
            [name, icon, color, type, budget_limit ?? null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM pfg_categories WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
});

// ===== TRANSACTIONS =====
app.get('/api/transactions', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id obrigatório' });
        const result = await pool.query(
            `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
             FROM pfg_transactions t
             LEFT JOIN pfg_categories c ON t.category_id = c.id
             WHERE t.user_id = $1
             ORDER BY t.date DESC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
});

// Suporta um objeto ou um array (parcelas)
app.post('/api/transactions', async (req, res) => {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const item of items) {
            const { amount, description, date, type, category_id, account_id, user_id, recurring, tags } = item;
            const result = await client.query(
                'INSERT INTO pfg_transactions (amount, description, date, type, category_id, account_id, user_id, recurring, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
                [amount, description, date, type, category_id, account_id, user_id, recurring ?? false, tags ?? []]
            );
            results.push(result.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json(Array.isArray(req.body) ? results : results[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar transação' });
    } finally {
        client.release();
    }
});

app.put('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description, date, type, category_id, account_id, recurring, tags } = req.body;
        const result = await pool.query(
            'UPDATE pfg_transactions SET amount=$1, description=$2, date=$3, type=$4, category_id=$5, account_id=$6, recurring=$7, tags=$8 WHERE id=$9 RETURNING *',
            [amount, description, date, type, category_id, account_id, recurring ?? false, tags ?? [], id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Transação não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar transação' });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM pfg_transactions WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir transação' });
    }
});

// ===== BUDGETS =====
app.get('/api/budgets', async (req, res) => {
    try {
        const { user_id, month, year } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id obrigatório' });
        let query = `SELECT b.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
                     FROM pfg_budgets b
                     LEFT JOIN pfg_categories c ON b.category_id = c.id
                     WHERE b.user_id = $1`;
        const params = [user_id];
        if (month) { query += ` AND b.month = $${params.length + 1}`; params.push(month); }
        if (year) { query += ` AND b.year = $${params.length + 1}`; params.push(year); }
        query += ' ORDER BY c.name';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar orçamentos' });
    }
});

app.post('/api/budgets', async (req, res) => {
    try {
        const { category_id, amount, month, year, user_id } = req.body;
        const result = await pool.query(
            'INSERT INTO pfg_budgets (category_id, amount, spent, month, year, user_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [category_id, amount, 0, month, year, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar orçamento' });
    }
});

app.put('/api/budgets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, amount, month, year } = req.body;
        const result = await pool.query(
            'UPDATE pfg_budgets SET category_id=$1, amount=$2, month=$3, year=$4 WHERE id=$5 RETURNING *',
            [category_id, amount, month, year, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Orçamento não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar orçamento' });
    }
});

app.delete('/api/budgets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM pfg_budgets WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir orçamento' });
    }
});

// ── EDUCATIONAL CONTENT ──
app.get('/api/educational-content', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, title, content, type, category, difficulty, read_time FROM pfg_educational_content ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar conteúdo educacional' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
