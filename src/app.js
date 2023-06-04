const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();

// load the environment variables from .env 
require('dotenv').config();

// Connect Database
connectDB();

// Swaggers CONFIG

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'LeonArt API',
      version: '1.0.0',
      description: 'API documentation for the LeonArt project',
      contact: {
        name: 'LeonArt Team',
        email: 'leonarteip@epitechfr.onmicrosoft.com',
      },
      servers: [
        {
          url: 'http://localhost:5000/api',
          description: 'Development server',
        },
      ],
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));


// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', authRoutes);

module.exports = app; // Export the app
