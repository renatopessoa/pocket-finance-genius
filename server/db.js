import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
    console.error('ERRO FATAL: A variável de ambiente DATABASE_URL não está definida.');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

export default pool;
