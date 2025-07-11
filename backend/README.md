# Backend Mana VAI

Backend para a aplicação Mana VAI, fornecendo API para consulta de cards e validação de decks.

## Estrutura do Projeto

```
backend/
  ├── src/
  │   ├── app.js              # Configuração do Express
  │   ├── routes/             # Rotas da API
  │   ├── services/           # Lógica de negócio
  │   └── middleware/         # Middlewares
  ├── server.js               # Ponto de entrada
  ├── analyze-json.js         # Utilitário para analisar o arquivo JSON
  └── default-cards-*.json    # Banco de dados de cards (grande arquivo JSON)
```

## Requisitos

- Node.js 14+
- NPM 6+

## Instalação

```bash
# Instalar dependências
npm install
```

## Configuração

O arquivo de cards deve estar na pasta raiz do backend com o nome `default-cards-XXXXXXXX.json`. Este arquivo é muito grande e contém todos os cards disponíveis.

## Executando o Servidor

```bash
# Modo de desenvolvimento
npm run dev

# Modo de produção
npm start
```

## Endpoints da API

### Cards

- `GET /api/cards/status` - Verifica o status do serviço de cards
- `GET /api/cards/load` - Carrega os cards na memória
- `GET /api/cards` - Lista cards com paginação
- `GET /api/cards/search?name=:name` - Busca cards por nome
- `GET /api/cards/:id` - Obtém detalhes de um card específico
- `GET /api/cards/stats/summary` - Obtém estatísticas sobre os cards

### Decks

- `POST /api/decks/validate` - Valida um deck
- `POST /api/decks/validate/:format` - Valida um deck em um formato específico

## Formato de Dados

### Deck para Validação

```json
{
  "name": "Nome do Deck",
  "cards": [
    {
      "id": "card_id_1",
      "quantity": 4
    },
    {
      "id": "card_id_2",
      "quantity": 2
    }
  ],
  "isCommander": false
}
```

## Limitações

- O banco de cards é grande (~472MB) e será carregado na memória ao iniciar o servidor
- A lista de cards banidos em Commander é simplificada e pode não estar completa 