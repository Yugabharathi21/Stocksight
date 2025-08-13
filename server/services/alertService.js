import { dbHelpers } from '../config/database.js';
import { emailService } from './emailService.js';

class AlertService {
  constructor() {
    this.alertThresholds = {
      low_stock: 0.8, // Alert when stock is 80% below min level
      overstock: 1.2, // Alert when stock is 120% above max level
      high_demand: 1.5 // Alert when predicted demand exceeds 150% of average
    };
  }

  async checkInventoryLevels() {
    try {
      console.debug('[ALERTS] Checking inventory levels...');
      
      const products = await dbHelpers.getProducts(1000); // Get all products
      const alerts = [];
      
      for (const product of products) {
        const productAlerts = await this.checkProductAlerts(product);
        alerts.push(...productAlerts);
      }
      
      console.debug(`[ALERTS] Generated ${alerts.length} alerts`);
      return alerts;
      
    } catch (error) {
      console.error('[ALERTS] Failed to check inventory levels:', error);
      throw error;
    }
  }

  async checkProductAlerts(product) {
    const alerts = [];
    
    try {
      // Check low stock
      if (product.current_stock <= product.min_stock_level * this.alertThresholds.low_stock) {
        alerts.push(await this.createAlert(product, 'low_stock', 
          `Low stock alert: ${product.name} is running low (${product.current_stock} remaining)`
        ));
      }
      
      // Check overstock
      if (product.current_stock >= product.max_stock_level * this.alertThresholds.overstock) {
        alerts.push(await this.createAlert(product, 'overstock',
          `Overstock alert: ${product.name} has excess inventory (${product.current_stock} in stock)`
        ));
      }
      
      // Check demand forecasts for high demand
      const forecasts = await dbHelpers.getForecastsByProduct(product.id, 7);
      if (forecasts && forecasts.length > 0) {
        const avgDemand = forecasts.reduce((sum, f) => sum + f.predicted_demand, 0) / forecasts.length;
        const salesData = await dbHelpers.getSalesData(product.id, 30);
        const avgSales = salesData.length > 0 
          ? salesData.reduce((sum, s) => sum + s.quantity_sold, 0) / salesData.length 
          : 0;
        
        if (avgDemand > avgSales * this.alertThresholds.high_demand) {
          alerts.push(await this.createAlert(product, 'high_demand',
            `High demand predicted for ${product.name} (predicted: ${Math.round(avgDemand)}/day)`
          ));
        }
      }
      
    } catch (error) {
      console.error(`[ALERTS] Failed to check alerts for product ${product.id}:`, error);
    }
    
    return alerts.filter(alert => alert !== null);
  }

  async createAlert(product, alertType, message) {
    try {
      // Check if similar alert already exists in the last 24 hours
      const existingAlerts = await dbHelpers.getAlerts(false, 10);
      const recentAlert = existingAlerts.find(alert => 
        alert.product_id === product.id && 
        alert.alert_type === alertType &&
        new Date(alert.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      
      if (recentAlert) {
        console.debug(`[ALERTS] Skipping duplicate alert for product ${product.id}`);
        return null;
      }
      
      const alertData = {
        product_id: product.id,
        alert_type: alertType,
        message: message
      };
      
      const alert = await dbHelpers.createAlert(alertData);
      console.debug(`[ALERTS] Created ${alertType} alert for product:`, product.name);
      
      return alert;
      
    } catch (error) {
      console.error('[ALERTS] Failed to create alert:', error);
      return null;
    }
  }

  async sendAlertEmails(alerts, recipients = []) {
    try {
      if (!alerts || alerts.length === 0) {
        console.debug('[ALERTS] No alerts to send');
        return [];
      }
      
      // Group alerts by type
      const alertsByType = alerts.reduce((acc, alert) => {
        if (!acc[alert.alert_type]) {
          acc[alert.alert_type] = [];
        }
        acc[alert.alert_type].push(alert);
        return acc;
      }, {});
      
      const results = [];
      
      // Send emails for each alert type
      for (const [alertType, typeAlerts] of Object.entries(alertsByType)) {
        const subject = this.getAlertSubject(alertType, typeAlerts.length);
        const message = this.formatAlertMessage(typeAlerts);
        
        if (recipients.length > 0) {
          const emailResults = await emailService.sendBulkAlerts(
            recipients, 
            subject, 
            message, 
            this.getEmailAlertType(alertType)
          );
          results.push(...emailResults);
        } else {
          console.debug('[ALERTS] No email recipients configured');
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('[ALERTS] Failed to send alert emails:', error);
      throw error;
    }
  }

  getAlertSubject(alertType, count) {
    const subjects = {
      low_stock: `Low Stock Alert${count > 1 ? 's' : ''} - ${count} product${count > 1 ? 's' : ''} need restocking`,
      overstock: `Overstock Alert${count > 1 ? 's' : ''} - ${count} product${count > 1 ? 's' : ''} have excess inventory`,
      high_demand: `High Demand Alert${count > 1 ? 's' : ''} - ${count} product${count > 1 ? 's' : ''} showing increased demand`
    };
    
    return subjects[alertType] || `Inventory Alert - ${count} notification${count > 1 ? 's' : ''}`;
  }

  formatAlertMessage(alerts) {
    let message = '<h3>Inventory Alerts</h3>\n<ul>\n';
    
    alerts.forEach(alert => {
      message += `<li><strong>${alert.products?.name || 'Unknown Product'}:</strong> ${alert.message}</li>\n`;
    });
    
    message += '</ul>\n';
    message += '<p>Please review your inventory levels and take appropriate action.</p>';
    
    return message;
  }

  getEmailAlertType(alertType) {
    const typeMapping = {
      low_stock: 'warning',
      overstock: 'info',
      high_demand: 'warning'
    };
    
    return typeMapping[alertType] || 'info';
  }

  async getUnreadAlerts(limit = 50) {
    try {
      return await dbHelpers.getAlerts(false, limit);
    } catch (error) {
      console.error('[ALERTS] Failed to get unread alerts:', error);
      throw error;
    }
  }

  async getAllAlerts(limit = 100) {
    try {
      return await dbHelpers.getAlerts(null, limit);
    } catch (error) {
      console.error('[ALERTS] Failed to get all alerts:', error);
      throw error;
    }
  }

  async markAlertAsRead(alertId) {
    try {
      return await dbHelpers.markAlertAsRead(alertId);
    } catch (error) {
      console.error('[ALERTS] Failed to mark alert as read:', error);
      throw error;
    }
  }

  async markAllAlertsAsRead() {
    try {
      const unreadAlerts = await this.getUnreadAlerts(1000);
      const results = [];
      
      for (const alert of unreadAlerts) {
        try {
          const result = await this.markAlertAsRead(alert.id);
          results.push({ id: alert.id, success: true });
        } catch (error) {
          results.push({ id: alert.id, success: false, error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      console.error('[ALERTS] Failed to mark all alerts as read:', error);
      throw error;
    }
  }

  // Scheduled job to run periodically
  async runAlertCheck() {
    try {
      console.log('[ALERTS] Running scheduled alert check...');
      
      const alerts = await this.checkInventoryLevels();
      
      if (alerts.length > 0) {
        // Get admin users for email notifications
        // For now, we'll skip email sending unless configured
        console.log(`[ALERTS] Found ${alerts.length} new alerts`);
      }
      
      return { alertsGenerated: alerts.length, timestamp: new Date().toISOString() };
      
    } catch (error) {
      console.error('[ALERTS] Scheduled alert check failed:', error);
      throw error;
    }
  }
}

export const alertService = new AlertService();
