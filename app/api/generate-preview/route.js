import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import ffmpeg from 'fluent-ffmpeg';
import Busboy from 'busboy';

// Configurar caminho do FFmpeg (require para evitar problemas com webpack)
let ffmpegPath;
try {
  ffmpegPath = require('ffmpeg-static');
  if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log('✅ FFmpeg configurado:', ffmpegPath);
  } else {
    console.error('⚠️ FFmpeg não encontrado');
  }
} catch (e) {
  console.error('⚠️ Erro ao carregar FFmpeg:', e.message);
  // Tentar buscar no sistema
  try {
    ffmpeg.setFfmpegPath('ffmpeg');
    ffmpegPath = 'ffmpeg';
    console.log('✅ Usando FFmpeg do sistema');
  } catch (e2) {
    console.error('❌ FFmpeg não disponível:', e2.message);
  }
}

// Helper para parsear FormData usando Busboy
function parseFormData(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: Object.fromEntries(req.headers) });
    const fields = {};
    const files = {};
    const fileBuffers = {};

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];
      
      file.on('data', (data) => {
        chunks.push(data);
      });
      
      file.on('end', () => {
        fileBuffers[fieldname] = {
          buffer: Buffer.concat(chunks),
          filename,
          mimeType
        };
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, files: fileBuffers });
    });

    busboy.on('error', reject);

    // Converter ReadableStream para Node stream
    const reader = req.body.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      }
    });

    // Pipe para busboy
    (async () => {
      const nodeStream = require('stream').Readable.from(
        (async function* () {
          const reader = stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield value;
          }
        })()
      );
      nodeStream.pipe(busboy);
    })();
  });
}

export async function POST(request) {
  let videoPath = null;
  let logoPath = null;
  let outputPath = null;

  try {
    console.log('📥 Recebendo requisição para gerar preview...');
    
    // Verificar se FFmpeg está disponível
    if (!ffmpegPath) {
      throw new Error('FFmpeg não está disponível no servidor');
    }

    // Parsear FormData
    const { fields, files } = await parseFormData(request);
    
    if (!files.video || !files.logo) {
      return NextResponse.json(
        { error: 'Vídeo e logo são obrigatórios' },
        { status: 400 }
      );
    }

    // Parsear configurações
    const config = JSON.parse(fields.config || '{}');
    const {
      logoScale = 50,
      logoSpeed = 100,
      logoOpacity = 100,
      logoText = '',
      fontFamily = 'Arial',
      textSize = 100,
      textOpacity = 100,
      textPosition = 0
    } = config;

    // Construir filtros FFmpeg
    // Velocidade: 0-100% na UI, multiplicado por 5x para movimento rápido
    // 0% = 0px/s, 10% = 5px/s (lento), 50% = 25px/s (normal), 100% = 50px/s (muito rápido)
    const speedMultiplier = 5; // Multiplicador para aumentar velocidade
    const speedX = (logoSpeed * speedMultiplier) / 10;
    const speedY = ((logoSpeed * speedMultiplier) / 10) * 0.8; // Proporção 80% para movimento mais natural

    console.log('⚙️ Configurações recebidas:', config);
    console.log(`📊 Valores aplicados: Tamanho=${logoScale}%, Velocidade=${logoSpeed}% (X=${speedX}px/s, Y=${speedY}px/s), Opacidade=${logoOpacity}%`);

    // Criar diretório temporário se não existir
    const tempDir = join(tmpdir(), 'marcadagua-preview');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Salvar arquivos temporários
    const timestamp = Date.now();
    videoPath = join(tempDir, `video_${timestamp}.mp4`);
    logoPath = join(tempDir, `logo_${timestamp}.png`);
    outputPath = join(tempDir, `preview_${timestamp}.mp4`);

    await writeFile(videoPath, files.video.buffer);
    await writeFile(logoPath, files.logo.buffer);

    console.log('💾 Arquivos salvos temporariamente');

    // Preparar filtro do logo: texto ACIMA do logo (assim move junto)
    let logoFilter = '[1:v]';
    
    // Adicionar texto se fornecido (em um espaço acima do logo - tudo se move junto)
    if (logoText && logoText.trim()) {
      // Tamanho da fonte baseado no textSize (50-400%)
      const baseFontSize = 120; // Tamanho base aumentado (era 60)
      const fontSize = Math.max(30, Math.round(baseFontSize * (logoScale / 100) * (textSize / 100)));
      
      // Espaço base para o texto + ajuste de posição
      // textPosition: negativo = mais longe do logo (acima), positivo = mais perto do logo (abaixo)
      const basePadding = Math.round(fontSize * 1.8);
      const adjustedPadding = Math.max(fontSize + 20, basePadding - textPosition); // Garantir espaço mínimo
      
      // Opacidade do texto (0-100%)
      const finalTextOpacity = textOpacity / 100;
      
      const escapedText = logoText.replace(/'/g, "\\\\'").replace(/:/g, "\\:");
      
      // Mapear fontes do Windows
      const fontMap = {
        'Arial': 'C\\:/Windows/Fonts/arialbd.ttf',
        'Times New Roman': 'C\\:/Windows/Fonts/timesbd.ttf',
        'Verdana': 'C\\:/Windows/Fonts/verdanab.ttf',
        'Comic Sans MS': 'C\\:/Windows/Fonts/comicbd.ttf',
        'Impact': 'C\\:/Windows/Fonts/impact.ttf',
        'Calibri': 'C\\:/Windows/Fonts/calibrib.ttf'
      };
      
      const fontFile = fontMap[fontFamily] || fontMap['Arial'];
      
      console.log(`✏️ Texto: "${logoText}" | Tamanho: ${fontSize}px (${textSize}%) | Opacidade: ${textOpacity}% | Distância do logo: ${adjustedPadding}px (ajuste: ${textPosition}px)`);
      
      // 1. Adicionar espaço transparente acima do logo (texto + logo = unidade única)
      // 2. Aplicar texto nesse espaço (centralizado horizontalmente na largura do logo)
      // 3. Tudo se move junto no overlay DVD bouncing
      logoFilter += `pad=w=iw:h=ih+${adjustedPadding}:x=0:y=${adjustedPadding}:color=black@0.0,drawtext=text='${escapedText}':fontfile=${fontFile}:fontsize=${fontSize}:fontcolor=white@${finalTextOpacity}:borderw=4:bordercolor=black@${finalTextOpacity}:x=(w-text_w)/2:y=(${adjustedPadding}-text_h)/2,`;
    }
    
    // Escalar o logo (com texto se houver)
    logoFilter += `scale=iw*${logoScale/100}:ih*${logoScale/100}`;
    
    // Aplicar opacidade se necessário
    if (logoOpacity < 100) {
      logoFilter += `,format=rgba,colorchannelmixer=aa=${logoOpacity/100}`;
    }
    
    logoFilter += '[logo]';

    // Preparar filtro de overlay (DVD bouncing)
    const overlayX = `if(lte(mod(t*${speedX}\\,2*(W-overlay_w))\\,W-overlay_w)\\, mod(t*${speedX}\\,W-overlay_w)\\, 2*(W-overlay_w)-mod(t*${speedX}\\,2*(W-overlay_w)))`;
    const overlayY = `if(lte(mod(t*${speedY}\\,2*(H-overlay_h))\\,H-overlay_h)\\, mod(t*${speedY}\\,H-overlay_h)\\, 2*(H-overlay_h)-mod(t*${speedY}\\,2*(H-overlay_h)))`;
    
    const complexFilter = `${logoFilter};[0:v][logo]overlay=x='${overlayX}':y='${overlayY}'`;

    console.log('🎨 Filtro FFmpeg aplicado:', complexFilter.substring(0, 200) + '...');
    console.log('🎬 Gerando preview de 5 segundos...');

    // Processar vídeo
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .input(logoPath)
        .complexFilter(complexFilter)
        .outputOptions([
          '-t 5', // 5 segundos
          '-c:v libx264',
          '-crf 28', // Qualidade reduzida para preview rápido
          '-preset ultrafast',
          '-an', // Sem áudio no preview
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('🔧 Comando FFmpeg:', cmd);
        })
        .on('progress', (progress) => {
          console.log(`⏳ Progresso: ${progress.percent?.toFixed(1) || 0}%`);
        })
        .on('end', () => {
          console.log('✅ Preview gerado com sucesso!');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ Erro no FFmpeg:', err);
          reject(err);
        })
        .run();
    });

    // Ler arquivo gerado
    const fs = require('fs').promises;
    const videoBuffer = await fs.readFile(outputPath);

    // Limpar arquivos temporários
    await Promise.all([
      unlink(videoPath).catch(() => {}),
      unlink(logoPath).catch(() => {}),
      unlink(outputPath).catch(() => {})
    ]);

    console.log('🧹 Arquivos temporários limpos');

    // Retornar vídeo
    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar preview:', error);

    // Limpar arquivos em caso de erro
    if (videoPath) await unlink(videoPath).catch(() => {});
    if (logoPath) await unlink(logoPath).catch(() => {});
    if (outputPath) await unlink(outputPath).catch(() => {});

    return NextResponse.json(
      { error: `Erro ao gerar preview: ${error.message}` },
      { status: 500 }
    );
  }
}

// Aumentar timeout
export const maxDuration = 60; // 60 segundos

