import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { generateToken } from '../middleware/auth.js';
import { validate, schemas } from '../lib/validate.js';
import logger from '../lib/logger.js';

const router = Router();

router.post('/register', validate(schemas.register), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await pool.query('SELECT id FROM pfg_users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Este e-mail já está cadastrado' });
        }
        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO pfg_users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, avatar, created_at',
            [name, email, password_hash]
        );
        const user = result.rows[0];
        const token = generateToken(user);
        logger.info('Novo usuário registrado', { userId: user.id, email: user.email });
        res.status(201).json({ user, token });
    } catch (err) {
        logger.error('POST /auth/register falhou', err);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

router.post('/login', validate(schemas.login), async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM pfg_users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos' });
        }
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash || '');
        if (!valid) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos' });
        }
        const userData = { id: user.id, name: user.name, email: user.email, avatar: user.avatar };
        const token = generateToken(userData);
        logger.info('Login bem-sucedido', { userId: user.id });
        res.json({ user: userData, token });
    } catch (err) {
        logger.error('POST /auth/login falhou', err);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

export default router;
