import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const { month, year } = req.query;
        const user_id = req.user.id;
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

router.post('/', async (req, res) => {
    try {
        const { category_id, amount, month, year } = req.body;
        const user_id = req.user.id;
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

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, amount, month, year } = req.body;
        const result = await pool.query(
            'UPDATE pfg_budgets SET category_id=$1, amount=$2, month=$3, year=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
            [category_id, amount, month, year, id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Orçamento não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar orçamento' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM pfg_budgets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir orçamento' });
    }
});

export default router;
