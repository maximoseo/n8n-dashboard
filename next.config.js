/** @type {import('next').NextConfig} */
const isSeoAuditBridge = process.env.NEXT_PUBLIC_SEO_AUDIT_BRIDGE === '1';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (isSeoAuditBridge ? '/n8n-app' : '');

const nextConfig = {
  distDir: 'dist',
  images: { unoptimized: true },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  async redirects() {
    if (!basePath) return [];
    return [{ source: '/', destination: basePath, basePath: false, permanent: false }];
  },
};

module.exports = nextConfig;
