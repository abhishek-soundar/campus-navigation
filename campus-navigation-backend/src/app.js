// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const routes = require('./routes');
const authRoutes = require('./routes/auth');   // ✅ add this

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ✅ Root route for health check and favicon (to stop 404 spam)
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Campus Navigation API is live', uptime: process.uptime() });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routes
app.use('/', routes);
app.use('/api/auth', authRoutes);   // ✅ mount auth

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;
