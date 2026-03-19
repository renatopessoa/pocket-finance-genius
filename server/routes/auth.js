import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
        }
        const existing = await pool.query('SELECT id FROM pfg_users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO pfg_users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, avatar, created_at',
            [name, email, password_hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
        }
        const result = await pool.query('SELECT * FROM pfg_users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos' });
        }
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash || '');
        if (!valid) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos' });
        }
        res.json({ id: user.id, name: user.name, email: user.email, avatar: user.avatar });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

export default router;
