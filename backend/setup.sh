#!/bin/bash
# Script para configurar o backend do Mana VAI

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Configurando backend do Magic Card Validator...${NC}"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não encontrado. Por favor, instale o Node.js (v14+).${NC}"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm não encontrado. Por favor, instale o npm.${NC}"
    exit 1
fi

# Verificar a versão do Node.js
NODE_VERSION=$(node -v | cut -c2-)
REQUIRED_VERSION="14.0.0"

if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
    echo -e "${YELLOW}Atenção: Versão do Node.js ($NODE_VERSION) é inferior à recomendada ($REQUIRED_VERSION).${NC}"
    echo -e "${YELLOW}Isso pode causar problemas de compatibilidade.${NC}"
else
    echo -e "${GREEN}Versão do Node.js: $NODE_VERSION${NC}"
fi

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
npm install

# Verificar se o arquivo de cards existe
CARDS_FILE="$SCRIPT_DIR/all-cards-20250417092449.json"
if [ ! -f "$CARDS_FILE" ]; then
    echo -e "${RED}Arquivo de cards não encontrado: $CARDS_FILE${NC}"
    echo -e "${YELLOW}Download necessário. Isso pode levar alguns minutos...${NC}"
    
    # Download do arquivo de cards (substituir pela URL real)
    echo -e "${YELLOW}Fazendo download do arquivo de cards...${NC}"
    curl -L "https://mtgjson.com/api/v5/AllCards.json" -o "$CARDS_FILE"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Falha ao baixar o arquivo de cards.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Arquivo de cards encontrado: $CARDS_FILE${NC}"
# Verificar o tamanho do arquivo
FILE_SIZE=$(du -h "$CARDS_FILE" | cut -f1)
echo -e "${BLUE}Tamanho do arquivo: $FILE_SIZE${NC}"

# Verificar se as pastas necessárias existem
mkdir -p src/routes src/services src/middleware src/scripts

# Verificar se o arquivo de carregamento dos cards existe
LOADER_SCRIPT="$SCRIPT_DIR/src/scripts/loadCards.js"
if [ ! -f "$LOADER_SCRIPT" ]; then
    echo -e "${YELLOW}Criando script para carregamento de cards...${NC}"
    cat > "$LOADER_SCRIPT" << 'EOF'
/**
 * Script para carregar os cards no banco de dados
 * Executado durante o setup do backend
 */

import { loadCards } from '../services/cardService.js';

// Função principal
async function main() {
  console.log('Iniciando carregamento de cards...');
  
  try {
    // Carregar os cards
    const result = await loadCards();
    
    if (result.success) {
      console.log(`Carregamento concluído! ${result.count} cards carregados.`);
    } else {
      console.error(`Falha ao carregar cards: ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro durante o carregamento de cards:', error);
    process.exit(1);
  }
}

// Executar o script
main().then(() => {
  console.log('Script de carregamento concluído.');
}).catch(err => {
  console.error('Erro fatal no script de carregamento:', err);
  process.exit(1);
});
EOF
fi

# Tornar o script de carregamento executável
chmod +x "$LOADER_SCRIPT"

# Executar o script de carregamento de cards
echo -e "${BLUE}Carregando cards...${NC}"
node --experimental-modules "$LOADER_SCRIPT"

# Verificar se o servidor já está rodando
PORT=3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}Porta $PORT já está em uso. O servidor já pode estar rodando.${NC}"
    echo -e "${YELLOW}Para iniciar o servidor, execute: npm start${NC}"
else
    # Iniciar o servidor
    echo -e "${GREEN}Configuração concluída! Iniciando o servidor...${NC}"
    npm start &
    
    # Esperar um pouco para o servidor iniciar
    sleep 5
    
    # Verificar se o servidor está rodando
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}Servidor iniciado com sucesso na porta $PORT!${NC}"
        echo -e "${YELLOW}Para parar o servidor, execute: npm stop${NC}"
    else
        echo -e "${RED}Falha ao iniciar o servidor. Verifique os logs para mais detalhes.${NC}"
        echo -e "${YELLOW}Para iniciar manualmente, execute: npm start${NC}"
    fi
fi

echo -e "${GREEN}Configuração do backend concluída!${NC}"
echo -e "${BLUE}Para iniciar o servidor, execute:${NC}"
echo -e "${YELLOW}npm run dev${NC}" 