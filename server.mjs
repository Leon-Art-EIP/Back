import app, { httpServer } from './src/app.mjs';
import connectDB from "./src/config/db.mjs";

// Connectez la base de données
connectDB();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`)); // Utilisez httpServer.listen()
