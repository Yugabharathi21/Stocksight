"""
Test script for TrendWise Demand Forecaster
Demonstrates the model functionality with sample data.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from trendwise_forecaster import TrendWiseForecaster, predict_demand, train_forecaster

def create_sample_sales_data():
    """Create sample sales data for testing."""
    # Generate 6 months of daily sales data for 3 products
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 6, 30)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    sales_data = []
    
    # Product 1: Electronics with weekly seasonality
    for date in dates:
        # Base demand with weekly pattern (higher on weekends)
        base_demand = 20
        weekly_pattern = 10 if date.weekday() >= 5 else 0  # Weekend boost
        trend = (date - start_date).days * 0.1  # Slight upward trend
        noise = np.random.normal(0, 5)
        
        sales_qty = max(0, int(base_demand + weekly_pattern + trend + noise))
        sales_data.append({
            'date': date,
            'sku': 'PROD001',
            'sales_qty': sales_qty
        })
    
    # Product 2: Clothing with monthly seasonality
    for date in dates:
        # Base demand with monthly pattern
        base_demand = 15
        monthly_pattern = 8 if date.day <= 7 else 0  # First week boost
        trend = (date - start_date).days * 0.05  # Gentle upward trend
        noise = np.random.normal(0, 3)
        
        sales_qty = max(0, int(base_demand + monthly_pattern + trend + noise))
        sales_data.append({
            'date': date,
            'sku': 'PROD002',
            'sales_qty': sales_qty
        })
    
    # Product 3: Food items with daily seasonality
    for date in dates:
        # Base demand with daily pattern
        base_demand = 30
        daily_pattern = 15 if date.weekday() < 5 else 0  # Weekday boost
        trend = (date - start_date).days * 0.02  # Very gentle trend
        noise = np.random.normal(0, 4)
        
        sales_qty = max(0, int(base_demand + daily_pattern + trend + noise))
        sales_data.append({
            'date': date,
            'sku': 'PROD003',
            'sales_qty': sales_qty
        })
    
    return pd.DataFrame(sales_data)

def create_sample_inventory_data():
    """Create sample inventory data for testing."""
    inventory_data = [
        {
            'Name': 'Smartphone X',
            'SKU': 'PROD001',
            'Category': 'Electronics',
            'Current Stock': 45,
            'Price': 599.99,
            'Total Value': 26999.55
        },
        {
            'Name': 'Cotton T-Shirt',
            'SKU': 'PROD002',
            'Category': 'Clothing',
            'Current Stock': 120,
            'Price': 24.99,
            'Total Value': 2998.80
        },
        {
            'Name': 'Organic Apples',
            'SKU': 'PROD003',
            'Category': 'Food',
            'Current Stock': 200,
            'Price': 4.99,
            'Total Value': 998.00
        }
    ]
    
    return pd.DataFrame(inventory_data)

def test_basic_functionality():
    """Test basic forecaster functionality."""
    print("=== Testing TrendWise Demand Forecaster ===\n")
    
    # Create sample data
    print("1. Creating sample data...")
    sales_df = create_sample_sales_data()
    inventory_df = create_sample_inventory_data()
    
    print(f"   Sales data: {len(sales_df)} records for {sales_df['sku'].nunique()} products")
    print(f"   Inventory data: {len(inventory_df)} products")
    print(f"   Date range: {sales_df['date'].min()} to {sales_df['date'].max()}")
    
    # Test training
    print("\n2. Training forecasting models...")
    try:
        forecaster = TrendWiseForecaster()
        training_results = forecaster.train_forecaster(sales_df)
        
        print(f"   Successfully trained {len(training_results)} models:")
        for sku, result in training_results.items():
            print(f"     {sku}: {result['model_type']} (MAPE: {result['validation_mape']:.3f})")
    
    except Exception as e:
        print(f"   Training failed: {e}")
        return
    
    # Test predictions
    print("\n3. Generating predictions and recommendations...")
    try:
        predictions = forecaster.predict_demand(sales_df, inventory_df)
        
        print(f"   Generated {len(predictions)} predictions:")
        for pred in predictions:
            print(f"\n   SKU: {pred['sku']}")
            print(f"     Forecast: {pred['point_forecast']:.1f} units")
            print(f"     Confidence: {pred['confidence_score']:.2f}")
            print(f"     Current Stock: {pred['current_stock']}")
            print(f"     Safety Stock: {pred['safety_stock']:.1f}")
            print(f"     Recommendation: {pred['recommendation']}")
            print(f"     Model Used: {pred['model_used']}")
    
    except Exception as e:
        print(f"   Prediction failed: {e}")
    
    # Test convenience functions
    print("\n4. Testing convenience functions...")
    try:
        # Test predict_demand function
        predictions_conv = predict_demand(sales_df, inventory_df)
        print(f"   Convenience function returned {len(predictions_conv)} predictions")
        
        # Test train_forecaster function
        train_results = train_forecaster(sales_df)
        print(f"   Training function returned {len(train_results)} results")
        
    except Exception as e:
        print(f"   Convenience functions failed: {e}")
    
    print("\n=== Test completed ===")

def test_data_validation():
    """Test data validation and error handling."""
    print("\n=== Testing Data Validation ===\n")
    
    # Test with missing columns
    print("1. Testing missing columns...")
    invalid_sales = pd.DataFrame({
        'date': ['2024-01-01'],
        'product': ['PROD001'],  # Wrong column name
        'quantity': [10]  # Wrong column name
    })
    
    try:
        forecaster = TrendWiseForecaster()
        forecaster.preprocess_sales_data(invalid_sales)
        print("   ❌ Should have failed with missing columns")
    except ValueError as e:
        print(f"   ✅ Correctly caught error: {e}")
    
    # Test with insufficient data
    print("\n2. Testing insufficient data...")
    minimal_sales = pd.DataFrame({
        'date': pd.date_range('2024-01-01', periods=30, freq='D'),
        'sku': ['PROD001'] * 30,
        'sales_qty': np.random.randint(1, 20, 30)
    })
    
    try:
        forecaster = TrendWiseForecaster()
        results = forecaster.train_forecaster(minimal_sales)
        print(f"   Results: {results}")
    except Exception as e:
        print(f"   Error: {e}")

def test_model_persistence():
    """Test model saving and loading."""
    print("\n=== Testing Model Persistence ===\n")
    
    # Create data and train model
    sales_df = create_sample_sales_data()
    forecaster = TrendWiseForecaster()
    
    print("1. Training and saving model...")
    training_results = forecaster.train_forecaster(sales_df)
    print(f"   Trained {len(training_results)} models")
    
    # Create new forecaster instance
    print("\n2. Loading model in new instance...")
    new_forecaster = TrendWiseForecaster()
    print(f"   Loaded {len(new_forecaster.models)} models")
    
    # Test predictions with loaded model
    inventory_df = create_sample_inventory_data()
    predictions = new_forecaster.predict_demand(sales_df, inventory_df)
    print(f"   Generated {len(predictions)} predictions with loaded model")

if __name__ == "__main__":
    # Run all tests
    test_basic_functionality()
    test_data_validation()
    test_model_persistence()
    
    print("\n" + "="*50)
    print("All tests completed!")
    print("="*50)
