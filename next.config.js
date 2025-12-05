/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Configuração para suportar WebAssembly no client-side
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
};

module.exports = nextConfig;

