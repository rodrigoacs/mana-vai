import * as cardService from './cardService.js';

// Validação básica de deck
export const validateDeck = (deck) => {
  if (!cardService.isLoaded()) {
    return {
      success: false,
      message: 'Banco de cards ainda não foi carregado'
    };
  }
  
  if (!deck || !Array.isArray(deck.cards) || deck.cards.length === 0) {
    return {
      success: false,
      message: 'Formato de deck inválido ou deck vazio'
    };
  }
  
  const validationResult = {
    success: true,
    deckName: deck.name || 'Deck sem nome',
    cardCount: deck.cards.length,
    errors: [],
    warnings: [],
    cards: {
      found: [],
      notFound: []
    },
    stats: {
      byType: {},
      byCmc: {},
      byColor: {},
      byRarity: {}
    }
  };
  
  // Verificar limites básicos
  if (deck.cards.length < 60 && !deck.isCommander) {
    validationResult.errors.push('Decks normais devem ter no mínimo 60 cartas');
  }
  
  if (deck.isCommander && deck.cards.length < 100) {
    validationResult.errors.push('Decks de Commander devem ter exatamente 100 cartas');
  }
  
  // Mapa para contar repetições de cards
  const cardCounts = new Map();
  
  // Verificar cada card
  deck.cards.forEach(cardEntry => {
    const cardId = cardEntry.id;
    const quantity = cardEntry.quantity || 1;
    
    // Verificar se o card existe no banco de dados
    const cardResult = cardService.getCardById(cardId);
    
    if (cardResult.success) {
      const card = cardResult.card;
      
      // Adicionar aos cards encontrados
      validationResult.cards.found.push({
        id: cardId,
        name: card.name,
        quantity
      });
      
      // Contar o card
      cardCounts.set(cardId, (cardCounts.get(cardId) || 0) + quantity);
      
      // Verificar limite de 4 cópias por card (exceto terrenos básicos)
      if (cardCounts.get(cardId) > 4 && !isBasicLand(card)) {
        validationResult.errors.push(`Mais de 4 cópias do card: ${card.name}`);
      }
      
      // Verificar se é Commander e tem cartas proibidas
      if (deck.isCommander && isCardBannedInCommander(card)) {
        validationResult.errors.push(`Card banido em Commander: ${card.name}`);
      }
      
      // Atualizar estatísticas
      updateStats(validationResult.stats, card, quantity);
      
    } else {
      // Card não encontrado
      validationResult.cards.notFound.push({
        id: cardId,
        quantity
      });
      
      validationResult.warnings.push(`Card não encontrado no banco de dados: ID ${cardId}`);
    }
  });
  
  // Verificar se há erros
  if (validationResult.errors.length > 0) {
    validationResult.success = false;
  }
  
  return validationResult;
};

// Função auxiliar para verificar se um card é um terreno básico
function isBasicLand(card) {
  return card.type?.includes('Basic Land') || 
    (card.name && ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'].includes(card.name));
}

// Função auxiliar para verificar se um card está banido em Commander
function isCardBannedInCommander(card) {
  // Lista simplificada de cards banidos em Commander
  const bannedInCommander = [
    'Ancestral Recall', 
    'Black Lotus', 
    'Time Walk', 
    'Mox Emerald', 
    'Mox Jet', 
    'Mox Pearl', 
    'Mox Ruby', 
    'Mox Sapphire',
    'Channel',
    'Emrakul, the Aeons Torn',
    'Griselbrand',
    'Leovold, Emissary of Trest',
    'Primeval Titan',
    'Prophet of Kruphix',
    'Sylvan Primordial',
    'Tolarian Academy',
    'Trade Secrets',
    'Upheaval'
    // Esta é uma lista simplificada, a lista completa é muito maior
  ];
  
  return card.name && bannedInCommander.includes(card.name);
}

// Função auxiliar para atualizar as estatísticas do deck
function updateStats(stats, card, quantity) {
  // Contagem por tipo
  const cardType = card.type || 'Unknown';
  stats.byType[cardType] = (stats.byType[cardType] || 0) + quantity;
  
  // Contagem por CMC
  const cmc = card.cmc !== undefined ? String(card.cmc) : 'Unknown';
  stats.byCmc[cmc] = (stats.byCmc[cmc] || 0) + quantity;
  
  // Contagem por cor
  const colors = card.colors || ['Colorless'];
  colors.forEach(color => {
    stats.byColor[color] = (stats.byColor[color] || 0) + quantity;
  });
  
  // Contagem por raridade
  const rarity = card.rarity || 'Unknown';
  stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + quantity;
} 