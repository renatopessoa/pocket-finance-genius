import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, avatar, created_at FROM pfg_users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

router.post('/', async (req, res) => {
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

export default router;
