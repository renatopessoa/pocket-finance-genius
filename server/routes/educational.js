import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
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

export default router;
