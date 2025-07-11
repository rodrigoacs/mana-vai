import * as cardService from './cardService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivo de log para validação do Arena
const LOG_FILE = path.join(process.cwd(), 'arena-validation.log');

// Função para registrar logs específicos de validação do Arena
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Escrever no arquivo de log
  fs.appendFileSync(LOG_FILE, logMessage);
  
  // Também mostrar no console para debugging
  console.log(message);
};

// Lista de propriedades a verificar para determinar se um card está disponível no Arena
const ARENA_INDICATORS = ['arena', 'isInArena', 'isArenaLegal'];

function logValidationMessage(message, card = null) {
    const logMessage = card 
        ? `${message}: ${card.name} (${card.set || 'N/A'})` 
        : message;
    
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
    console.log(logMessage);
    return logMessage;
}

/**
 * Verifica se um card está disponível no MTG Arena
 * @param {string} cardName Nome do card
 * @param {string} setCode Código do set (opcional)
 * @returns {Promise<{isAvailable: boolean, card: Object|null, reason: string}>}
 */
const isCardInArena = async (cardName, setCode = null) => {
  try {
    // Validar se o cardName é válido
    if (!cardName || cardName === 'undefined') {
      logValidationMessage(`Nome de card inválido ou indefinido: "${cardName}"`);
      return { isAvailable: false, card: null, reason: 'Nome de card inválido ou indefinido' };
    }
    
    // Tratamento especial para cards com nomes duplos ou que contêm "//"
    const searchName = cardName.includes('//')
      ? cardName.split('//')[0].trim() // Usa apenas a primeira face
      : cardName;
    
    logValidationMessage(`Analisando card: "${cardName}" ${setCode ? `(Set: ${setCode})` : ''}`);
    
    // Primeiro tenta buscar pelo nome exato
    let card = await cardService.findCardByName(searchName);
    
    // Se não encontrou pelo nome exato, tenta buscar em múltiplos idiomas
    if (!card) {
      logValidationMessage(`Card não encontrado pelo nome exato, buscando em múltiplos idiomas: "${searchName}"`);
      const multiLangResults = await cardService.findCardsByMultiLanguage(searchName);
      
      if (multiLangResults && multiLangResults.length > 0) {
        // Se temos resultados em múltiplos idiomas, escolhe o primeiro
        card = multiLangResults[0];
        logValidationMessage(`Card encontrado em outro idioma: "${card.name}" (${card.lang || 'desconhecido'})`);
      } else {
        // Tenta uma busca mais flexível
        const searchResults = await cardService.searchCards(searchName, 1);
        if (searchResults && searchResults.length > 0) {
          card = searchResults[0];
          logValidationMessage(`Card encontrado por busca aproximada: "${card.name}"`);
        } else {
          logValidationMessage(`Card não encontrado em nenhum idioma: "${searchName}"`);
          return { isAvailable: false, card: null, reason: 'Card não encontrado' };
        }
      }
    }
    
    // Verificar se é um card com múltiplas faces
    const isDoubleFaced = cardName.includes('//') || 
                         (card.layout && ['transform', 'flip', 'modal_dfc', 'double_faced_token'].includes(card.layout));
    
    // Se o setCode for especificado, verifica se o card pertence a esse set
    if (setCode && card.set && card.set.toLowerCase() !== setCode.toLowerCase()) {
      logValidationMessage(`Card encontrado, mas não pertence ao set especificado: ${card.set} vs ${setCode}`);
      
      // Tenta encontrar a versão correta do set
      const multiLangResults = await cardService.findCardsByMultiLanguage(searchName);
      const cardInCorrectSet = multiLangResults && multiLangResults.length > 0 ? 
        multiLangResults.find(c => c && c.set && c.set.toLowerCase() === setCode.toLowerCase()) : null;
      
      if (cardInCorrectSet) {
        card = cardInCorrectSet;
        logValidationMessage(`Encontrada versão do card no set correto: ${card.set}`);
      } else {
        // Continua com o card encontrado, mas alerta que o set é diferente
        logValidationMessage(`Aviso: Usando card de set diferente do especificado`);
      }
    }
    
    // A partir daqui verificamos se o card está disponível no MTG Arena
    
    // 1. Verifica se o card tem o campo 'games' que inclui 'arena'
    if (card.games && Array.isArray(card.games) && card.games.includes('arena')) {
      logValidationMessage(`Card disponível no MTG Arena (confirmado pelo campo 'games'): ${card.name}`);
      return { isAvailable: true, card, reason: 'Confirmado pelo campo games' };
    }
    
    // 2. Verifica as legalidades específicas do Arena
    const arenaFormats = ['alchemy', 'historic', 'brawl', 'standard', 'explorer'];
    if (card.legalities) {
      for (const format of arenaFormats) {
        if (card.legalities[format] && ['legal', 'restricted'].includes(card.legalities[format].toLowerCase())) {
          logValidationMessage(`Card disponível no MTG Arena (legal em formato do Arena: ${format}): ${card.name}`);
          return { isAvailable: true, card, reason: `Legal em ${format}` };
        }
      }
    }
    
    // 3. Verifica propriedades que indicam disponibilidade no Arena
    if (card.arena === true || (card.mtgo === true && card.digital === true)) {
      logValidationMessage(`Card disponível no MTG Arena (propriedades específicas): ${card.name}`);
      return { isAvailable: true, card, reason: 'Propriedades específicas' };
    }
    
    // 4. Lista de sets conhecidos disponíveis no Arena (ATUALIZADA)
    const arenaSets = [
      // Sets base e expansões recentes
      'xln', 'rix', 'dom', 'grn', 'rna', 'war', 'm19', 'm20', 'm21', 'm22', 'm23', 'm24',
      'thb', 'iko', 'znr', 'khm', 'stx', 'afr', 'mid', 'vow', 'neo', 'snc', 'dmu',
      'bro', 'one', 'mom', 'woe', 'mkm', 'lci', 'ltr', 'eld', 
      
      // Sets exclusivos de Arena
      'arena', 'anb', 'akr', 'klr', 'sta', 'y22', 'y23', 'y24', 'slx', 
      
      // Antologias e outros produtos
      'hbg', 'bot', 'mat', 'oko', 'mago', 'moc', 'g01', 'g02', 'j21', 'j22', 'jmp', 'mb1',
      
      // Horizonte de Modern
      'mh1', 'mh2',
      
      // Sets antigos mas disponíveis no Arena
      'akh', 'hou', 'kld', 'aer', 'inv', 'mmq', 'apc', 'ody', 'tor', 'plc',
      
      // Anthologies do Historic
      'ha1', 'ha2', 'ha3', 'ha4', 'ha5', 'ha6', 'ha7',
      
      // Sets especiais
      'cmr', 'gn3', 'sig'
    ];
    
    if (card.set && arenaSets.includes(card.set.toLowerCase())) {
      logValidationMessage(`Card disponível no MTG Arena (set conhecido do Arena: ${card.set}): ${card.name}`);
      return { isAvailable: true, card, reason: `Set do Arena: ${card.set}` };
    }
    
    // 5. Tratamento especial para cards de dupla face de sets que estão no Arena
    if (isDoubleFaced && card.set) {
      const setCode = card.set.toLowerCase();
      const dfcSetsInArena = ['mid', 'vow', 'neo', 'dmu', 'one', 'mom', 'woe', 'ixl', 'emn', 'soi'];
      
      if (dfcSetsInArena.includes(setCode)) {
        logValidationMessage(`Card de dupla face disponível no MTG Arena (set: ${card.set}): ${card.name}`);
        return { isAvailable: true, card, reason: `Card de dupla face de set disponível no Arena: ${card.set}` };
      }
    }
    
    // 6. Heurística para cards lançados a partir de 2021 (Neo-Kamigawa foi lançado em 2022)
    if (card.releaseDate) {
      const releaseYear = new Date(card.releaseDate).getFullYear();
      if (releaseYear >= 2021) {
        logValidationMessage(`Card provavelmente disponível no MTG Arena (lançado após 2021): ${card.name}`);
        return { isAvailable: true, card, reason: `Lançado após 2021 (${releaseYear})` };
      }
    }
    
    // 7. Verificar se o card é básico (básicos estão sempre disponíveis)
    if (card.type && (card.type.toLowerCase().includes('basic') || 
                      card.supertypes?.includes('Basic'))) {
      logValidationMessage(`Card básico (sempre disponível no Arena): ${card.name}`);
      return { isAvailable: true, card, reason: 'Terra básica' };
    }
    
    // Se chegou até aqui, não temos evidências suficientes de que o card está no Arena
    logValidationMessage(`Card provavelmente NÃO disponível no MTG Arena: ${card.name}`);
    return { isAvailable: false, card, reason: 'Sem evidências de disponibilidade no Arena' };
    
  } catch (error) {
    logValidationMessage(`Erro ao verificar disponibilidade do card "${cardName}": ${error.message}`);
    return { isAvailable: false, card: null, reason: `Erro: ${error.message}` };
  }
};

/**
 * Valida um deck para o MTG Arena
 * @param {Array} deckList Lista de objetos {quantity: number, cardName: string, setCode: string}
 * @returns {Promise<Object>} Resultado da validação
 */
const validateDeckForArena = async (deckList) => {
  try {
    // Verificar se a lista de cards é válida
    if (!deckList || !Array.isArray(deckList) || deckList.length === 0) {
      logValidationMessage('Lista de deck vazia ou inválida');
      return {
        success: false,
        error: 'Lista de deck vazia ou inválida'
      };
    }
    
    logValidationMessage(`Iniciando validação de deck com ${deckList.length} entradas...`);
    
    // Verificar se o serviço de cards está inicializado
    if (!cardService.isLoaded()) {
      try {
        log(`[ARENA-VALIDATOR] Carregando base de cards (all-cards-20250417092449.json)`);
        await cardService.loadCards();
      } catch (error) {
        return { success: false, message: 'Erro ao carregar a base de cards: ' + error.message };
      }
    }
    
    let totalCards = 0;
    let availableCards = 0;
    let unavailableCards = 0;
    
    const results = {
      totalCards: 0,
      totalUniqueCards: deckList.length,
      availableCards: [],
      unavailableCards: [],
      percentAvailable: 0
    };
    
    // Filtrar cards inválidos
    const validDeckList = deckList.filter(entry => 
      entry && 
      typeof entry === 'object' && 
      entry.cardName && 
      entry.cardName !== 'undefined' && 
      !isNaN(entry.quantity)
    );
    
    if (validDeckList.length < deckList.length) {
      logValidationMessage(`Aviso: ${deckList.length - validDeckList.length} entradas inválidas foram removidas do deck`);
    }
    
    // Calcular o total de cards considerando as quantidades
    for (const entry of validDeckList) {
      totalCards += entry.quantity;
    }
    
    results.totalCards = totalCards;
    results.totalUniqueCards = validDeckList.length;
    
    // Avaliar cada card do deck
    for (const entry of validDeckList) {
      const { quantity, cardName, setCode } = entry;
      
      const validationResult = await isCardInArena(cardName, setCode);
      
      if (validationResult.isAvailable) {
        availableCards += quantity;
        results.availableCards.push({
          quantity,
          name: cardName,
          set: validationResult.card?.set || setCode,
          games: validationResult.card?.games || [],
          releaseDate: validationResult.card?.releaseDate || null,
          reason: validationResult.reason
        });
      } else {
        unavailableCards += quantity;
        results.unavailableCards.push({
          quantity,
          name: cardName,
          set: validationResult.card?.set || setCode,
          games: validationResult.card?.games || [],
          releaseDate: validationResult.card?.releaseDate || null,
          reason: validationResult.reason
        });
      }
    }
    
    // Calcular a porcentagem de cards disponíveis
    results.percentAvailable = totalCards > 0 
      ? Math.round((availableCards / totalCards) * 100) 
      : 0;
    
    // Estatísticas de validação
    logValidationMessage(`Validação concluída. Resultados:
      - Total de cards: ${totalCards}
      - Cards únicos: ${validDeckList.length}
      - Cards disponíveis: ${availableCards} (${results.percentAvailable}%)
      - Cards indisponíveis: ${unavailableCards} (${100 - results.percentAvailable}%)
    `);
    
    return results;
  } catch (error) {
    logValidationMessage(`Erro na validação do deck: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Valida um deck para um formato específico do MTG Arena
 * @param {Array} deckCards - Lista de cards no formato {quantity, name}
 * @param {String} format - Formato de jogo (standard, historic, explorer, etc)
 * @returns {Object} - Resultados da validação
 */
const validateDeckForFormat = async (deckCards, format) => {
  // Verificar se o serviço de cards está inicializado
  if (!cardService.isLoaded()) {
    try {
      await cardService.loadCards();
    } catch (error) {
      return { success: false, message: 'Erro ao carregar a base de cards: ' + error.message };
    }
  }

  // Verificar se deckCards é um array válido
  if (!deckCards || !Array.isArray(deckCards) || deckCards.length === 0) {
    log(`[ARENA-VALIDATOR] Erro: formato de deck inválido ou vazio`);
    return { 
      success: false, 
      message: 'Formato de deck inválido. Esperado um array de cards no formato {quantity, name}.'
    };
  }

  // Verificar se o formato é válido
  if (!format || typeof format !== 'string') {
    log(`[ARENA-VALIDATOR] Erro: formato de jogo inválido - ${format}`);
    return {
      success: false,
      message: 'Formato de jogo inválido ou não especificado'
    };
  }

  format = format.toLowerCase();
  log(`[ARENA-VALIDATOR] Iniciando validação para formato específico: ${format}`);

  // Por enquanto, apenas utilizamos a validação genérica do Arena
  // No futuro, podemos implementar validações específicas por formato
  const result = await validateDeckForArena(deckCards);
  
  // Adicionar informações sobre o formato no resultado
  return {
    ...result,
    format: format
  };
};

export {
  isCardInArena,
  validateDeckForArena,
  validateDeckForFormat
}; 