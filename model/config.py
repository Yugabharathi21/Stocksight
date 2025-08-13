"""
Configuration file for TrendWise Demand Forecaster
Contains all model parameters and settings for easy customization.
"""

# Model Configuration
MODEL_CONFIG = {
    "model_name": "TrendWise Demand Forecaster",
    "model_description": "A time-series machine learning model that predicts next month's product demand using the last 3 months of sales data, capturing seasonal patterns, trends, and uncertainty, then generating stock recommendations based on current inventory.",
    "version": "1.0.0",
    "author": "StockSight Team"
}

# Data Requirements
DATA_REQUIREMENTS = {
    "sales_data_format": "CSV or Pandas DataFrame",
    "sales_data_columns": [
        "date (YYYY-MM-DD)",
        "sku (string)",
        "sales_qty (numeric)"
    ],
    "inventory_data_format": "CSV or Pandas DataFrame",
    "inventory_data_columns": [
        "Name",
        "SKU",
        "Category",
        "Current Stock",
        "Price",
        "Total Value"
    ],
    "minimum_data_points": "At least 90 daily or 12 weekly sales records per SKU"
}

# Preprocessing Configuration
PREPROCESSING_CONFIG = {
    "steps": [
        "Parse dates and sort chronologically",
        "Aggregate sales by date and SKU if multiple entries exist",
        "Auto-detect frequency (daily/weekly)",
        "Fill missing dates with sales_qty=0 unless disabled",
        "Remove or cap extreme outliers using IQR",
        "Optional log1p transform for skewed series"
    ],
    "outlier_detection": {
        "method": "IQR",
        "multiplier": 1.5,
        "action": "cap"  # "cap" or "remove"
    },
    "log_transform": {
        "enabled": True,
        "skew_threshold": 1.0
    },
    "missing_data": {
        "fill_strategy": "zero",
        "interpolation": False
    }
}

# Prophet Model Configuration
PROPHET_CONFIG = {
    "library": "prophet",
    "params": {
        "seasonality_mode": "additive",
        "weekly_seasonality": True,
        "daily_seasonality": "auto",
        "yearly_seasonality": False,
        "changepoint_prior_scale": 0.05,
        "seasonality_prior_scale": 10,
        "holidays_prior_scale": 10,
        "interval_width": 0.8
    },
    "validation": {
        "test_periods": 30,  # days
        "mape_threshold": 0.3  # 30% MAPE threshold for model selection
    }
}

# Fallback Models Configuration
FALLBACK_MODELS_CONFIG = {
    "models": [
        "Simple Exponential Smoothing (SES)",
        "Moving Average",
        "Naive Last-Value"
    ],
    "ses_config": {
        "smoothing_level": None,  # Auto-optimize
        "smoothing_sliding": None,  # Auto-optimize
        "smoothing_bias": None  # Auto-optimize
    },
    "moving_average_config": {
        "window_size": 7,  # 7-day moving average
        "min_periods": 1
    },
    "naive_config": {
        "method": "last_value"  # Use last observed value
    }
}

# Model Selection Logic
MODEL_SELECTION_CONFIG = {
    "logic": [
        "If Prophet's validation MAPE <= 0.3 → use Prophet",
        "Else choose best fallback based on validation error"
    ],
    "metrics": ["MAPE"],  # Primary metric for model selection
    "fallback_priority": ["SES", "MA", "Naive"]  # Priority order for fallbacks
}

# Forecast Output Configuration
FORECAST_CONFIG = {
    "horizon": "Next 1 month (matching detected frequency)",
    "fields": [
        "sku",
        "point_forecast",
        "lower_ci",
        "upper_ci",
        "confidence_score",
        "model_used"
    ],
    "confidence_score_formula": "1 - ((upper_ci - lower_ci) / max(1, point_forecast))",
    "prediction_interval": 0.8  # 80% confidence interval
}

# Recommendation Engine Configuration
RECOMMENDATION_CONFIG = {
    "inputs": [
        "point_forecast",
        "current_stock",
        "lead_time_days (default=7)"
    ],
    "logic": [
        "If current_stock >= forecast + safety_stock → Reduce/Hold",
        "If current_stock between forecast and forecast + safety_stock → Maintain",
        "If current_stock < forecast → Increase"
    ],
    "safety_stock": {
        "formula": "z * demand_std * sqrt(lead_time_days)",
        "service_level": 0.80,  # 80% service level
        "z_score": 1.28,  # Corresponds to 80% service level
        "default_lead_time": 7  # days
    },
    "recommendations": {
        "increase": "Increase",
        "maintain": "Maintain",
        "reduce": "Reduce/Hold"
    }
}

# Model Persistence Configuration
PERSISTENCE_CONFIG = {
    "save_format": "Pickle (.pkl)",
    "save_path": "model/trendwise_forecaster.pkl",
    "load_on_startup": True,
    "backup_enabled": True,
    "backup_path": "model/trendwise_forecaster_backup.pkl"
}

# API Integration Configuration
API_CONFIG = {
    "train_function": "train_forecaster(sales_df)",
    "predict_function": "predict_demand(sales_df, inventory_df)",
    "returns": "List of dicts containing forecast, confidence score, and stock recommendation",
    "example_usage": {
        "code_snippet": "from model.trendwise_forecaster import predict_demand\npredictions = predict_demand(sales_df, inventory_df)"
    }
}

# Performance Configuration
PERFORMANCE_CONFIG = {
    "training": {
        "max_skus_per_batch": 100,
        "parallel_processing": False,
        "memory_limit_mb": 1024
    },
    "prediction": {
        "batch_size": 50,
        "timeout_seconds": 300
    },
    "validation": {
        "cross_validation_folds": 3,
        "min_training_periods": 60  # days
    }
}

# Logging Configuration
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "model/forecaster.log",
    "console_output": True
}

# Error Handling Configuration
ERROR_HANDLING_CONFIG = {
    "graceful_fallback": True,
    "max_retries": 3,
    "continue_on_error": True,
    "log_errors": True
}

# All configurations combined
FULL_CONFIG = {
    "model": MODEL_CONFIG,
    "data_requirements": DATA_REQUIREMENTS,
    "preprocessing": PREPROCESSING_CONFIG,
    "prophet": PROPHET_CONFIG,
    "fallback_models": FALLBACK_MODELS_CONFIG,
    "model_selection": MODEL_SELECTION_CONFIG,
    "forecast": FORECAST_CONFIG,
    "recommendation": RECOMMENDATION_CONFIG,
    "persistence": PERSISTENCE_CONFIG,
    "api": API_CONFIG,
    "performance": PERFORMANCE_CONFIG,
    "logging": LOGGING_CONFIG,
    "error_handling": ERROR_HANDLING_CONFIG
}

def get_config(section=None):
    """
    Get configuration for a specific section or all configurations.
    
    Args:
        section (str, optional): Configuration section name
        
    Returns:
        dict: Configuration dictionary
    """
    if section is None:
        return FULL_CONFIG
    return FULL_CONFIG.get(section, {})

def update_config(section, key, value):
    """
    Update a specific configuration value.
    
    Args:
        section (str): Configuration section name
        key (str): Configuration key
        value: New value
        
    Returns:
        bool: True if updated successfully
    """
    if section in FULL_CONFIG and key in FULL_CONFIG[section]:
        FULL_CONFIG[section][key] = value
        return True
    return False
