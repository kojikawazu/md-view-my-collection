import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://localhost',
    'http://0.0.0.0:3000',
  ],
};

export default nextConfig;
