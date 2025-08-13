# StockSight - AI-Powered Inventory Management System

A comprehensive inventory management system with advanced AI-powered demand forecasting using the TrendWise Demand Forecaster model.

## 🚀 Features

### Core Features
- **Real-time Inventory Management** - Track products, stock levels, and valuations
- **AI-Powered Demand Forecasting** - Advanced machine learning predictions
- **Smart Alerts & Notifications** - Automated inventory alerts
- **Multi-User Support** - Role-based access control
- **Organization Management** - Multi-tenant support
- **Data Import/Export** - CSV upload and export capabilities
- **Analytics Dashboard** - Comprehensive reporting and insights

### TrendWise AI Features
- **Advanced Time-Series Forecasting** - Prophet-based predictions with fallback models
- **Seasonal Pattern Detection** - Automatic seasonality and trend analysis
- **Smart Recommendations** - AI-powered inventory recommendations
- **Model Persistence** - Save and load trained models
- **Real-time Predictions** - Instant demand forecasts
- **Confidence Intervals** - Uncertainty quantification
- **Multiple Model Support** - Prophet, SES, Moving Average, Naive models

### TrendWise Pro Features (NEW!)
- **Database-Driven Pipeline** - No file uploads required, direct database integration
- **Auto Pipeline** - One-click training and prediction generation
- **Smart Data Detection** - Automatic fallback to sample data when needed
- **Real-Time Status Monitoring** - Live pipeline status and progress tracking
- **Data Health Dashboard** - Comprehensive database connectivity and quality metrics
- **Automatic Alert Generation** - Smart inventory alerts based on predictions
- **Professional UI** - Advanced interface with multiple tabs and analytics

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **Supabase** for database and authentication
- **Python** for AI/ML models
- **Multer** for file uploads
- **JWT** for authentication

### AI/ML Stack
- **Prophet** - Primary forecasting model
- **Statsmodels** - Fallback models (SES, Moving Average)
- **Pandas** - Data manipulation
- **NumPy** - Numerical operations
- **Scikit-learn** - Additional ML utilities

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- npm or yarn
- Supabase account

### Quick Start
```bash
# Clone and setup
git clone <repository-url>
cd Stocksightmain

# Install dependencies
npm install
pip install -r model/requirements.txt

# Start the application
npm run dev
```

### Professional Pipeline Setup
The new TrendWise Pro feature is automatically available once the application is running. No additional setup required!

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Stocksightmain
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Python Dependencies
```bash
cd model
pip install -r requirements.txt
cd ..
```

### 4. Environment Setup
Create a `.env` file in the root directory:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration (optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 5. Database Setup
Run the Supabase migrations:
```bash
npx supabase db push
```

## 🚀 Running the Application

### Development Mode
```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run dev:server  # Backend only
npm run dev:frontend # Frontend only
```

### Production Build
```bash
npm run build
npm run preview
```

## 🤖 Using TrendWise AI

### Quick Demo
1. Navigate to "TrendWise AI" in the sidebar
2. Click "Generate Sample Data" to create test data
3. Click "Run AI Demo" to see the model in action
4. View predictions and recommendations

### Custom Training
1. Prepare your CSV files:
   - **Sales Data**: `date`, `sku`, `sales_qty` columns
   - **Inventory Data**: `SKU`, `Current Stock`, `Price` columns
2. Upload files in the "Upload & Train" tab
3. Set lead time and click "Train Model"
4. Make predictions with your trained model

### API Endpoints
- `GET /api/trendwise/health` - Model health check
- `POST /api/trendwise/generate-sample-data` - Generate sample data
- `POST /api/trendwise/train` - Train model with uploaded files
- `POST /api/trendwise/predict` - Make predictions
- `POST /api/trendwise/demo` - Run quick demo
- `GET /api/trendwise/status` - Check model status

## 📊 Data Formats

### Sales Data CSV
```csv
date,sku,sales_qty
2024-01-01,PROD001,25
2024-01-01,PROD002,18
2024-01-02,PROD001,30
```

### Inventory Data CSV
```csv
Name,SKU,Category,Current Stock,Price,Total Value
Smartphone X,PROD001,Electronics,45,599.99,26999.55
Cotton T-Shirt,PROD002,Clothing,32,24.99,799.68
```

## 🔧 Configuration

### Model Configuration
Edit `model/config.py` to customize:
- Prophet parameters
- Fallback model settings
- Recommendation thresholds
- Safety stock calculations

### Application Settings
- **Lead Time**: Default 7 days (configurable per prediction)
- **Confidence Level**: 80% service level for safety stock
- **Model Selection**: Automatic based on MAPE threshold (0.3)

## 📈 Model Performance

### Accuracy Metrics
- **MAPE (Mean Absolute Percentage Error)**: Primary accuracy metric
- **Confidence Intervals**: Uncertainty quantification
- **Model Selection**: Automatic based on validation performance

### Supported Models
1. **Prophet** - Primary model for complex patterns
2. **Simple Exponential Smoothing** - Fallback for trend data
3. **Moving Average** - Fallback for stable data
4. **Naive Last-Value** - Simple baseline

## 🔒 Security

- **JWT Authentication** - Secure user sessions
- **Role-based Access** - Admin, Manager, User roles
- **Input Validation** - File type and size restrictions
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Cross-origin request handling

## 🧪 Testing

### Frontend Tests
```bash
npm run test
```

### Model Tests
```bash
cd model
python test_forecaster.py
```

### API Tests
```bash
# Test model endpoints
curl http://localhost:3001/api/trendwise/health
```

## 📝 API Documentation

### Authentication
All API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Error Handling
Standard HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `500` - Internal Server Error

## 🚀 Deployment

### Docker Deployment
```bash
# Build the image
docker build -t stocksight .

# Run the container
docker run -p 3000:3000 -p 3001:3001 stocksight
```

### Environment Variables
Set production environment variables:
```env
NODE_ENV=production
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the model documentation in `/model/README.md`

## 🔄 Changelog

### v1.0.0
- Initial release with TrendWise AI integration
- Complete inventory management system
- Advanced demand forecasting
- Multi-user support
- Real-time analytics

---

**Built with ❤️ using React, Node.js, and Python**
