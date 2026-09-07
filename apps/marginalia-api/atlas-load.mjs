// Feeds Atlas the desired schema for the "external_schema" data source.
// TypeORM's @PrimaryGeneratedColumn('uuid') emits `DEFAULT uuid_generate_v4()`
// (needs the uuid-ossp extension). We rewrite it to `gen_random_uuid()`, which
// is built into PostgreSQL 13+ — no extension, no baseline migration.
import { execSync } from 'node:child_process';

const sql = execSync(
  'npx @ariga/atlas-provider-typeorm load --path ./src/app/database/entities --dialect postgres',
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
);

process.stdout.write(sql.replaceAll('uuid_generate_v4()', 'gen_random_uuid()'));
