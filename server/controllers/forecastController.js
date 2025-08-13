import { dbHelpers } from '../config/database.js';

export const forecastController = {
  // Generate forecast for a product
  async generateForecast(req, res) {
    try {
      const { productId, days = 14 } = req.body;
      
      console.debug('[DEBUG] Generating forecast for product:', productId);

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      // Get product details
      const product = await dbHelpers.getProductById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get historical sales data
      const salesData = await dbHelpers.getSalesData(productId, 90); // Last 90 days
      
      if (salesData.length === 0) {
        console.debug('[DEBUG] No sales data found for product:', productId);
        return res.status(400).json({ 
          error: 'No sales data available for forecasting' 
        });
      }

      // Calculate basic forecast using moving average
      const avgSales = salesData.reduce((sum, sale) => sum + sale.quantity_sold, 0) / salesData.length;
      const volatility = Math.sqrt(
        salesData.reduce((sum, sale) => sum + Math.pow(sale.quantity_sold - avgSales, 2), 0) / salesData.length
      );

      // Generate forecasts for the next 'days' days
      const forecasts = [];
      for (let i = 1; i <= days; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);
        
        // Add some randomness and seasonal factors
        const seasonalFactor = 1 + 0.1 * Math.sin((i / 7) * 2 * Math.PI); // Weekly pattern
        const randomFactor = 1 + (Math.random() - 0.5) * 0.2; // ±10% random variation
        
        const predicted = Math.max(0, Math.round(avgSales * seasonalFactor * randomFactor));
        const confidence = Math.max(0.5, Math.min(0.95, 1 - (volatility / avgSales) * 0.5));
        const lowerBound = Math.max(0, Math.round(predicted * (1 - volatility / avgSales)));
        const upperBound = Math.round(predicted * (1 + volatility / avgSales));

        const forecastData = {
          product_id: productId,
          forecast_date: forecastDate.toISOString().split('T')[0],
          predicted_demand: predicted,
          confidence_score: parseFloat(confidence.toFixed(2)),
          lower_bound: lowerBound,
          upper_bound: upperBound,
          model_version: 'v1.0'
        };

        // Save forecast to database
        const savedForecast = await dbHelpers.createForecast(forecastData);
        forecasts.push(savedForecast);
      }

      console.debug('[DEBUG] Forecast generated successfully for product:', productId);

      res.json({
        success: true,
        message: 'Forecast generated successfully',
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku
        },
        forecasts,
        metadata: {
          avgSales,
          volatility: parseFloat(volatility.toFixed(2)),
          dataPoints: salesData.length,
          forecastPeriod: days
        }
      });

    } catch (error) {
      console.error('[ERROR] Generate forecast error:', error);
      res.status(500).json({ 
        error: 'Failed to generate forecast', 
        details: error.message 
      });
    }
  },

  // Get forecasts for a product
  async getForecasts(req, res) {
    try {
      const { productId } = req.params;
      const { days = 14 } = req.query;
      
      console.debug('[DEBUG] Getting forecasts for product:', productId);

      const forecasts = await dbHelpers.getForecastsByProduct(productId, parseInt(days));

      res.json({
        success: true,
        forecasts,
        count: forecasts.length
      });

    } catch (error) {
      console.error('[ERROR] Get forecasts error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch forecasts', 
        details: error.message 
      });
    }
  },

  // Get forecast accuracy metrics
  async getForecastAccuracy(req, res) {
    try {
      const { productId } = req.params;
      
      console.debug('[DEBUG] Getting forecast accuracy for product:', productId);

      // Get past forecasts (30 days back)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      
      // This would require more complex database queries to compare
      // actual sales vs predicted sales. For now, returning mock data.
      const accuracy = {
        productId,
        period: '30 days',
        accuracy: 0.78, // 78% accuracy
        meanAbsoluteError: 5.2,
        meanAbsolutePercentageError: 0.15, // 15%
        forecasts: {
          total: 30,
          accurate: 23, // Within 20% of actual
          overestimated: 4,
          underestimated: 3
        }
      };

      res.json({
        success: true,
        accuracy
      });

    } catch (error) {
      console.error('[ERROR] Get forecast accuracy error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch forecast accuracy', 
        details: error.message 
      });
    }
  },

  // Bulk generate forecasts for all products
  async bulkGenerateForecasts(req, res) {
    try {
      const { days = 14 } = req.body;
      
      console.debug('[DEBUG] Bulk generating forecasts for all products');

      const products = await dbHelpers.getProducts(1000, 0); // Get all products
      const results = [];

      for (const product of products) {
        try {
          // Get sales data for the product
          const salesData = await dbHelpers.getSalesData(product.id, 30);
          
          if (salesData.length < 5) {
            console.debug(`[DEBUG] Skipping product ${product.id} - insufficient sales data`);
            continue;
          }

          // Generate simple forecast
          const avgSales = salesData.reduce((sum, sale) => sum + sale.quantity_sold, 0) / salesData.length;
          
          for (let i = 1; i <= days; i++) {
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + i);
            
            const predicted = Math.max(0, Math.round(avgSales * (1 + (Math.random() - 0.5) * 0.2)));
            
            const forecastData = {
              product_id: product.id,
              forecast_date: forecastDate.toISOString().split('T')[0],
              predicted_demand: predicted,
              confidence_score: 0.75,
              lower_bound: Math.round(predicted * 0.8),
              upper_bound: Math.round(predicted * 1.2),
              model_version: 'v1.0-bulk'
            };

            await dbHelpers.createForecast(forecastData);
          }

          results.push({
            productId: product.id,
            productName: product.name,
            success: true
          });

        } catch (error) {
          console.error(`[ERROR] Failed to generate forecast for product ${product.id}:`, error);
          results.push({
            productId: product.id,
            productName: product.name,
            success: false,
            error: error.message
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.debug(`[DEBUG] Bulk forecast generation completed: ${successful} successful, ${failed} failed`);

      res.json({
        success: true,
        message: 'Bulk forecast generation completed',
        summary: {
          total: results.length,
          successful,
          failed
        },
        results
      });

    } catch (error) {
      console.error('[ERROR] Bulk generate forecasts error:', error);
      res.status(500).json({ 
        error: 'Failed to bulk generate forecasts', 
        details: error.message 
      });
    }
  }
};
