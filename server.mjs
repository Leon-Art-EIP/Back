import './envSetup.mjs';
import app, { httpServer } from './src/app.mjs';
import logger from './src/admin/logger.mjs';

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => logger.info(`Server started on port ${PORT}`));
