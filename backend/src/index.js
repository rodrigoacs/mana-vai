import cardRoutes from './routes/cardRoutes.js';
import deckRoutes from './routes/deckRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';

app.use('/api/cards', cardRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/tournaments', tournamentRoutes); 