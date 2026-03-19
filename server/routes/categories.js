import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pfg_categories ORDER BY type, name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
});

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM pfg_categories WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
});

export default router;
