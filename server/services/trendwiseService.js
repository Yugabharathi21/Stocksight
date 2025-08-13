import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dbHelpers, supabaseAdmin } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TrendWiseService {
  constructor() {
    this.modelPath = path.join(__dirname, '../../model/trendwise_forecaster.pkl');
    this.pythonScriptPath = path.join(__dirname, '../../model/use_sample_data.py');
    this.supabaseAdmin = supabaseAdmin;
  }

  /**
   * Check if the model is trained and ready
   */
  async checkModelStatus() {
    try {
      const modelExists = fs.existsSync(this.modelPath);
      
      let modelInfo = null;
      if (modelExists) {
        const stats = fs.statSync(this.modelPath);
        modelInfo = {
          exists: true,
          size: stats.size,
          lastModified: stats.mtime,
          path: this.modelPath
        };
      }

      return {
        modelExists,
        modelInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[TrendWise Service] Error checking model status:', error);
      throw error;
    }
  }

  /**
   * Fetch sales data from database and format for TrendWise model
   */
  async fetchSalesDataFromDB(days = 90) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

             // Get all products with their sales data
       const { data: products, error: productsError } = await supabaseAdmin
         .from('products')
         .select('id, name, sku, category');

      if (productsError) throw productsError;

      const salesData = [];
      
      for (const product of products) {
                 // Get sales data for this product
         const { data: sales, error: salesError } = await supabaseAdmin
           .from('sales_data')
           .select('quantity_sold, sale_date')
           .eq('product_id', product.id)
           .gte('sale_date', startDate.toISOString().split('T')[0])
           .order('sale_date', { ascending: true });

        if (salesError) {
          console.warn(`[TrendWise Service] Error fetching sales for ${product.sku}:`, salesError);
          continue;
        }

        // Group sales by date and aggregate
        const dailySales = {};
        sales.forEach(sale => {
          const date = sale.sale_date;
          dailySales[date] = (dailySales[date] || 0) + sale.quantity_sold;
        });

        // Convert to TrendWise format
        Object.entries(dailySales).forEach(([date, quantity]) => {
          salesData.push({
            date,
            sku: product.sku,
            sales_qty: quantity
          });
        });
      }

      return salesData;
    } catch (error) {
      console.error('[TrendWise Service] Error fetching sales data:', error);
      throw error;
    }
  }

  /**
   * Fetch inventory data from database and format for TrendWise model
   */
  async fetchInventoryDataFromDB() {
    try {
           const { data: products, error } = await supabaseAdmin
       .from('products')
       .select('name, sku, category, current_stock, unit_price');

      if (error) throw error;

      // Convert to TrendWise format
      const inventoryData = products.map(product => ({
        Name: product.name,
        SKU: product.sku,
        Category: product.category,
        'Current Stock': product.current_stock,
        Price: product.unit_price,
        'Total Value': product.current_stock * product.unit_price
      }));

      return inventoryData;
    } catch (error) {
      console.error('[TrendWise Service] Error fetching inventory data:', error);
      throw error;
    }
  }

  /**
   * Create temporary CSV files from database data
   */
  async createTempCSVFiles(salesData, inventoryData) {
    try {
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const timestamp = Date.now();
      const salesFile = path.join(tempDir, `sales_${timestamp}.csv`);
      const inventoryFile = path.join(tempDir, `inventory_${timestamp}.csv`);

      // Create sales CSV
      const salesCSV = ['date,sku,sales_qty'];
      salesData.forEach(record => {
        salesCSV.push(`${record.date},${record.sku},${record.sales_qty}`);
      });
      fs.writeFileSync(salesFile, salesCSV.join('\n'));

      // Create inventory CSV
      const inventoryCSV = ['Name,SKU,Category,Current Stock,Price,Total Value'];
      inventoryData.forEach(record => {
        inventoryCSV.push(`${record.Name},${record.SKU},${record.Category},${record['Current Stock']},${record.Price},${record['Total Value']}`);
      });
      fs.writeFileSync(inventoryFile, inventoryCSV.join('\n'));

      return { salesFile, inventoryFile };
    } catch (error) {
      console.error('[TrendWise Service] Error creating temp CSV files:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(salesFile, inventoryFile) {
    try {
      if (fs.existsSync(salesFile)) {
        fs.unlinkSync(salesFile);
      }
      if (fs.existsSync(inventoryFile)) {
        fs.unlinkSync(inventoryFile);
      }
    } catch (error) {
      console.warn('[TrendWise Service] Error cleaning up temp files:', error);
    }
  }

  /**
   * Train the model using database data
   */
  async trainModelFromDB(leadTimeDays = 7) {
    try {
      console.log('[TrendWise Service] Starting model training from database...');

      // Fetch data from database
      const salesData = await this.fetchSalesDataFromDB();
      const inventoryData = await this.fetchInventoryDataFromDB();

      if (salesData.length === 0) {
        throw new Error('No sales data available for training');
      }

      console.log(`[TrendWise Service] Fetched ${salesData.length} sales records and ${inventoryData.length} inventory records`);

      // Create temporary CSV files
      const { salesFile, inventoryFile } = await this.createTempCSVFiles(salesData, inventoryData);

      try {
        // Run the training script
        const result = await this.runPythonScript([
          '--train',
          '--sales-file', salesFile,
          '--inventory-file', inventoryFile,
          '--lead-time', leadTimeDays.toString()
        ]);

        console.log('[TrendWise Service] Model training completed successfully');
        return {
          success: true,
          message: 'Model trained successfully using database data',
          skusTrained: salesData.length > 0 ? new Set(salesData.map(s => s.sku)).size : 0,
          recordsProcessed: salesData.length,
          output: result.output
        };
      } finally {
        // Clean up temporary files
        await this.cleanupTempFiles(salesFile, inventoryFile);
      }
    } catch (error) {
      console.error('[TrendWise Service] Error training model:', error);
      throw error;
    }
  }

  /**
   * Make predictions using database data
   */
  async predictFromDB(leadTimeDays = 7) {
    try {
      console.log('[TrendWise Service] Starting predictions from database...');

      // Fetch data from database
      const salesData = await this.fetchSalesDataFromDB();
      const inventoryData = await this.fetchInventoryDataFromDB();

      if (salesData.length === 0) {
        throw new Error('No sales data available for predictions');
      }

      // Create temporary CSV files
      const { salesFile, inventoryFile } = await this.createTempCSVFiles(salesData, inventoryData);

      try {
        // Run the prediction script
        const result = await this.runPythonScript([
          '--predict',
          '--sales-file', salesFile,
          '--inventory-file', inventoryFile,
          '--lead-time', leadTimeDays.toString()
        ]);

        // Parse predictions
        const predictions = this.parsePredictionsOutput(result.output);

        // Save predictions to database
        await this.savePredictionsToDB(predictions, leadTimeDays);

        console.log('[TrendWise Service] Predictions completed successfully');
        return {
          success: true,
          predictions,
          recordsProcessed: salesData.length,
          output: result.output
        };
      } finally {
        // Clean up temporary files
        await this.cleanupTempFiles(salesFile, inventoryFile);
      }
    } catch (error) {
      console.error('[TrendWise Service] Error making predictions:', error);
      throw error;
    }
  }

  /**
   * Run demo with database data
   */
  async runDemoFromDB(leadTimeDays = 7) {
    try {
      console.log('[TrendWise Service] Starting demo with database data...');

      // Fetch data from database
      const salesData = await this.fetchSalesDataFromDB();
      const inventoryData = await this.fetchInventoryDataFromDB();

      if (salesData.length === 0) {
        // Generate sample data if no real data exists
        console.log('[TrendWise Service] No real data found, generating sample data...');
        return await this.generateSampleDataAndDemo(leadTimeDays);
      }

      // Create temporary CSV files
      const { salesFile, inventoryFile } = await this.createTempCSVFiles(salesData, inventoryData);

      try {
        // Run the demo script
        const result = await this.runPythonScript([
          '--demo',
          '--sales-file', salesFile,
          '--inventory-file', inventoryFile,
          '--lead-time', leadTimeDays.toString()
        ]);

        const demoResults = this.parseDemoOutput(result.output);

        console.log('[TrendWise Service] Demo completed successfully');
        return {
          success: true,
          results: demoResults,
          dataSource: 'database',
          recordsProcessed: salesData.length,
          output: result.output
        };
      } finally {
        // Clean up temporary files
        await this.cleanupTempFiles(salesFile, inventoryFile);
      }
    } catch (error) {
      console.error('[TrendWise Service] Error running demo:', error);
      throw error;
    }
  }

  /**
   * Generate sample data and run demo
   */
  async generateSampleDataAndDemo(leadTimeDays = 7) {
    try {
      // Run the sample data generator
      const result = await this.runPythonScript([
        '--demo',
        '--lead-time', leadTimeDays.toString()
      ]);

      const demoResults = this.parseDemoOutput(result.output);

      return {
        success: true,
        results: demoResults,
        dataSource: 'sample',
        message: 'Demo completed with generated sample data',
        output: result.output
      };
    } catch (error) {
      console.error('[TrendWise Service] Error generating sample data:', error);
      throw error;
    }
  }

  /**
   * Run Python script and capture output
   */
  async runPythonScript(args) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [this.pythonScriptPath, ...args]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ output, errorOutput });
        } else {
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });
    });
  }

  /**
   * Parse predictions output from Python script
   */
  parsePredictionsOutput(output) {
    const lines = output.split('\n');
    const predictions = [];
    
    for (const line of lines) {
      if (line.includes('SKU:') && line.includes('Forecast:')) {
        const match = line.match(/SKU: (\w+).*Forecast: ([\d.]+).*Recommendation: (\w+)/);
        if (match) {
          predictions.push({
            sku: match[1],
            forecast: parseFloat(match[2]),
            recommendation: match[3]
          });
        }
      }
    }
    
    return predictions;
  }

  /**
   * Parse demo output from Python script
   */
  parseDemoOutput(output) {
    const lines = output.split('\n');
    const results = {
      training: {},
      predictions: []
    };
    
    for (const line of lines) {
      if (line.includes('Training completed!')) {
        const match = line.match(/Trained models for (\d+) SKUs/);
        if (match) {
          results.training.skusTrained = parseInt(match[1]);
        }
      }
      
      if (line.includes('SKU:') && line.includes('units -')) {
        const match = line.match(/(\w+): ([\d.]+) units - (\w+)/);
        if (match) {
          results.predictions.push({
            sku: match[1],
            forecast: parseFloat(match[2]),
            recommendation: match[3]
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Save predictions to database
   */
  async savePredictionsToDB(predictions, leadTimeDays) {
    try {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + leadTimeDays);

      for (const prediction of predictions) {
                 // Get product ID from SKU
         const { data: product, error: productError } = await supabaseAdmin
           .from('products')
           .select('id')
           .eq('sku', prediction.sku)
           .single();

        if (productError) {
          console.warn(`[TrendWise Service] Product not found for SKU ${prediction.sku}`);
          continue;
        }

        // Save forecast to database
        await dbHelpers.createForecast({
          product_id: product.id,
          forecast_date: forecastDate.toISOString().split('T')[0],
          predicted_demand: Math.round(prediction.forecast),
          confidence_score: 0.85, // Default confidence score
          lower_bound: Math.round(prediction.forecast * 0.8),
          upper_bound: Math.round(prediction.forecast * 1.2),
          model_version: 'trendwise_v1.0'
        });

        // Create alert if needed
        await this.createInventoryAlert(product.id, prediction);
      }

      console.log(`[TrendWise Service] Saved ${predictions.length} predictions to database`);
    } catch (error) {
      console.error('[TrendWise Service] Error saving predictions to database:', error);
      throw error;
    }
  }

  /**
   * Create inventory alerts based on predictions
   */
  async createInventoryAlert(productId, prediction) {
    try {
             const { data: product, error: productError } = await supabaseAdmin
         .from('products')
         .select('current_stock, min_stock_level, max_stock_level')
         .eq('id', productId)
         .single();

      if (productError) return;

      let alertType = null;
      let message = '';

      if (prediction.recommendation === 'increase' && product.current_stock < product.min_stock_level) {
        alertType = 'low_stock';
        message = `Low stock alert: Current stock (${product.current_stock}) is below minimum level (${product.min_stock_level}). Predicted demand: ${Math.round(prediction.forecast)} units.`;
      } else if (prediction.recommendation === 'reduce' && product.current_stock > product.max_stock_level) {
        alertType = 'overstock';
        message = `Overstock alert: Current stock (${product.current_stock}) is above maximum level (${product.max_stock_level}). Predicted demand: ${Math.round(prediction.forecast)} units.`;
      } else if (prediction.recommendation === 'increase' && prediction.forecast > product.current_stock * 1.5) {
        alertType = 'high_demand';
        message = `High demand alert: Predicted demand (${Math.round(prediction.forecast)}) is significantly higher than current stock (${product.current_stock}).`;
      }

      if (alertType) {
        await dbHelpers.createAlert({
          product_id: productId,
          alert_type: alertType,
          message: message
        });
      }
    } catch (error) {
      console.error('[TrendWise Service] Error creating inventory alert:', error);
    }
  }

  /**
   * Get recent predictions from database
   */
  async getRecentPredictions(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

             const { data: forecasts, error } = await supabaseAdmin
         .from('demand_forecasts')
         .select(`
           *,
           products (name, sku, category, current_stock)
         `)
         .gte('forecast_date', startDate.toISOString().split('T')[0])
         .order('forecast_date', { ascending: false });

      if (error) throw error;

      return forecasts;
    } catch (error) {
      console.error('[TrendWise Service] Error getting recent predictions:', error);
      throw error;
    }
  }
}

export default new TrendWiseService();
