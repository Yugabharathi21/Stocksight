# How to Use Sample Data Generator with TrendWise Demand Forecaster

This guide shows you how to generate sample CSV data and use it to train the TrendWise Demand Forecaster model.

## Quick Start

### Option 1: Run the Complete Demo Script

```bash
cd model
python use_sample_data.py
```

This will:
1. Generate sample CSV files
2. Load the CSV files
3. Train the forecaster
4. Make predictions
5. Save the trained model

### Option 2: Step-by-Step Manual Process

#### Step 1: Generate Sample Data

```python
from sample_data_generator import SampleDataGenerator

# Create the generator
generator = SampleDataGenerator()

# Generate and save sample data to CSV files
generator.save_sample_data("model/sample_data")
```

This creates the following CSV files:
- `model/sample_data/sample_sales.csv` - Sales data with date, sku, sales_qty
- `model/sample_data/sample_inventory.csv` - Inventory data with SKU, Current Stock, etc.
- `model/sample_data/seasonal_sales.csv` - Seasonal sales patterns
- `model/sample_data/seasonal_inventory.csv` - Seasonal inventory data

#### Step 2: Load the CSV Files

```python
import pandas as pd

# Load the generated CSV files
sales_df = pd.read_csv("model/sample_data/sample_sales.csv")
inventory_df = pd.read_csv("model/sample_data/sample_inventory.csv")

# Convert date column to datetime
sales_df['date'] = pd.to_datetime(sales_df['date'])

print(f"Loaded {len(sales_df)} sales records")
print(f"Loaded {len(inventory_df)} inventory records")
```

#### Step 3: Train the TrendWise Forecaster

```python
from trendwise_forecaster import TrendWiseForecaster

# Create and train the forecaster
forecaster = TrendWiseForecaster()

# Train the model with the sales data
training_result = forecaster.train_forecaster(sales_df)

print(f"Training completed!")
print(f"Best model: {training_result['best_model']}")
print(f"Validation MAPE: {training_result['validation_mape']:.4f}")

# Save the trained model
forecaster.save_model()
```

#### Step 4: Make Predictions

```python
# Make predictions using the trained model
predictions = forecaster.predict_demand(sales_df, inventory_df, lead_time_days=7)

print(f"Generated {len(predictions)} predictions:")
for pred in predictions[:3]:  # Show first 3 predictions
    print(f"SKU: {pred['sku']}")
    print(f"  Forecast: {pred['point_forecast']:.1f} units")
    print(f"  Confidence: {pred['confidence_score']:.2f}")
    print(f"  Recommendation: {pred['recommendation']}")
    print(f"  Model used: {pred['model_used']}")
```

## CSV File Formats

### Sales Data Format (`sample_sales.csv`)

| date | sku | sales_qty |
|------|-----|-----------|
| 2024-01-01 | PROD001 | 25 |
| 2024-01-01 | PROD002 | 18 |
| 2024-01-02 | PROD001 | 30 |
| ... | ... | ... |

**Required columns:**
- `date`: Date of the sale (will be converted to datetime)
- `sku`: Product SKU identifier
- `sales_qty`: Quantity sold (numeric)

### Inventory Data Format (`sample_inventory.csv`)

| Name | SKU | Category | Current Stock | Price | Total Value |
|------|-----|----------|---------------|-------|-------------|
| Smartphone X | PROD001 | Electronics | 45 | 599.99 | 26999.55 |
| Cotton T-Shirt | PROD002 | Clothing | 32 | 24.99 | 799.68 |
| ... | ... | ... | ... | ... | ... |

**Required columns:**
- `SKU`: Product SKU identifier (must match sales data)
- `Current Stock`: Current inventory level (numeric)
- `Price`: Unit price (numeric)

## Sample Data Features

The generated sample data includes:

1. **8 Different Products** with realistic patterns:
   - Smartphone X (Electronics) - Weekly seasonality
   - Cotton T-Shirt (Clothing) - Monthly seasonality
   - Organic Apples (Food) - Daily seasonality
   - Gaming Laptop (Electronics) - Weekly seasonality
   - Running Shoes (Sports) - Monthly seasonality
   - Coffee Beans (Food) - Daily seasonality
   - Wireless Headphones (Electronics) - Weekly seasonality
   - Denim Jeans (Clothing) - Monthly seasonality

2. **Realistic Patterns**:
   - Base demand levels
   - Seasonal variations (weekly, monthly, daily)
   - Trends (gradual increases)
   - Noise/volatility
   - Zero sales days (5% probability)

3. **Time Period**: 6 months of daily data (Jan 2024 - Jun 2024)

## Using Your Own CSV Data

To use your own CSV data, ensure it follows the same format:

1. **Sales CSV** must have columns: `date`, `sku`, `sales_qty`
2. **Inventory CSV** must have columns: `SKU`, `Current Stock`, `Price`
3. **Date format** should be parseable by pandas (e.g., "2024-01-01", "01/01/2024")
4. **SKU values** must match between sales and inventory files

Example with your own data:

```python
# Load your own CSV files
your_sales_df = pd.read_csv("your_sales_data.csv")
your_inventory_df = pd.read_csv("your_inventory_data.csv")

# Convert date column
your_sales_df['date'] = pd.to_datetime(your_sales_df['date'])

# Train the model
forecaster = TrendWiseForecaster()
training_result = forecaster.train_forecaster(your_sales_df)

# Make predictions
predictions = forecaster.predict_demand(your_sales_df, your_inventory_df)
```

## Quick Test

For faster testing with minimal data:

```python
from sample_data_generator import SampleDataGenerator
from trendwise_forecaster import TrendWiseForecaster

# Generate minimal test data (3 products, 3 months)
generator = SampleDataGenerator()
sales_df, inventory_df = generator.generate_sales_data(
    start_date=pd.Timestamp('2024-01-01'),
    end_date=pd.Timestamp('2024-03-31'),
    products=['PROD001', 'PROD002', 'PROD003']
), generator.generate_inventory_data(['PROD001', 'PROD002', 'PROD003'])

# Train and predict
forecaster = TrendWiseForecaster()
training_result = forecaster.train_forecaster(sales_df)
predictions = forecaster.predict_demand(sales_df, inventory_df)

print(f"Generated {len(predictions)} predictions")
```

## Troubleshooting

### Common Issues:

1. **Missing dependencies**: Install required packages from `requirements.txt`
2. **Date parsing errors**: Ensure your date column is in a standard format
3. **SKU mismatch**: Make sure SKU values are identical between sales and inventory files
4. **Memory issues**: Use the quick test option for large datasets

### Error Messages:

- `"No module named 'prophet'"` → Run `pip install prophet`
- `"Date column not found"` → Check your CSV column names
- `"SKU not found in inventory"` → Verify SKU values match between files

## Next Steps

After training the model:

1. **Save the model**: `forecaster.save_model()`
2. **Load the model**: `forecaster = TrendWiseForecaster()` (auto-loads saved model)
3. **Make predictions**: `predictions = forecaster.predict_demand(sales_df, inventory_df)`
4. **Integrate with your application**: Use the API functions in your code

The trained model will be saved as `trendwise_forecaster.pkl` and can be reused for future predictions without retraining.
