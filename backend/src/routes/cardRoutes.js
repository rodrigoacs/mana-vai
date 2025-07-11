import express from 'express';
import * as cardService from '../services/cardService.js';

const router = express.Router();

// Rota para verificar o status do serviço de cards
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    cardsLoaded: cardService.isLoaded(),
    timestamp: new Date().toISOString()
  });
});

// Rota para carregar os cards (GET)
router.get('/load', async (req, res) => {
  // Se já estão carregados, apenas retorne sucesso
  if (cardService.isLoaded()) {
    return res.json({
      success: true,
      message: 'Cards já estão carregados',
      count: cardService.getCacheSize()
    });
  }

  console.log('Iniciando carregamento de cards via GET /load');
  
  // Como o carregamento pode demorar, retornar status imediatamente
  res.json({
    success: true,
    message: 'Carregamento de cards iniciado',
    status: 'loading'
  });
  
  // Carregar os cards assincronamente após retornar a resposta
  try {
    await cardService.loadCards();
    console.log('Carregamento de cards concluído via GET /load');
  } catch (error) {
    console.error('Erro no carregamento de cards via GET /load:', error);
  }
});

// Rota para carregar os cards (POST)
router.post('/load', async (req, res) => {
  // Se já estão carregados, apenas retorne sucesso
  if (cardService.isLoaded()) {
    return res.json({
      success: true,
      message: 'Cards já estão carregados',
      count: cardService.getCacheSize()
    });
  }

  console.log('Iniciando carregamento de cards via POST /load');
  
  // Como o carregamento pode demorar, retornar status imediatamente
  res.json({
    success: true,
    message: 'Carregamento de cards iniciado',
    status: 'loading'
  });
  
  // Carregar os cards assincronamente após retornar a resposta
  try {
    await cardService.loadCards();
    console.log('Carregamento de cards concluído via POST /load');
  } catch (error) {
    console.error('Erro no carregamento de cards via POST /load:', error);
  }
});

// Rota para obter todos os cards (com paginação)
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  const result = cardService.getAllCards({ page, limit });
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(503).json({
      success: false,
      message: result.message || 'Cards ainda não foram carregados'
    });
  }
});

// Rota para buscar cards por nome
router.get('/search', (req, res) => {
  const name = req.query.name || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'É necessário fornecer um nome para busca'
    });
  }
  
  const result = cardService.searchCardsByName({ name, page, limit });
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(result.cards ? 200 : 503).json(result);
  }
});

// Rota para obter detalhes de um card específico por ID
router.get('/:id', (req, res) => {
  const cardId = req.params.id;
  const result = cardService.getCardById(cardId);
  
  if (result.success) {
    res.json(result.card);
  } else {
    res.status(404).json({
      success: false,
      message: result.message || 'Card não encontrado'
    });
  }
});

// Rota para obter estatísticas dos cards
router.get('/stats/summary', (req, res) => {
  const stats = cardService.getCardStats();
  
  if (stats.success) {
    res.json(stats);
  } else {
    res.status(503).json({
      success: false,
      message: stats.message || 'Não foi possível obter estatísticas'
    });
  }
});

export default router; 