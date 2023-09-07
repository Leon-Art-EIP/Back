const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require('./routes/user');
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const cors = require("cors");
const AdminJS = require('adminjs');
const buildAdminRouter = require('@adminjs/express');
const adminOptions = require('./admin/admin');

const app = express();

// load the environment variables from .env
require("dotenv").config();

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
    },
    apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// CORS

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow no origin (e.g. same origin requests) or if the origin is in the allowedOrigins list
            if (!origin || allowedOrigins.indexOf(origin) !== -1 || (origin.startsWith('https://web-') && origin.includes('-leon-art.vercel.app'))) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    })
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
app.use('/api', userRoutes);

// AdminJS CONFIG

const admin = new AdminJS(adminOptions);
const router = buildAdminRouter(admin);

app.use(expressSession({ secret: 'some-secret', resave: false, saveUninitialized: true }));
app.use(admin.options.rootPath, router);

module.exports = app; // Export the app
 