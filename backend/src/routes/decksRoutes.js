import express from 'express';
import * as deckService from '../services/deckService.js';
import * as mtgArenaService from '../services/mtgArenaService.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Middleware para autenticação
router.use(authenticateUser);

/**
 * @swagger
 * /api/decks:
 *   get:
 *     summary: Lista todos os decks do usuário
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de decks do usuário
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await deckService.getUserDecks(userId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar decks:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar decks', error: error.message });
  }
});

/**
 * @swagger
 * /api/decks/{id}:
 *   get:
 *     summary: Obtém um deck específico
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do deck
 *     responses:
 *       200:
 *         description: Detalhes do deck
 *       404:
 *         description: Deck não encontrado
 */
router.get('/:id', async (req, res) => {
  try {
    const deckId = req.params.id;
    const userId = req.user.id;
    
    const result = await deckService.getDeckById(deckId, userId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter deck:', error);
    res.status(500).json({ success: false, message: 'Erro ao obter deck', error: error.message });
  }
});

/**
 * @swagger
 * /api/decks:
 *   post:
 *     summary: Cria um novo deck
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - format
 *               - cards
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               format:
 *                 type: string
 *               cards:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Deck criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const deckData = req.body;
    
    // Validação básica
    if (!deckData.name || !deckData.cards || !Array.isArray(deckData.cards)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados do deck inválidos. Nome e lista de cards são obrigatórios.' 
      });
    }
    
    // Validar formato se fornecido
    if (deckData.format && !deckService.isValidFormat(deckData.format)) {
      return res.status(400).json({ 
        success: false, 
        message: `Formato '${deckData.format}' não é válido.` 
      });
    }
    
    // Criar o deck
    const result = await deckService.createDeck(deckData, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar deck:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar deck', error: error.message });
  }
});

/**
 * @swagger
 * /api/decks/{id}:
 *   put:
 *     summary: Atualiza um deck existente
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Deck atualizado com sucesso
 *       404:
 *         description: Deck não encontrado
 */
router.put('/:id', async (req, res) => {
  try {
    const deckId = req.params.id;
    const userId = req.user.id;
    const deckData = req.body;
    
    // Garantir que não podemos atualizar o dono do deck
    delete deckData.userId;
    
    const result = await deckService.updateDeck(deckId, deckData, userId);
    
    if (!result.success) {
      if (result.message.includes('não encontrado')) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar deck:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar deck', error: error.message });
  }
});

/**
 * @swagger
 * /api/decks/{id}:
 *   delete:
 *     summary: Remove um deck
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deck removido com sucesso
 *       404:
 *         description: Deck não encontrado
 */
router.delete('/:id', async (req, res) => {
  try {
    const deckId = req.params.id;
    const userId = req.user.id;
    
    const result = await deckService.deleteDeck(deckId, userId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao excluir deck:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir deck', error: error.message });
  }
});

/**
 * @swagger
 * /api/decks/{id}/cards:
 *   post:
 *     summary: Adiciona cards a um deck existente
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cards
 *             properties:
 *               cards:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Cards adicionados com sucesso
 *       404:
 *         description: Deck não encontrado
 */
router.post('/:id/cards', async (req, res) => {
  try {
    const deckId = req.params.id;
    const userId = req.user.id;
    const { cards } = req.body;
    
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ success: false, message: 'Lista de cards é obrigatória' });
    }
    
    const result = await deckService.addCardsToDeck(deckId, cards, userId);
    
    if (!result.success) {
      if (result.message.includes('não encontrado')) {
        return res.status(404).json(result);
      }
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao adicionar cards ao deck:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao adicionar cards ao deck', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/decks/{id}/validate/arena:
 *   get:
 *     summary: Valida um deck para o MTG Arena
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado da validação
 *       404:
 *         description: Deck não encontrado
 */
router.get('/:id/validate/arena', async (req, res) => {
  try {
    const deckId = req.params.id;
    const userId = req.user.id;
    
    // Obter o deck
    const deckResult = await deckService.getDeckById(deckId, userId);
    
    if (!deckResult.success) {
      return res.status(404).json(deckResult);
    }
    
    // Verificar se o deck tem o formato esperado
    const deck = deckResult.deck;
    if (!deck || !deck.cards || !Array.isArray(deck.cards) || deck.cards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Formato de deck inválido para validação no Arena'
      });
    }
    
    // Validar o deck para o Arena
    const validationResult = await mtgArenaService.validateDeckForArena(deck.cards);
    
    res.json(validationResult);
  } catch (error) {
    console.error('Erro ao validar deck para o Arena:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao validar deck para o Arena', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/decks/{id}/validate/{format}:
 *   get:
 *     summary: Valida um deck para um formato específico
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *         description: Formato para validação (standard, modern, etc.)
 *     responses:
 *       200:
 *         description: Resultado da validação
 *       404:
 *         description: Deck não encontrado
 */
router.get('/:id/validate/:format', async (req, res) => {
  try {
    const deckId = req.params.id;
    const format = req.params.format.toLowerCase();
    const userId = req.user.id;
    
    // Verificar se o formato é válido
    if (!deckService.isValidFormat(format)) {
      return res.status(400).json({ 
        success: false, 
        message: `Formato '${format}' não é válido.` 
      });
    }
    
    // Obter o deck
    const deckResult = await deckService.getDeckById(deckId, userId);
    
    if (!deckResult.success) {
      return res.status(404).json(deckResult);
    }
    
    // Verificar se o deck tem o formato esperado
    const deck = deckResult.deck;
    if (!deck || !deck.cards || !Array.isArray(deck.cards) || deck.cards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Formato de deck inválido para validação'
      });
    }
    
    // Validar o deck para o formato específico
    const validationResult = await mtgArenaService.validateDeckForFormat(deck.cards, format);
    
    res.json(validationResult);
  } catch (error) {
    console.error('Erro ao validar deck para formato específico:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao validar deck para formato específico', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/decks/{id}/share:
 *   post:
 *     summary: Compartilha um deck
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Link de compartilhamento
 *       404:
 *         description: Deck não encontrado
 */
router.post('/:id/share', async (req, res) => {
  try {
    const deckId = req.params.id;
    const userId = req.user.id;
    
    const result = await deckService.shareDeck(deckId, userId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao compartilhar deck:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao compartilhar deck', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/decks/shared/{shareId}:
 *   get:
 *     summary: Obtém um deck compartilhado pelo ID de compartilhamento
 *     tags: [Decks]
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do deck compartilhado
 *       404:
 *         description: Deck compartilhado não encontrado
 */
router.get('/shared/:shareId', async (req, res) => {
  try {
    const shareId = req.params.shareId;
    
    const result = await deckService.getSharedDeck(shareId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter deck compartilhado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter deck compartilhado', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/decks/shared/{shareId}/clone:
 *   post:
 *     summary: Clona um deck compartilhado para o usuário logado
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Deck clonado com sucesso
 *       404:
 *         description: Deck compartilhado não encontrado
 */
router.post('/shared/:shareId/clone', async (req, res) => {
  try {
    const shareId = req.params.shareId;
    const userId = req.user.id;
    
    const result = await deckService.cloneSharedDeck(shareId, userId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao clonar deck compartilhado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao clonar deck compartilhado', 
      error: error.message 
    });
  }
});

export default router; 