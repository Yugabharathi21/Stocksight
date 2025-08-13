import { dbHelpers } from '../config/database.js';

export const alertsController = {
  // Get all alerts
  async getAlerts(req, res) {
    try {
      const { isRead, limit = 50, type } = req.query;
      
      console.debug('[DEBUG] Getting alerts:', { isRead, limit, type });

      let alerts = await dbHelpers.getAlerts(
        isRead !== undefined ? isRead === 'true' : null, 
        parseInt(limit)
      );

      // Filter by alert type if provided
      if (type) {
        alerts = alerts.filter(alert => alert.alert_type === type);
      }

      res.json({
        success: true,
        alerts,
        count: alerts.length
      });

    } catch (error) {
      console.error('[ERROR] Get alerts error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch alerts', 
        details: error.message 
      });
    }
  },

  // Mark alert as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      console.debug('[DEBUG] Marking alert as read:', id);

      const updatedAlert = await dbHelpers.markAlertAsRead(id);

      res.json({
        success: true,
        message: 'Alert marked as read',
        alert: updatedAlert
      });

    } catch (error) {
      console.error('[ERROR] Mark alert as read error:', error);
      res.status(500).json({ 
        error: 'Failed to mark alert as read', 
        details: error.message 
      });
    }
  },

  // Create manual alert (Admin only)
  async createAlert(req, res) {
    try {
      const { productId, alertType, message } = req.body;
      
      console.debug('[DEBUG] Creating manual alert:', { productId, alertType });

      // Validation
      if (!productId || !alertType || !message) {
        return res.status(400).json({ 
          error: 'Product ID, alert type, and message are required' 
        });
      }

      if (!['low_stock', 'overstock', 'high_demand'].includes(alertType)) {
        return res.status(400).json({ 
          error: 'Invalid alert type. Must be: low_stock, overstock, or high_demand' 
        });
      }

      const alertData = {
        product_id: productId,
        alert_type: alertType,
        message: message.trim()
      };

      const newAlert = await dbHelpers.createAlert(alertData);

      console.debug('[DEBUG] Alert created successfully:', newAlert.id);

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        alert: newAlert
      });

    } catch (error) {
      console.error('[ERROR] Create alert error:', error);
      res.status(500).json({ 
        error: 'Failed to create alert', 
        details: error.message 
      });
    }
  },

  // Get alert statistics
  async getAlertStats(req, res) {
    try {
      console.debug('[DEBUG] Getting alert statistics');

      const allAlerts = await dbHelpers.getAlerts(null, 1000);
      
      const stats = {
        total: allAlerts.length,
        unread: allAlerts.filter(alert => !alert.is_read).length,
        byType: {
          low_stock: allAlerts.filter(alert => alert.alert_type === 'low_stock').length,
          overstock: allAlerts.filter(alert => alert.alert_type === 'overstock').length,
          high_demand: allAlerts.filter(alert => alert.alert_type === 'high_demand').length
        },
        recent: allAlerts.slice(0, 5) // Last 5 alerts
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('[ERROR] Get alert stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch alert statistics', 
        details: error.message 
      });
    }
  },

  // Bulk mark alerts as read
  async bulkMarkAsRead(req, res) {
    try {
      const { alertIds } = req.body;
      
      console.debug('[DEBUG] Bulk marking alerts as read:', alertIds);

      if (!Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({ 
          error: 'Alert IDs array is required' 
        });
      }

      const updatedAlerts = [];
      for (const alertId of alertIds) {
        try {
          const updatedAlert = await dbHelpers.markAlertAsRead(alertId);
          updatedAlerts.push(updatedAlert);
        } catch (error) {
          console.error(`[ERROR] Failed to mark alert ${alertId} as read:`, error);
        }
      }

      res.json({
        success: true,
        message: `${updatedAlerts.length} alerts marked as read`,
        updatedAlerts
      });

    } catch (error) {
      console.error('[ERROR] Bulk mark as read error:', error);
      res.status(500).json({ 
        error: 'Failed to bulk update alerts', 
        details: error.message 
      });
    }
  }
};
