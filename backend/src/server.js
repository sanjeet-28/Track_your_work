require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend dev server
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    name: 'Work Tracker & Productivity Analytics API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Start listening if run directly
// if (require.main === module) {
//   app.listen(PORT, () => {
//     console.log(`🚀 Work Tracker API Server running on http://localhost:${PORT}`);
//     console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
//   });
// }

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Work Tracker API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
