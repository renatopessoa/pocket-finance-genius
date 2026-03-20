import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
    console.error('ERRO FATAL: A variável de ambiente DATABASE_URL não está definida.');
    process.exit(1);
}

// Em ambientes de VPS comum, o SSL geralmente não é suportado por padrão.
// Forçamos false se a variável DATABASE_SSL for 'false'.
const useSSL = process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false };

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL,
});

// Testar a conexão imediatamente ao iniciar
pool.connect((err, client, release) => {
    if (err) {
        console.error('ERRO FATAL: Não foi possível conectar ao PostgreSQL:', err.message);
        console.error('Verifique a variável DATABASE_URL no arquivo .env ou nas variáveis de ambiente do servidor.');
        // Não encerramos o processo aqui para permitir que o servidor HTTP suba, 
        // mas as rotas de API falharão.
    } else {
        console.log('Conexão com o PostgreSQL estabelecida com sucesso!');
        release();
    }
});

export default pool;
