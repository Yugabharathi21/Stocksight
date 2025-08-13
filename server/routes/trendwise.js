import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/trendwise/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Health check for TrendWise model
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'OK',
      model: 'TrendWise Demand Forecaster',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate sample data
router.post('/generate-sample-data', async (req, res) => {
  try {
    const { startDate, endDate, products } = req.body;
    
    // Run the sample data generator
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../../model/sample_data_generator.py'),
      '--generate',
      '--start-date', startDate || '2024-01-01',
      '--end-date', endDate || '2024-06-30',
      '--products', products ? JSON.stringify(products) : 'all'
    ]);

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
        res.json({
          success: true,
          message: 'Sample data generated successfully',
          output: output,
          files: [
            'model/sample_data/sample_sales.csv',
            'model/sample_data/sample_inventory.csv',
            'model/sample_data/seasonal_sales.csv',
            'model/sample_data/seasonal_inventory.csv'
          ]
        });
      } else {
        res.status(500).json({
          error: 'Failed to generate sample data',
          details: errorOutput
        });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Train the model
router.post('/train', upload.fields([
  { name: 'salesData', maxCount: 1 },
  { name: 'inventoryData', maxCount: 1 }
]), async (req, res) => {
  try {
    const { leadTimeDays = 7 } = req.body;
    
    if (!req.files || (!req.files.salesData && !req.files.inventoryData)) {
      return res.status(400).json({ error: 'Please upload sales and inventory data files' });
    }

    const salesFile = req.files.salesData?.[0];
    const inventoryFile = req.files.inventoryData?.[0];

    // Run the training script
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../../model/use_sample_data.py'),
      '--train',
      '--sales-file', salesFile?.path || 'model/sample_data/sample_sales.csv',
      '--inventory-file', inventoryFile?.path || 'model/sample_data/sample_inventory.csv',
      '--lead-time', leadTimeDays.toString()
    ]);

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
        res.json({
          success: true,
          message: 'Model trained successfully',
          output: output
        });
      } else {
        res.status(500).json({
          error: 'Training failed',
          details: errorOutput
        });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Make predictions
router.post('/predict', upload.fields([
  { name: 'salesData', maxCount: 1 },
  { name: 'inventoryData', maxCount: 1 }
]), async (req, res) => {
  try {
    const { leadTimeDays = 7 } = req.body;
    
    if (!req.files || (!req.files.salesData && !req.files.inventoryData)) {
      return res.status(400).json({ error: 'Please upload sales and inventory data files' });
    }

    const salesFile = req.files.salesData?.[0];
    const inventoryFile = req.files.inventoryData?.[0];

    // Run the prediction script
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../../model/use_sample_data.py'),
      '--predict',
      '--sales-file', salesFile?.path || 'model/sample_data/sample_sales.csv',
      '--inventory-file', inventoryFile?.path || 'model/sample_data/sample_inventory.csv',
      '--lead-time', leadTimeDays.toString()
    ]);

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
        try {
          // Parse the output to extract predictions
          const predictions = parsePredictionsOutput(output);
          res.json({
            success: true,
            predictions: predictions,
            output: output
          });
        } catch (parseError) {
          res.status(500).json({
            error: 'Failed to parse predictions',
            details: parseError.message
          });
        }
      } else {
        res.status(500).json({
          error: 'Prediction failed',
          details: errorOutput
        });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick demo with sample data
router.post('/demo', async (req, res) => {
  try {
    const { leadTimeDays = 7 } = req.body;

    // Run the quick demo
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../../model/use_sample_data.py'),
      '--demo',
      '--lead-time', leadTimeDays.toString()
    ]);

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
        try {
          const demoResults = parseDemoOutput(output);
          res.json({
            success: true,
            results: demoResults,
            output: output
          });
        } catch (parseError) {
          res.status(500).json({
            error: 'Failed to parse demo results',
            details: parseError.message
          });
        }
      } else {
        res.status(500).json({
          error: 'Demo failed',
          details: errorOutput
        });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get model status
router.get('/status', async (req, res) => {
  try {
    const modelPath = path.join(__dirname, '../../model/trendwise_forecaster.pkl');
    const modelExists = fs.existsSync(modelPath);
    
    let modelInfo = null;
    if (modelExists) {
      const stats = fs.statSync(modelPath);
      modelInfo = {
        exists: true,
        size: stats.size,
        lastModified: stats.mtime,
        path: modelPath
      };
    }

    res.json({
      modelExists: modelExists,
      modelInfo: modelInfo,
      sampleDataExists: {
        sales: fs.existsSync(path.join(__dirname, '../../model/sample_data/sample_sales.csv')),
        inventory: fs.existsSync(path.join(__dirname, '../../model/sample_data/sample_inventory.csv'))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to parse predictions output
function parsePredictionsOutput(output) {
  // This is a simplified parser - in a real implementation, you'd want more robust parsing
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

// Helper function to parse demo output
function parseDemoOutput(output) {
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

export default router;
