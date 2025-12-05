# 🎬 Sistema de Marca d'água Animada em Vídeo

Aplicação web desenvolvida em Next.js 14 (App Router) que permite adicionar um logotipo animado (estilo DVD bouncing) em vídeos mantendo a máxima qualidade possível.

## ✨ Funcionalidades

- ✅ **Upload de vídeos** (até 200MB)
- ✅ **Upload de logotipo personalizado** (até 10MB)
- ✅ **Efeito DVD Bouncing**: o logo se move e quica nas bordas da tela
- ✅ **Controles Avançados**:
  - 📏 Tamanho do logo (0-100%)
  - ⚡ Velocidade do movimento (25-200%)
  - 👻 Transparência do logo (0-100%)
  - ✏️ Texto acima do logo (opcional)
  - 🔤 Seleção de fonte para o texto
- ✅ **Preview em Tempo Real**: Vídeo de 5 segundos mostrando resultado
- ✅ **Processamento 100% no servidor** com FFmpeg nativo
- ✅ **Suporte completo a texto** com fontes do Windows
- ✅ **Qualidade máxima** (H.264, CRF 23)
- ✅ **Preservação do áudio original**
- ✅ **Barra de progresso** durante processamento
- ✅ **Download do resultado**
- ✅ **Interface responsiva e moderna** com Tailwind CSS

## 🚀 Tecnologias Utilizadas

- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca de interface
- **Tailwind CSS** - Framework CSS utilitário
- **FFmpeg (Nativo)** - Processamento de vídeo no servidor
- **@ffmpeg-installer/ffmpeg** - Instalação automática do FFmpeg
- **fluent-ffmpeg** - Wrapper Node.js para FFmpeg
- **Busboy** - Parsing de multipart/form-data

## 📁 Estrutura do Projeto

```
marcadagua/
├── app/
│   ├── api/
│   │   ├── generate-preview/
│   │   │   └── route.js        # API para gerar preview de 5 segundos
│   │   └── process-video/
│   │       └── route.js        # API para processar vídeo completo
│   ├── globals.css             # Estilos globais
│   ├── layout.jsx              # Layout principal
│   └── page.jsx                # Página principal (UI)
├── public/
│   ├── favicon.svg             # Ícone do site
│   └── icon.svg                # Ícone para PWA
├── next.config.js              # Configuração Next.js
├── tailwind.config.js          # Configuração Tailwind
├── postcss.config.js           # Configuração PostCSS
└── package.json                # Dependências
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado
- npm, yarn ou pnpm
- Windows (para acesso às fontes do sistema)

### Passo a Passo

1. **Clone ou baixe o projeto**

2. **Instale as dependências**
   ```bash
   npm install
   ```

   O FFmpeg será instalado automaticamente via `@ffmpeg-installer/ffmpeg`.

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**
   ```
   http://localhost:3000
   ```

## 📖 Como Usar

### 1. Upload de Arquivos

- **Vídeo**: Clique na área "🎥 Vídeo" e selecione um arquivo de vídeo (máximo 200MB)
- **Logo**: Clique na área "🖼️ Logotipo" e selecione uma imagem PNG com transparência (máximo 10MB)

### 2. Ajustar Controles

#### 📏 Tamanho do Logo (0-100%)
- Use o slider para ajustar
- Ou clique nos botões rápidos: 10%, 25%, 50%, 75%, 100%
- Ou digite o valor exato no campo numérico
- **0%** = Invisível
- **50%** = Metade do tamanho original
- **100%** = Tamanho original

#### ⚡ Velocidade do Movimento (25-200%)
- Use o slider para ajustar
- Ou clique nos botões rápidos:
  - 🐢 **Lento (25%)** - Movimento suave
  - ⚡ **Normal (100%)** - Velocidade padrão
  - 🚀 **Rápido (200%)** - Movimento ágil

#### 👻 Transparência do Logo (0-100%)
- Use o slider para ajustar
- Ou clique nos botões rápidos: 30%, 50%, 75%, 100%
- **0%** = Totalmente invisível
- **50%** = Semi-transparente
- **100%** = Totalmente opaco

#### ✏️ Texto Acima do Logo (Opcional)
- Digite o texto desejado (máximo 50 caracteres)
- O texto seguirá o logo com mesma velocidade e opacidade
- Fica posicionado acima do logo

#### 🔤 Fonte do Texto
- Escolha entre as fontes disponíveis:
  - Arial
  - Times New Roman
  - Verdana
  - Comic Sans MS
  - Impact
  - Calibri

### 3. Preview

- Após carregar vídeo e logo, um **preview de 5 segundos** é gerado automaticamente
- O preview mostra exatamente como ficará no vídeo final
- É atualizado automaticamente quando você muda os controles (aguarda 500ms)

### 4. Processar

- Clique no botão **"🎬 Processar Vídeo"**
- Aguarde o processamento (a barra de progresso mostra o andamento)
- O vídeo completo será processado com **qualidade máxima** (CRF 23)

### 5. Download

- Quando concluído, o vídeo processado aparecerá na tela
- Clique no botão **"📥 Download"** para baixar o arquivo

## 🎨 Efeito DVD Bouncing

O logo se move pela tela como o antigo protetor de tela de DVD:

- Movimento horizontal e vertical contínuo
- Quica nas bordas da tela (reflexão perfeita)
- Velocidade ajustável
- Mantém proporção do movimento

### Como Funciona

O movimento é calculado usando expressões matemáticas do FFmpeg:

```javascript
// Posição X (horizontal)
x = if(lte(mod(t*speedX, 2*(W-overlay_w)), W-overlay_w),
       mod(t*speedX, W-overlay_w),
       2*(W-overlay_w) - mod(t*speedX, 2*(W-overlay_w)))

// Posição Y (vertical)
y = if(lte(mod(t*speedY, 2*(H-overlay_h)), H-overlay_h),
       mod(t*speedY, H-overlay_h),
       2*(H-overlay_h) - mod(t*speedY, 2*(H-overlay_h)))
```

Onde:
- `t` = tempo atual do vídeo
- `speedX/Y` = velocidade configurada
- `W/H` = largura/altura do vídeo
- `overlay_w/h` = largura/altura do logo

## ⚙️ Configurações Técnicas

### API Routes

#### `/api/generate-preview`

**Função**: Gera preview de 5 segundos

**Input**:
- FormData com vídeo, logo e configurações

**Output**:
- Vídeo MP4 de 5 segundos

**Configurações FFmpeg**:
- `-t 5` - 5 segundos
- `-c:v libx264` - Codec H.264
- `-crf 28` - Qualidade reduzida (preview rápido)
- `-preset ultrafast` - Encoding rápido
- `-an` - Sem áudio
- `-movflags +faststart` - Otimização para streaming

#### `/api/process-video`

**Função**: Processa vídeo completo

**Input**:
- FormData com vídeo, logo e configurações

**Output**:
- Vídeo MP4 processado completo

**Configurações FFmpeg**:
- `-c:v libx264` - Codec H.264
- `-crf 23` - **Qualidade máxima**
- `-preset medium` - Balanço qualidade/velocidade
- `-c:a copy` - Mantém áudio original
- `-movflags +faststart` - Otimização para streaming

### Fontes do Windows

As fontes são carregadas diretamente do sistema:

```javascript
const fontMap = {
  'Arial': 'C:/Windows/Fonts/arial.ttf',
  'Times New Roman': 'C:/Windows/Fonts/times.ttf',
  'Verdana': 'C:/Windows/Fonts/verdana.ttf',
  'Comic Sans MS': 'C:/Windows/Fonts/comic.ttf',
  'Impact': 'C:/Windows/Fonts/impact.ttf',
  'Calibri': 'C:/Windows/Fonts/calibri.ttf'
};
```

### Arquivos Temporários

- Uploads são salvos em `os.tmpdir()` (pasta temporária do sistema)
- Arquivos são limpos automaticamente após processamento
- Inclui limpeza em caso de erro

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar em produção
npm start

# Linting
npm run lint
```

## 📊 Limites e Restrições

- **Vídeo**: Máximo 200MB
- **Logo**: Máximo 10MB
- **Texto**: Máximo 50 caracteres
- **Timeout preview**: 60 segundos
- **Timeout processamento**: 300 segundos (5 minutos)
- **Fontes**: Apenas fontes do Windows (no momento)

## 🐛 Solução de Problemas

### Erro: "Port 3000 is in use"

O Next.js tentará usar a porta 3001 automaticamente.

### Erro: "Erro ao gerar preview"

Verifique:
- Formato do vídeo (MP4, MOV, AVI, etc.)
- Formato do logo (PNG recomendado)
- Tamanho dos arquivos dentro dos limites

### Erro: "Could not load font"

**Solução**: A fonte selecionada pode não estar instalada no Windows.
- Use fontes padrão (Arial, Verdana, etc.)
- Ou deixe o campo de texto vazio

### Processamento lento

O processamento depende de:
- Tamanho e duração do vídeo
- Resolução do vídeo
- Poder de processamento do servidor
- Configurações de qualidade (CRF 23 = máxima qualidade)

**Tempos estimados** (vídeo 1080p):
- 10 segundos: ~5-10 segundos
- 1 minuto: ~30-60 segundos
- 5 minutos: ~2-5 minutos

## 🚀 Deploy

### Vercel

✅ **Suportado com configurações adicionais**

#### 📋 Requisitos

1. **Plano Vercel Pro** (recomendado) para:
   - Timeout de 60s (preview) e 300s (processamento)
   - Memória de 3GB
   - Sem limite de tamanho de resposta

2. **Arquivo `vercel.json`** (já incluído):
   ```json
   {
     "functions": {
       "app/api/generate-preview/route.js": {
         "maxDuration": 60,
         "memory": 3008
       },
       "app/api/process-video/route.js": {
         "maxDuration": 300,
         "memory": 3008
       }
     }
   }
   ```

#### ⚠️ Limitações no Plano Gratuito

- **Timeout**: 10 segundos apenas
- **Memória**: 1GB
- **Resultado**: Preview pode funcionar, mas processamento completo falhará

#### 🔧 Verificando Erros na Vercel

Se aparecer erro `JSON.parse: unexpected character`:

1. **Acesse os Logs da Vercel**:
   - Dashboard → Seu projeto → Deployments → Clique no deployment → Function Logs
   
2. **Verifique se o FFmpeg foi instalado**:
   - Procure por: `✅ FFmpeg configurado`
   - Se não aparecer, o `ffmpeg-static` não foi carregado

3. **Verifique timeout**:
   - Erro `FUNCTION_INVOCATION_TIMEOUT` = vídeo muito grande para o plano
   - Solução: Upgrade para Pro ou use vídeos menores (<30s)

#### 🐛 Solução de Problemas Vercel

**Erro: "FFmpeg não está disponível no servidor"**
- O FFmpeg não foi instalado corretamente
- Verifique se `ffmpeg-static` está em `dependencies` (não devDependencies)
- Limpe o cache: `vercel --force`

**Erro: "504 Gateway Timeout"**
- Vídeo muito grande para processar no tempo limite
- Plano gratuito: use vídeos de até 10 segundos
- Plano Pro: use vídeos de até 2 minutos

**Erro: "Out of Memory"**
- Vídeo de resolução muito alta
- Solução: reduza resolução ou upgrade o plano

### Netlify

⚠️ **Não recomendado**: Netlify Functions tem timeout de 10s (mesmo no plano pago).

### VPS (DigitalOcean, AWS, etc.)

1. Clone o repositório
2. Instale Node.js 18+
3. Execute `npm install`
4. Execute `npm run build`
5. Execute `npm start`
6. Configure NGINX ou Apache como reverse proxy

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar FFmpeg
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 📝 Notas Importantes

### Diferenças vs Versão Client-Side

| Aspecto | Client-Side (Antiga) | Server-Side (Atual) |
|---------|---------------------|---------------------|
| **Processamento** | Navegador (FFmpeg.wasm) | Servidor (FFmpeg nativo) |
| **Velocidade** | Lento | Rápido |
| **Limite de memória** | Navegador (~2GB) | Servidor (ilimitado) |
| **Suporte a fontes** | ❌ Não | ✅ Sim |
| **Suporte a texto** | ❌ Limitado | ✅ Completo |
| **Upload necessário** | Não | Sim |
| **Privacidade** | Total (local) | Arquivos no servidor |

### Privacidade

- Arquivos são temporários e deletados após processamento
- Não há armazenamento permanente
- Processamento é isolado por sessão

### Performance

Para melhor performance:
- Use vídeos em 1080p ou menos
- Prefira logos PNG otimizados
- Evite textos muito longos
- Use preset "medium" ou "fast" para velocidade

## 🎯 Roadmap Futuro

- [ ] Progresso em tempo real via Server-Sent Events (SSE)
- [ ] Upload de fontes personalizadas
- [ ] Múltiplos logos simultaneamente
- [ ] Efeitos adicionais (fade, zoom, etc.)
- [ ] Suporte a legendas
- [ ] Processamento em batch (múltiplos vídeos)
- [ ] Histórico de processamentos
- [ ] Autenticação de usuários
- [ ] API REST pública

## 📄 Licença

MIT License - Uso livre para projetos pessoais e comerciais.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se livre para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests

## 📧 Suporte

Para dúvidas e suporte, abra uma issue no repositório.

---

**Desenvolvido com ❤️ usando Next.js 14 e FFmpeg**

✨ **Qualidade máxima garantida!** ✨
