import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
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

router.post('/', async (req, res) => {
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

router.post('/transfer', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM pfg_accounts WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir conta' });
    }
});

export default router;
