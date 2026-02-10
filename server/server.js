const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.KONNECT_URL],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'KaSh Money Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      accounts: '/api/accounts',
      transactions: '/api/transactions',
      budgets: '/api/budgets',
      reports: '/api/reports'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 KaSh Money Management API is running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Konnect Service: ${process.env.KONNECT_URL}\n`);
});

module.exports = app;
