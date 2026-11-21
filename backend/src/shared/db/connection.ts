import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/servigest';

export const pool = new Pool({
  connectionString,
  max: 10,
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos PostgreSQL:', error);
    return false;
  }
}
