#!/bin/bash

# StockSight - AI-Powered Inventory Management System
# Startup Script

echo "🚀 Starting StockSight - AI-Powered Inventory Management System"
echo "================================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
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
EOF
    echo "📝 Please edit .env file with your Supabase credentials before running again."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd model
pip install -r requirements.txt
cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p model/sample_data
mkdir -p server/uploads/trendwise

# Generate sample data if it doesn't exist
if [ ! -f "model/sample_data/sample_sales.csv" ]; then
    echo "📊 Generating sample data..."
    cd model
    python sample_data_generator.py --generate
    cd ..
fi

echo "✅ Setup complete!"
echo ""
echo "🌐 Starting the application..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/trendwise/health"
echo ""
echo "📱 Open your browser and navigate to http://localhost:3000"
echo "🤖 Access TrendWise AI from the sidebar menu"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start the application
npm run dev
