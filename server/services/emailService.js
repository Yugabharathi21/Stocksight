import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/sendmail';
    this.useN8nWebhook = process.env.USE_N8N_WEBHOOK === 'true' || true; // Default to true for n8n integration
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      if (this.useN8nWebhook) {
        console.log('[EMAIL] ✅ Using n8n webhook for email automation:', this.n8nWebhookUrl);
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify connection
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.verify();
        console.log('[EMAIL] ✅ Email service initialized successfully');
      } else {
        console.log('[EMAIL] ⚠️  Email credentials not configured - email features disabled');
      }
    } catch (error) {
      console.error('[EMAIL] Failed to initialize email service:', error.message);
      this.transporter = null;
    }
  }

  async sendAlert(to, subject, message, alertType = 'info') {
    try {
      if (this.useN8nWebhook) {
        return await this.sendViaWebhook(to, subject, message, alertType);
      }

      if (!this.transporter) {
        console.log('[EMAIL] Email service not configured - simulating email send');
        return { success: true, simulated: true };
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject: `[Stocksight Alert] ${subject}`,
        html: this.generateAlertHTML(message, alertType),
        text: message
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('[EMAIL] Alert sent successfully:', result.messageId);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('[EMAIL] Failed to send alert:', error);
      throw error;
    }
  }

  async sendViaWebhook(toMail, subject, content, alertType = 'info') {
    try {
      const webhookPayload = {
        toMail: toMail,
        Subject: `[Stocksight Alert] ${subject}`,
        content: this.generateAlertHTML(content, alertType)
      };

      console.debug('[EMAIL] Sending via n8n webhook:', { toMail, subject });

      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[EMAIL] ✅ Alert sent via n8n webhook successfully');
      
      return { 
        success: true, 
        webhookResponse: result,
        method: 'n8n_webhook',
        recipient: toMail
      };

    } catch (error) {
      console.error('[EMAIL] Failed to send via n8n webhook:', error);
      throw error;
    }
  }

  generateAlertHTML(message, alertType) {
    const colors = {
      info: '#3B82F6',
      warning: '#F59E0B', 
      error: '#EF4444',
      success: '#10B981'
    };

    const color = colors[alertType] || colors.info;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Stocksight Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Stocksight Alert</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px;">
              ${message}
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                 style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666;">
            <p style="margin: 0; font-size: 14px;">
              This is an automated message from Stocksight. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateInventoryReportHTML(reportData) {
    const { totalProducts, lowStockCount, overstockCount, totalValue, topProducts } = reportData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily Inventory Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📊 Daily Inventory Report</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
          </div>
          <div style="padding: 30px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
              <div style="text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                <h3 style="margin: 0; color: #3B82F6; font-size: 24px;">${totalProducts}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Total Products</p>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                <h3 style="margin: 0; color: #10B981; font-size: 24px;">₹${totalValue?.toLocaleString() || '0'}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Total Value</p>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #fef3cd; border-radius: 6px;">
                <h3 style="margin: 0; color: #F59E0B; font-size: 24px;">${lowStockCount}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Low Stock Items</p>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #e7f3ff; border-radius: 6px;">
                <h3 style="margin: 0; color: #3B82F6; font-size: 24px;">${overstockCount}</h3>
                <p style="margin: 5px 0 0 0; color: #666;">Overstock Items</p>
              </div>
            </div>
            
            ${topProducts && topProducts.length > 0 ? `
            <h3 style="color: #333; margin-bottom: 15px;">🔥 Top Moving Products</h3>
            <div style="margin-bottom: 20px;">
              ${topProducts.map(product => `
                <div style="padding: 10px; border-left: 4px solid #3B82F6; background-color: #f8f9fa; margin-bottom: 10px;">
                  <strong>${product.name}</strong> - ${product.soldQuantity} units sold
                </div>
              `).join('')}
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                 style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Full Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateLowStockHTML(products) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Low Stock Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #F59E0B; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Low Stock Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${products.length} product${products.length > 1 ? 's' : ''} need immediate attention</p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #333; margin-bottom: 20px;">The following products are running low on stock and need to be restocked:</p>
            
            ${products.map(product => `
              <div style="padding: 15px; border-left: 4px solid #F59E0B; background-color: #fef3cd; margin-bottom: 15px; border-radius: 0 4px 4px 0;">
                <h4 style="margin: 0 0 5px 0; color: #333;">${product.name}</h4>
                <p style="margin: 0; color: #666;">
                  <strong>Current Stock:</strong> ${product.current_stock} units<br>
                  <strong>Minimum Level:</strong> ${product.min_stock_level} units<br>
                  <strong>SKU:</strong> ${product.sku}
                </p>
              </div>
            `).join('')}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products" 
                 style="background-color: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Manage Inventory
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateForecastUpdateHTML(forecastData) {
    const { weeklyPredictions, trends, recommendations } = forecastData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Forecast Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #10B981; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📈 Weekly Forecast Update</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Demand predictions for the upcoming week</p>
          </div>
          <div style="padding: 30px;">
            <h3 style="color: #333; margin-bottom: 15px;">📊 Key Predictions</h3>
            
            ${weeklyPredictions?.map(prediction => `
              <div style="padding: 12px; background-color: #f0fdf4; border-radius: 6px; margin-bottom: 10px;">
                <strong>${prediction.productName}:</strong> ${prediction.predictedDemand} units expected
                <small style="color: #666; display: block;">Confidence: ${(prediction.confidence * 100).toFixed(0)}%</small>
              </div>
            `).join('') || '<p>No predictions available</p>'}
            
            ${recommendations && recommendations.length > 0 ? `
            <h3 style="color: #333; margin: 25px 0 15px 0;">💡 Recommendations</h3>
            <ul style="color: #666; line-height: 1.6;">
              ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/forecasts" 
                 style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Detailed Forecasts
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateHighDemandHTML(products) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>High Demand Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #8B5CF6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚀 High Demand Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${products.length} product${products.length > 1 ? 's' : ''} showing increased demand</p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #333; margin-bottom: 20px;">The following products are experiencing higher than expected demand:</p>
            
            ${products.map(product => `
              <div style="padding: 15px; border-left: 4px solid #8B5CF6; background-color: #f3f4f6; margin-bottom: 15px; border-radius: 0 4px 4px 0;">
                <h4 style="margin: 0 0 5px 0; color: #333;">${product.name}</h4>
                <p style="margin: 0; color: #666;">
                  <strong>Predicted Demand:</strong> ${product.predictedDemand} units/day<br>
                  <strong>Current Stock:</strong> ${product.currentStock} units<br>
                  <strong>Days of Stock:</strong> ${Math.floor(product.currentStock / product.predictedDemand)} days
                </p>
              </div>
            `).join('')}
            
            <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>💡 Recommendation:</strong> Consider increasing stock levels for these high-demand products to avoid stockouts.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/forecasts" 
                 style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Demand Analysis
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateSystemHealthHTML(healthData) {
    const { uptime, dbStatus, alertsCount, lastBackup, systemLoad } = healthData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>System Health Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #10B981; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🏥 System Health Report</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">All systems operational</p>
          </div>
          <div style="padding: 30px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 15px; background-color: #f0fdf4; border-radius: 6px;">
                <h4 style="margin: 0; color: #10B981;">✅ Database</h4>
                <p style="margin: 5px 0 0 0; color: #666;">${dbStatus || 'Connected'}</p>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #f0fdf4; border-radius: 6px;">
                <h4 style="margin: 0; color: #10B981;">⏱️ Uptime</h4>
                <p style="margin: 5px 0 0 0; color: #666;">${uptime || '24h'}</p>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #f0fdf4; border-radius: 6px;">
                <h4 style="margin: 0; color: #F59E0B;">🔔 Active Alerts</h4>
                <p style="margin: 5px 0 0 0; color: #666;">${alertsCount || 0}</p>
              </div>
              <div style="text-align: center; padding: 15px; background-color: #f0fdf4; border-radius: 6px;">
                <h4 style="margin: 0; color: #3B82F6;">💾 Last Backup</h4>
                <p style="margin: 5px 0 0 0; color: #666;">${lastBackup || 'Today'}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                 style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View System Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendBulkAlerts(recipients, subject, message, alertType = 'info') {
    try {
      const results = [];
      
      for (const recipient of recipients) {
        try {
          const result = await this.sendAlert(recipient, subject, message, alertType);
          results.push({ recipient, success: true, ...result });
        } catch (error) {
          results.push({ recipient, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('[EMAIL] Bulk alert send failed:', error);
      throw error;
    }
  }

  // New methods for regular updates and different notification types
  async sendDailyInventoryReport(toMail, reportData) {
    try {
      const subject = `Daily Inventory Report - ${new Date().toLocaleDateString()}`;
      const content = this.generateInventoryReportHTML(reportData);
      
      return await this.sendViaWebhook(toMail, subject, content, 'info');
    } catch (error) {
      console.error('[EMAIL] Failed to send daily inventory report:', error);
      throw error;
    }
  }

  async sendWeeklyForecastUpdate(toMail, forecastData) {
    try {
      const subject = `Weekly Demand Forecast Update - Week of ${new Date().toLocaleDateString()}`;
      const content = this.generateForecastUpdateHTML(forecastData);
      
      return await this.sendViaWebhook(toMail, subject, content, 'info');
    } catch (error) {
      console.error('[EMAIL] Failed to send weekly forecast update:', error);
      throw error;
    }
  }

  async sendLowStockAlert(toMail, products) {
    try {
      const subject = `Urgent: Low Stock Alert - ${products.length} Product${products.length > 1 ? 's' : ''} Need Attention`;
      const content = this.generateLowStockHTML(products);
      
      return await this.sendViaWebhook(toMail, subject, content, 'warning');
    } catch (error) {
      console.error('[EMAIL] Failed to send low stock alert:', error);
      throw error;
    }
  }

  async sendHighDemandNotification(toMail, products) {
    try {
      const subject = `High Demand Alert - ${products.length} Product${products.length > 1 ? 's' : ''} Showing Increased Demand`;
      const content = this.generateHighDemandHTML(products);
      
      return await this.sendViaWebhook(toMail, subject, content, 'info');
    } catch (error) {
      console.error('[EMAIL] Failed to send high demand notification:', error);
      throw error;
    }
  }

  async sendSystemHealthUpdate(toMail, healthData) {
    try {
      const subject = `Stocksight System Health Report - ${new Date().toLocaleDateString()}`;
      const content = this.generateSystemHealthHTML(healthData);
      
      return await this.sendViaWebhook(toMail, subject, content, 'success');
    } catch (error) {
      console.error('[EMAIL] Failed to send system health update:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
