/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurar limites de body parser para uploads grandes
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb'
    }
  },
  
  // Configurar webpack para lidar com binários externos
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Excluir ffmpeg-static do bundle (usar caminho absoluto)
      config.externals.push('ffmpeg-static');
    }
    return config;
  },
  
  // Headers para CORS (se necessário)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

