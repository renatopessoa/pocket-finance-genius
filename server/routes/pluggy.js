import { Router } from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../lib/logger.js';
import {
    createConnectToken,
    getItem,
    deleteItem,
    getAccounts,
    getTransactions,
} from '../services/pluggy.js';

const router = Router();
router.use(authenticateToken);

// ── POST /api/pluggy/connect-token ──────────────────────────────────────────
// Gera um connect token para abrir o widget Pluggy Connect no frontend.
// Se o usuário já tem um itemId, passa para permitir reconexão.
router.post('/connect-token', async (req, res) => {
    try {
        const { itemId } = req.body;
        const data = await createConnectToken(itemId || undefined);
        res.json(data);
    } catch (err) {
        logger.error('POST /pluggy/connect-token falhou', err);
        res.status(500).json({ error: 'Erro ao gerar token de conexão Pluggy' });
    }
});

// ── POST /api/pluggy/items ──────────────────────────────────────────────────
// Salva a referência de um Item (conexão bancária) criado pelo widget.
router.post('/items', async (req, res) => {
    try {
        const { itemId } = req.body;
        if (!itemId) return res.status(400).json({ error: 'itemId é obrigatório' });

        const userId = req.user.id;

        // Busca info do item na Pluggy
        const item = await getItem(itemId);

        // Salva na tabela pfg_pluggy_items
        const result = await pool.query(
            `INSERT INTO pfg_pluggy_items (item_id, user_id, connector_name, connector_id, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (item_id) DO UPDATE SET status = $5, updated_at = NOW()
             RETURNING *`,
            [itemId, userId, item.connector?.name || 'Desconhecido', item.connector?.id || 0, item.status]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        logger.error('POST /pluggy/items falhou', err);
        res.status(500).json({ error: 'Erro ao salvar conexão bancária' });
    }
});

// ── GET /api/pluggy/items ───────────────────────────────────────────────────
// Lista todas as conexões bancárias do usuário.
router.get('/items', async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT * FROM pfg_pluggy_items WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        logger.error('GET /pluggy/items falhou', err);
        res.status(500).json({ error: 'Erro ao buscar conexões bancárias' });
    }
});

// ── DELETE /api/pluggy/items/:itemId ────────────────────────────────────────
router.delete('/items/:itemId', async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.id;

        // Verifica ownership
        const check = await pool.query(
            'SELECT id FROM pfg_pluggy_items WHERE item_id = $1 AND user_id = $2',
            [itemId, userId]
        );
        if (check.rows.length === 0) return res.status(404).json({ error: 'Conexão não encontrada' });

        // Remove na Pluggy e no banco local
        await deleteItem(itemId);
        await pool.query('DELETE FROM pfg_pluggy_items WHERE item_id = $1', [itemId]);

        res.status(204).send();
    } catch (err) {
        logger.error('DELETE /pluggy/items falhou', err);
        res.status(500).json({ error: 'Erro ao remover conexão bancária' });
    }
});

// ── POST /api/pluggy/sync/:itemId ───────────────────────────────────────────
// Sincroniza contas e transações de um Item para o banco local.
router.post('/sync/:itemId', async (req, res) => {
    const client = await pool.connect();
    try {
        const { itemId } = req.params;
        const userId = req.user.id;

        // Verifica ownership
        const ownership = await client.query(
            'SELECT id FROM pfg_pluggy_items WHERE item_id = $1 AND user_id = $2',
            [itemId, userId]
        );
        if (ownership.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Conexão não encontrada' });
        }

        await client.query('BEGIN');

        // 1. Busca contas do Pluggy
        const { results: pluggyAccounts } = await getAccounts(itemId);
        const syncedAccounts = [];

        for (const pa of pluggyAccounts) {
            // Upsert na pfg_accounts usando pluggy_account_id
            const accResult = await client.query(
                `INSERT INTO pfg_accounts (name, type, balance, user_id, color, icon, pluggy_account_id, pluggy_item_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (pluggy_account_id) DO UPDATE
                    SET balance = $3, name = $1, updated_at = NOW()
                 RETURNING *`,
                [
                    pa.name,
                    mapPluggyAccountType(pa.type),
                    pa.balance || 0,
                    userId,
                    '#0EA5E9', // cor padrão para contas Pluggy
                    'Building2', // ícone de banco
                    pa.id,
                    itemId,
                ]
            );
            syncedAccounts.push(accResult.rows[0]);

            // 2. Busca transações dos últimos 90 dias
            const from = new Date();
            from.setDate(from.getDate() - 90);
            const { results: pluggyTxs } = await getTransactions(pa.id, {
                from: from.toISOString().split('T')[0],
            });

            for (const pt of pluggyTxs) {
                // Upsert na pfg_transactions usando pluggy_transaction_id
                const txType = pt.type === 'CREDIT' ? 'income' : 'expense';
                const amount = Math.abs(pt.amount);
                await client.query(
                    `INSERT INTO pfg_transactions
                        (amount, description, date, type, account_id, user_id, pluggy_transaction_id, tags)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (pluggy_transaction_id) DO UPDATE
                        SET amount = $1, description = $2, date = $3, type = $4
                    `,
                    [
                        amount,
                        pt.description || pt.descriptionRaw || 'Transação Pluggy',
                        pt.date,
                        txType,
                        accResult.rows[0].id,
                        userId,
                        pt.id,
                        [],
                    ]
                );
            }
        }

        // Atualiza status do item
        await client.query(
            "UPDATE pfg_pluggy_items SET status = 'UPDATED', updated_at = NOW() WHERE item_id = $1",
            [itemId]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Sincronização concluída',
            accounts: syncedAccounts.length,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error('POST /pluggy/sync falhou', err);
        res.status(500).json({ error: 'Erro ao sincronizar dados bancários' });
    } finally {
        client.release();
    }
});

// ── Helper: mapeia tipo de conta Pluggy → tipo local ─────────────────────────
function mapPluggyAccountType(pluggyType) {
    const map = {
        BANK: 'checking',
        CREDIT: 'credit',
        INVESTMENT: 'investment',
        SAVINGS: 'savings',
    };
    return map[pluggyType] || 'other';
}

export default router;
