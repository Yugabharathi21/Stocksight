import express from 'express';
import { productsController } from '../controllers/productsController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public/authenticated routes
router.get('/', authenticateToken, productsController.getProducts);
router.get('/low-stock', authenticateToken, productsController.getLowStockProducts);
router.get('/:id', authenticateToken, productsController.getProduct);
router.get('/:id/analytics', authenticateToken, productsController.getProductAnalytics);

// Admin only routes
router.post('/', authenticateToken, requireAdmin, productsController.createProduct);
router.put('/:id', authenticateToken, requireAdmin, productsController.updateProduct);

export default router;
