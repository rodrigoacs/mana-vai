import express from 'express'
import cors from 'cors'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import cardRoutes from './routes/cardRoutes.js'
import deckRoutes from './routes/deckRoutes.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Rotas
app.get('/', (req, res) => {
  res.json({
    message: 'Mana VAI API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  })
})

// Rotas para os cards
app.use('/api/cards', cardRoutes)

// Rotas para decks
app.use('/api/decks', deckRoutes)

// Middleware para tratar rotas não encontradas
app.use(notFound)

// Middleware para tratar erros
app.use(errorHandler)

export default app 