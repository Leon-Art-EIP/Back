import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import http from 'http';
import bodyParser from 'body-parser';
import { Server, Socket } from 'socket.io';
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import collectionRoutes from "./routes/collectionRoutes";
import artPublicationRoutes from './routes/artPublicationRoutes';
import artistRoutes from "./routes/artistRoutes";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import cors from "cors";
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import expressSession from "express-session";
import quizzRoutes from "./routes/quizzRoutes";
import followRoutes from "./routes/followsRoutes";
import articleRoutes from "./routes/articleRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import explorerRoutes from './routes/explorerRoutes';
import orderRoutes from './routes/orderRoutes';
import chatsRoutes from "./controllers/chat/chats";
import Message from "./models/messageModel";
import conditionRoute from "./routes/conditionsRoutes";
import { handleStripeWebhook } from "./controllers/stripe/stripeController";
import stripeRoutes from './routes/stripeRoutes';
import foryouRoutes from './routes/foryouRoutes';

declare global {
    var onlineUsers: Map<string, string>;
    var chatSocket: Socket;
  }
  
globalThis.onlineUsers = new Map<string, string>();

const app: Express = express();
const httpServer = http.createServer(app);

// Configuration de socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

global.onlineUsers = new Map<string, string>();
io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId: string) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data: any) => {
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
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/controllers/chat/*.ts"], // Changed the file extension to .ts
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors());

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { explorer: true })
);

// webhooks :

app.post('/webhooks/stripe', bodyParser.raw({type: 'application/json'}), handleStripeWebhook);

// Init Middleware
app.use(express.json());

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

// AdminJS CONFIG
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const admin = new AdminJS(adminOptions);
const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email: string, password: string) => {
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
