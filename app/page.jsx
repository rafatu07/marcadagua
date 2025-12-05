'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function Home() {
  const [videoFile, setVideoFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [videoSize, setVideoSize] = useState(null);
  const [logoSize, setLogoSize] = useState(null);
  const [loadingFFmpeg, setLoadingFFmpeg] = useState(true);
  const [processingStep, setProcessingStep] = useState('');
  const [quality, setQuality] = useState('balanced'); // fast, balanced, quality
  const [logoScale, setLogoScale] = useState(100); // Escala do logo (25-200%)
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const videoInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const ffmpegRef = useRef(null);
  const loaded = useRef(false);

  // Carregar FFmpeg quando o componente montar
  useEffect(() => {
    loadFFmpeg();
  }, []);

  // Gerar preview quando vídeo, logo ou escala mudarem
  useEffect(() => {
    if (videoFile && logoFile) {
      generatePreview();
    }
  }, [videoFile, logoFile, logoScale]);

  const loadFFmpeg = async () => {
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      // Log de progresso
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      loaded.current = true;
      setLoadingFFmpeg(false);
      console.log('FFmpeg carregado com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar FFmpeg:', error);
      setError('Erro ao carregar o processador de vídeo. Recarregue a página.');
      setLoadingFFmpeg(false);
    }
  };

  const generatePreview = async () => {
    if (!videoFile || !logoFile) return;
    
    setGeneratingPreview(true);
    try {
      // Criar elementos temporários
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Carregar vídeo
      video.src = URL.createObjectURL(videoFile);
      await new Promise((resolve) => {
        video.onloadeddata = resolve;
      });
      
      // Buscar frame no meio do vídeo (2 segundos ou meio)
      video.currentTime = Math.min(2, video.duration / 2);
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });
      
      // Configurar canvas com dimensões do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Desenhar frame do vídeo
      ctx.drawImage(video, 0, 0);
      
      // Carregar logo
      const logo = new Image();
      logo.src = URL.createObjectURL(logoFile);
      await new Promise((resolve) => {
        logo.onload = resolve;
      });
      
      // Calcular tamanho do logo com escala
      const logoWidth = (logo.width * logoScale) / 100;
      const logoHeight = (logo.height * logoScale) / 100;
      
      // Desenhar logo no canto superior esquerdo (posição inicial)
      ctx.drawImage(logo, 10, 10, logoWidth, logoHeight);
      
      // Converter para URL
      const previewDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewUrl(previewDataUrl);
      
      // Limpar
      URL.revokeObjectURL(video.src);
      URL.revokeObjectURL(logo.src);
      
      console.log('✅ Preview gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar preview:', err);
      setError('Erro ao gerar preview. Tente outro arquivo.');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Verificar se é um vídeo
    if (!file.type.startsWith('video/')) {
      setError('Por favor, selecione um arquivo de vídeo válido.');
      setVideoFile(null);
      return;
    }

    // Verificar tamanho máximo (200MB)
    const maxSize = 200 * 1024 * 1024; // 200MB em bytes
    if (file.size > maxSize) {
      setError('O arquivo é muito grande. O tamanho máximo é 200MB.');
      setVideoFile(null);
      return;
    }

    setError(null);
    setVideoFile(file);
    setVideoSize(file.size);
    setProcessedVideoUrl(null);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida para o logotipo.');
      setLogoFile(null);
      return;
    }

    // Verificar tamanho máximo (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    if (file.size > maxSize) {
      setError('O logotipo é muito grande. O tamanho máximo é 10MB.');
      setLogoFile(null);
      return;
    }

    setError(null);
    setLogoFile(file);
    setLogoSize(file.size);
    setProcessedVideoUrl(null);
  };

  const handleProcess = async () => {
    if (!videoFile) {
      setError('Por favor, selecione um vídeo primeiro.');
      return;
    }

    if (!logoFile) {
      setError('Por favor, selecione um logotipo primeiro.');
      return;
    }

    if (!loaded.current) {
      setError('Aguarde o carregamento do processador de vídeo.');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setError(null);
    setProcessedVideoUrl(null);

    try {
      const ffmpeg = ffmpegRef.current;

      // 1. Carregar vídeo (0-5%)
      setProcessingStep('Carregando vídeo...');
      setProgress(0);
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
      console.log('Vídeo carregado');
      setProgress(3);

      // 2. Carregar logo (3-6%)
      setProcessingStep('Carregando logotipo...');
      await ffmpeg.writeFile('logo.png', await fetchFile(logoFile));
      console.log('Logo carregado');
      setProgress(6);

      // 3. Detectar duração do vídeo ANTES de processar (6-10%)
      setProcessingStep('Analisando vídeo...');
      setProgress(8);
      
      let videoDuration = 0;
      let durationDetected = false;
      
      // Listener temporário para capturar duração
      const durationListener = ({ message }) => {
        if (!durationDetected) {
          const durationMatch = message.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            videoDuration = hours * 3600 + minutes * 60 + seconds;
            durationDetected = true;
            console.log(`✅ Duração detectada: ${videoDuration.toFixed(2)}s`);
          }
        }
      };
      
      ffmpeg.on('log', durationListener);
      
      // Executar FFmpeg apenas para detectar informações do vídeo
      try {
        await ffmpeg.exec(['-i', 'input.mp4', '-f', 'null', '-']);
      } catch (e) {
        // Erro esperado (null output), mas capturamos a duração
        console.log('Informações do vídeo capturadas');
      }
      
      ffmpeg.off('log', durationListener);
      
      if (videoDuration === 0) {
        console.warn('⚠️ Não foi possível detectar duração, usando progresso aproximado');
        videoDuration = 30; // fallback
      }
      
      console.log(`📹 Processando vídeo de ${videoDuration.toFixed(2)}s`);
      setProgress(10);

      // 4. Processar vídeo com efeito DVD bouncing (10-95%)
      setProcessingStep('Processando vídeo com efeito DVD bouncing...');
      
      // Configurar listener de progresso em tempo real
      const progressListener = ({ message }) => {
        // Capturar progresso em tempo real
        const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (timeMatch && videoDuration > 0) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseFloat(timeMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          
          // Calcular progresso real (10% a 95%)
          // 85% do progresso é dedicado ao processamento do vídeo
          const processProgress = (currentTime / videoDuration) * 85 + 10;
          const finalProgress = Math.min(Math.round(processProgress), 95);
          setProgress(finalProgress);
          
          // Log detalhado
          const percentage = Math.round((currentTime / videoDuration) * 100);
          console.log(`⏳ Processando: ${currentTime.toFixed(1)}s / ${videoDuration.toFixed(1)}s (${percentage}%) → ${finalProgress}% total`);
        }
      };
      
      ffmpeg.on('log', progressListener);

      // Efeito DVD bouncing - movimento suave com quique nas bordas
      // O logo percorre TODA a tela do vídeo
      // W = largura do vídeo, H = altura do vídeo
      // overlay_w = largura do logo (após escala), overlay_h = altura do logo (após escala)
      // O logo vai de 0 até (W-overlay_w) horizontalmente e 0 até (H-overlay_h) verticalmente
      
      // Velocidade de movimento (pixels por segundo)
      const speedX = 100; // velocidade horizontal
      const speedY = 80;  // velocidade vertical
      
      // Aplicar escala ao logo se necessário
      const scaleFilter = logoScale !== 100 
        ? `[1:v]scale=iw*${logoScale/100}:ih*${logoScale/100}[logo];` 
        : '[1:v]null[logo];';
      
      // Fórmula: O logo se move pela tela inteira, quicando nas bordas
      // x: de 0 até (W-overlay_w), indo e voltando
      // y: de 0 até (H-overlay_h), indo e voltando
      const overlayFilter = `${scaleFilter}[0:v][logo]overlay=x='if(lte(mod(t*${speedX}\\,2*(W-overlay_w))\\,W-overlay_w)\\, mod(t*${speedX}\\,W-overlay_w)\\, 2*(W-overlay_w)-mod(t*${speedX}\\,2*(W-overlay_w)))':y='if(lte(mod(t*${speedY}\\,2*(H-overlay_h))\\,H-overlay_h)\\, mod(t*${speedY}\\,H-overlay_h)\\, 2*(H-overlay_h)-mod(t*${speedY}\\,2*(H-overlay_h)))'`;

      // Configurações baseadas na qualidade escolhida
      const qualitySettings = {
        fast: {
          preset: 'ultrafast',
          crf: '28',
          description: 'Processamento muito rápido, qualidade boa'
        },
        balanced: {
          preset: 'veryfast',
          crf: '25',
          description: 'Equilíbrio entre velocidade e qualidade'
        },
        quality: {
          preset: 'medium',
          crf: '23',
          description: 'Melhor qualidade, processamento mais lento'
        }
      };

      const settings = qualitySettings[quality];
      console.log(`Executando FFmpeg com preset: ${settings.preset}, CRF: ${settings.crf}`);

      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-i', 'logo.png',
        '-filter_complex', overlayFilter,
        '-c:v', 'libx264',
        '-crf', settings.crf,
        '-preset', settings.preset,
        '-c:a', 'copy',
        '-movflags', '+faststart', // Otimização para streaming
        'output.mp4'
      ]);
      
      // Remover listener de progresso
      ffmpeg.off('log', progressListener);

      console.log('✅ Processamento de vídeo concluído!');
      setProgress(95);

      // 5. Ler o vídeo processado (95-97%)
      setProcessingStep('Lendo vídeo processado...');
      const data = await ffmpeg.readFile('output.mp4');
      setProgress(97);
      
      // 6. Criar arquivo final (97-99%)
      setProcessingStep('Criando arquivo para download...');
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' })
      );
      setProgress(99);
      
      setProcessedVideoUrl(url);
      setProgress(100);
      setProcessingStep('Concluído! 🎉');
      console.log('🎉 Vídeo pronto para download!');

      // 7. Limpar arquivos temporários
      try {
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('logo.png');
        await ffmpeg.deleteFile('output.mp4');
        console.log('🧹 Arquivos temporários limpos');
      } catch (e) {
        console.log('⚠️ Erro ao limpar arquivos temporários:', e);
      }

    } catch (err) {
      console.error('Erro ao processar:', err);
      setError(`Erro ao processar o vídeo: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  const handleDownload = () => {
    if (!processedVideoUrl) return;

    const a = document.createElement('a');
    a.href = processedVideoUrl;
    a.download = `video_com_marca_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setVideoFile(null);
    setLogoFile(null);
    setProcessedVideoUrl(null);
    setError(null);
    setProgress(0);
    setVideoSize(null);
    setLogoSize(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎬 Marca d&apos;água Animada em Vídeo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Adicione um logotipo animado (estilo DVD bouncing) aos seus vídeos
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          {/* Video Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              1️⃣ Selecione o vídeo
            </label>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-12 h-12 mb-3 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Clique para fazer upload do vídeo</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MP4, AVI, MOV (máx. 200MB)
                  </p>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleVideoChange}
                  disabled={processing}
                />
              </label>
            </div>

            {/* Selected Video Info */}
            {videoFile && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {videoFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(videoSize)}
                      </p>
                    </div>
                  </div>
                  {!processing && (
                    <button
                      onClick={() => {
                        setVideoFile(null);
                        setVideoSize(null);
                        if (videoInputRef.current) videoInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {videoFile && logoFile && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                3️⃣ Ajuste o Tamanho do Logo e Visualize
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Preview Image - Card Miniatura */}
                <div className="md:col-span-1">
                  <div className="relative bg-black rounded-lg overflow-hidden shadow-lg border-2 border-gray-300 dark:border-gray-600">
                    {generatingPreview ? (
                      <div className="aspect-video flex items-center justify-center">
                        <div className="flex flex-col items-center">
                          <svg
                            className="animate-spin h-8 w-8 text-white mb-2"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <p className="text-white text-xs">Gerando...</p>
                        </div>
                      </div>
                    ) : previewUrl ? (
                      <div className="relative">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-full h-auto"
                        />
                        <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs text-center">
                          Preview do Logo
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    📺 Visualização em miniatura
                  </p>
                </div>
                
                {/* Logo Size Controls */}
                <div className="md:col-span-2 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tamanho do Logo
                    </label>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                      {logoScale}%
                    </span>
                  </div>
                  
                  {/* Slider */}
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="5"
                    value={logoScale}
                    onChange={(e) => setLogoScale(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-indigo-600"
                    disabled={processing}
                    style={{
                      background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${(logoScale - 25) / 1.75}%, #d1d5db ${(logoScale - 25) / 1.75}%, #d1d5db 100%)`
                    }}
                  />
                  
                  {/* Scale markers */}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>25%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                  
                  {/* Quick preset buttons */}
                  <div className="flex gap-2 mt-3">
                    {[50, 75, 100, 150, 200].map((size) => (
                      <button
                        key={size}
                        onClick={() => setLogoScale(size)}
                        disabled={processing}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-all ${
                          logoScale === size
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500'
                        } ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                      >
                        {size}%
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Numeric Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tamanho Personalizado
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="25"
                      max="200"
                      step="1"
                      value={logoScale}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 100;
                        setLogoScale(Math.min(200, Math.max(25, value)));
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      disabled={processing}
                    />
                    <span className="text-gray-600 dark:text-gray-400 font-medium">%</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Ajuste entre 25% (muito pequeno) e 200% (muito grande)
                  </p>
                </div>
                
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ℹ️ O preview mostra o logo no tamanho e posição inicial. No vídeo final, o logo vai se mover pela tela toda (efeito DVD bouncing).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quality Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              {videoFile && logoFile ? '4️⃣' : '3️⃣'} Modo de Processamento
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Fast */}
              <button
                type="button"
                onClick={() => setQuality('fast')}
                disabled={processing}
                className={`p-4 rounded-lg border-2 transition-all ${
                  quality === 'fast'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                } ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Rápido ⚡</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  ~2-3x mais rápido
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Qualidade: Boa
                </p>
              </button>

              {/* Balanced */}
              <button
                type="button"
                onClick={() => setQuality('balanced')}
                disabled={processing}
                className={`p-4 rounded-lg border-2 transition-all ${
                  quality === 'balanced'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                } ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Equilibrado ⚖️</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Recomendado
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Qualidade: Ótima
                </p>
              </button>

              {/* Quality */}
              <button
                type="button"
                onClick={() => setQuality('quality')}
                disabled={processing}
                className={`p-4 rounded-lg border-2 transition-all ${
                  quality === 'quality'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                } ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Alta Qualidade ✨</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Mais lento
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Qualidade: Máxima
                </p>
              </button>
            </div>

            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {quality === 'fast' && '⚡ Modo Rápido: Processamento 2-3x mais rápido com boa qualidade. Ideal para testes e vídeos para redes sociais.'}
                {quality === 'balanced' && '⚖️ Modo Equilibrado (Recomendado): Ótimo balanço entre velocidade e qualidade. Perfeito para a maioria dos casos.'}
                {quality === 'quality' && '✨ Alta Qualidade: Melhor qualidade possível, mas processamento mais lento. Ideal para vídeos profissionais.'}
              </p>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              2️⃣ Selecione o logotipo (marca d&apos;água)
            </label>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-purple-300 border-dashed rounded-lg cursor-pointer bg-purple-50 dark:hover:bg-purple-900/20 dark:bg-purple-900/10 hover:bg-purple-100 dark:border-purple-600 dark:hover:border-purple-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-12 h-12 mb-3 text-purple-500 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-purple-600 dark:text-purple-400">
                    <span className="font-semibold">Clique para fazer upload do logotipo</span>
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    PNG, JPG, SVG (máx. 10MB) - Recomendado: PNG transparente
                  </p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={processing}
                />
              </label>
            </div>

            {/* Selected Logo Info */}
            {logoFile && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-8 h-8 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {logoFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(logoSize)}
                      </p>
                    </div>
                  </div>
                  {!processing && (
                    <button
                      onClick={() => {
                        setLogoFile(null);
                        setLogoSize(null);
                        if (logoInputRef.current) logoInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcess}
            disabled={!videoFile || !logoFile || processing}
            className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            {processing ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processando...
              </span>
            ) : (
              '🎬 Processar Vídeo com Logo Animado'
            )}
          </button>

          {/* Loading FFmpeg */}
          {loadingFFmpeg && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 mr-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Carregando processador de vídeo...
                </span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {processing && (
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {processingStep || 'Processando...'}
                </span>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Result Section */}
        {processedVideoUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <svg
                className="w-7 h-7 mr-2 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Vídeo Processado com Sucesso!
            </h2>

            {/* Video Player */}
            <div className="mb-6 rounded-lg overflow-hidden bg-black">
              <video
                src={processedVideoUrl}
                controls
                className="w-full h-auto"
                style={{ maxHeight: '500px' }}
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download do Vídeo
              </button>

              <button
                onClick={handleReset}
                className="flex-1 bg-gray-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Processar Outro Vídeo
              </button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>💡 O logotipo percorre 100% da tela do vídeo como o clássico logo de DVD</p>
          <p className="mt-2">🎯 Use modo "Rápido ⚡" para processamento 2-3x mais veloz</p>
          <p className="mt-2">✨ Efeito bouncing: o logo quica perfeitamente em todas as bordas</p>
          <p className="mt-2">🔒 100% privado: tudo processa no seu navegador</p>
        </div>
      </div>
    </div>
  );
}

