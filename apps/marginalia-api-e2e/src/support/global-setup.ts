import { execSync, spawn } from 'node:child_process';
import { killPort, waitForPortOpen } from '@nx/node/utils';

module.exports = async function globalSetup() {
  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Infra: Postgres + Mailpit + schema. Idempotent — fast when already up.
  // Set E2E_SKIP_INFRA=true if you manage docker-compose / migrations yourself.
  if (process.env.E2E_SKIP_INFRA !== 'true') {
    console.log('\n[e2e] docker compose up (db, mail)...');
    execSync('docker compose up -d --wait db mail', { stdio: 'inherit' });
    console.log('[e2e] atlas migrate apply...');
    execSync('npx nx run marginalia-api:migrate-apply', { stdio: 'inherit' });
  }

  // Free the port in case a stale API process is lingering, then start our own
  // (not via `nx serve`) so ordering is deterministic: infra is ready first.
  await killPort(port);
  console.log('[e2e] starting API...');
  const api = spawn('node', ['apps/marginalia-api/dist/main.js'], {
    stdio: 'ignore',
    env: process.env,
    detached: false,
  });
  globalThis.__API_PID__ = api.pid;

  await waitForPortOpen(port, { host });
};
