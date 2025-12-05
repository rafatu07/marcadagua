# 🚀 Deploy na Vercel - Guia Completo

## ✅ Correções Aplicadas

### 1. `vercel.json` Corrigido
Removida a propriedade `"api"` inválida que causava erro de validação.

**Antes (❌ ERRO)**:
```json
{
  "functions": {...},
  "api": {
    "bodyParser": {
      "sizeLimit": "200mb"
    }
  }
}
```

**Agora (✅ CORRETO)**:
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

### 2. `next.config.js` Otimizado
Configurações simplificadas para compatibilidade com Vercel:
- Removidas configurações experimentais desnecessárias
- Webpack configurado para externalizar binários
- Headers CORS removidos (não necessários)

### 3. `.vercelignore` Criado
Otimiza o upload ignorando arquivos desnecessários.

## 📋 Requisitos para Deploy

### ⚠️ Importante: Limitações do Plano Gratuito

O plano **GRATUITO** da Vercel tem limitações severas:
- **Timeout**: 10 segundos apenas
- **Memória**: 1GB
- **Resultado**: Processamento de vídeo provavelmente **FALHARÁ**

### ✅ Plano Pro Recomendado

Para funcionar corretamente, você precisa do **Vercel Pro**:
- **Timeout**: 60-300 segundos (configurado no `vercel.json`)
- **Memória**: 3GB
- **Custo**: $20/mês
- **Vídeos**: Até 2 minutos

## 🔧 Como Fazer o Deploy

### Opção 1: Via Git (Recomendado)

```bash
# 1. Fazer commit das mudanças
git add .
git commit -m "fix: corrigir vercel.json e otimizar para deploy"
git push

# 2. A Vercel fará deploy automático
```

### Opção 2: Via CLI

```bash
# 1. Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Fazer deploy
vercel --prod

# 4. Se der erro, limpar cache
vercel --force
```

## 🐛 Erros Comuns e Soluções

### ❌ Erro: "Build Failed - schema validation"

**Causa**: `vercel.json` com propriedades inválidas

**Solução**: Use o `vercel.json` corrigido (sem a propriedade `"api"`)

---

### ❌ Erro: "504 Gateway Timeout"

**Causa**: Vídeo muito grande ou plano gratuito

**Soluções**:
1. **Upgrade para Vercel Pro** ($20/mês)
2. Use vídeos menores:
   - Plano Gratuito: máximo **5-10 segundos**
   - Plano Pro: máximo **1-2 minutos**
3. Considere usar VPS em vez de Vercel

---

### ❌ Erro: "Function Execution Failed"

**Causa**: FFmpeg não encontrado ou erro durante processamento

**Solução**:
1. Verifique os logs da função:
   - Dashboard Vercel → Deployments → Runtime Logs
2. Procure por:
   - `✅ FFmpeg configurado` (bom!)
   - `⚠️ FFmpeg não encontrado` (problema!)
3. Se FFmpeg não for encontrado:
   ```bash
   # Limpar cache e fazer novo deploy
   vercel --force
   ```

---

### ❌ Erro: "Out of Memory"

**Causa**: Vídeo muito grande ou alta resolução (4K)

**Soluções**:
1. Use vídeos em **1080p ou menos**
2. Reduza o tamanho do logo
3. Upgrade para Vercel Pro (3GB RAM)
4. Use VPS para vídeos grandes

---

### ❌ Erro: "JSON.parse: unexpected character"

**Causa**: Servidor retornou HTML de erro em vez de JSON

**Solução**:
1. O frontend agora trata esse erro automaticamente
2. Verifique os logs da Vercel para ver o erro real
3. Erro comum: timeout ou falta de memória

## 📊 Limitações por Plano

| Recurso | Gratuito | Pro | Enterprise |
|---------|----------|-----|------------|
| **Timeout** | 10s | 60-300s | 900s |
| **Memória** | 1GB | 3GB | 6GB+ |
| **Vídeos (preview)** | ~5-10s | ~30s | ~1min |
| **Vídeos (completo)** | ❌ | ~1-2min | ~5min+ |
| **Preço** | $0 | $20/mês | Custom |

## 🎯 Recomendações Finais

### Para Teste/Desenvolvimento
- Use o plano **gratuito** com vídeos muito curtos (5-10s)
- Teste apenas a funcionalidade de preview
- Processamento completo provavelmente falhará

### Para Produção
- **Opção 1**: Vercel Pro ($20/mês) - Bom para vídeos curtos
- **Opção 2**: VPS (DigitalOcean, AWS, etc.) - Melhor para vídeos longos
- **Opção 3**: Dedicated Server - Melhor performance

### Para Vídeos Longos (>2min)
- ❌ Não use Vercel (mesmo com Pro)
- ✅ Use VPS ou servidor dedicado
- ✅ Considere processamento assíncrono com fila

## 🔍 Verificar Status do Deploy

### 1. Acessar Logs
```
Dashboard Vercel → Deployments → [Seu Deploy] → Runtime Logs
```

### 2. Procurar por Mensagens Importantes
```
✅ FFmpeg configurado: /vercel/.../ffmpeg    ← Bom!
✅ Preview de vídeo gerado!                   ← Funcionando!
⚠️ Erro ao carregar FFmpeg                    ← Problema
❌ FUNCTION_INVOCATION_TIMEOUT                ← Timeout
```

### 3. Testar no Navegador
```
1. Abrir Console (F12)
2. Fazer upload de vídeo pequeno
3. Verificar erros no console
4. Verificar resposta da API (Network tab)
```

## 📝 Checklist de Deploy

- [ ] Arquivo `vercel.json` correto (sem propriedade `"api"`)
- [ ] Plano Vercel adequado (Pro recomendado)
- [ ] Vídeos de teste pequenos (<30s)
- [ ] Resolução moderada (1080p ou menos)
- [ ] Logo otimizado (PNG, <1MB)
- [ ] Logs verificados após deploy
- [ ] Teste de upload funcionando
- [ ] Preview gerando corretamente

## 🆘 Ainda com Problemas?

### 1. Exporte os Logs
```bash
vercel logs [deployment-url] > logs.txt
```

### 2. Verifique Variáveis de Ambiente
Certifique-se de que não há variáveis de ambiente necessárias

### 3. Teste Local
```bash
# Build local para verificar se compila
npm run build

# Testar produção localmente
npm start
```

### 4. Considere Alternativas
Se Vercel continuar com problemas:
- **Railway.app** - Similar à Vercel, mais flexível
- **Render.com** - Boa para apps com FFmpeg
- **Fly.io** - Containers, mais controle
- **DigitalOcean App Platform** - VPS simplificado

## ✅ Deploy Bem-Sucedido!

Quando tudo funcionar, você verá:
```
🎉 Deployment Ready
✅ Preview Working
✅ Video Processing Working
📥 Download Available
```

**Teste com vídeos pequenos primeiro!**

---

**Desenvolvido com ❤️ | Otimizado para Vercel**

