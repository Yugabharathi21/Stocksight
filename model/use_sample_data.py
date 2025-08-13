"""
How to Use Sample Data Generator with TrendWise Demand Forecaster
This script shows you how to:
1. Generate sample CSV data
2. Load the CSV files
3. Train the forecaster
4. Make predictions
"""

import pandas as pd
import os
from sample_data_generator import SampleDataGenerator
from trendwise_forecaster import TrendWiseForecaster

def generate_and_train():
    """
    Step-by-step process to generate sample data and train the model.
    """
    print("=== Step 1: Generate Sample Data ===")
    
    # Create the sample data generator
    generator = SampleDataGenerator()
    
    # Generate and save sample data to CSV files
    generator.save_sample_data("model/sample_data")
    
    print("\n=== Step 2: Load the CSV Files ===")
    
    # Load the generated CSV files
    sales_df = pd.read_csv("model/sample_data/sample_sales.csv")
    inventory_df = pd.read_csv("model/sample_data/sample_inventory.csv")
    
    print(f"Loaded sales data: {len(sales_df)} records")
    print(f"Loaded inventory data: {len(inventory_df)} records")
    
    # Convert date column to datetime
    sales_df['date'] = pd.to_datetime(sales_df['date'])
    
    print("\nSales data preview:")
    print(sales_df.head())
    print("\nInventory data preview:")
    print(inventory_df.head())
    
    print("\n=== Step 3: Train the TrendWise Forecaster ===")
    
    # Create and train the forecaster
    forecaster = TrendWiseForecaster()
    
    # Train the model with the sales data
    training_result = forecaster.train_forecaster(sales_df)
    
    print("Training completed!")
    print(f"Models trained for {len(training_result)} SKUs")
    
    # Show training results for each SKU
    for sku, result in list(training_result.items())[:3]:  # Show first 3
        print(f"  {sku}: {result['model_type']} (MAPE: {result['validation_mape']:.4f})")
    
    # Save the trained model
    forecaster.save_model()
    print("Model saved to disk!")
    
    print("\n=== Step 4: Make Predictions ===")
    
    # Make predictions using the trained model
    predictions = forecaster.predict_demand(sales_df, inventory_df, lead_time_days=7)
    
    print(f"Generated {len(predictions)} predictions:")
    for pred in predictions[:5]:  # Show first 5 predictions
        print(f"SKU: {pred['sku']}")
        print(f"  Forecast: {pred['point_forecast']:.1f} units")
        print(f"  Confidence: {pred['confidence_score']:.2f}")
        print(f"  Recommendation: {pred['recommendation']}")
        print(f"  Model used: {pred['model_used']}")
        print()
    
    return forecaster, predictions

def quick_test():
    """
    Quick test with minimal data for faster execution.
    """
    print("=== Quick Test with Minimal Data ===")
    
    # Generate minimal test data
    generator = SampleDataGenerator()
    sales_df, inventory_df = generator.generate_sales_data(
        start_date=pd.Timestamp('2024-01-01'),
        end_date=pd.Timestamp('2024-03-31'),
        products=['PROD001', 'PROD002', 'PROD003']
    ), generator.generate_inventory_data(['PROD001', 'PROD002', 'PROD003'])
    
    print(f"Generated {len(sales_df)} sales records")
    print(f"Generated {len(inventory_df)} inventory records")
    
    # Train and predict
    forecaster = TrendWiseForecaster()
    training_result = forecaster.train_forecaster(sales_df)
    
    print(f"Training completed! Trained models for {len(training_result)} SKUs")
    # Show first result as example
    if training_result:
        first_sku = list(training_result.keys())[0]
        print(f"Example: {first_sku} - {training_result[first_sku]['model_type']} (MAPE: {training_result[first_sku]['validation_mape']:.4f})")
    
    predictions = forecaster.predict_demand(sales_df, inventory_df)
    
    print(f"Generated {len(predictions)} predictions:")
    for pred in predictions:
        print(f"{pred['sku']}: {pred['point_forecast']:.1f} units - {pred['recommendation']}")

def load_existing_csv_and_train():
    """
    Example of how to load existing CSV files and train the model.
    """
    print("=== Loading Existing CSV Files ===")
    
    # Check if sample data files exist
    sales_file = "model/sample_data/sample_sales.csv"
    inventory_file = "model/sample_data/sample_inventory.csv"
    
    if not os.path.exists(sales_file) or not os.path.exists(inventory_file):
        print("Sample data files not found. Please run generate_and_train() first.")
        return
    
    # Load existing CSV files
    sales_df = pd.read_csv(sales_file)
    inventory_df = pd.read_csv(inventory_file)
    
    # Convert date column
    sales_df['date'] = pd.to_datetime(sales_df['date'])
    
    print(f"Loaded {len(sales_df)} sales records from {sales_file}")
    print(f"Loaded {len(inventory_df)} inventory records from {inventory_file}")
    
    # Train the model
    forecaster = TrendWiseForecaster()
    training_result = forecaster.train_forecaster(sales_df)
    
    print(f"Training completed! Trained models for {len(training_result)} SKUs")
    # Show first result as example
    if training_result:
        first_sku = list(training_result.keys())[0]
        print(f"Example: {first_sku} - {training_result[first_sku]['model_type']} (MAPE: {training_result[first_sku]['validation_mape']:.4f})")
    
    # Make predictions
    predictions = forecaster.predict_demand(sales_df, inventory_df)
    
    print(f"Generated {len(predictions)} predictions")
    return forecaster, predictions

if __name__ == "__main__":
    print("TrendWise Demand Forecaster - Sample Data Usage Guide")
    print("=" * 60)
    
    # Choose which function to run
    choice = input("\nChoose an option:\n1. Full demo (generate data + train)\n2. Quick test\n3. Load existing CSV files\nEnter choice (1-3): ")
    
    if choice == "1":
        forecaster, predictions = generate_and_train()
    elif choice == "2":
        quick_test()
    elif choice == "3":
        forecaster, predictions = load_existing_csv_and_train()
    else:
        print("Invalid choice. Running quick test...")
        quick_test()
    
    print("\n=== Usage Summary ===")
    print("1. Run this script to generate sample CSV files")
    print("2. The CSV files will be saved in 'model/sample_data/' directory")
    print("3. Use these CSV files to train your TrendWise Demand Forecaster")
    print("4. The trained model will be saved as 'trendwise_forecaster.pkl'")
    print("5. You can then use the model to make predictions on new data")
