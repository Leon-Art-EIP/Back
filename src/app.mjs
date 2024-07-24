import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from 'http';
import bodyParser from 'body-parser';
import authRoutes from "./routes/authRoutes.mjs";
import userRoutes from "./routes/userRoutes.mjs";
import collectionRoutes from "./routes/collectionRoutes.mjs";
import artPublicationRoutes from './routes/artPublicationRoutes.mjs';
import artistRoutes from "./routes/artistRoutes.mjs";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import cors from "cors";
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import adminOptions from "./admin/admin.mjs";
import expressSession from "express-session";
import quizzRoutes from "./routes/quizzRoutes.mjs";
import followRoutes from "./routes/followsRoutes.mjs";
import articleRoutes from "./routes/articleRoutes.mjs";
import locationRoutes from "./routes/locationRoutes.mjs";
import mapRoutes from "./routes/mapRoutes.mjs";
import notificationRoutes from "./routes/notificationRoutes.mjs";
import uploadRoutes from "./routes/uploadRoutes.mjs";
import explorerRoutes from './routes/explorerRoutes.mjs';
import orderRoutes from './routes/orderRoutes.mjs';
import chatsRoutes from "./routes/chatRoutes.mjs";
import conditionRoute from "./routes/conditionsRoutes.mjs";
import { handleStripeWebhook } from "./controllers/stripe/stripeController.mjs"
import stripeRoutes from './routes/stripeRoutes.mjs';
import foryouRoutes from './routes/foryouRoutes.mjs';
import postRoutes from './routes/postRoutes.mjs';
import convertImageRoutes from './routes/convertImageRoutes.mjs';
import SocketManager from "./utils/socketManager.mjs";
import logger from './admin/logger.mjs';
import signalmentRoutes from './routes/signalmentRoutes.mjs';

const app = express();
const httpServer = http.createServer(app);

export const socketManager = new SocketManager(httpServer);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "LeonArt API",
      version: "1.0.0",
      description: "API documentation for the LeonArt project",
      contact: {
        name: "LeonArt Team",
        email: "leonarteip@epitechfr.onmicrosoft.com",
      },
      servers: [
        {
          url: "http://localhost:5000/api",
          description: "Development server",
        },
      ],
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.mjs", "./src/controllers/*.mjs", "./src/controllers/chat/*.mjs"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

// webhooks
app.post('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), handleStripeWebhook);

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/quizz", quizzRoutes);
app.use('/api/art-publication', artPublicationRoutes);
app.use('/api/collection', collectionRoutes);
app.use("/api/follow", followRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/article', articleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/conditions', conditionRoute);
app.use('/api/order', orderRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/conversations', chatsRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/foryou', foryouRoutes);
app.use('/api/', convertImageRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/map", mapRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/signalments', signalmentRoutes);



// AdminJS CONFIG
// const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
// const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// const admin = new AdminJS(adminOptions);
// const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
//   authenticate: async (email, password) => {
//     if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
//       return { email: ADMIN_EMAIL };
//     }
//     return false;
//   },
//   cookieName: 'adminjs',
//   cookiePassword: 'super-secret-and-long-cookie-password',
// });

// app.use(
//   expressSession({
//     secret: "some-secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );

// app.use(admin.options.rootPath, adminRouter);

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;
export { httpServer };
