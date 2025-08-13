import { emailService } from './emailService.js';
import { alertService } from './alertService.js';
import { forecastService } from './forecastService.js';
import { dbHelpers } from '../config/database.js';

class ScheduledUpdateService {
  constructor() {
    this.intervals = new Map();
    this.isRunning = false;
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@yourcompany.com';
  }

  start() {
    if (this.isRunning) {
      console.log('[SCHEDULER] Already running');
      return;
    }

    console.log('[SCHEDULER] 🕐 Starting scheduled update service...');
    this.isRunning = true;

    // Schedule different types of updates
    this.scheduleHourlyAlertCheck();
    this.scheduleDailyInventoryReport();
    this.scheduleWeeklyForecastUpdate();
    this.scheduleSystemHealthCheck();

    console.log('[SCHEDULER] ✅ All scheduled tasks initialized');
  }

  stop() {
    if (!this.isRunning) {
      console.log('[SCHEDULER] Not running');
      return;
    }

    console.log('[SCHEDULER] 🛑 Stopping scheduled update service...');
    
    // Clear all intervals
    for (const [name, intervalId] of this.intervals) {
      clearInterval(intervalId);
      console.log(`[SCHEDULER] Stopped ${name}`);
    }
    
    this.intervals.clear();
    this.isRunning = false;
  }

  scheduleHourlyAlertCheck() {
    const intervalId = setInterval(async () => {
      try {
        console.log('[SCHEDULER] 🔍 Running hourly alert check...');
        await this.runAlertCheck();
      } catch (error) {
        console.error('[SCHEDULER] Hourly alert check failed:', error);
      }
    }, 60 * 60 * 1000); // Every hour

    this.intervals.set('hourlyAlertCheck', intervalId);
    console.log('[SCHEDULER] ⏰ Scheduled hourly alert checks');
  }

  scheduleDailyInventoryReport() {
    // Run at 8 AM daily
    const dailyInterval = setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 8 && now.getMinutes() === 0) {
        try {
          console.log('[SCHEDULER] 📊 Generating daily inventory report...');
          await this.sendDailyInventoryReport();
        } catch (error) {
          console.error('[SCHEDULER] Daily inventory report failed:', error);
        }
      }
    }, 60 * 1000); // Check every minute

    this.intervals.set('dailyInventoryReport', dailyInterval);
    console.log('[SCHEDULER] 📅 Scheduled daily inventory reports (8 AM)');
  }

  scheduleWeeklyForecastUpdate() {
    // Run on Monday at 9 AM
    const weeklyInterval = setInterval(async () => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() === 0) {
        try {
          console.log('[SCHEDULER] 📈 Generating weekly forecast update...');
          await this.sendWeeklyForecastUpdate();
        } catch (error) {
          console.error('[SCHEDULER] Weekly forecast update failed:', error);
        }
      }
    }, 60 * 1000); // Check every minute

    this.intervals.set('weeklyForecastUpdate', weeklyInterval);
    console.log('[SCHEDULER] 📈 Scheduled weekly forecast updates (Monday 9 AM)');
  }

  scheduleSystemHealthCheck() {
    const healthInterval = setInterval(async () => {
      try {
        console.log('[SCHEDULER] 🏥 Running system health check...');
        await this.runSystemHealthCheck();
      } catch (error) {
        console.error('[SCHEDULER] System health check failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours

    this.intervals.set('systemHealthCheck', healthInterval);
    console.log('[SCHEDULER] 🏥 Scheduled system health checks (every 6 hours)');
  }

  async runAlertCheck() {
    try {
      const alerts = await alertService.checkInventoryLevels();
      
      if (alerts.length > 0) {
        console.log(`[SCHEDULER] Found ${alerts.length} new alerts`);
        
        // Group alerts by type
        const lowStockAlerts = alerts.filter(a => a.alert_type === 'low_stock');
        const highDemandAlerts = alerts.filter(a => a.alert_type === 'high_demand');
        
        // Send specific alert types
        if (lowStockAlerts.length > 0) {
          const products = await Promise.all(
            lowStockAlerts.map(alert => dbHelpers.getProductById(alert.product_id))
          );
          await emailService.sendLowStockAlert(this.adminEmail, products.filter(p => p));
        }
        
        if (highDemandAlerts.length > 0) {
          const products = await Promise.all(
            highDemandAlerts.map(async alert => {
              const product = await dbHelpers.getProductById(alert.product_id);
              if (product) {
                const forecasts = await dbHelpers.getForecastsByProduct(product.id, 7);
                const avgDemand = forecasts.length > 0 
                  ? forecasts.reduce((sum, f) => sum + f.predicted_demand, 0) / forecasts.length 
                  : 0;
                return {
                  ...product,
                  predictedDemand: avgDemand,
                  currentStock: product.current_stock
                };
              }
              return null;
            })
          );
          await emailService.sendHighDemandNotification(this.adminEmail, products.filter(p => p));
        }
      }
      
      return { alertsGenerated: alerts.length, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('[SCHEDULER] Alert check failed:', error);
      throw error;
    }
  }

  async sendDailyInventoryReport() {
    try {
      const products = await dbHelpers.getProducts(1000);
      const alerts = await dbHelpers.getAlerts(null, 1000);
      
      const reportData = {
        totalProducts: products.length,
        lowStockCount: products.filter(p => p.current_stock <= p.min_stock_level).length,
        overstockCount: products.filter(p => p.current_stock >= p.max_stock_level).length,
        totalValue: products.reduce((sum, p) => sum + (p.current_stock * p.unit_price), 0),
        topProducts: await this.getTopMovingProducts()
      };
      
      await emailService.sendDailyInventoryReport(this.adminEmail, reportData);
      console.log('[SCHEDULER] ✅ Daily inventory report sent');
      
    } catch (error) {
      console.error('[SCHEDULER] Failed to send daily inventory report:', error);
      throw error;
    }
  }

  async sendWeeklyForecastUpdate() {
    try {
      const products = await dbHelpers.getProducts(50); // Top 50 products
      const forecastData = {
        weeklyPredictions: [],
        recommendations: []
      };
      
      for (const product of products.slice(0, 10)) { // Top 10 for email
        const forecasts = await dbHelpers.getForecastsByProduct(product.id, 7);
        if (forecasts.length > 0) {
          const avgDemand = forecasts.reduce((sum, f) => sum + f.predicted_demand, 0) / forecasts.length;
          const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence_score, 0) / forecasts.length;
          
          forecastData.weeklyPredictions.push({
            productName: product.name,
            predictedDemand: Math.round(avgDemand),
            confidence: avgConfidence
          });
        }
      }
      
      // Generate recommendations
      forecastData.recommendations = [
        'Review stock levels for high-demand products',
        'Consider bulk purchasing for consistently demanded items',
        'Monitor seasonal trends for better forecasting'
      ];
      
      await emailService.sendWeeklyForecastUpdate(this.adminEmail, forecastData);
      console.log('[SCHEDULER] ✅ Weekly forecast update sent');
      
    } catch (error) {
      console.error('[SCHEDULER] Failed to send weekly forecast update:', error);
      throw error;
    }
  }

  async runSystemHealthCheck() {
    try {
      const healthData = {
        uptime: this.getUptime(),
        dbStatus: 'Connected',
        alertsCount: (await dbHelpers.getAlerts(false, 100)).length,
        lastBackup: new Date().toLocaleDateString(),
        systemLoad: 'Normal'
      };
      
      // Send weekly system health report (only on Sundays)
      const now = new Date();
      if (now.getDay() === 0) { // Sunday
        await emailService.sendSystemHealthUpdate(this.adminEmail, healthData);
        console.log('[SCHEDULER] ✅ Weekly system health report sent');
      }
      
      console.log('[SCHEDULER] System health check completed');
      
    } catch (error) {
      console.error('[SCHEDULER] System health check failed:', error);
      throw error;
    }
  }

  async getTopMovingProducts() {
    try {
      const salesData = await dbHelpers.getSalesData(null, 100);
      const productSales = new Map();
      
      salesData.forEach(sale => {
        const productId = sale.product_id;
        const current = productSales.get(productId) || { quantity: 0, name: '' };
        productSales.set(productId, {
          quantity: current.quantity + sale.quantity_sold,
          name: sale.products?.name || 'Unknown Product'
        });
      });
      
      return Array.from(productSales.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          soldQuantity: data.quantity
        }))
        .sort((a, b) => b.soldQuantity - a.soldQuantity)
        .slice(0, 5);
        
    } catch (error) {
      console.error('[SCHEDULER] Failed to get top moving products:', error);
      return [];
    }
  }

  getUptime() {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  // Manual trigger methods for testing
  async triggerDailyReport() {
    console.log('[SCHEDULER] 🔄 Manually triggering daily report...');
    await this.sendDailyInventoryReport();
  }

  async triggerWeeklyForecast() {
    console.log('[SCHEDULER] 🔄 Manually triggering weekly forecast...');
    await this.sendWeeklyForecastUpdate();
  }

  async triggerAlertCheck() {
    console.log('[SCHEDULER] 🔄 Manually triggering alert check...');
    return await this.runAlertCheck();
  }
}

export const scheduledUpdateService = new ScheduledUpdateService();
