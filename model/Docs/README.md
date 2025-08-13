# TrendWise Demand Forecaster

A sophisticated time-series machine learning model that predicts next month's product demand using the last 3 months of sales data, capturing seasonal patterns, trends, and uncertainty, then generating stock recommendations based on current inventory.

## Features

### 🎯 **Advanced Forecasting**
- **Prophet-based forecasting** with automatic seasonality detection
- **Fallback models** (SES, Moving Average, Naive) for robustness
- **Automatic model selection** based on validation performance
- **Confidence intervals** for uncertainty quantification

### 📊 **Smart Preprocessing**
- **Auto-frequency detection** (daily/weekly)
- **Missing data handling** with intelligent filling
- **Outlier detection and capping** using IQR method
- **Log transformation** for skewed distributions

### 🛒 **Inventory Intelligence**
- **Safety stock calculation** with configurable service levels
- **Stock recommendations** (Increase/Maintain/Reduce)
- **Lead time consideration** in calculations
- **Multi-SKU support** with individual models per product

## Installation

1. **Install Python dependencies:**
```bash
pip install -r model/requirements.txt
```

2. **Verify installation:**
```python
from model.trendwise_forecaster import TrendWiseForecaster
print("TrendWise Forecaster ready!")
```

## Data Requirements

### Sales Data Format
```csv
date,sku,sales_qty
2024-01-01,PROD001,10
2024-01-02,PROD001,15
2024-01-01,PROD002,5
```

**Required columns:**
- `date`: Date in YYYY-MM-DD format
- `sku`: Product SKU (string)
- `sales_qty`: Sales quantity (numeric)

**Minimum data:** At least 90 daily or 12 weekly sales records per SKU

### Inventory Data Format
```csv
Name,SKU,Category,Current Stock,Price,Total Value
Product A,PROD001,Electronics,50,29.99,1499.50
Product B,PROD002,Clothing,25,19.99,499.75
```

## Quick Start

### Basic Usage
```python
import pandas as pd
from model.trendwise_forecaster import predict_demand

# Load your data
sales_df = pd.read_csv('sales_data.csv')
inventory_df = pd.read_csv('inventory_data.csv')

# Get predictions and recommendations
predictions = predict_demand(sales_df, inventory_df)

# View results
for pred in predictions:
    print(f"SKU: {pred['sku']}")
    print(f"Forecast: {pred['point_forecast']:.0f} units")
    print(f"Recommendation: {pred['recommendation']}")
    print(f"Confidence: {pred['confidence_score']:.2f}")
    print("---")
```

### Advanced Usage
```python
from model.trendwise_forecaster import TrendWiseForecaster

# Initialize forecaster
forecaster = TrendWiseForecaster()

# Train models
training_results = forecaster.train_forecaster(sales_df)
print(f"Trained {len(training_results)} models")

# Get predictions with custom lead time
predictions = forecaster.predict_demand(
    sales_df, 
    inventory_df, 
    lead_time_days=14
)
```

## API Integration

### Training Function
```python
from model.trendwise_forecaster import train_forecaster

# Train the model
results = train_forecaster(sales_df)
# Returns: Dict with training results for each SKU
```

### Prediction Function
```python
from model.trendwise_forecaster import predict_demand

# Get predictions and recommendations
predictions = predict_demand(sales_df, inventory_df)
# Returns: List of dicts with forecast and recommendations
```

### Output Format
Each prediction contains:
```python
{
    'sku': 'PROD001',
    'point_forecast': 150.0,
    'lower_ci': 120.0,
    'upper_ci': 180.0,
    'confidence_score': 0.85,
    'model_used': 'Prophet',
    'current_stock': 50,
    'safety_stock': 25.0,
    'recommendation': 'Increase'
}
```

## Model Architecture

### Forecasting Pipeline
1. **Prophet Model** (Primary)
   - Additive seasonality
   - Weekly seasonality enabled
   - Auto daily seasonality
   - Optimized hyperparameters

2. **Fallback Models**
   - Simple Exponential Smoothing (SES)
   - Moving Average (7-day window)
   - Naive Last-Value

3. **Model Selection Logic**
   - If Prophet MAPE ≤ 0.3 → Use Prophet
   - Else → Choose best fallback based on validation error

### Recommendation Engine
- **Safety Stock Formula:** `z * demand_std * sqrt(lead_time_days)`
- **Service Level:** 80% (z = 1.28)
- **Recommendation Logic:**
  - Current stock ≥ forecast + safety stock → Reduce/Hold
  - Current stock between forecast and forecast + safety stock → Maintain
  - Current stock < forecast → Increase

## Configuration

### Model Parameters
```python
# Prophet parameters
prophet_params = {
    'seasonality_mode': 'additive',
    'weekly_seasonality': True,
    'daily_seasonality': 'auto',
    'yearly_seasonality': False,
    'changepoint_prior_scale': 0.05,
    'seasonality_prior_scale': 10
}

# Safety stock parameters
safety_stock_params = {
    'service_level': 0.80,  # 80% service level
    'z_score': 1.28,
    'default_lead_time': 7  # days
}
```

### Model Persistence
- **Save format:** Pickle (.pkl)
- **Save path:** `model/trendwise_forecaster.pkl`
- **Auto-load:** Enabled on startup

## Performance Metrics

### Validation Metrics
- **MAPE (Mean Absolute Percentage Error)**
- **Model selection threshold:** MAPE ≤ 0.3 for Prophet
- **Confidence score:** Based on prediction interval width

### Model Performance
- **Training time:** ~30-60 seconds per SKU
- **Prediction time:** ~1-5 seconds per SKU
- **Memory usage:** ~50-100MB per 1000 SKUs

## Error Handling

The model includes robust error handling:
- **Missing dependencies:** Graceful fallback to available models
- **Insufficient data:** Warning messages and skip logic
- **Invalid data:** Clear error messages with requirements
- **Model failures:** Automatic fallback to simpler models

## Examples

### Example 1: E-commerce Inventory
```python
# Predict demand for online store
predictions = predict_demand(ecommerce_sales, ecommerce_inventory)

# Filter for low stock items
low_stock = [p for p in predictions if p['recommendation'] == 'Increase']
print(f"Need to restock {len(low_stock)} items")
```

### Example 2: Retail Chain
```python
# Custom lead time for retail
predictions = predict_demand(
    retail_sales, 
    retail_inventory, 
    lead_time_days=21  # 3 weeks lead time
)
```

### Example 3: Seasonal Products
```python
# The model automatically detects and handles seasonality
seasonal_predictions = predict_demand(seasonal_sales, seasonal_inventory)
# Prophet will capture holiday patterns, weekly cycles, etc.
```

## Troubleshooting

### Common Issues

1. **"Prophet not available"**
   ```bash
   pip install prophet
   ```

2. **"Insufficient data"**
   - Ensure at least 90 days of data per SKU
   - Check for missing dates in your dataset

3. **"Invalid column names"**
   - Verify column names: `date`, `sku`, `sales_qty`
   - Check for extra spaces or special characters

4. **"Model training failed"**
   - Check data quality and remove extreme outliers
   - Ensure dates are in correct format
   - Verify no negative sales quantities

### Performance Tips

1. **Data Quality:**
   - Clean outliers before training
   - Ensure consistent date formats
   - Fill missing values appropriately

2. **Model Optimization:**
   - Use sufficient historical data (3+ months)
   - Consider product seasonality patterns
   - Adjust lead time based on supplier capabilities

3. **System Resources:**
   - Monitor memory usage for large datasets
   - Consider batch processing for 1000+ SKUs
   - Use SSD storage for faster model loading

## Contributing

To contribute to the TrendWise Demand Forecaster:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the example code
- Open an issue with detailed error information

---

**TrendWise Demand Forecaster** - Making inventory management intelligent and data-driven.
