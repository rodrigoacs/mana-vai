import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo de cards
const ALL_CARDS_FILE = path.join(__dirname, '..', '..', 'all-cards-20250417092449.json');

// Cache dos cards em memória (indexado por nome e ID para pesquisa rápida)
let cardsCache = null;
let cardsByName = new Map();  // Inglês (padrão)
let cardsById = null;
let cardsSearchIndex = null;
let cardsByLocalizedName = new Map();  // Outros idiomas

// Lista de idiomas que queremos suportar
const SUPPORTED_LANGUAGES = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'zhs', 'zht'];

// Indexa os cards por nome e ID para pesquisa rápida
const indexCards = (cards) => {
  console.log('Criando índices para busca rápida...');
  const byName = new Map();
  const byId = {};
  const searchIndex = {};
  const byLocalizedName = new Map();
  
  // Inicializar o índice para cada idioma
  SUPPORTED_LANGUAGES.forEach(lang => {
    if (lang !== 'en') {  // 'en' é tratado separadamente em byName
      byLocalizedName.set(lang, new Map());
    }
  });
  
  cards.forEach(card => {
    if (card.id) {
      byId[card.id] = card;
    }
    
    if (card.name) {
      const normalizedName = normalizeCardName(card.name);
      byName.set(normalizedName, card);
      
      // Criando um índice de busca simples por palavra
      const words = normalizedName.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) { // ignorar palavras muito curtas
          if (!searchIndex[word]) {
            searchIndex[word] = new Set();
          }
          searchIndex[word].add(card.id);
        }
      });
    }
    
    // Indexar por nomes localizados
    if (card.foreignNames && Array.isArray(card.foreignNames)) {
      card.foreignNames.forEach(foreign => {
        if (foreign.name && foreign.language) {
          const normalizedName = normalizeCardName(foreign.name);
          const lang = foreign.language.toLowerCase();
          
          if (SUPPORTED_LANGUAGES.includes(lang) && lang !== 'en') {
            if (!byLocalizedName.has(lang)) {
              byLocalizedName.set(lang, new Map());
            }
            
            if (!byLocalizedName.get(normalizedName)) {
              byLocalizedName.set(normalizedName, []);
            }
            
            byLocalizedName.get(normalizedName).push({
              card,
              language: lang
            });
          }
        }
      });
    }
  });
  
  return { byName, byId, searchIndex, byLocalizedName };
};

// Processar o arquivo JSON por streaming para evitar limitação de tamanho de string
const processJsonFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    const cards = [];
    let fileContent = '';
    let isFirstLine = true;
    let processedBytes = 0;
    let totalSize = 0;
    
    try {
      // Obter o tamanho total do arquivo para monitorar progresso
      const stats = fs.statSync(filePath);
      totalSize = stats.size;
      console.log(`Tamanho total do arquivo: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    } catch (err) {
      console.warn('Não foi possível determinar o tamanho do arquivo:', err.message);
    }
    
    // Criar stream de leitura do arquivo
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 1024 * 1024 });
    
    let lastProgressLog = Date.now();
    const progressLogInterval = 2000; // Log a cada 2 segundos
    
    fileStream.on('data', (chunk) => {
      // Atualizar bytes processados
      processedBytes += Buffer.byteLength(chunk, 'utf8');
      
      // Log de progresso a cada X segundos
      const now = Date.now();
      if (now - lastProgressLog > progressLogInterval) {
        const progress = totalSize > 0 ? (processedBytes / totalSize * 100).toFixed(2) : '?';
        console.log(`Processamento em andamento... ${progress}% (${cards.length} cards carregados)`);
        lastProgressLog = now;
      }
      
      // Se for a primeira linha, remover o caractere de início do array JSON
      if (isFirstLine) {
        chunk = chunk.trimStart();
        if (chunk.startsWith('[')) {
          chunk = chunk.slice(1);
        }
        isFirstLine = false;
      }
      
      fileContent += chunk;
      
      // Processar o conteúdo acumulado para encontrar objetos JSON completos
      let lastValidPos = 0;
      let bracketCount = 0;
      let inQuotes = false;
      let escapeNext = false;
      
      for (let i = 0; i < fileContent.length; i++) {
        const char = fileContent[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inQuotes = !inQuotes;
          continue;
        }
        
        if (inQuotes) {
          continue;
        }
        
        if (char === '{') {
          bracketCount++;
        } else if (char === '}') {
          bracketCount--;
          
          // Se encontramos um objeto JSON completo
          if (bracketCount === 0) {
            try {
              const jsonStr = fileContent.substring(lastValidPos, i + 1);
              
              // Remover qualquer vírgula de separação entre objetos
              const cleanedStr = jsonStr.replace(/^\s*,\s*/, '');
              
              if (cleanedStr.trim().length > 0) {
                const cardObj = JSON.parse(cleanedStr);
                cards.push(cardObj);
              }
              
              lastValidPos = i + 1;
            } catch (error) {
              console.error('Erro ao parsear objeto JSON:', error);
            }
          }
        }
      }
      
      // Manter apenas a parte não processada para a próxima iteração
      if (lastValidPos > 0) {
        fileContent = fileContent.slice(lastValidPos);
      }
    });
    
    fileStream.on('error', (error) => {
      reject(error);
    });
    
    fileStream.on('end', () => {
      console.log(`Concluído o processamento do arquivo. Total de cards: ${cards.length}`);
      resolve(cards);
    });
  });
};

/**
 * Normaliza um nome de card para busca (remove acentos, converte para lowercase)
 * @param {string} name - Nome do card
 * @returns {string} - Nome normalizado
 */
const normalizeCardName = (name) => {
  if (!name) return '';
  
  // Remove variações do nome (tudo entre parênteses)
  let normalizedName = name.replace(/\([^)]*\)/g, '');
  
  // Remove números de coleção que podem aparecer após o nome
  normalizedName = normalizedName.replace(/\s+\d+$/, '');
  
  // Para cards de dupla face, pega apenas o primeiro nome
  if (normalizedName.includes('//')) {
    normalizedName = normalizedName.split('//')[0];
  }
  
  return normalizedName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '')        // Remove pontuações e caracteres especiais
    .replace(/\s+/g, ' ')           // Normaliza espaços
    .trim();                       // Remove espaços extras
};

// Carrega os cards do arquivo JSON
const loadCards = async () => {
  if (cardsCache) {
    console.log('Cards já estão em memória');
    return { success: true, count: cardsCache.length };
  }
  
  try {
    console.log(`Carregando cards de ${ALL_CARDS_FILE}`);
    const startTime = Date.now();
    
    // Verificando se o arquivo existe
    if (!fs.existsSync(ALL_CARDS_FILE)) {
      console.error('Arquivo de cards não encontrado');
      return { success: false, message: 'Arquivo de cards não encontrado' };
    }
    
    // Usar o processador de streaming para carregar o arquivo
    console.log('Processando arquivo por streaming para evitar limitações de memória...');
    cardsCache = await processJsonFile(ALL_CARDS_FILE);
    
    // Indexando os cards
    const indices = indexCards(cardsCache);
    cardsByName = indices.byName;
    cardsById = indices.byId;
    cardsSearchIndex = indices.searchIndex;
    cardsByLocalizedName = indices.byLocalizedName;
    
    const endTime = Date.now();
    console.log(`Cards carregados com sucesso em ${(endTime - startTime) / 1000} segundos`);
    console.log(`Total de cards: ${cardsCache.length}`);
    
    // Mostrar informações sobre os idiomas disponíveis
    console.log('Cards indexados por nome:', cardsByName.size);
    console.log('Cards indexados por idioma:', cardsByLocalizedName.size);
    
    return { success: true, count: cardsCache.length };
  } catch (error) {
    console.error('Erro ao carregar os cards:', error);
    return { success: false, message: error.message };
  }
};

// Obtém todos os cards com paginação
const getAllCards = ({ page = 1, limit = 20 }) => {
  if (!cardsCache) {
    return { success: false, message: 'Cards ainda não foram carregados' };
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, cardsCache.length);
  
  return {
    success: true,
    totalCards: cardsCache.length,
    totalPages: Math.ceil(cardsCache.length / limit),
    currentPage: page,
    cardsPerPage: limit,
    cards: cardsCache.slice(startIndex, endIndex)
  };
};

// Busca cards por nome em qualquer idioma
const searchCardsByName = ({ name, page = 1, limit = 20 }) => {
  if (!cardsCache || !cardsByName || !cardsSearchIndex) {
    return { success: false, message: 'Cards ainda não foram carregados' };
  }
  
  if (!name) {
    return { success: false, message: 'Nome de busca não fornecido' };
  }
  
  const searchTerm = normalizeCardName(name);
  let results = [];
  
  // Primeiro, buscar cards em inglês
  // Busca exata
  if (cardsByName.has(searchTerm)) {
    results.push(cardsByName.get(searchTerm));
  }
  
  // Busca por correspondência parcial em inglês
  if (results.length === 0) {
    results = cardsCache.filter(card => 
      card.name && normalizeCardName(card.name).includes(searchTerm)
    );
  }
  
  // Se ainda não encontrou, buscar nos índices de outros idiomas
  if (results.length === 0) {
    const localizedCards = cardsByLocalizedName.get(searchTerm);
    if (localizedCards) {
      localizedCards.forEach(item => {
        if (!results.some(r => r.id === item.card.id)) {
          results.push(item.card);
        }
      });
    }
    
    // Se não encontrou resultados exatos, tenta buscar cards que contenham o nome
    if (results.length === 0 && searchTerm.length >= 3) {
      // Percorre todas as chaves do mapa e verifica se contêm o nome buscado
      for (const [key, value] of cardsByLocalizedName.entries()) {
        if (typeof key === 'string' && key.includes(searchTerm)) {
          value.forEach(item => {
            if (!results.some(r => r.id === item.card.id)) {
              results.push(item.card);
            }
          });
        }
      }
    }
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, results.length);
  
  return {
    success: true,
    totalResults: results.length,
    totalPages: Math.ceil(results.length / limit),
    currentPage: page,
    cardsPerPage: limit,
    cards: results.slice(startIndex, endIndex)
  };
};

/**
 * Encontra um card pelo nome exato
 * @param {string} name - Nome do card
 * @returns {Promise<Object|null>} - Objeto do card ou null se não encontrado
 */
const findCardByName = async (name) => {
  if (!name) return null;
  
  try {
    // Garante que os cards estão carregados
    if (!cardsCache || !cardsByName) {
      await loadCards();
    }
    
    const normalizedName = normalizeCardName(name);
    if (!normalizedName) return null;
    
    // Primeiro tenta uma correspondência exata
    const exactMatch = cardsByName.get(normalizedName);
    if (exactMatch) return exactMatch;
    
    // Se não encontrar, tenta verificar se o nome inclui uma variante
    // (ex: "Kumano Faces Kakkazan" é uma variante de "Kumano")
    const possibleMatches = [];
    for (const [key, card] of cardsByName.entries()) {
      // Verifica se o nome normalizado é parte do nome do card ou vice-versa
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        possibleMatches.push(card);
      }
      
      // Verifica cards com múltiplas faces
      if (card.layout && ['transform', 'flip', 'modal_dfc', 'double_faced_token'].includes(card.layout)) {
        // Verifica se alguma das faces corresponde ao nome buscado
        if (card.card_faces && Array.isArray(card.card_faces)) {
          for (const face of card.card_faces) {
            if (face.name) {
              const normalizedFaceName = normalizeCardName(face.name);
              if (normalizedName === normalizedFaceName || 
                  normalizedName.includes(normalizedFaceName) || 
                  normalizedFaceName.includes(normalizedName)) {
                possibleMatches.push(card);
                break;
              }
            }
          }
        }
      }
    }
    
    // Se encontrou possíveis correspondências, retorna a primeira
    if (possibleMatches.length > 0) {
      return possibleMatches[0];
    }
    
    // Nenhuma correspondência encontrada
    return null;
  } catch (error) {
    console.error(`Erro ao buscar card por nome "${name}":`, error);
    return null;
  }
};

/**
 * Encontra cards em qualquer idioma suportado que correspondem ao nome fornecido
 * @param {string} name - Nome do card
 * @returns {Promise<Array>} - Array de cards encontrados
 */
const findCardsByMultiLanguage = async (name) => {
  if (!name) return [];
  
  try {
    // Garante que os cards estão carregados
    if (!cardsCache || !cardsByLocalizedName) {
      await loadCards();
    }
    
    const normalizedName = normalizeCardName(name);
    if (!normalizedName) return [];
    
    const results = [];
    
    // Primeiro tenta encontrar pelo nome em inglês
    const englishCard = await findCardByName(normalizedName);
    if (englishCard) {
      results.push(englishCard);
    }
    
    // Verifica se o nome normalizado está no índice de nomes localizados
    if (cardsByLocalizedName.has(normalizedName)) {
      cardsByLocalizedName.get(normalizedName).forEach(item => {
        if (!results.some(c => c.id === item.card.id)) {
          results.push(item.card);
        }
      });
    }
    
    // Se não encontrou resultados exatos, tenta buscar cards que contenham o nome
    if (results.length === 0 && normalizedName.length >= 3) {
      // Percorre todas as chaves do mapa e verifica se contêm o nome buscado
      for (const [key, value] of cardsByLocalizedName.entries()) {
        if (typeof key === 'string' && 
            (key.includes(normalizedName) || normalizedName.includes(key))) {
          value.forEach(item => {
            if (!results.some(c => c.id === item.card.id)) {
              results.push(item.card);
            }
          });
        }
      }
    }
    
    // Busca especial para cards de dupla face
    if (results.length === 0) {
      for (const card of cardsCache) {
        if (card.layout && ['transform', 'flip', 'modal_dfc', 'double_faced_token'].includes(card.layout)) {
          if (card.card_faces && Array.isArray(card.card_faces)) {
            for (const face of card.card_faces) {
              if (face.name) {
                const normalizedFaceName = normalizeCardName(face.name);
                if (normalizedName === normalizedFaceName || 
                    normalizedName.includes(normalizedFaceName) || 
                    normalizedFaceName.includes(normalizedName)) {
                  if (!results.some(c => c.id === card.id)) {
                    results.push(card);
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Erro ao buscar cards multilíngue para "${name}":`, error);
    return [];
  }
};

/**
 * Função simplificada para calcular similaridade entre strings
 * @param {string} str1 - Primeira string
 * @param {string} str2 - Segunda string
 * @returns {number} - Pontuação de similaridade (0-1)
 */
const calculateSimilarity = (str1, str2) => {
  // Verifica se uma string contém a outra
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.8 + (0.2 * Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length));
  }
  
  // Verifica palavras em comum
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    if (word1.length <= 2) continue; // Ignora palavras muito curtas
    
    for (const word2 of words2) {
      if (word2.length <= 2) continue;
      
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }
  
  // Calcula pontuação baseada em palavras correspondentes
  const totalWords = Math.max(1, words1.length);
  return matchCount / totalWords;
};

/**
 * Busca cards com uma correspondência aproximada do nome
 * @param {string} query - Nome ou parte do nome a buscar
 * @param {number} limit - Número máximo de resultados (padrão: 10)
 * @returns {Promise<Array>} - Array de cards encontrados
 */
const searchCards = async (query, limit = 10) => {
  if (!query || query.length < 3) return [];
  
  try {
    // Garante que os cards estão carregados
    if (!cardsCache) {
      await loadCards();
    }
    
    const normalizedQuery = normalizeCardName(query);
    const results = [];
    
    // Primeiro tenta busca exata
    const exactMatch = await findCardByName(query);
    if (exactMatch) {
      results.push({
        card: exactMatch,
        score: 1.0,
        matchType: 'exact'
      });
    }
    
    // Então busca em outros idiomas
    const multiLangMatches = await findCardsByMultiLanguage(query);
    for (const card of multiLangMatches) {
      if (!results.some(r => r.card.id === card.id)) {
        results.push({
          card,
          score: 0.9,
          matchType: 'multilang'
        });
      }
    }
    
    // Se ainda precisamos de mais resultados, fazemos uma busca mais ampla
    if (results.length < limit) {
      // Divide a consulta em palavras para buscar correspondências parciais
      const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
      
      // Para consultas com mais de uma palavra, priorizamos cards que contêm todas as palavras
      for (const card of cardsCache) {
        // Pula se já está nos resultados
        if (results.some(r => r.card.id === card.id)) continue;
        
        const normalizedName = normalizeCardName(card.name);
        const score = calculateSimilarity(normalizedQuery, normalizedName);
        
        if (score > 0.5) {
          results.push({
            card,
            score,
            matchType: 'fuzzy'
          });
        }
        
        // Limita o número de buscas para não demorar muito
        if (results.length >= limit * 3) break;
      }
    }
    
    // Ordena por pontuação e limita resultados
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(result => result.card);
      
  } catch (error) {
    console.error(`Erro ao buscar cards para "${query}":`, error);
    return [];
  }
};

// Verifica se os cards estão carregados
const isLoaded = () => {
  return cardsCache !== null;
};

// Obtém um card pelo ID
const getCardById = (id) => {
  if (!cardsCache || !cardsById) {
    return { success: false, message: 'Cards ainda não foram carregados' };
  }
  
  const card = cardsById[id];
  
  if (!card) {
    return { success: false, message: 'Card não encontrado' };
  }
  
  return { success: true, card };
};

// Retorna o tamanho atual do cache de cards
const getCacheSize = () => {
  return cardsCache ? cardsCache.length : 0;
};

export {
  loadCards,
  getAllCards,
  searchCardsByName,
  getCardById,
  isLoaded,
  getCacheSize,
  findCardByName,
  findCardsByMultiLanguage,
  searchCards,
  normalizeCardName
}; 