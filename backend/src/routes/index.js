const express = require('express');
const router = express.Router();

const taskRoutes = require('./taskRoutes');
const timerRoutes = require('./timerRoutes');
const categoryRoutes = require('./categoryRoutes');
const tagRoutes = require('./tagRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reviewRoutes = require('./reviewRoutes');
const settingsRoutes = require('./settingsRoutes');
const exportRoutes = require('./exportRoutes');

router.use('/tasks', taskRoutes);
router.use('/timer', timerRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reviews', reviewRoutes);
router.use('/settings', settingsRoutes);
router.use('/export', exportRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
