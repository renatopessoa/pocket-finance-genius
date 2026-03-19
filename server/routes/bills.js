import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// ── GET /api/bills — list user's bills ────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { status, days } = req.query;
        const userId = req.user.id;

        let query = `
            SELECT b.id, b.title, b.description, b.amount,
                   b.due_date::date AS due_date,
                   b.status, b.recurring, b.recurrence,
                   b.paid_at, b.created_at,
                   c.name AS category,
                   a.name AS account
            FROM pfg_bills b
            LEFT JOIN pfg_categories c ON b.category_id = c.id
            LEFT JOIN pfg_accounts   a ON b.account_id  = a.id
            WHERE b.user_id = $1
        `;
        const params = [userId];

        if (status) {
            params.push(status);
            query += ` AND b.status = $${params.length}`;
        }
        if (days) {
            const limit = new Date();
            limit.setDate(limit.getDate() + parseInt(days, 10));
            params.push(limit.toISOString().split('T')[0]);
            query += ` AND b.due_date <= $${params.length}`;
        }

        query += ' ORDER BY b.due_date ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /bills error:', err);
        res.status(500).json({ error: 'Erro ao buscar contas a pagar' });
    }
});

// ── POST /api/bills — create a bill ──────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const {
            title, description, amount, due_date,
            recurring = false, recurrence = null,
            category_id = null, account_id = null,
        } = req.body;
        const userId = req.user.id;

        if (!title || !amount || !due_date) {
            return res.status(400).json({ error: 'Campos obrigatórios: title, amount, due_date' });
        }
        if (recurring && !['monthly', 'weekly', 'yearly'].includes(recurrence)) {
            return res.status(400).json({ error: 'recurrence deve ser monthly, weekly ou yearly quando recurring=true' });
        }

        const result = await pool.query(
            `INSERT INTO pfg_bills
                (user_id, title, description, amount, due_date, recurring, recurrence, category_id, account_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [userId, title, description, amount, due_date, recurring, recurrence, category_id, account_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('POST /bills error:', err);
        res.status(500).json({ error: 'Erro ao criar conta a pagar' });
    }
});

// ── PUT /api/bills/:id — update a bill ───────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const {
            title, description, amount, due_date,
            recurring, recurrence, status,
            category_id, account_id, paid_at,
        } = req.body;

        // Verify ownership
        const check = await pool.query(
            'SELECT id FROM pfg_bills WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        if (!check.rows.length) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }

        const result = await pool.query(
            `UPDATE pfg_bills
             SET title       = COALESCE($1, title),
                 description = COALESCE($2, description),
                 amount      = COALESCE($3, amount),
                 due_date    = COALESCE($4, due_date),
                 recurring   = COALESCE($5, recurring),
                 recurrence  = COALESCE($6, recurrence),
                 status      = COALESCE($7, status),
                 category_id = COALESCE($8, category_id),
                 account_id  = COALESCE($9, account_id),
                 paid_at     = COALESCE($10, paid_at)
             WHERE id = $11 AND user_id = $12
             RETURNING *`,
            [title, description, amount, due_date, recurring, recurrence,
                status, category_id, account_id, paid_at, id, userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT /bills error:', err);
        res.status(500).json({ error: 'Erro ao atualizar conta a pagar' });
    }
});

// ── PATCH /api/bills/:id/pay — mark as paid ──────────────────────────────────
router.patch('/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            `UPDATE pfg_bills
             SET status = 'paid', paid_at = NOW()
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, userId]
        );
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PATCH /bills/:id/pay error:', err);
        res.status(500).json({ error: 'Erro ao marcar conta como paga' });
    }
});

// ── DELETE /api/bills/:id — delete a bill ────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            'DELETE FROM pfg_bills WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }
        res.json({ message: 'Conta excluída com sucesso' });
    } catch (err) {
        console.error('DELETE /bills error:', err);
        res.status(500).json({ error: 'Erro ao excluir conta a pagar' });
    }
});

export default router;
