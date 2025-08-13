# n8n Gmail SMTP Webhook Integration

## 🚀 Integration Setup Complete

Your Stocksight backend is now integrated with your local n8n Gmail SMTP automation webhook at:
```
http://localhost:5678/webhook-test/sendmail
```

## 📧 Email Service Features

### Automatic Email Types:
1. **Daily Inventory Reports** (8 AM daily)
2. **Weekly Forecast Updates** (Monday 9 AM)
3. **Low Stock Alerts** (Hourly checks)
4. **High Demand Notifications** (Hourly checks)
5. **System Health Reports** (Weekly on Sunday)

### Email Templates:
- ✅ Professional HTML templates with responsive design
- ✅ Color-coded alerts (Info: Blue, Warning: Orange, Error: Red, Success: Green)
- ✅ Dashboard links for quick access
- ✅ Product-specific information and recommendations

## 🔧 Configuration

### Environment Variables (.env):
```bash
# n8n Webhook Configuration
USE_N8N_WEBHOOK=true
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/sendmail
ADMIN_EMAIL=admin@yourcompany.com
FRONTEND_URL=http://localhost:5173
```

### Webhook Payload Format:
```json
{
  "toMail": "recipient@example.com",
  "Subject": "[Stocksight Alert] Your Subject Here",
  "content": "<html>Your HTML content here</html>"
}
```

## 📋 API Endpoints for Email Testing

### Test Webhook:
```bash
POST /api/notifications/test-webhook
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "toMail": "test@example.com",
  "subject": "Test Email",
  "message": "This is a test message",
  "alertType": "info"
}
```

### Manual Daily Report:
```bash
POST /api/notifications/send-daily-report
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "toMail": "admin@example.com"
}
```

### Manual Weekly Forecast:
```bash
POST /api/notifications/send-weekly-forecast
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "toMail": "admin@example.com"
}
```

### Trigger Alert Check:
```bash
POST /api/notifications/trigger-alert-check
Authorization: Bearer <your-jwt-token>
```

### Send Custom Notification:
```bash
POST /api/notifications/send-custom-notification
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "toMail": "recipient@example.com",
  "subject": "Custom Alert",
  "message": "Custom message content",
  "alertType": "warning",
  "notificationType": "custom"
}
```

### Get Email Service Status:
```bash
GET /api/notifications/status
Authorization: Bearer <your-jwt-token>
```

### Start/Stop Scheduler:
```bash
POST /api/notifications/scheduler/start
POST /api/notifications/scheduler/stop
Authorization: Bearer <your-jwt-token>
```

## 🔄 Scheduled Updates

### Automatic Schedules:
- **Hourly**: Alert checks for low stock, overstock, high demand
- **Daily 8 AM**: Comprehensive inventory report
- **Weekly Monday 9 AM**: Demand forecast updates
- **Every 6 hours**: System health checks
- **Weekly Sunday**: System health reports

### Manual Triggers:
All scheduled tasks can be triggered manually via API endpoints for testing and immediate updates.

## 🛠️ Advanced Features

### Email Template Types:

1. **Daily Inventory Report**:
   - Total products count
   - Low stock and overstock counts
   - Total inventory value
   - Top moving products
   - Visual metrics with charts

2. **Low Stock Alert**:
   - List of products below minimum levels
   - Current vs minimum stock levels
   - SKU information
   - Urgent action recommendations

3. **High Demand Notification**:
   - Products with increased demand
   - Predicted demand vs current stock
   - Days of stock remaining
   - Restocking recommendations

4. **Weekly Forecast Update**:
   - Demand predictions for top products
   - Confidence scores
   - Business recommendations
   - Trend analysis

5. **System Health Report**:
   - Database status
   - System uptime
   - Active alerts count
   - Backup status
   - Performance metrics

## 🔍 Testing Your Integration

1. **Test Basic Webhook**:
   ```bash
   curl -X POST http://localhost:3001/api/notifications/test-webhook \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "toMail": "your-email@example.com",
       "subject": "Test Integration",
       "message": "Testing n8n webhook integration",
       "alertType": "info"
     }'
   ```

2. **Check Service Status**:
   ```bash
   curl -X GET http://localhost:3001/api/notifications/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Trigger Manual Report**:
   ```bash
   curl -X POST http://localhost:3001/api/notifications/send-daily-report \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"toMail": "your-email@example.com"}'
   ```

## 🚨 Troubleshooting

### Common Issues:

1. **Webhook not responding**:
   - Ensure n8n is running on port 5678
   - Check webhook URL in environment variables
   - Verify webhook endpoint is active in n8n

2. **Authorization errors**:
   - Ensure you have a valid JWT token
   - Admin endpoints require admin privileges
   - Check token expiration (24h default)

3. **Email template errors**:
   - Check console logs for template generation errors
   - Verify data structure matches expected format
   - Test with simple messages first

### Debug Mode:
Set `NODE_ENV=development` in your `.env` file for detailed logging.

## 📈 Monitoring

### Logs to Monitor:
- `[EMAIL]` - Email service operations
- `[SCHEDULER]` - Scheduled task execution
- `[WEBHOOK]` - n8n webhook communications
- `[ALERTS]` - Alert generation and processing

### Success Indicators:
- ✅ Email service initialized with n8n webhook
- ✅ Scheduler started with all intervals
- ✅ Webhook responses with success status
- ✅ Email deliveries confirmed in logs

---

## 🎉 Your Email Automation is Ready!

The system will now automatically:
- Monitor inventory levels hourly
- Send daily reports at 8 AM
- Provide weekly forecasts on Mondays
- Alert you of critical stock situations
- Keep you informed of system health

All emails are sent through your n8n Gmail SMTP automation for reliable delivery!
