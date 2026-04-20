#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy Amenic Filmes → Hostinger Business Hosting (Node.js via Passenger)
#
# Pré-requisitos:
#   1. SSH habilitado no hPanel (Avançado → SSH Access)
#   2. Node.js configurado no hPanel (Sites → amenicfilmes.com.br → Node.js)
#   3. Arquivo de entrada definido como: app.js
#
# Uso:
#   HOSTINGER_USER=u123456789 HOSTINGER_HOST=srv123.hstgr.io ./deploy-hostinger.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

REMOTE_USER="${HOSTINGER_USER:?Defina HOSTINGER_USER ex: u123456789}"
REMOTE_HOST="${HOSTINGER_HOST:?Defina HOSTINGER_HOST ex: srv123.hstgr.io}"
REMOTE_DIR="/home/$REMOTE_USER/amenicfilmes.com.br"

WKDIR="$(cd "$(dirname "$0")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploy → amenicfilmes.com.br"
echo "  Servidor: $REMOTE_USER@$REMOTE_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Build ─────────────────────────────────────────────────────────────────
echo ""
echo "🔨 [1/4] Gerando build de produção..."
cd "$WKDIR"
npx next build --webpack

# ── 2. Preparar pacote standalone ────────────────────────────────────────────
echo ""
echo "📦 [2/4] Preparando pacote standalone..."
cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public
cp app.js           .next/standalone/app.js
cp .env.production  .next/standalone/.env.production

# Resolver o symlink do node_modules no standalone
if [ -L ".next/standalone/node_modules" ]; then
  REAL_NM=$(readlink -f ".next/standalone/node_modules")
  rm ".next/standalone/node_modules"
  cp -r "$REAL_NM" ".next/standalone/node_modules"
  echo "   ✓ node_modules copiado (symlink resolvido)"
fi

# ── 3. Enviar para o servidor ────────────────────────────────────────────────
echo ""
echo "🚀 [3/4] Enviando para $REMOTE_HOST..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.next/cache' \
  .next/standalone/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# ── 4. Reiniciar no servidor ──────────────────────────────────────────────────
echo ""
echo "🔄 [4/4] Reiniciando aplicação..."
ssh "$REMOTE_USER@$REMOTE_HOST" \
  "mkdir -p $REMOTE_DIR/tmp && touch $REMOTE_DIR/tmp/restart.txt"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deploy concluído!"
echo "  🌐 https://amenicfilmes.com.br"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
