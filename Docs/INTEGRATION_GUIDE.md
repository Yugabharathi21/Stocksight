# TrendWise AI Integration Guide

This guide explains how the TrendWise Demand Forecaster model has been seamlessly integrated into the StockSight web application.

## 🏗️ Integration Architecture

### Overview
The integration follows a **hybrid architecture** where:
- **Frontend**: React/TypeScript web interface
- **Backend**: Node.js/Express API server
- **AI Model**: Python-based TrendWise Demand Forecaster
- **Communication**: HTTP API calls between frontend and backend, subprocess calls between backend and Python model

### Architecture Diagram
```
┌─────────────────┐    HTTP API    ┌─────────────────┐    Subprocess    ┌─────────────────┐
│   React Frontend │ ──────────────► │  Node.js Backend │ ──────────────► │  Python AI Model │
│                 │                │                 │                │                 │
│ • TrendWise UI  │                │ • API Routes    │                │ • Prophet Model │
│ • File Upload   │                │ • File Handling │                │ • Fallback Models│
│ • Results Display│                │ • Data Processing│               │ • Model Persistence│
└─────────────────┘                └─────────────────┘                └─────────────────┘
```

## 🔧 Integration Components

### 1. Backend API Routes (`server/routes/trendwise.js`)

**Purpose**: Handle all AI model interactions through HTTP endpoints

**Key Endpoints**:
- `GET /api/trendwise/health` - Model health check
- `POST /api/trendwise/generate-sample-data` - Generate sample data
- `POST /api/trendwise/train` - Train model with uploaded files
- `POST /api/trendwise/predict` - Make predictions
- `POST /api/trendwise/demo` - Run quick demo
- `GET /api/trendwise/status` - Check model status

**File Upload Handling**:
```javascript
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});
```

**Python Process Communication**:
```javascript
const pythonProcess = spawn('python', [
  path.join(__dirname, '../../model/use_sample_data.py'),
  '--demo',
  '--lead-time', leadTimeDays.toString()
]);
```

### 2. Frontend React Component (`src/components/TrendWise/TrendWiseAI.tsx`)

**Purpose**: Provide a modern, user-friendly interface for AI model interaction

**Key Features**:
- **Tabbed Interface**: Demo, Upload & Train, Model Status
- **File Upload**: Drag-and-drop CSV file upload
- **Real-time Feedback**: Loading states and progress indicators
- **Results Display**: Beautiful cards showing predictions and recommendations
- **Error Handling**: Comprehensive error messages and validation

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState<'demo' | 'upload' | 'status'>('demo');
const [isLoading, setIsLoading] = useState(false);
const [predictions, setPredictions] = useState<Prediction[]>([]);
const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
```

**API Integration**:
```typescript
const runDemo = async () => {
  const response = await fetch('/api/trendwise/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadTimeDays }),
  });
  const data = await response.json();
  setPredictions(data.results.predictions || []);
};
```

### 3. Python Model Interface (`model/use_sample_data.py`)

**Purpose**: Command-line interface for the AI model that can be called from Node.js

**Command Line Arguments**:
```python
parser.add_argument('--demo', action='store_true', help='Run quick demo')
parser.add_argument('--train', action='store_true', help='Train model')
parser.add_argument('--predict', action='store_true', help='Make predictions')
parser.add_argument('--generate', action='store_true', help='Generate sample data')
parser.add_argument('--sales-file', type=str, help='Path to sales CSV file')
parser.add_argument('--inventory-file', type=str, help='Path to inventory CSV file')
parser.add_argument('--lead-time', type=int, default=7, help='Lead time in days')
```

**Output Parsing**:
```python
def parsePredictionsOutput(output):
    lines = output.split('\n')
    predictions = []
    for line in lines:
        if line.includes('SKU:') and line.includes('Forecast:'):
            # Parse prediction data
            predictions.append({...})
    return predictions
```

## 🔄 Data Flow

### 1. Demo Flow
```
User clicks "Run AI Demo" 
    ↓
Frontend calls /api/trendwise/demo
    ↓
Backend spawns Python process: python use_sample_data.py --demo
    ↓
Python generates sample data, trains model, makes predictions
    ↓
Python returns results to Node.js
    ↓
Node.js parses and returns JSON to frontend
    ↓
Frontend displays predictions in UI
```

### 2. Custom Training Flow
```
User uploads CSV files
    ↓
Frontend sends files to /api/trendwise/train
    ↓
Backend saves files and spawns Python process
    ↓
Python loads data, trains model, saves model
    ↓
Python returns training results
    ↓
Backend returns success/error to frontend
    ↓
Frontend shows training status
```

### 3. Prediction Flow
```
User uploads data and clicks "Make Predictions"
    ↓
Frontend sends files to /api/trendwise/predict
    ↓
Backend spawns Python process with uploaded files
    ↓
Python loads trained model, makes predictions
    ↓
Python returns predictions with confidence scores
    ↓
Backend parses and returns structured data
    ↓
Frontend displays predictions with recommendations
```

## 🎨 UI/UX Design

### Design Principles
- **Modern & Clean**: Minimalist design with focus on functionality
- **Intuitive**: Clear navigation and logical flow
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Proper contrast, keyboard navigation, screen reader support

### Color Scheme
- **Primary**: `#556B2F` (Dark Olive Green)
- **Secondary**: `#8F9779` (Sage Green)
- **Background**: `#F5F5F0` (Off White)
- **Accent**: `#A3B18A` (Light Sage)

### Component Structure
```
TrendWiseAI
├── Header (Gradient background with title)
├── Message Display (Success/Error notifications)
├── Tab Navigation (Demo, Upload, Status)
├── Tab Content
│   ├── Demo Tab
│   │   ├── Lead Time Input
│   │   ├── Generate Sample Data Button
│   │   ├── Demo Information
│   │   └── Run Demo Button
│   ├── Upload Tab
│   │   ├── File Upload Areas
│   │   ├── File Requirements
│   │   ├── Train Model Button
│   │   └── Make Predictions Button
│   └── Status Tab
│       ├── Model Status
│       └── Sample Data Status
└── Results Section (Prediction Cards)
```

## 🔒 Security Considerations

### File Upload Security
- **File Type Validation**: Only CSV files allowed
- **File Size Limits**: 10MB maximum per file
- **Virus Scanning**: Files saved to isolated directory
- **Input Sanitization**: All file paths validated

### API Security
- **Authentication**: JWT token validation
- **Rate Limiting**: Prevent abuse of AI endpoints
- **Input Validation**: All parameters validated
- **Error Handling**: No sensitive information in error messages

### Model Security
- **Isolated Execution**: Python processes run in isolated environment
- **Resource Limits**: Memory and CPU limits on model execution
- **Timeout Protection**: Automatic timeout for long-running operations

## 🚀 Performance Optimization

### Frontend Optimizations
- **Lazy Loading**: Components loaded on demand
- **Debounced Input**: Reduce API calls during typing
- **Caching**: Cache model status and results
- **Optimistic Updates**: Show immediate feedback

### Backend Optimizations
- **Connection Pooling**: Reuse database connections
- **File Streaming**: Stream large files instead of loading in memory
- **Process Pooling**: Reuse Python processes when possible
- **Response Compression**: Compress API responses

### Model Optimizations
- **Model Caching**: Cache trained models in memory
- **Batch Processing**: Process multiple predictions together
- **Parallel Execution**: Run multiple models in parallel
- **Memory Management**: Clean up model resources

## 🧪 Testing Strategy

### Frontend Testing
```typescript
// Component testing
describe('TrendWiseAI', () => {
  it('should run demo successfully', async () => {
    // Test demo functionality
  });
  
  it('should handle file uploads', async () => {
    // Test file upload
  });
});
```

### Backend Testing
```javascript
// API endpoint testing
describe('/api/trendwise/demo', () => {
  it('should return predictions', async () => {
    // Test demo endpoint
  });
});
```

### Model Testing
```python
# Model functionality testing
def test_basic_functionality():
    # Test model training and prediction
    pass
```

## 📊 Monitoring & Logging

### Application Logging
```javascript
// Backend logging
console.log(`[TRENDWISE] Training model for ${skuCount} SKUs`);
console.log(`[TRENDWISE] Prediction completed in ${duration}ms`);
```

### Model Logging
```python
# Python model logging
print(f"Training completed! Trained models for {len(training_result)} SKUs")
print(f"Generated {len(predictions)} predictions")
```

### Error Tracking
- **Frontend Errors**: Sentry integration for React errors
- **Backend Errors**: Structured logging with error codes
- **Model Errors**: Detailed error messages with stack traces

## 🔄 Deployment Considerations

### Environment Setup
- **Python Environment**: Virtual environment with exact dependencies
- **Node.js Environment**: Production build with optimized bundles
- **File Permissions**: Proper permissions for file uploads and model access

### Scaling Strategy
- **Horizontal Scaling**: Multiple Node.js instances behind load balancer
- **Model Scaling**: Separate model servers for heavy computation
- **Database Scaling**: Read replicas for analytics queries

### Monitoring
- **Health Checks**: Regular health checks for all components
- **Performance Metrics**: Track API response times and model accuracy
- **Error Alerts**: Automated alerts for system failures

## 🎯 Future Enhancements

### Planned Features
- **Real-time Predictions**: WebSocket-based real-time updates
- **Model Versioning**: Track and manage multiple model versions
- **Advanced Analytics**: More detailed performance metrics
- **Batch Processing**: Process large datasets in background
- **Model Comparison**: Compare different model performances

### Technical Improvements
- **Microservices**: Split into separate microservices
- **Containerization**: Docker containers for easy deployment
- **CI/CD Pipeline**: Automated testing and deployment
- **API Documentation**: OpenAPI/Swagger documentation
- **GraphQL**: More efficient data fetching

---

This integration provides a seamless bridge between the modern web interface and the powerful AI model, making advanced demand forecasting accessible to users through an intuitive, beautiful interface.
