import express from 'express';
import { alertsController } from '../controllers/alertsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, alertsController.getAlerts);
router.get('/stats', authenticateToken, alertsController.getAlertStats);
router.put('/:id/read', authenticateToken, alertsController.markAsRead);
router.put('/bulk-read', authenticateToken, alertsController.bulkMarkAsRead);

// Admin only routes
router.post('/', authenticateToken, requireAdmin, alertsController.createAlert);

export default router;
