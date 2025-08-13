import express from 'express';
import { forecastController } from '../controllers/forecastController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.get('/product/:productId', authenticateToken, forecastController.getForecasts);
router.get('/product/:productId/accuracy', authenticateToken, forecastController.getForecastAccuracy);

// Admin only routes (forecasting operations)
router.post('/generate', authenticateToken, requireAdmin, forecastController.generateForecast);
router.post('/bulk-generate', authenticateToken, requireAdmin, forecastController.bulkGenerateForecasts);

export default router;
