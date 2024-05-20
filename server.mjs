import app, { httpServer } from './src/app.mjs';

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`)); // Utilisez httpServer.listen()
