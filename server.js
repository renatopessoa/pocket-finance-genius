import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import pool from './server/db.js';

// ── Route modules ──
import authRoutes from './server/routes/auth.js';
import usersRoutes from './server/routes/users.js';
import accountsRoutes from './server/routes/accounts.js';
import categoriesRoutes from './server/routes/categories.js';
import transactionsRoutes from './server/routes/transactions.js';
import budgetsRoutes from './server/routes/budgets.js';
import educationalRoutes from './server/routes/educational.js';
import aiRoutes from './server/routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Rate limiting ──
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' } });
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ── Request logging (leve, sem lib extra) ──
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
    });
    next();
});

// ── Serve frontend estático (build do Vite) ──
app.use(express.static(path.join(__dirname, 'dist')));

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/educational-content', educationalRoutes);
app.use('/api/ai', aiRoutes);

// ── Seed: categorias padrão ──
async function seedCategories() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS cnt FROM pfg_categories');
    if (rows[0].cnt > 0) return;
    const cats = [
        // Despesas
        ['Alimentação', 'Utensils', '#EF4444', 'expense'],
        ['Transporte', 'Car', '#F59E0B', 'expense'],
        ['Moradia', 'Home', '#8B5CF6', 'expense'],
        ['Saúde', 'Heart', '#EC4899', 'expense'],
        ['Educação', 'GraduationCap', '#3B82F6', 'expense'],
        ['Lazer', 'Gamepad2', '#10B981', 'expense'],
        ['Roupas', 'Shirt', '#06B6D4', 'expense'],
        ['Assinaturas', 'Tv', '#6366F1', 'expense'],
        ['Outros', 'MoreHorizontal', '#6B7280', 'expense'],
        // Receitas
        ['Salário', 'Banknote', '#22C55E', 'income'],
        ['Freelance', 'Laptop', '#14B8A6', 'income'],
        ['Investimentos', 'TrendingUp', '#0EA5E9', 'income'],
        ['Outros', 'MoreHorizontal', '#A3A3A3', 'income'],
    ];
    const values = cats.map((_, i) => `($${i * 4 + 1},$${i * 4 + 2},$${i * 4 + 3},$${i * 4 + 4})`).join(',');
    await pool.query(
        `INSERT INTO pfg_categories (name, icon, color, type) VALUES ${values}`,
        cats.flat()
    );
    console.log(`Seed: ${cats.length} categorias inseridas.`);
}

// ── Ensure password_hash column exists ──
async function ensurePasswordHashColumn() {
    await pool.query(`
        ALTER TABLE pfg_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
    `);
}

// ── Init ──
pool.connect()
    .then(async () => {
        console.log('Conectado ao PostgreSQL com sucesso!');
        await ensurePasswordHashColumn();
        await seedCategories();
    })
    .catch(err => console.error('Erro ao conectar ao PostgreSQL:', err));

// ── SPA catch-all: qualquer rota que não seja /api cai no index.html ──
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://0.0.0.0:${port}`);
});
