# 🎬 Sistema de Marca d'água Animada em Vídeo

Aplicação web desenvolvida em Next.js 14 (App Router) que permite adicionar um logotipo animado (estilo DVD bouncing) em vídeos mantendo a máxima qualidade possível.

## ✨ Funcionalidades

- ✅ Upload de vídeos (até 200MB)
- ✅ Upload de logotipo personalizado (até 10MB)
- ✅ **Efeito DVD Bouncing**: o logo se move e quica nas bordas da tela
- ✅ Processamento com FFmpeg.wasm
- ✅ **3 Modos de Processamento**: Rápido ⚡, Equilibrado ⚖️, Alta Qualidade ✨
- ✅ Manutenção de alta qualidade (H.264, CRF 23-28)
- ✅ **Processamento 100% no navegador** - seus arquivos nunca saem do seu computador!
- ✅ **Modo Rápido 2-3x mais veloz** - Ideal para testes e redes sociais
- ✅ Preservação do áudio original
- ✅ Preview do vídeo processado
- ✅ Download do resultado
- ✅ Interface responsiva e moderna com Tailwind CSS
- ✅ Barra de progresso durante processamento

## 🚀 Tecnologias Utilizadas

- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca de interface
- **Tailwind CSS** - Framework CSS utilitário
- **FFmpeg.wasm** - Processamento de vídeo no navegador
- **@ffmpeg/ffmpeg** - Biblioteca oficial FFmpeg para WebAssembly

## 📁 Estrutura do Projeto

```
marcadagua/
├── app/
│   ├── globals.css              # Estilos globais
│   ├── layout.jsx               # Layout principal
│   └── page.jsx                 # Página principal (UI + processamento)
├── public/
│   └── .gitkeep
├── next.config.js               # Configuração Next.js
├── tailwind.config.js           # Configuração Tailwind
├── postcss.config.js            # Configuração PostCSS
└── package.json                 # Dependências
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+ instalado
- npm, yarn ou pnpm

### Passo 1: Instalar Dependências

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### Passo 2: Executar em Desenvolvimento

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Passo 3: Build para Produção

```bash
npm run build
# ou
yarn build
# ou
pnpm build
```

### Passo 4: Iniciar em Produção

```bash
npm start
# ou
yarn start
# ou
pnpm start
```

## 🎯 Como Usar

1. **Abra a aplicação** no navegador
2. **Escolha o modo de processamento**:
   - ⚡ **Rápido**: 2-3x mais veloz (recomendado)
   - ⚖️ **Equilibrado**: Balanço perfeito (padrão)
   - ✨ **Alta Qualidade**: Máxima qualidade
3. **Passo 1**: Faça upload do vídeo (MP4, AVI, MOV, etc.)
4. **Passo 2**: Faça upload do logotipo (PNG, JPG, SVG - recomendado PNG transparente)
5. **Clique em "Processar Vídeo com Logo Animado"**
6. **Aguarde o processamento** (tempo varia pelo modo escolhido)
7. **Visualize o resultado** no player de vídeo com o logo em movimento
8. **Baixe o vídeo** com o logotipo animado aplicado

### 💡 Dicas para Melhores Resultados

- **Modo Rápido ⚡**: Use para processamento 2-3x mais veloz com ótima qualidade
- **Logotipo**: Use PNG com fundo transparente para melhor resultado
- **Tamanho do logo**: Recomendamos logos entre 150x150 e 300x300 pixels
- **Formato de vídeo**: MP4 é o mais compatível
- **Vídeos curtos**: Para testes, use vídeos de 10-30 segundos
- **Qualidade**: O áudio é preservado sem recompressão

### ⚡ Processamento Lento?

Veja o arquivo [OTIMIZACAO.md](OTIMIZACAO.md) com dicas detalhadas para acelerar!

## ⚙️ Configurações do FFmpeg

O processamento **ocorre no navegador** (client-side) usando FFmpeg.wasm com 3 modos:

### ⚡ Modo Rápido (2-3x mais veloz)
- **Preset**: ultrafast
- **CRF**: 28
- **Velocidade**: Muito rápido
- **Qualidade**: Boa (ideal para redes sociais)

### ⚖️ Modo Equilibrado (Padrão)
- **Preset**: veryfast
- **CRF**: 25
- **Velocidade**: Balanceada
- **Qualidade**: Ótima

### ✨ Modo Alta Qualidade
- **Preset**: medium
- **CRF**: 23
- **Velocidade**: Mais lento
- **Qualidade**: Máxima

**Comum a todos os modos**:
- **Codec de vídeo**: libx264
- **Codec de áudio**: copy (sem recompressão)
- **Overlay**: Efeito DVD bouncing animado
- **Otimização**: -movflags +faststart para streaming
- **Processamento**: 100% no navegador

### 🎬 Como Funciona o Efeito DVD Bouncing

O logotipo se move continuamente pela **tela inteira do vídeo**, quicando nas bordas como o clássico protetor de tela do DVD. O movimento é calculado em tempo real usando expressões matemáticas do FFmpeg que:

- Movem o logo nas direções X e Y
- **Percorrem 100% da tela** (de borda a borda)
- Se adaptam automaticamente ao tamanho do vídeo (W x H)
- Detectam quando o logo atinge as bordas
- Invertem a direção criando o efeito de "quique"
- Mantêm o movimento suave e contínuo durante todo o vídeo

Funciona perfeitamente em qualquer resolução: HD, Full HD, 4K, etc!

## 🎨 Personalização do Efeito de Movimento

Você pode ajustar a velocidade e o comportamento do movimento editando o arquivo `app/page.jsx`:

### Ajustar Velocidade do Movimento

No código (`app/page.jsx`), localize as variáveis de velocidade dentro da função `handleProcess`:

```javascript
const speedX = 100; // velocidade horizontal
const speedY = 80;  // velocidade vertical
```

**Exemplos:**

```javascript
// Movimento padrão (recomendado)
const speedX = 100;
const speedY = 80;

// Movimento mais rápido
const speedX = 150;
const speedY = 120;

// Movimento mais lento
const speedX = 50;
const speedY = 40;

// Movimento super rápido
const speedX = 200;
const speedY = 160;
```

**O logo agora percorre automaticamente 100% da tela, independente do tamanho do vídeo!**

Para mais detalhes sobre o sistema de movimento, veja [MOVIMENTO_LOGO.md](MOVIMENTO_LOGO.md).

## 📝 Limitações

- Tamanho máximo de vídeo: 200MB
- Tamanho máximo de logotipo: 10MB
- Formatos de vídeo aceitos: MP4, AVI, MOV, MKV, etc.
- Formatos de logo aceitos: PNG (recomendado), JPG, SVG, GIF
- **O processamento ocorre 100% no navegador** (client-side com FFmpeg.wasm)
- Tempo de processamento varia conforme tamanho e duração do vídeo e poder do seu computador
- O efeito bouncing é aplicado durante todo o vídeo
- **Nenhum arquivo é enviado para servidor** - privacidade total!

## 🐛 Solução de Problemas

### Erro ao processar vídeo grande
- Verifique se o vídeo está dentro do limite de 200MB
- Tente reduzir a qualidade ou duração do vídeo original

### Logotipo não aparece ou não se move
- Verifique se você fez upload do logotipo (Passo 2)
- Confirme que a imagem é válida
- Para logos com fundo, use PNG transparente para melhor resultado
- O movimento pode ser sutil dependendo do tamanho do logo

### Erro de memória
- Vídeos muito grandes podem causar problemas de memória
- Considere aumentar o limite de memória do Node.js:
  ```bash
  NODE_OPTIONS=--max-old-space-size=4096 npm run dev
  ```

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request

## 📧 Suporte

Para problemas ou dúvidas, abra uma issue no repositório do projeto.

---

## 🎥 Recursos Adicionais

### O que é o Efeito DVD Bouncing?

É aquele efeito clássico dos antigos aparelhos de DVD onde o logo ficava se movendo pela tela e quicando nas bordas. Muitos se lembram de ficar esperando o logo acertar perfeitamente o canto da tela! 😄

Este projeto recria esse efeito nostálgico diretamente no seu vídeo com o logotipo de sua escolha.

---

Desenvolvido com ❤️ usando Next.js e FFmpeg.wasm

