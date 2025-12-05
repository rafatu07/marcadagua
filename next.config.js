/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurar webpack para lidar com binários externos
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Excluir ffmpeg-static do bundle (usar caminho absoluto)
      config.externals.push('ffmpeg-static', 'fluent-ffmpeg', 'busboy');
    }
    return config;
  },
};

module.exports = nextConfig;

