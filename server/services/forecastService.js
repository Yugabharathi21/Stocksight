import { dbHelpers } from '../config/database.js';

class ForecastService {
  constructor() {
    this.models = {
      'simple_moving_average': this.simpleMovingAverage,
      'exponential_smoothing': this.exponentialSmoothing,
      'linear_trend': this.linearTrend
    };
  }

  async generateForecast(productId, model = 'simple_moving_average', days = 14) {
    try {
      console.debug('[FORECAST] Generating forecast for product:', productId);
      
      // Get historical sales data
      const salesData = await dbHelpers.getSalesData(productId, 90); // Last 90 days
      
      if (!salesData || salesData.length < 7) {
        throw new Error('Insufficient historical data for forecasting');
      }

      // Process sales data into daily aggregates
      const dailySales = this.aggregateDailySales(salesData);
      
      // Generate forecast using selected model
      const forecastModel = this.models[model] || this.models.simple_moving_average;
      const predictions = forecastModel.call(this, dailySales, days);
      
      // Calculate confidence intervals
      const forecastWithConfidence = this.calculateConfidenceIntervals(predictions, dailySales);
      
      // Save forecast to database
      const forecastRecords = await this.saveForecastToDatabase(
        productId, 
        forecastWithConfidence, 
        model
      );

      console.debug('[FORECAST] Forecast generated successfully for product:', productId);
      
      return {
        productId,
        model,
        predictions: forecastRecords,
        generatedAt: new Date().toISOString(),
        dataPoints: dailySales.length
      };

    } catch (error) {
      console.error('[FORECAST] Forecast generation failed:', error);
      throw error;
    }
  }

  aggregateDailySales(salesData) {
    const dailyMap = new Map();
    
    salesData.forEach(sale => {
      const date = sale.sale_date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, 0);
      }
      dailyMap.set(date, dailyMap.get(date) + sale.quantity_sold);
    });

    // Convert to array and sort by date
    return Array.from(dailyMap.entries())
      .map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  simpleMovingAverage(dailySales, days, window = 7) {
    const predictions = [];
    const values = dailySales.map(d => d.quantity);
    
    // Calculate moving average for the last 'window' days
    const recentValues = values.slice(-window);
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    // Generate forecasts
    const startDate = new Date();
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(startDate.getDate() + i);
      
      // Add some randomness (±10%) to make it more realistic
      const variance = 0.1;
      const randomFactor = 1 + (Math.random() - 0.5) * variance;
      const predicted = Math.round(average * randomFactor);
      
      predictions.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted)
      });
    }
    
    return predictions;
  }

  exponentialSmoothing(dailySales, days, alpha = 0.3) {
    const predictions = [];
    const values = dailySales.map(d => d.quantity);
    
    // Initialize with first value
    let smoothed = values[0];
    
    // Apply exponential smoothing
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
    }
    
    // Generate forecasts
    const startDate = new Date();
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(startDate.getDate() + i);
      
      predictions.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.max(0, Math.round(smoothed))
      });
    }
    
    return predictions;
  }

  linearTrend(dailySales, days) {
    const predictions = [];
    const values = dailySales.map(d => d.quantity);
    const n = values.length;
    
    // Calculate linear trend using least squares
    const xValues = Array.from({ length: n }, (_, i) => i);
    const xSum = xValues.reduce((sum, x) => sum + x, 0);
    const ySum = values.reduce((sum, y) => sum + y, 0);
    const xySum = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const x2Sum = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    // Generate forecasts
    const startDate = new Date();
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(startDate.getDate() + i);
      
      const x = n + i - 1; // Continue the trend
      const predicted = Math.round(slope * x + intercept);
      
      predictions.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted)
      });
    }
    
    return predictions;
  }

  calculateConfidenceIntervals(predictions, historicalData) {
    // Calculate standard deviation from historical data
    const values = historicalData.map(d => d.quantity);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return predictions.map(pred => ({
      ...pred,
      confidence_score: Math.min(0.95, Math.max(0.65, 1 - (stdDev / mean) * 0.5)), // 65%-95%
      lower_bound: Math.max(0, pred.predicted - Math.round(stdDev * 1.96)),
      upper_bound: pred.predicted + Math.round(stdDev * 1.96)
    }));
  }

  async saveForecastToDatabase(productId, predictions, model) {
    const forecastRecords = [];
    
    for (const prediction of predictions) {
      const forecastData = {
        product_id: productId,
        forecast_date: prediction.date,
        predicted_demand: prediction.predicted,
        confidence_score: prediction.confidence_score,
        lower_bound: prediction.lower_bound,
        upper_bound: prediction.upper_bound,
        model_version: model
      };
      
      const record = await dbHelpers.createForecast(forecastData);
      forecastRecords.push(record);
    }
    
    return forecastRecords;
  }

  async getForecastsForProduct(productId, days = 14) {
    try {
      return await dbHelpers.getForecastsByProduct(productId, days);
    } catch (error) {
      console.error('[FORECAST] Failed to get forecasts:', error);
      throw error;
    }
  }

  async generateBulkForecasts(productIds, model = 'simple_moving_average') {
    const results = [];
    
    for (const productId of productIds) {
      try {
        const forecast = await this.generateForecast(productId, model);
        results.push({ productId, success: true, forecast });
      } catch (error) {
        results.push({ productId, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

export const forecastService = new ForecastService();
