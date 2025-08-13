import express from 'express';
import trendwiseService from '../services/trendwiseService.js';

const router = express.Router();

/**
 * @route GET /api/trendwise-db/health
 * @desc Health check for database-driven TrendWise service
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'OK',
      model: 'TrendWise Demand Forecaster (Database-Driven)',
      version: '2.0.0',
      features: [
        'Database-driven data fetching',
        'Automatic CSV generation',
        'Real-time predictions',
        'Automatic alert generation',
        'Model persistence'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/trendwise-db/status
 * @desc Get model status and database connectivity
 */
router.get('/status', async (req, res) => {
  try {
    const status = await trendwiseService.checkModelStatus();
    
    // Check database connectivity
    const { data: productCount, error: dbError } = await trendwiseService.supabaseAdmin
      .from('products')
      .select('count', { count: 'exact', head: true });

    const { data: salesCount, error: salesError } = await trendwiseService.supabaseAdmin
      .from('sales_data')
      .select('count', { count: 'exact', head: true });

    res.json({
      ...status,
      database: {
        connected: !dbError && !salesError,
        products: productCount || 0,
        salesRecords: salesCount || 0,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/trendwise-db/train
 * @desc Train the model using data from database
 */
router.post('/train', async (req, res) => {
  try {
    const { leadTimeDays = 7 } = req.body;

    console.log(`[API] Training request received with lead time: ${leadTimeDays} days`);

    const result = await trendwiseService.trainModelFromDB(leadTimeDays);

    res.json({
      success: true,
      message: 'Model trained successfully using database data',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Training error:', error);
    res.status(500).json({
      error: 'Training failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/trendwise-db/predict
 * @desc Make predictions using data from database
 */
router.post('/predict', async (req, res) => {
  try {
    const { leadTimeDays = 7 } = req.body;

    console.log(`[API] Prediction request received with lead time: ${leadTimeDays} days`);

    const result = await trendwiseService.predictFromDB(leadTimeDays);

    res.json({
      success: true,
      message: 'Predictions generated successfully using database data',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Prediction error:', error);
    res.status(500).json({
      error: 'Prediction failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/trendwise-db/demo
 * @desc Run demo with database data (falls back to sample data if no real data)
 */
router.post('/demo', async (req, res) => {
  try {
    const { leadTimeDays = 7 } = req.body;

    console.log(`[API] Demo request received with lead time: ${leadTimeDays} days`);

    const result = await trendwiseService.runDemoFromDB(leadTimeDays);

    res.json({
      success: true,
      message: 'Demo completed successfully',
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Demo error:', error);
    res.status(500).json({
      error: 'Demo failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/trendwise-db/predictions
 * @desc Get recent predictions from database
 */
router.get('/predictions', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const predictions = await trendwiseService.getRecentPredictions(parseInt(days));

    res.json({
      success: true,
      predictions,
      count: predictions.length,
      days: parseInt(days),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Get predictions error:', error);
    res.status(500).json({
      error: 'Failed to fetch predictions',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/trendwise-db/data-summary
 * @desc Get summary of available data in database
 */
router.get('/data-summary', async (req, res) => {
  try {
    // Get product count
    const { count: productCount } = await trendwiseService.supabaseAdmin
      .from('products')
      .select('count', { count: 'exact', head: true });

    // Get sales data count
    const { count: salesCount } = await trendwiseService.supabaseAdmin
      .from('sales_data')
      .select('count', { count: 'exact', head: true });

    // Get recent sales data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSales } = await trendwiseService.supabaseAdmin
      .from('sales_data')
      .select('sale_date')
      .gte('sale_date', thirtyDaysAgo.toISOString().split('T')[0]);

    // Get forecast count
    const { count: forecastCount } = await trendwiseService.supabaseAdmin
      .from('demand_forecasts')
      .select('count', { count: 'exact', head: true });

    // Get alert count
    const { count: alertCount } = await trendwiseService.supabaseAdmin
      .from('inventory_alerts')
      .select('count', { count: 'exact', head: true });

    res.json({
      success: true,
      summary: {
        products: productCount || 0,
        totalSalesRecords: salesCount || 0,
        recentSalesRecords: recentSales?.length || 0,
        forecasts: forecastCount || 0,
        alerts: alertCount || 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[API] Data summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch data summary',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/trendwise-db/auto-pipeline
 * @desc Run complete pipeline: train model and generate predictions
 */
router.post('/auto-pipeline', async (req, res) => {
  try {
    const { leadTimeDays = 7, skipTraining = false } = req.body;

    console.log(`[API] Auto pipeline request received with lead time: ${leadTimeDays} days`);

    const results = {
      training: null,
      predictions: null,
      timestamp: new Date().toISOString()
    };

    // Step 1: Train model (unless skipped)
    if (!skipTraining) {
      console.log('[API] Step 1: Training model...');
      results.training = await trendwiseService.trainModelFromDB(leadTimeDays);
    }

    // Step 2: Generate predictions
    console.log('[API] Step 2: Generating predictions...');
    results.predictions = await trendwiseService.predictFromDB(leadTimeDays);

    res.json({
      success: true,
      message: 'Auto pipeline completed successfully',
      ...results
    });
  } catch (error) {
    console.error('[API] Auto pipeline error:', error);
    res.status(500).json({
      error: 'Auto pipeline failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/trendwise-db/refresh-data
 * @desc Refresh data from database and retrain if needed
 */
router.post('/refresh-data', async (req, res) => {
  try {
    const { retrain = true, leadTimeDays = 7 } = req.body;

    console.log('[API] Data refresh request received');

    // Check if we have enough data
    const { data: recentSales } = await trendwiseService.supabaseAdmin
      .from('sales_data')
      .select('sale_date')
      .gte('sale_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (!recentSales || recentSales.length < 10) {
      return res.status(400).json({
        error: 'Insufficient data',
        message: 'Need at least 10 sales records in the last 90 days for training',
        availableRecords: recentSales?.length || 0
      });
    }

    const results = {
      dataRefresh: {
        salesRecords: recentSales.length,
        lastUpdated: new Date().toISOString()
      },
      training: null,
      timestamp: new Date().toISOString()
    };

    // Retrain if requested
    if (retrain) {
      console.log('[API] Retraining model with refreshed data...');
      results.training = await trendwiseService.trainModelFromDB(leadTimeDays);
    }

    res.json({
      success: true,
      message: 'Data refresh completed successfully',
      ...results
    });
  } catch (error) {
    console.error('[API] Data refresh error:', error);
    res.status(500).json({
      error: 'Data refresh failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
