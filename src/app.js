const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const app = express();

// load the environment variables from .env 
require('dotenv').config();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', authRoutes);

module.exports = app; // Export the app
