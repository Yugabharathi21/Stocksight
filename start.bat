@echo off
REM StockSight - AI-Powered Inventory Management System
REM Startup Script for Windows

echo 🚀 Starting StockSight - AI-Powered Inventory Management System
echo ================================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating template...
    (
        echo # Supabase Configuration
        echo SUPABASE_URL=your_supabase_url
        echo SUPABASE_ANON_KEY=your_supabase_anon_key
        echo SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
        echo.
        echo # Server Configuration
        echo PORT=3001
        echo NODE_ENV=development
        echo.
        echo # Email Configuration ^(optional^)
        echo SMTP_HOST=your_smtp_host
        echo SMTP_PORT=587
        echo SMTP_USER=your_smtp_user
        echo SMTP_PASS=your_smtp_password
    ) > .env
    echo 📝 Please edit .env file with your Supabase credentials before running again.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing Node.js dependencies...
    npm install
)

REM Install Python dependencies
echo 🐍 Installing Python dependencies...
cd model
pip install -r requirements.txt
cd ..

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist model\sample_data mkdir model\sample_data
if not exist server\uploads\trendwise mkdir server\uploads\trendwise

REM Generate sample data if it doesn't exist
if not exist model\sample_data\sample_sales.csv (
    echo 📊 Generating sample data...
    cd model
    python sample_data_generator.py --generate
    cd ..
)

echo ✅ Setup complete!
echo.
echo 🌐 Starting the application...
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo    API Docs: http://localhost:3001/api/trendwise/health
echo.
echo 📱 Open your browser and navigate to http://localhost:3000
echo 🤖 Access TrendWise AI from the sidebar menu
echo.
echo Press Ctrl+C to stop the application
echo.

REM Start the application
npm run dev
