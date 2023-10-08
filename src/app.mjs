import express from "express";
import connectDB from "./config/db.mjs";
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
import dotenv from "dotenv";
import quizzRoutes from "./routes/quizzRoutes.mjs";
import followRoutes from "./routes/followsRoutes.mjs";

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Swaggers CONFIG

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
  apis: ["./src/routes/*.mjs", "./src/controllers/*.mjs"], // Changed the file extension to .mjs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// CORS
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",")
  : [];

app.use( cors()
  // cors({
  //   origin: (origin, callback) => {
  //     if (
  //       !origin ||
  //       allowedOrigins.indexOf(origin) !== -1 ||
  //       (origin.startsWith("https://web-") &&
  //         origin.includes("-leon-art.vercel.app"))
  //     ) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error("Not allowed by CORS"));
  //     }
  //   },
  // })
);

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
app.use("/api", followRoutes);
app.use('/api/artists', artistRoutes);



// AdminJS CONFIG
const admin = new AdminJS(adminOptions);
const router = AdminJSExpress.buildRouter(admin);

app.use(
  expressSession({
    secret: "some-secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(admin.options.rootPath, router);

export default app; // Changed this line to use ES module export syntax
