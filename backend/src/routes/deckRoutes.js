import express from 'express';
import * as deckValidationService from '../services/deckValidationService.js';
import * as mtgArenaService from '../services/mtgArenaService.js';

const router = express.Router();

// Rota para validar um deck
router.post('/validate', (req, res) => {
  const deck = req.body;
  
  if (!deck) {
    return res.status(400).json({
      success: false,
      message: 'Dados do deck não fornecidos'
    });
  }
  
  const result = deckValidationService.validateDeck(deck);
  
  if (result.success) {
    res.json(result);
  } else {
    // Ainda retornamos 200 mesmo com erros de validação, pois tecnicamente a API funcionou
    res.json(result);
  }
});

// Rota para validar formato específico (Commander, Standard, etc)
router.post('/validate/:format', (req, res) => {
  const format = req.params.format?.toLowerCase();
  const deck = req.body;
  
  if (!format) {
    return res.status(400).json({
      success: false,
      message: 'Formato não especificado'
    });
  }
  
  if (!deck) {
    return res.status(400).json({
      success: false,
      message: 'Dados do deck não fornecidos'
    });
  }
  
  // Adicionando a propriedade de formato ao deck
  const deckWithFormat = {
    ...deck,
    isCommander: format === 'commander'
  };
  
  const result = deckValidationService.validateDeck(deckWithFormat);
  
  res.json(result);
});

// Nova rota para verificar compatibilidade com MTG Arena
router.post('/validate-arena', async (req, res) => {
  const deck = req.body;
  
  if (!deck) {
    return res.status(400).json({
      success: false,
      message: 'Dados do deck não fornecidos'
    });
  }
  
  // Verificar se temos o formato esperado
  if (!deck.cards || !Array.isArray(deck.cards)) {
    return res.status(400).json({
      success: false,
      message: 'Formato inválido. Esperado: {cards: [{quantity, cardName}, ...]}' 
    });
  }
  
  try {
    // Verificar se cada card tem a propriedade 'cardName'
    const validCards = deck.cards.filter(card => 
      card && typeof card === 'object' && card.cardName && card.cardName !== 'undefined'
    );
    
    if (validCards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum card válido encontrado no deck'
      });
    }
    
    if (validCards.length < deck.cards.length) {
      console.warn(`${deck.cards.length - validCards.length} cards inválidos foram removidos do deck`);
    }
    
    const result = await mtgArenaService.validateDeckForArena(validCards);
    
    // Adicionar informações do deck ao resultado
    return res.json({
      success: true,
      deckName: deck.name || 'Deck sem nome',
      arenaCompatibility: {
        totalCards: result.totalCards,
        totalUniqueCards: result.totalUniqueCards,
        availableInArena: getTotalCardQuantity(result.availableCards),
        unavailableCardCount: getTotalCardQuantity(result.unavailableCards),
        availablePercentage: result.percentAvailable,
        cardsInArena: result.availableCards,
        cardsNotInArena: result.unavailableCards
      }
    });
  } catch (error) {
    console.error('Erro ao validar deck para o Arena:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao validar deck para o Arena',
      error: error.message
    });
  }
});

// Helper para calcular o total de cards considerando a quantidade de cada um
function getTotalCardQuantity(cards) {
  if (!cards || !Array.isArray(cards)) return 0;
  return cards.reduce((total, card) => total + (card.quantity || 1), 0);
}

export default router; 