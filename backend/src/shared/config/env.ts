/**
 * Configuración tipada de variables de entorno.
 * Lee las variables desde el archivo .env del backend.
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  frontendUrl: string;
  jwtSecret: string;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/servigest',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET || 'servigest-dev-secret-key-change-in-production',
  };
}
