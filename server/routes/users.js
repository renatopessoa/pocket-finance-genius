import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../lib/validate.js';
import logger from '../lib/logger.js';

const router = Router();

// GET /me — retorna apenas os dados do usuário autenticado
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, avatar, created_at FROM pfg_users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('GET /users/me falhou', err);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// PUT /me — atualiza nome e avatar do usuário autenticado
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const { name, avatar } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return res.status(422).json({ error: 'Nome deve ter ao menos 2 caracteres' });
        }
        const result = await pool.query(
            'UPDATE pfg_users SET name = $1, avatar = $2 WHERE id = $3 RETURNING id, name, email, avatar, created_at',
            [name.trim(), avatar ?? null, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        logger.info('Perfil atualizado', { userId: req.user.id });
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('PUT /users/me falhou', err);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});

// PUT /me/password — altera a senha do usuário autenticado
router.put(
    '/me/password',
    authenticateToken,
    validate(schemas.changePassword),
    async (req, res) => {
        try {
            const { current_password, new_password } = req.body;

            // Busca hash atual
            const result = await pool.query(
                'SELECT password_hash FROM pfg_users WHERE id = $1',
                [req.user.id]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

            const { password_hash } = result.rows[0];

            // Verifica senha atual
            const valid = await bcrypt.compare(current_password, password_hash || '');
            if (!valid) {
                return res.status(401).json({ error: 'Senha atual incorreta' });
            }

            // Impede reutilização da mesma senha
            const samePassword = await bcrypt.compare(new_password, password_hash || '');
            if (samePassword) {
                return res.status(422).json({ error: 'A nova senha não pode ser igual à senha atual' });
            }

            const newHash = await bcrypt.hash(new_password, 12);
            await pool.query(
                'UPDATE pfg_users SET password_hash = $1 WHERE id = $2',
                [newHash, req.user.id]
            );

            logger.info('Senha alterada com sucesso', { userId: req.user.id });
            res.json({ message: 'Senha alterada com sucesso' });
        } catch (err) {
            logger.error('PUT /users/me/password falhou', err);
            res.status(500).json({ error: 'Erro ao alterar senha' });
        }
    }
);

export default router;
