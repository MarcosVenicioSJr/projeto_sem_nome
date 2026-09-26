//@ts-check

const { join } = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js options go here
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js

  // Este app vive num monorepo (apps/scheduling-web) e depende de pacotes do
  // workspace (ex.: @org/contracts), cujos symlinks ficam no node_modules da
  // raiz. Sem isto, o Turbopack pode inferir a raiz errada e falhar com
  // "Module not found" para pacotes @org/*.
  turbopack: {
    root: join(__dirname, '../..'),
  },

  // O navegador chama `/api/...` no próprio Next, que repassa para a API —
  // assim não há CORS. Em produção, aponte API_PROXY_TARGET para a API.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';
    return [{ source: '/api/:path*', destination: `${target}/api/:path*` }];
  },
};

module.exports = nextConfig;
