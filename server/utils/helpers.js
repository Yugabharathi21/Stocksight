// Date and time utilities
export const dateUtils = {
  formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
  },

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  getDaysFromNow(days) {
    return this.addDays(new Date(), days);
  },

  isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  },

  getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  },

  getMonthStart(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
};

// Validation utilities
export const validators = {
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidSKU(sku) {
    // SKU should be alphanumeric with hyphens, 3-20 characters
    const skuRegex = /^[A-Z0-9-]{3,20}$/;
    return skuRegex.test(sku);
  },

  isValidPrice(price) {
    return typeof price === 'number' && price > 0 && price < 1000000;
  },

  isValidStock(stock) {
    return Number.isInteger(stock) && stock >= 0;
  },

  isValidAlertType(type) {
    return ['low_stock', 'overstock', 'high_demand'].includes(type);
  }
};

// Response utilities
export const responseUtils = {
  success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...data
    });
  },

  error(res, message, statusCode = 500, details = null) {
    const response = {
      success: false,
      error: message
    };
    
    if (details) {
      response.details = details;
    }
    
    return res.status(statusCode).json(response);
  },

  notFound(res, resource = 'Resource') {
    return this.error(res, `${resource} not found`, 404);
  },

  badRequest(res, message = 'Bad request') {
    return this.error(res, message, 400);
  },

  unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  },

  forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }
};

// Business logic utilities
export const businessUtils = {
  calculateReorderPoint(avgDemand, leadTimeDays, safetyStock = 0) {
    return Math.ceil(avgDemand * leadTimeDays + safetyStock);
  },

  calculateStockTurnover(costOfGoodsSold, avgInventoryValue) {
    return avgInventoryValue > 0 ? costOfGoodsSold / avgInventoryValue : 0;
  },

  getStockStatus(currentStock, minLevel, maxLevel) {
    if (currentStock <= minLevel) return 'low';
    if (currentStock >= maxLevel) return 'overstock';
    return 'normal';
  },

  calculateDaysOfStock(currentStock, avgDailyDemand) {
    return avgDailyDemand > 0 ? Math.floor(currentStock / avgDailyDemand) : null;
  },

  generateSKU(name, category) {
    const namePrefix = name.substring(0, 3).toUpperCase();
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${namePrefix}-${categoryPrefix}-${timestamp}`;
  }
};

// Logging utilities
export const logger = {
  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data ? data : '');
    }
  },

  info(message, data = null) {
    console.log(`[INFO] ${message}`, data ? data : '');
  },

  warn(message, data = null) {
    console.warn(`[WARN] ${message}`, data ? data : '');
  },

  error(message, error = null) {
    console.error(`[ERROR] ${message}`, error ? error : '');
  }
};
