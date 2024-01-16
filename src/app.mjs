import dotenv from "dotenv";
import { initializeStripe } from "./controllers/order/orderController.mjs";

dotenv.config();

import express from "express";
import http from 'http';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
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
import notificationRoutes from "./routes/notificationRoutes.mjs";
import uploadRoutes from "./routes/uploadRoutes.mjs";
import explorerRoutes from './routes/explorerRoutes.mjs';
import orderRoutes from './routes/orderRoutes.mjs';
import chatsRoutes from "./controllers/chat/chats.mjs";
import Message from "./models/messageModel.mjs";
import conditionRoute from "./routes/conditionsRoutes.mjs";
import {handleStripeWebhook} from "./controllers/order/orderController.mjs"
import stripeRoutes from './routes/stripeRoutes.mjs';


initializeStripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const httpServer = http.createServer(app);

// Configuration de socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

global.onlineUsers = new Map();
io.on("connection", (socket) => /* istanbul ignore next */ {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      const message = new Message({
        id: data.convId,
        senderId: data.from,
        contentType: "text",
        content: data.msg,
        dateTime: new Date().toISOString()
    });
      socket.to(sendUserSocket).emit("msg-recieve", message);
    }
  });
});

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
  apis: ["./src/routes/*.mjs", "./src/controllers/*.mjs", "./src/controllers/chat/*.mjs"], // Changed the file extension to .mjs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

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

// webhooks :

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     description: Endpoint for handling Stripe webhook events.
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *     responses:
 *       200:
 *         description: Webhook event received and processed successfully.
 *       400:
 *         description: Bad request, invalid webhook event.
 *       500:
 *         description: Server error.
 */
app.post('/webhooks/stripe', bodyParser.raw({type: 'application/json'}), handleStripeWebhook);


app.use('/api/chats', chatsRoutes);

// AdminJS CONFIG
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const admin = new AdminJS(adminOptions);
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
  authenticate: async (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return { email: ADMIN_EMAIL };
    }
    return false;
  },
  cookieName: 'adminjs',
  cookiePassword: 'super-secret-and-long-cookie-password',
});

app.use(
  expressSession({
    secret: "some-secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(admin.options.rootPath, adminRouter);






export default app; // Export app
export { httpServer }; // Exportez httpServer pour le démarrage
