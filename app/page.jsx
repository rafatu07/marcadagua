'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [videoFile, setVideoFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [videoSize, setVideoSize] = useState(null);
  const [logoSize, setLogoSize] = useState(null);
  const [processingStep, setProcessingStep] = useState('');
  const [logoScale, setLogoScale] = useState(50);
  const [logoSpeed, setLogoSpeed] = useState(50); // 0-100%, padrão 50%
  const [logoOpacity, setLogoOpacity] = useState(100);
  const [logoText, setLogoText] = useState('');
  const [fontFamily, setFontFamily] = useState('Arial');
  // Controles do texto
  const [textSize, setTextSize] = useState(100); // Tamanho do texto (50-200%)
  const [textOpacity, setTextOpacity] = useState(100); // Opacidade do texto (0-100%)
  const [textPosition, setTextPosition] = useState(0); // Posição vertical (-50 a +50)
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const videoInputRef = useRef(null);
  const logoInputRef = useRef(null);

  // Gerar preview quando configurações mudarem
  useEffect(() => {
    if (videoFile && logoFile) {
      const timer = setTimeout(() => {
        generatePreview();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [videoFile, logoFile, logoScale, logoSpeed, logoOpacity, logoText, fontFamily, textSize, textOpacity, textPosition]);

  const generatePreview = async () => {
    if (!videoFile || !logoFile) return;
    
    setGeneratingPreview(true);
    setPreviewVideoUrl(null);
    
    try {
      console.log('🎬 Gerando preview de 5 segundos...');
      
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('logo', logoFile);
      formData.append('config', JSON.stringify({
        logoScale,
        logoSpeed,
        logoOpacity,
        logoText,
        fontFamily,
        textSize,
        textOpacity,
        textPosition
      }));

      const response = await fetch('/api/generate-preview', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar preview');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewVideoUrl(url);
      console.log('✅ Preview gerado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
      setError(`Erro ao gerar preview: ${error.message}`);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Por favor, selecione um arquivo de vídeo válido.');
      setVideoFile(null);
      return;
    }

    const maxSize = 200 * 1024 * 1024;
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

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida para o logotipo.');
      setLogoFile(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
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

    setProcessing(true);
    setProgress(0);
    setError(null);
    setProcessedVideoUrl(null);

    try {
      console.log('🎬 Processando vídeo completo...');
      setProcessingStep('Enviando arquivos...');
      setProgress(5);

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('logo', logoFile);
      formData.append('config', JSON.stringify({
        logoScale,
        logoSpeed,
        logoOpacity,
        logoText,
        fontFamily,
        textSize,
        textOpacity,
        textPosition
      }));

      setProcessingStep('Processando vídeo no servidor...');
      setProgress(10);

      // Estimar tempo baseado no tamanho do vídeo (aproximadamente 1 segundo por MB)
      const videoSizeMB = videoFile.size / (1024 * 1024);
      const estimatedSeconds = Math.max(10, videoSizeMB * 1); // Mínimo 10 segundos
      const incrementPerSecond = 80 / estimatedSeconds; // 80% do progresso (de 10% a 90%)
      
      console.log(`📊 Vídeo ${videoSizeMB.toFixed(2)}MB, tempo estimado: ${estimatedSeconds.toFixed(0)}s`);

      // Simular progresso baseado no tempo estimado
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const estimatedProgress = 10 + (elapsedSeconds * incrementPerSecond);
        
        setProgress(prev => {
          const newProgress = Math.min(90, Math.round(estimatedProgress));
          if (newProgress > prev) {
            // Atualizar mensagem baseado no progresso
            if (newProgress < 30) {
              setProcessingStep('Analisando vídeo...');
            } else if (newProgress < 60) {
              setProcessingStep('Aplicando marca d\'água...');
            } else if (newProgress < 85) {
              setProcessingStep('Processando com qualidade máxima...');
            } else {
              setProcessingStep('Finalizando...');
            }
            return newProgress;
          }
          return prev;
        });
      }, 1000); // Atualizar a cada segundo

      const response = await fetch('/api/process-video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        clearInterval(interval);
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar vídeo');
      }

      setProcessingStep('Recebendo vídeo processado...');
      setProgress(90);
      const blob = await response.blob();
      clearInterval(interval);
      
      setProgress(95);
      setProcessingStep('Criando arquivo para download...');
      
      const url = URL.createObjectURL(blob);
      setProcessedVideoUrl(url);
      
      setProgress(100);
      setProcessingStep('Concluído! 🎉');
      console.log('🎉 Vídeo processado com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao processar:', error);
      setError(`Erro ao processar o vídeo: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedVideoUrl) return;

    const a = document.createElement('a');
    a.href = processedVideoUrl;
    a.download = 'video_com_marca_dagua.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-3">
            🎬 Marca d&apos;água Animada
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Adicione logo animado (DVD bouncing) em seus vídeos com qualidade máxima
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <span className="text-yellow-800 dark:text-yellow-200 font-semibold">✨ Máxima Qualidade</span>
            <span className="text-xs text-yellow-600 dark:text-yellow-400">(CRF 23)</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          
          {/* Upload Section */}
          <div className="space-y-6">
            
            {/* Video Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                🎥 Vídeo
              </h2>
              
              <div 
                onClick={() => videoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  videoFile 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                }`}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={processing}
                />
                
                {videoFile ? (
                  <div className="space-y-2">
                    <div className="text-4xl">✅</div>
                    <p className="font-medium text-gray-800 dark:text-white">{videoFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(videoSize)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl">📹</div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Clique para selecionar vídeo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Máximo 200MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                🖼️ Logotipo
              </h2>
              
              <div 
                onClick={() => logoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  logoFile 
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 dark:hover:border-pink-500'
                }`}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={processing}
                />
                
                {logoFile ? (
                  <div className="space-y-2">
                    <div className="text-4xl">✅</div>
                    <p className="font-medium text-gray-800 dark:text-white">{logoFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(logoSize)}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl">🎨</div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Clique para selecionar logo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG com transparência • Máximo 10MB</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Preview Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              👁️ Ajuste o Tamanho do Logo e Visualize
            </h2>
            
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 flex items-center justify-center border-2 border-purple-500/30">
              {generatingPreview ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
                  <p className="text-white text-sm">Gerando preview...</p>
                </div>
              ) : previewVideoUrl ? (
                <video
                  src={previewVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-5xl mb-3">🎬</div>
                  <p className="text-sm">Carregue vídeo e logo</p>
                </div>
              )}
            </div>
            
            <p className="text-center text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center justify-center gap-1">
              🎥 Preview de 5 segundos
            </p>
          </div>

        </div>

        {/* Controls Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
            ⚙️ Controles do Logo
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Tamanho do Logo */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  📏 Tamanho do Logo
                </label>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {logoScale}%
                </span>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={logoScale}
                onChange={(e) => setLogoScale(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                disabled={processing}
              />
              
              <div className="flex gap-2 mt-3">
                {[10, 25, 50, 75, 100].map(size => (
                  <button
                    key={size}
                    onClick={() => setLogoScale(size)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      logoScale === size
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    }`}
                    disabled={processing}
                  >
                    {size}%
                  </button>
                ))}
              </div>
              
              <input
                type="number"
                min="0"
                max="100"
                value={logoScale}
                onChange={(e) => setLogoScale(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                disabled={processing}
              />
            </div>

            {/* Velocidade */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ⚡ Velocidade do Movimento
                </label>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {logoSpeed}%
                </span>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={logoSpeed}
                onChange={(e) => setLogoSpeed(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                disabled={processing}
              />
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setLogoSpeed(10)}
                  className={`flex-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                    logoSpeed === 10
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }`}
                  disabled={processing}
                >
                  🐢 Lento
                </button>
                <button
                  onClick={() => setLogoSpeed(50)}
                  className={`flex-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                    logoSpeed === 50
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }`}
                  disabled={processing}
                >
                  ⚡ Normal
                </button>
                <button
                  onClick={() => setLogoSpeed(100)}
                  className={`flex-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                    logoSpeed === 100
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }`}
                  disabled={processing}
                >
                  🚀 Rápido
                </button>
              </div>
            </div>

            {/* Transparência */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  👻 Transparência do Logo
                </label>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {logoOpacity}%
                </span>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={logoOpacity}
                onChange={(e) => setLogoOpacity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                disabled={processing}
              />
              
              <div className="flex gap-2 mt-3">
                {[30, 50, 75, 100].map(opacity => (
                  <button
                    key={opacity}
                    onClick={() => setLogoOpacity(opacity)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      logoOpacity === opacity
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                    }`}
                    disabled={processing}
                  >
                    {opacity}%
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Controles do Texto */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
            ✏️ Texto (Opcional)
          </h2>
          
          {/* Input do Texto */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Digite o Texto
            </label>
            <input
              type="text"
              value={logoText}
              onChange={(e) => setLogoText(e.target.value)}
              placeholder="Ex: Esse é um produto vendido por..."
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-base"
              disabled={processing}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 O texto aparecerá acima do logo e se moverá junto com ele
            </p>
          </div>

          {/* Controles do Texto (aparecem quando há texto) */}
          {logoText.trim() && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                Ajustes do Texto
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6">
              
              {/* Tamanho do Texto */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📏 Tamanho do Texto
                  </label>
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    {textSize}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="50"
                  max="400"
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  disabled={processing}
                />
                
                <div className="flex gap-2 mt-3">
                  {[100, 200, 300, 400].map(size => (
                    <button
                      key={size}
                      onClick={() => setTextSize(size)}
                      className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                        textSize === size
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      }`}
                      disabled={processing}
                    >
                      {size}%
                    </button>
                  ))}
                </div>
                
                <input
                  type="number"
                  min="50"
                  max="400"
                  value={textSize}
                  onChange={(e) => setTextSize(Math.min(400, Math.max(50, Number(e.target.value))))}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  disabled={processing}
                />
              </div>

              {/* Transparência do Texto */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    👻 Transparência do Texto
                  </label>
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    {textOpacity}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={textOpacity}
                  onChange={(e) => setTextOpacity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  disabled={processing}
                />
                
                <div className="flex gap-2 mt-3">
                  {[50, 75, 100].map(opacity => (
                    <button
                      key={opacity}
                      onClick={() => setTextOpacity(opacity)}
                      className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                        textOpacity === opacity
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      }`}
                      disabled={processing}
                    >
                      {opacity}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Posição do Texto */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📍 Distância do Logo
                  </label>
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    {textPosition < 0 ? `${Math.abs(textPosition)}px ⬆️` : textPosition > 0 ? `${textPosition}px ⬇️` : 'Normal'}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={textPosition}
                  onChange={(e) => setTextPosition(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  disabled={processing}
                />
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setTextPosition(-30)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      textPosition === -30
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                    }`}
                    disabled={processing}
                  >
                    ⬆️ Longe
                  </button>
                  <button
                    onClick={() => setTextPosition(0)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      textPosition === 0
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                    }`}
                    disabled={processing}
                  >
                    ↔️ Normal
                  </button>
                  <button
                    onClick={() => setTextPosition(30)}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      textPosition === 30
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                    }`}
                    disabled={processing}
                  >
                    ⬇️ Perto
                  </button>
                </div>
              </div>

              {/* Fonte do Texto */}
              <div className="md:col-span-3 mt-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  🔤 Fonte do Texto
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={processing}
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Impact">Impact</option>
                  <option value="Calibri">Calibri</option>
                </select>
              </div>

              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                💡 <strong>Texto e logo se movem juntos!</strong> Tamanho do texto vai até 400% (muito grande). A distância ajusta o espaço entre texto e logo: valores negativos afastam (⬆️), positivos aproximam (⬇️).
              </p>
            </div>
          )}
        </div>

        {/* Process Button */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleProcess}
            disabled={!videoFile || !logoFile || processing}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              !videoFile || !logoFile || processing
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {processing ? '⏳ Processando...' : '🎬 Processar Vídeo'}
          </button>

          {/* Progress Bar */}
          {processing && (
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {processingStep}
                </span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Download Section */}
          {processedVideoUrl && (
            <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">
                    🎉 Vídeo Processado!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Seu vídeo com marca d&apos;água está pronto
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  📥 Download
                </button>
              </div>
              
              {/* Video Preview - Tamanho Limitado */}
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <video
                    src={processedVideoUrl}
                    controls
                    className="w-full max-h-96 rounded-lg border-2 border-green-300 dark:border-green-700 object-contain bg-black"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>✨ Processamento 100% no servidor • Qualidade máxima garantida</p>
        </div>
      </div>
    </div>
  );
}
