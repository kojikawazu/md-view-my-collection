import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: [
    '127.0.0.1',
    '127.0.0.1:3000',
    'localhost',
    'localhost:3000',
    '0.0.0.0:3000',
    'http://127.0.0.1',
    'http://127.0.0.1:3000',
    'http://localhost',
    'http://localhost:3000',
    'http://0.0.0.0:3000',
  ],
};

export default nextConfig;
