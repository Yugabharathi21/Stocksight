import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import alertsRoutes from './routes/alerts.js';
import forecastsRoutes from './routes/forecasts.js';
import notificationsRoutes from './routes/notifications.js';
import organizationRoutes from './routes/organizationRoutes.js';
import trendwiseRoutes from './routes/trendwise.js';
import trendwiseDBRoutes from './routes/trendwiseDB.js';

// Import services and config
import { testConnection } from './config/database.js';
import { alertService } from './services/alertService.js';
import { scheduledUpdateService } from './services/scheduledUpdateService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Use structured routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/forecasts', forecastsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/trendwise', trendwiseRoutes);
app.use('/api/trendwise-db', trendwiseDBRoutes);

// CSV Upload endpoint (keeping as utility endpoint)
app.post('/api/upload-csv', upload.single('csvFile'), (req, res) => {
  try {
    if (!req.file) {
      console.debug('[DEBUG] No file uploaded in /api/upload-csv');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: filePath,
      uploadedAt: new Date().toISOString()
    };

    console.debug('[DEBUG] CSV file uploaded:', fileInfo);

    res.json({
      success: true,
      message: 'CSV file uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('[ERROR] Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`🚀 Stocksight API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed - some features may not work');
  }
  
  // Start background services
  try {
    console.log('🔄 Starting background services...');
    
    // Start the scheduled update service
    scheduledUpdateService.start();
    
    console.log('✅ Background services started successfully');
  } catch (error) {
    console.error('⚠️  Background services failed to start:', error.message);
  }
});

export default app;