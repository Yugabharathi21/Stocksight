import express from 'express';
import { emailService } from '../services/emailService.js';
import { scheduledUpdateService } from '../services/scheduledUpdateService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { responseUtils } from '../utils/helpers.js';

const router = express.Router();

// Test n8n webhook endpoint
router.post('/test-webhook', authenticateToken, async (req, res) => {
  try {
    const { toMail, subject, message, alertType = 'info' } = req.body;

    if (!toMail || !subject || !message) {
      return responseUtils.validationError(res, 'toMail, subject, and message are required');
    }

    console.debug('[WEBHOOK] Testing n8n webhook with:', { toMail, subject, alertType });

    const result = await emailService.sendAlert(toMail, subject, message, alertType);

    responseUtils.success(res, { 
      emailResult: result,
      webhookUrl: emailService.n8nWebhookUrl,
      method: emailService.useN8nWebhook ? 'n8n_webhook' : 'smtp'
    }, 'Test email sent successfully');

  } catch (error) {
    console.error('[WEBHOOK] Test webhook failed:', error);
    responseUtils.error(res, 'Failed to send test email', 500, error.message);
  }
});

// Send daily inventory report manually
router.post('/send-daily-report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { toMail } = req.body;
    const email = toMail || process.env.ADMIN_EMAIL || req.user.email;

    console.debug('[EMAIL] Manually sending daily report to:', email);

    await scheduledUpdateService.triggerDailyReport();

    responseUtils.success(res, { 
      recipient: email,
      type: 'daily_inventory_report'
    }, 'Daily inventory report sent successfully');

  } catch (error) {
    console.error('[EMAIL] Failed to send daily report:', error);
    responseUtils.error(res, 'Failed to send daily report', 500, error.message);
  }
});

// Send weekly forecast update manually
router.post('/send-weekly-forecast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { toMail } = req.body;
    const email = toMail || process.env.ADMIN_EMAIL || req.user.email;

    console.debug('[EMAIL] Manually sending weekly forecast to:', email);

    await scheduledUpdateService.triggerWeeklyForecast();

    responseUtils.success(res, { 
      recipient: email,
      type: 'weekly_forecast_update'
    }, 'Weekly forecast update sent successfully');

  } catch (error) {
    console.error('[EMAIL] Failed to send weekly forecast:', error);
    responseUtils.error(res, 'Failed to send weekly forecast', 500, error.message);
  }
});

// Trigger alert check manually
router.post('/trigger-alert-check', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.debug('[ALERTS] Manually triggering alert check...');

    const result = await scheduledUpdateService.triggerAlertCheck();

    responseUtils.success(res, result, 'Alert check completed successfully');

  } catch (error) {
    console.error('[ALERTS] Alert check failed:', error);
    responseUtils.error(res, 'Alert check failed', 500, error.message);
  }
});

// Send custom notification
router.post('/send-custom-notification', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      toMail, 
      subject, 
      message, 
      alertType = 'info',
      notificationType = 'custom'
    } = req.body;

    if (!toMail || !subject || !message) {
      return responseUtils.validationError(res, 'toMail, subject, and message are required');
    }

    console.debug('[EMAIL] Sending custom notification:', { toMail, subject, notificationType });

    let result;
    
    switch (notificationType) {
      case 'low_stock':
        // For low stock, expect products array in message
        result = await emailService.sendLowStockAlert(toMail, JSON.parse(message));
        break;
      case 'high_demand':
        // For high demand, expect products array in message
        result = await emailService.sendHighDemandNotification(toMail, JSON.parse(message));
        break;
      case 'system_health':
        // For system health, expect health data in message
        result = await emailService.sendSystemHealthUpdate(toMail, JSON.parse(message));
        break;
      default:
        // Regular alert
        result = await emailService.sendAlert(toMail, subject, message, alertType);
    }

    responseUtils.success(res, { 
      emailResult: result,
      notificationType,
      recipient: toMail
    }, 'Custom notification sent successfully');

  } catch (error) {
    console.error('[EMAIL] Failed to send custom notification:', error);
    responseUtils.error(res, 'Failed to send custom notification', 500, error.message);
  }
});

// Get email service status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = {
      emailServiceType: emailService.useN8nWebhook ? 'n8n_webhook' : 'smtp',
      webhookUrl: emailService.n8nWebhookUrl,
      smtpConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      adminEmail: process.env.ADMIN_EMAIL,
      schedulerRunning: scheduledUpdateService.isRunning,
      timestamp: new Date().toISOString()
    };

    responseUtils.success(res, { status }, 'Email service status retrieved');

  } catch (error) {
    console.error('[EMAIL] Failed to get email service status:', error);
    responseUtils.error(res, 'Failed to get email service status', 500, error.message);
  }
});

// Start/stop scheduler
router.post('/scheduler/:action', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action } = req.params;

    if (action === 'start') {
      scheduledUpdateService.start();
      responseUtils.success(res, { 
        action: 'started',
        isRunning: scheduledUpdateService.isRunning
      }, 'Scheduler started successfully');
    } else if (action === 'stop') {
      scheduledUpdateService.stop();
      responseUtils.success(res, { 
        action: 'stopped',
        isRunning: scheduledUpdateService.isRunning
      }, 'Scheduler stopped successfully');
    } else {
      responseUtils.validationError(res, 'Invalid action. Use "start" or "stop"');
    }

  } catch (error) {
    console.error('[SCHEDULER] Scheduler action failed:', error);
    responseUtils.error(res, 'Scheduler action failed', 500, error.message);
  }
});

export default router;
