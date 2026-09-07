import { execSync } from 'node:child_process';
import { killPort } from '@nx/node/utils';

module.exports = async function globalTeardown() {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  const pid = globalThis.__API_PID__;
  if (typeof pid === 'number') {
    try {
      process.kill(pid);
    } catch {
      /* already gone */
    }
  }
  await killPort(port);

  // In CI, drop the stack. Locally, leave it up for the next run.
  if (process.env.CI && process.env.E2E_SKIP_INFRA !== 'true') {
    execSync('docker compose stop', { stdio: 'inherit' });
  }

  console.log('\n[e2e] torn down.\n');
};
