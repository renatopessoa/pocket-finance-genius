require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.SCHEMA_DATABASE_URL || process.env.DATABASE_URL;

const client = new Client({
  connectionString,
});

async function runSchema() {
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL com sucesso!');

    const schemaPath = path.join(__dirname, 'pfg_database_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executando script SQL...');
    await client.query(schemaSql);

    console.log('Tabelas criadas com sucesso!');
  } catch (err) {
    console.error('Erro ao executar schema:', err);
  } finally {
    await client.end();
  }
}

runSchema();
