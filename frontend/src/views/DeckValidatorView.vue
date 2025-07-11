<template>
  <div class="deck-validator-view">
    <h1>Validador de Deck - MTG Arena</h1>
    
    <div class="deck-input-container">
      <Card class="input-card">
        <template #title>
          <div class="card-title">Insira seu deck</div>
        </template>
        <template #content>
          <div class="input-options">
            <div class="input-option">
              <h3>Texto do Deck</h3>
              <Textarea
                v-model="deckText"
                rows="10"
                placeholder="Cole aqui a lista do seu deck (formato: 1 Nome do Card)"
                class="deck-textarea"
              />
              <div class="example-btn-wrapper">
                <Button 
                  label="Usar exemplo" 
                  icon="pi pi-clone" 
                  @click="useSampleDeck" 
                  severity="secondary" 
                  text
                  size="small"
                />
              </div>
            </div>
            
            <div class="input-option">
              <h3>Arquivo de Deck</h3>
              <FileUpload
                mode="basic"
                accept=".txt"
                :maxFileSize="1000000"
                @upload="onDeckFileUpload"
                @select="onDeckFileSelect"
                chooseLabel="Escolher Arquivo"
                class="deck-file-upload"
              />
              <small>Formatos aceitos: .txt</small>
            </div>
          </div>
          
          <div class="deck-name-container">
            <span class="deck-name-label">Nome do Deck:</span>
            <InputText v-model="deckName" placeholder="Meu Deck" class="deck-name-input" />
          </div>
          
          <div class="action-buttons">
            <Button
              label="Validar para MTG Arena"
              icon="pi pi-check"
              @click="validateDeckForArena"
              :disabled="!deckText.trim()"
              class="validate-button"
            />
            <Button
              label="Limpar"
              icon="pi pi-trash"
              @click="clearDeck"
              class="clear-button"
              severity="secondary"
            />
          </div>
        </template>
      </Card>
    </div>
    
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <span>Validando deck...</span>
    </div>
    
    <div v-if="errorMessage" class="error-container">
      <Message severity="error" :closable="true" @close="errorMessage = null">
        <div class="error-message">{{ errorMessage }}</div>
      </Message>
    </div>
    
    <div v-if="validationResult && !loading" class="results-container">
      <Card class="result-card">
        <template #title>
          <div class="card-title">Resultado da Validação</div>
        </template>
        <template #content>
          <div class="deck-info">
            <h3>{{ validationResult.deckName }}</h3>
            <div class="compatibility-summary">
              <div class="compatibility-score">
                <div class="score-circle" :style="{ '--percentage': validationResult.arenaCompatibility.availablePercentage + '%' }">
                  <span>{{ validationResult.arenaCompatibility.availablePercentage }}%</span>
                </div>
                <div class="score-label">Compatível com Arena</div>
              </div>
              
              <div class="compatibility-stats">
                <div class="stat-item">
                  <strong>Total de Cards:</strong> {{ validationResult.arenaCompatibility.totalCards }}
                </div>
                <div class="stat-item">
                  <strong>Disponíveis no Arena:</strong> {{ validationResult.arenaCompatibility.availableInArena }}
                </div>
                <div class="stat-item">
                  <strong>Não Disponíveis:</strong> {{ validationResult.arenaCompatibility.unavailableCardCount }}
                </div>
              </div>
            </div>
          </div>
          
          <Divider />
          
          <div class="cards-lists">
            <TabView>
              <TabPanel :header="availableCardsTabHeader">
                <DataTable :value="validationResult.arenaCompatibility.cardsInArena" stripedRows>
                  <Column field="quantity" header="Quantidade" style="width: 80px" />
                  <Column field="name" header="Nome do Card" />
                </DataTable>
              </TabPanel>
              
              <TabPanel :header="unavailableCardsTabHeader">
                <DataTable :value="validationResult.arenaCompatibility.cardsNotInArena" stripedRows>
                  <Column field="quantity" header="Quantidade" style="width: 80px" />
                  <Column field="name" header="Nome do Card" />
                </DataTable>
              </TabPanel>
            </TabView>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import ProgressSpinner from 'primevue/progressspinner'
import Divider from 'primevue/divider'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'

const backendUrl = 'http://localhost:3000';
const deckText = ref('');
const deckName = ref('Meu Deck');
const loading = ref(false);
const validationResult = ref(null);
const errorMessage = ref(null);
const fileReader = new FileReader();

// Deck exemplo
const sampleDeck = `// Deck: Mono Red Aggro
4 Kumano Faces Kakkazan
4 Play with Fire
4 Lightning Strike
2 Squee, Dubious Monarch
4 Monastery Swiftspear
2 Phoenix Chick
3 Bloodthirsty Adversary
2 Chandra, Dressed to Kill
4 Shivan Devastator
3 Thundering Raiju
2 Feldon, Ronom Excavator
2 Jaya, Fiery Negotiator
1 Sokenzan, Crucible of Defiance
23 Mountain`;

// Carregar um deck de exemplo
function useSampleDeck() {
  deckText.value = sampleDeck;
  deckName.value = "Mono Red Aggro";
}

// Tratar upload de arquivo
function onDeckFileSelect(event) {
  const file = event.files[0];
  if (file) {
    fileReader.onload = (e) => {
      deckText.value = e.target.result;
      // Tentar extrair o nome do arquivo como nome do deck
      if (file.name && file.name.endsWith('.txt')) {
        const deckNameFromFile = file.name.replace('.txt', '');
        deckName.value = deckNameFromFile;
      }
    };
    fileReader.readAsText(file);
  }
}

function onDeckFileUpload(event) {
  // Este método é chamado quando o arquivo é enviado, mas estamos lidando com o conteúdo no onDeckFileSelect
}

// Parsear o texto do deck para o formato esperado pela API
function parseDeckText() {
  const lines = deckText.value.trim().split('\n');
  const cards = [];
  const notParsedLines = [];
  
  lines.forEach((line, index) => {
    // Ignorar linhas vazias
    if (!line.trim()) return;
    
    // Comentários começando com // ou #
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
      return;
    }
    
    // Formatos do MTG Arena
    // Exemplos:
    // 4 Lightning Bolt (M11) 149
    // 3x Counterspell (MMQ) 69
    // 2 Forest
    // 1 Island (XLN) 264
    
    // Formato do Arena: número + nome + (set) + número coleção
    let match = line.match(/^(\d+)(?:x)?\s+([^(]+)(?:\s+\(([A-Z0-9]{3,4})\))?(?:\s+\d+)?$/);
    
    if (match) {
      const quantity = parseInt(match[1]);
      const cardName = match[2].trim();
      const setCode = match[3]; // Pode ser undefined
      
      // Verificar se cardName não está vazio ou indefinido
      if (cardName && cardName !== 'undefined') {
        cards.push({
          cardName,
          setCode,
          quantity
        });
      } else {
        notParsedLines.push({ line, lineNumber: index + 1 });
      }
      return;
    }
    
    // Tenta outros formatos conhecidos
    // 1. "2 Card Name"
    // 2. "2x Card Name"
    match = line.match(/^(\d+)(?:x|\s+)(.+)$/);
    
    if (match) {
      const quantity = parseInt(match[1]);
      const cardName = match[2].trim();
      
      // Verificar se cardName não está vazio ou indefinido
      if (cardName && cardName !== 'undefined') {
        cards.push({
          cardName,
          quantity
        });
      } else {
        notParsedLines.push({ line, lineNumber: index + 1 });
      }
      return;
    }
    
    // Tenta o formato "Card Name (SET) 2" ou "Card Name 2"
    match = line.match(/^(.+?)(?:\s*\([A-Z0-9]{3,4}\))?\s+(\d+)$/);
    
    if (match) {
      const cardName = match[1].trim();
      const quantity = parseInt(match[2]);
      
      // Verificar se cardName não está vazio ou indefinido
      if (cardName && cardName !== 'undefined') {
        cards.push({
          cardName,
          quantity
        });
      } else {
        notParsedLines.push({ line, lineNumber: index + 1 });
      }
      return;
    }
    
    // Tenta o formato "Card Name #2"
    match = line.match(/^(.+?)\s+#(\d+)$/);
    
    if (match) {
      const cardName = match[1].trim();
      const quantity = parseInt(match[2]);
      
      // Verificar se cardName não está vazio ou indefinido
      if (cardName && cardName !== 'undefined') {
        cards.push({
          cardName,
          quantity
        });
      } else {
        notParsedLines.push({ line, lineNumber: index + 1 });
      }
      return;
    }
    
    // Se chegou até aqui, não conseguiu parsear a linha
    notParsedLines.push({ line, lineNumber: index + 1 });
  });
  
  // Se houver linhas não parseadas e a quantidade for maior que 5, mostrar alerta
  if (notParsedLines.length > 0) {
    let errorMessage = `Não foi possível interpretar ${notParsedLines.length} linha(s) do seu deck.\n`;
    
    // Mostrar até 5 linhas com problemas
    const linesToShow = notParsedLines.slice(0, 5);
    errorMessage += linesToShow.map(item => `Linha ${item.lineNumber}: "${item.line}"`).join('\n');
    
    if (notParsedLines.length > 5) {
      errorMessage += `\n... e mais ${notParsedLines.length - 5} linha(s).`;
    }
    
    alert(errorMessage + '\n\nCertifique-se de que cada linha siga o formato: "QUANTIDADE NOME DO CARD"');
    
    // Se mais de 50% das linhas não foram parseadas, considerar falha
    if (notParsedLines.length > lines.filter(l => l.trim()).length * 0.5) {
      throw new Error('Formato de deck inválido. A maioria das linhas não pôde ser interpretada.');
    }
  }
  
  return {
    name: deckName.value,
    cards
  };
}

// Calcular o total de cards em formato mais legível
const getTotalCardQuantity = (cards) => {
  return cards.reduce((total, card) => total + (card.quantity || 1), 0);
};

// Mostra as informações de quantidade de cards nas abas
const availableCardsTabHeader = computed(() => {
  if (!validationResult.value) return 'Cards Disponíveis';
  
  const count = getTotalCardQuantity(validationResult.value.arenaCompatibility.cardsInArena);
  const uniqueCount = validationResult.value.arenaCompatibility.cardsInArena.length;
  
  return `Cards Disponíveis (${count} cards / ${uniqueCount} únicos)`;
});

const unavailableCardsTabHeader = computed(() => {
  if (!validationResult.value) return 'Cards Indisponíveis';
  
  const count = getTotalCardQuantity(validationResult.value.arenaCompatibility.cardsNotInArena);
  const uniqueCount = validationResult.value.arenaCompatibility.cardsNotInArena.length;
  
  return `Cards Indisponíveis (${count} cards / ${uniqueCount} únicos)`;
});

// Validar o deck para MTG Arena
async function validateDeckForArena() {
  loading.value = true;
  validationResult.value = null;
  errorMessage.value = null;
  
  try {
    // Verificar se o deck está vazio
    if (!deckText.value.trim()) {
      errorMessage.value = 'Por favor, insira um deck para validar.';
      loading.value = false;
      return;
    }
    
    const deckData = parseDeckText();
    
    // Verificar se há pelo menos um card para validar
    if (!deckData.cards || deckData.cards.length === 0) {
      errorMessage.value = 'Nenhum card válido encontrado. Verifique o formato do seu deck.';
      loading.value = false;
      return;
    }
    
    // Verificar se o serviço está carregado
    const statusResponse = await fetch(`${backendUrl}/api/cards/status`);
    const statusData = await statusResponse.json();
    
    if (!statusData.cardsLoaded) {
      // Se os cards não estiverem carregados, tentar carregá-los
      // Usamos GET em vez de POST porque o endpoint está configurado como GET
      await fetch(`${backendUrl}/api/cards/load`);
    }
    
    console.log('Enviando deck para validação:', deckData);
    
    // Realizar a validação com o backend
    const response = await fetch(`${backendUrl}/api/decks/validate-arena`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deckData)
    });
    
    if (!response.ok) {
      throw new Error(`Erro no servidor: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      errorMessage.value = result.message || 'Erro ao validar o deck. Por favor, tente novamente.';
      loading.value = false;
      return;
    }
    
    validationResult.value = result;
  } catch (error) {
    console.error('Erro ao validar deck:', error);
    errorMessage.value = error.message || 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.';
  } finally {
    loading.value = false;
  }
}

// Limpar o deck
function clearDeck() {
  deckText.value = '';
  deckName.value = 'Meu Deck';
  validationResult.value = null;
  errorMessage.value = null;
}
</script>

<style scoped>
.deck-validator-view {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  color: white;
}

h1 {
  font-size: 2.2rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.deck-input-container, .results-container, .error-container {
  max-width: 900px;
  margin: 0 auto 2rem;
}

.error-container {
  margin-top: 1rem;
}

.error-message {
  white-space: pre-line;
}

.card-title {
  font-size: 1.4rem;
  font-weight: bold;
}

.input-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-option {
  margin-bottom: 10px;
}

h3 {
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.deck-textarea {
  width: 100%;
  font-family: monospace;
}

.example-btn-wrapper {
  margin-top: 5px;
  text-align: right;
}

.deck-file-upload {
  margin-bottom: 10px;
}

.deck-name-container {
  margin: 20px 0;
  display: flex;
  align-items: center;
}

.deck-name-label {
  margin-right: 10px;
  font-weight: bold;
}

.deck-name-input {
  width: 250px;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.validate-button {
  flex: 2;
  margin-right: 10px;
}

.clear-button {
  flex: 1;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.compatibility-summary {
  display: flex;
  align-items: center;
  gap: 30px;
  margin: 20px 0;
}

.compatibility-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: conic-gradient(
    var(--primary-color) 0%,
    var(--primary-color) var(--percentage),
    rgba(50, 50, 50, 0.8) var(--percentage),
    rgba(50, 50, 50, 0.8) 100%
  );
}

.score-circle::before {
  content: '';
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--surface-ground);
}

.score-circle span {
  position: relative;
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
}

.score-label {
  margin-top: 10px;
  font-weight: bold;
}

.compatibility-stats {
  flex: 1;
}

.stat-item {
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.cards-lists {
  margin-top: 20px;
}

/* Responsividade */
@media (max-width: 768px) {
  .compatibility-summary {
    flex-direction: column;
    gap: 15px;
  }
  
  .input-options {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .validate-button, .clear-button {
    width: 100%;
    margin-right: 0;
  }
}
</style> 