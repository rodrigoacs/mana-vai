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