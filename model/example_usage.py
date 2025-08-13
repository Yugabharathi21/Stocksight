"""
Example Usage of TrendWise Demand Forecaster
Demonstrates how to use the model with sample data.
"""

import pandas as pd
from sample_data_generator import create_minimal_test_data
from trendwise_forecaster import TrendWiseForecaster, predict_demand, train_forecaster

def basic_example():
    """Basic example showing how to use the forecaster."""
    print("=== TrendWise Demand Forecaster - Basic Example ===\n")
    
    # Step 1: Create sample data
    print("1. Creating sample data...")
    sales_df, inventory_df = create_minimal_test_data()
    
    print(f"   Sales data: {len(sales_df)} records")
    print(f"   Products: {sales_df['sku'].nunique()}")
    print(f"   Date range: {sales_df['date'].min()} to {sales_df['date'].max()}")
    print(f"   Inventory items: {len(inventory_df)}")
    
    # Step 2: Train the model
    print("\n2. Training forecasting models...")
    forecaster = TrendWiseForecaster()
    training_results = forecaster.train_forecaster(sales_df)
    
    print(f"   Trained {len(training_results)} models:")
    for sku, result in training_results.items():
        print(f"     {sku}: {result['model_type']} (MAPE: {result['validation_mape']:.3f})")
    
    # Step 3: Generate predictions
    print("\n3. Generating predictions and recommendations...")
    predictions = forecaster.predict_demand(sales_df, inventory_df)
    
    print(f"   Generated {len(predictions)} predictions:")
    for pred in predictions:
        print(f"\n   📦 {pred['sku']}")
        print(f"      📊 Forecast: {pred['point_forecast']:.1f} units")
        print(f"      📈 Confidence: {pred['confidence_score']:.2f}")
        print(f"      📦 Current Stock: {pred['current_stock']}")
        print(f"      🛡️  Safety Stock: {pred['safety_stock']:.1f}")
        print(f"      💡 Recommendation: {pred['recommendation']}")
        print(f"      🤖 Model: {pred['model_used']}")
    
    return predictions

def convenience_function_example():
    """Example using convenience functions."""
    print("\n=== Using Convenience Functions ===\n")
    
    # Create sample data
    sales_df, inventory_df = create_minimal_test_data()
    
    # Use convenience function for predictions
    print("Using predict_demand() convenience function...")
    predictions = predict_demand(sales_df, inventory_df)
    
    print(f"Generated {len(predictions)} predictions using convenience function")
    
    # Show summary
    recommendations = {}
    for pred in predictions:
        rec = pred['recommendation']
        if rec not in recommendations:
            recommendations[rec] = 0
        recommendations[rec] += 1
    
    print("\n📋 Recommendation Summary:")
    for rec, count in recommendations.items():
        print(f"   {rec}: {count} products")
    
    return predictions

def custom_lead_time_example():
    """Example with custom lead time."""
    print("\n=== Custom Lead Time Example ===\n")
    
    # Create sample data
    sales_df, inventory_df = create_minimal_test_data()
    
    # Use different lead times
    lead_times = [7, 14, 21]  # 1 week, 2 weeks, 3 weeks
    
    for lead_time in lead_times:
        print(f"Lead time: {lead_time} days")
        forecaster = TrendWiseForecaster()
        predictions = forecaster.predict_demand(sales_df, inventory_df, lead_time_days=lead_time)
        
        # Show average safety stock
        avg_safety_stock = sum(p['safety_stock'] for p in predictions) / len(predictions)
        print(f"   Average safety stock: {avg_safety_stock:.1f} units")
        
        # Show recommendations
        recommendations = {}
        for pred in predictions:
            rec = pred['recommendation']
            if rec not in recommendations:
                recommendations[rec] = 0
            recommendations[rec] += 1
        
        for rec, count in recommendations.items():
            print(f"   {rec}: {count} products")
        print()

def seasonal_data_example():
    """Example with seasonal data."""
    print("\n=== Seasonal Data Example ===\n")
    
    # Create seasonal data
    from sample_data_generator import SampleDataGenerator
    generator = SampleDataGenerator()
    
    # Generate seasonal sales data
    seasonal_sales = generator.generate_seasonal_sales_data()
    
    # Create seasonal inventory
    seasonal_inventory_data = [
        {
            'Name': 'Winter Coat',
            'SKU': 'WINTER_COAT',
            'Category': 'Clothing',
            'Current Stock': 15,
            'Price': 199.99,
            'Total Value': 2999.85
        },
        {
            'Name': 'Summer Dress',
            'SKU': 'SUMMER_DRESS',
            'Category': 'Clothing',
            'Current Stock': 25,
            'Price': 79.99,
            'Total Value': 1999.75
        },
        {
            'Name': 'Christmas Tree',
            'SKU': 'CHRISTMAS_TREE',
            'Category': 'Holiday',
            'Current Stock': 8,
            'Price': 89.99,
            'Total Value': 719.92
        }
    ]
    seasonal_inventory = pd.DataFrame(seasonal_inventory_data)
    
    print("Training model with seasonal data...")
    forecaster = TrendWiseForecaster()
    training_results = forecaster.train_forecaster(seasonal_sales)
    
    print("Generating predictions for seasonal products...")
    predictions = forecaster.predict_demand(seasonal_sales, seasonal_inventory)
    
    print(f"Generated {len(predictions)} seasonal predictions:")
    for pred in predictions:
        print(f"\n   🎄 {pred['sku']}")
        print(f"      📊 Forecast: {pred['point_forecast']:.1f} units")
        print(f"      💡 Recommendation: {pred['recommendation']}")
        print(f"      🤖 Model: {pred['model_used']}")
    
    return predictions

def main():
    """Run all examples."""
    print("🚀 TrendWise Demand Forecaster Examples")
    print("=" * 50)
    
    try:
        # Basic example
        basic_example()
        
        # Convenience function example
        convenience_function_example()
        
        # Custom lead time example
        custom_lead_time_example()
        
        # Seasonal data example
        seasonal_data_example()
        
        print("\n✅ All examples completed successfully!")
        print("\n💡 Tips:")
        print("   - Use the convenience functions for quick predictions")
        print("   - Adjust lead time based on your supplier capabilities")
        print("   - The model automatically handles seasonality")
        print("   - Check confidence scores for prediction reliability")
        
    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        print("Make sure you have installed the required dependencies:")
        print("   pip install -r model/requirements.txt")

if __name__ == "__main__":
    main()
