import app from './src/app.js'
import * as cardService from './src/services/cardService.js'

const PORT = process.env.PORT || 3000

// Inicialização do servidor
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  
  // Tentar carregar os cards automaticamente na inicialização
  console.log('Tentando carregar os cards...')
  try {
    const result = await cardService.loadCards()
    if (result.success) {
      console.log(`Cards carregados com sucesso! Total: ${result.count}`)
    } else {
      console.error('Falha ao carregar os cards:', result.message)
    }
  } catch (error) {
    console.error('Erro ao carregar os cards:', error)
  }
})

// Mostrar mensagem de encerramento
process.on('SIGINT', () => {
  console.log('Servidor está sendo encerrado...')
  process.exit(0)
}) 