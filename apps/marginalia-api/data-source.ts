/**
 * DataSource para o TypeORM CLI (migrations). NÃO é usado pela aplicação —
 * o runtime configura a conexão em src/app/database/database.module.ts.
 *
 * Uso (a partir da raiz do monorepo, com o Postgres do docker-compose no ar):
 *   npx typeorm-ts-node-commonjs migration:generate apps/marginalia-api/src/app/database/migrations/<Nome> -d apps/marginalia-api/data-source.ts
 *   npx typeorm-ts-node-commonjs migration:run       -d apps/marginalia-api/data-source.ts
 *   npx typeorm-ts-node-commonjs migration:revert    -d apps/marginalia-api/data-source.ts
 *
 * Em dev usamos DB_SYNCHRONIZE=true e migrations ficam para quando o schema estabilizar.
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { validateEnv } from './src/app/config/env.schema';

loadEnv();
const env = validateEnv(process.env);

export default new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  entities: ['apps/marginalia-api/src/app/database/entities/*.entity.ts'],
  migrations: ['apps/marginalia-api/src/app/database/migrations/*.ts'],
  synchronize: false,
});
