import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const user_id = req.user.id;
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
// Ao criar, atualiza o saldo da conta (income = +, expense = -)
router.post('/', async (req, res) => {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const item of items) {
            const { amount, description, date, type, category_id, account_id, recurring, tags } = item;
            const user_id = req.user.id;
            const result = await client.query(
                'INSERT INTO pfg_transactions (amount, description, date, type, category_id, account_id, user_id, recurring, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
                [amount, description, date, type, category_id, account_id, user_id, recurring ?? false, tags ?? []]
            );
            results.push(result.rows[0]);

            // ── Atualiza saldo da conta ──
            const delta = type === 'income' ? amount : -amount;
            await client.query(
                'UPDATE pfg_accounts SET balance = balance + $1 WHERE id = $2',
                [delta, account_id]
            );
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

router.put('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { amount, description, date, type, category_id, account_id, recurring, tags } = req.body;

        // Busca transação anterior para reverter o saldo — verifica ownership
        const old = await client.query('SELECT amount, type, account_id, user_id FROM pfg_transactions WHERE id = $1', [id]);
        if (old.rows.length === 0) return res.status(404).json({ error: 'Transação não encontrada' });
        if (old.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        await client.query('BEGIN');

        // Reverte o efeito da transação antiga na conta antiga
        const oldDelta = old.rows[0].type === 'income' ? -old.rows[0].amount : old.rows[0].amount;
        await client.query('UPDATE pfg_accounts SET balance = balance + $1 WHERE id = $2', [oldDelta, old.rows[0].account_id]);

        // Aplica o efeito da transação nova na conta nova
        const newDelta = type === 'income' ? amount : -amount;
        await client.query('UPDATE pfg_accounts SET balance = balance + $1 WHERE id = $2', [newDelta, account_id]);

        const result = await client.query(
            'UPDATE pfg_transactions SET amount=$1, description=$2, date=$3, type=$4, category_id=$5, account_id=$6, recurring=$7, tags=$8 WHERE id=$9 RETURNING *',
            [amount, description, date, type, category_id, account_id, recurring ?? false, tags ?? [], id]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar transação' });
    } finally {
        client.release();
    }
});

router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Busca transação para reverter o saldo — verifica ownership
        const old = await client.query('SELECT amount, type, account_id, user_id FROM pfg_transactions WHERE id = $1', [id]);
        if (old.rows.length === 0) return res.status(404).json({ error: 'Transação não encontrada' });
        if (old.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Acesso negado' });

        await client.query('BEGIN');
        // Reverte o efeito no saldo da conta
        const delta = old.rows[0].type === 'income' ? -old.rows[0].amount : old.rows[0].amount;
        await client.query('UPDATE pfg_accounts SET balance = balance + $1 WHERE id = $2', [delta, old.rows[0].account_id]);
        await client.query('DELETE FROM pfg_transactions WHERE id = $1', [id]);
        await client.query('COMMIT');
        res.status(204).send();
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir transação' });
    } finally {
        client.release();
    }
});

export default router;
