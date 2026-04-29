#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy Amenic Filmes → Hostinger Business Hosting (Node.js via Passenger)
#
# Uso:
#   ./deploy-hostinger.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

REMOTE_USER="u216405910"
REMOTE_HOST="147.93.38.97"
REMOTE_PORT="65002"
SSH_KEY="$HOME/.ssh/id_rsa"
# Diretório correto: onde o Passenger do Hostinger aponta (PassengerAppRoot)
REMOTE_DIR="/home/$REMOTE_USER/domains/amenicfilmes.com.br/nodejs"

WKDIR="$(cd "$(dirname "$0")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploy → amenicfilmes.com.br"
echo "  Servidor: $REMOTE_USER@$REMOTE_HOST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Build ─────────────────────────────────────────────────────────────────
echo ""
echo "🔨 [1/4] Gerando build de produção..."
cd "$WKDIR"
npm run build

# ── 2. Preparar pacote standalone ────────────────────────────────────────────
echo ""
echo "📦 [2/4] Preparando pacote standalone..."
cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public
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
  -e "ssh -i $SSH_KEY -p $REMOTE_PORT" \
  --exclude='.git' \
  --exclude='.next/cache' \
  --exclude='tmp' \
  --exclude='stderr.log' \
  --exclude='console.log' \
  .next/standalone/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# ── 4. Reiniciar no servidor ──────────────────────────────────────────────────
echo ""
echo "🔄 [4/4] Reiniciando aplicação..."
ssh -i "$SSH_KEY" -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" \
  "pkill -f 'next-server' 2>/dev/null; sleep 2; mkdir -p $REMOTE_DIR/tmp && touch $REMOTE_DIR/tmp/restart.txt && echo '✓ Restart OK'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deploy concluído!"
echo "  🌐 https://amenicfilmes.com.br"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
