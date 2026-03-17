import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configuração da conexão com o banco de dados
const pool = new Pool({
    connectionString: 'postgres://postgres:xurOtXYuNOXzV1hVUIEWVfaK1qzLY4I89Q5LEmvemJnFakbFk1GVh1q1pIeynMIE@72.62.137.175:5432/postgres',
});

// Testar conexão
pool.connect()
    .then(() => console.log('Conectado ao PostgreSQL com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao PostgreSQL:', err));

// Rota de exemplo para listar todos os usuários
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, avatar, created_at FROM pfg_users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
