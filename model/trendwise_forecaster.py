"""
TrendWise Demand Forecaster
A time-series machine learning model that predicts next month's product demand using the last 3 months of sales data,
capturing seasonal patterns, trends, and uncertainty, then generating stock recommendations based on current inventory.
"""

import pandas as pd
import numpy as np
import pickle
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# Prophet for advanced time series forecasting
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Warning: Prophet not available. Using fallback models only.")

# Statsmodels for fallback models
try:
    from statsmodels.tsa.holtwinters import SimpleExpSmoothing
    from statsmodels.tsa.stattools import adfuller
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    print("Warning: Statsmodels not available. Limited fallback models.")

class TrendWiseForecaster:
    """
    Main forecasting class implementing the TrendWise Demand Forecaster.
    """
    
    def __init__(self, model_path: str = "model/trendwise_forecaster.pkl"):
        self.model_path = model_path
        self.models = {}  # Store trained models for each SKU
        self.model_metadata = {}  # Store metadata about each model
        self.load_on_startup = True
        
        # Create model directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Load existing model if available
        if self.load_on_startup and os.path.exists(model_path):
            self.load_model()
    
    def preprocess_sales_data(self, sales_df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess sales data according to specifications.
        
        Args:
            sales_df: DataFrame with columns [date, sku, sales_qty]
            
        Returns:
            Preprocessed DataFrame
        """
        # Validate required columns
        required_cols = ['date', 'sku', 'sales_qty']
        if not all(col in sales_df.columns for col in required_cols):
            raise ValueError(f"Sales data must contain columns: {required_cols}")
        
        # Parse dates and sort chronologically
        sales_df['date'] = pd.to_datetime(sales_df['date'])
        sales_df = sales_df.sort_values(['sku', 'date'])
        
        # Aggregate sales by date and SKU if multiple entries exist
        sales_df = sales_df.groupby(['date', 'sku'])['sales_qty'].sum().reset_index()
        
        # Auto-detect frequency and fill missing dates
        for sku in sales_df['sku'].unique():
            sku_data = sales_df[sales_df['sku'] == sku].copy()
            
            # Detect frequency
            date_diffs = sku_data['date'].diff().dropna()
            if len(date_diffs) > 0:
                most_common_diff = date_diffs.mode().iloc[0]
                if most_common_diff.days == 1:
                    freq = 'D'
                elif most_common_diff.days == 7:
                    freq = 'W'
                else:
                    freq = 'D'  # Default to daily
            else:
                freq = 'D'
            
            # Create complete date range
            date_range = pd.date_range(
                start=sku_data['date'].min(),
                end=sku_data['date'].max(),
                freq=freq
            )
            
            # Reindex and fill missing values with 0
            complete_data = pd.DataFrame({'date': date_range})
            complete_data = complete_data.merge(sku_data, on='date', how='left')
            complete_data['sku'] = sku
            complete_data['sales_qty'] = complete_data['sales_qty'].fillna(0)
            
            # Remove or cap extreme outliers using IQR
            q1 = complete_data['sales_qty'].quantile(0.25)
            q3 = complete_data['sales_qty'].quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            # Cap outliers instead of removing
            complete_data['sales_qty'] = np.where(
                complete_data['sales_qty'] < lower_bound,
                lower_bound,
                complete_data['sales_qty']
            )
            complete_data['sales_qty'] = np.where(
                complete_data['sales_qty'] > upper_bound,
                upper_bound,
                complete_data['sales_qty']
            )
            
            # Optional log1p transform for skewed series
            if complete_data['sales_qty'].skew() > 1.0:
                complete_data['sales_qty'] = np.log1p(complete_data['sales_qty'])
            
            # Update the dataframe
            sales_df = sales_df[sales_df['sku'] != sku]
            sales_df = pd.concat([sales_df, complete_data], ignore_index=True)
        
        return sales_df.sort_values(['sku', 'date'])
    
    def train_forecaster(self, sales_df: pd.DataFrame) -> Dict:
        """
        Train forecasting models for all SKUs in the sales data.
        
        Args:
            sales_df: Preprocessed sales DataFrame
            
        Returns:
            Dictionary with training results
        """
        sales_df = self.preprocess_sales_data(sales_df)
        results = {}
        
        for sku in sales_df['sku'].unique():
            sku_data = sales_df[sales_df['sku'] == sku].copy()
            
            if len(sku_data) < 90:  # Minimum data requirement
                print(f"Warning: SKU {sku} has insufficient data ({len(sku_data)} points). Skipping.")
                continue
            
            # Prepare data for Prophet
            prophet_data = sku_data[['date', 'sales_qty']].rename(
                columns={'date': 'ds', 'sales_qty': 'y'}
            )
            
            # Split data for validation (last 30 days)
            train_data = prophet_data.iloc[:-30]
            val_data = prophet_data.iloc[-30:]
            
            # Try Prophet first
            prophet_model = None
            prophet_mape = float('inf')
            
            if PROPHET_AVAILABLE:
                try:
                    prophet_model = Prophet(
                        seasonality_mode='additive',
                        weekly_seasonality=True,
                        daily_seasonality='auto',
                        yearly_seasonality=False,
                        changepoint_prior_scale=0.05,
                        seasonality_prior_scale=10
                    )
                    prophet_model.fit(train_data)
                    
                    # Validate Prophet model
                    prophet_forecast = prophet_model.predict(val_data[['ds']])
                    prophet_mape = self._calculate_mape(val_data['y'], prophet_forecast['yhat'])
                    
                except Exception as e:
                    print(f"Prophet training failed for SKU {sku}: {e}")
                    prophet_mape = float('inf')
            
            # Try fallback models
            fallback_model = None
            fallback_mape = float('inf')
            fallback_type = None
            
            if STATSMODELS_AVAILABLE:
                # Simple Exponential Smoothing
                try:
                    # Set proper date index for statsmodels
                    train_data_indexed = train_data.copy()
                    train_data_indexed = train_data_indexed.set_index('ds')
                    
                    ses_model = SimpleExpSmoothing(train_data_indexed['y'])
                    ses_fitted = ses_model.fit()
                    ses_forecast = ses_fitted.forecast(len(val_data))
                    ses_mape = self._calculate_mape(val_data['y'], ses_forecast)
                    
                    if ses_mape < fallback_mape:
                        fallback_model = ses_fitted
                        fallback_mape = ses_mape
                        fallback_type = 'SES'
                except Exception as e:
                    print(f"SES training failed for SKU {sku}: {e}")
                    pass
                
                # Moving Average
                try:
                    ma_forecast = train_data['y'].rolling(window=7).mean().iloc[-1]
                    ma_forecast = [ma_forecast] * len(val_data)
                    ma_mape = self._calculate_mape(val_data['y'], ma_forecast)
                    
                    if ma_mape < fallback_mape:
                        fallback_model = {'type': 'MA', 'value': ma_forecast[0]}
                        fallback_mape = ma_mape
                        fallback_type = 'MA'
                except:
                    pass
            
            # Naive Last-Value
            try:
                naive_forecast = [train_data['y'].iloc[-1]] * len(val_data)
                naive_mape = self._calculate_mape(val_data['y'], naive_forecast)
                
                if naive_mape < fallback_mape:
                    fallback_model = {'type': 'Naive', 'value': naive_forecast[0]}
                    fallback_mape = naive_mape
                    fallback_type = 'Naive'
            except:
                pass
            
            # Model selection logic
            if prophet_mape <= 0.3 and prophet_model is not None:
                selected_model = prophet_model
                selected_type = 'Prophet'
                selected_mape = prophet_mape
            else:
                selected_model = fallback_model
                selected_type = fallback_type
                selected_mape = fallback_mape
            
            # Store model and metadata
            self.models[sku] = selected_model
            self.model_metadata[sku] = {
                'model_type': selected_type,
                'validation_mape': selected_mape,
                'last_trained': datetime.now(),
                'data_points': len(sku_data)
            }
            
            results[sku] = {
                'model_type': selected_type,
                'validation_mape': selected_mape,
                'status': 'success'
            }
        
        # Save the trained models
        self.save_model()
        
        return results
    
    def predict_demand(self, sales_df: pd.DataFrame, inventory_df: pd.DataFrame, 
                      lead_time_days: int = 7) -> List[Dict]:
        """
        Predict demand and generate stock recommendations.
        
        Args:
            sales_df: Sales data DataFrame
            inventory_df: Inventory data DataFrame
            lead_time_days: Lead time in days for safety stock calculation
            
        Returns:
            List of dictionaries containing forecast and recommendations
        """
        # Ensure models are trained
        if not self.models:
            print("No trained models found. Training models first...")
            self.train_forecaster(sales_df)
        
        sales_df = self.preprocess_sales_data(sales_df)
        predictions = []
        
        for _, inventory_row in inventory_df.iterrows():
            sku = inventory_row['SKU']
            current_stock = inventory_row['Current Stock']
            
            if sku not in self.models:
                print(f"Warning: No model found for SKU {sku}. Skipping.")
                continue
            
            # Get forecast
            forecast_result = self._get_forecast(sku, sales_df)
            
            if forecast_result is None:
                continue
            
            # Calculate safety stock
            safety_stock = self._calculate_safety_stock(sku, sales_df, lead_time_days)
            
            # Generate stock recommendation
            recommendation = self._generate_recommendation(
                forecast_result['point_forecast'],
                current_stock,
                safety_stock
            )
            
            # Calculate confidence score
            confidence_score = 1 - ((forecast_result['upper_ci'] - forecast_result['lower_ci']) / 
                                   max(1, forecast_result['point_forecast']))
            
            prediction = {
                'sku': sku,
                'point_forecast': forecast_result['point_forecast'],
                'lower_ci': forecast_result['lower_ci'],
                'upper_ci': forecast_result['upper_ci'],
                'confidence_score': confidence_score,
                'model_used': self.model_metadata[sku]['model_type'],
                'current_stock': current_stock,
                'safety_stock': safety_stock,
                'recommendation': recommendation
            }
            
            predictions.append(prediction)
        
        return predictions
    
    def _get_forecast(self, sku: str, sales_df: pd.DataFrame) -> Optional[Dict]:
        """Get forecast for a specific SKU."""
        if sku not in self.models:
            return None
        
        model = self.models[sku]
        model_type = self.model_metadata[sku]['model_type']
        
        # Get recent data for the SKU
        sku_data = sales_df[sales_df['sku'] == sku].copy()
        if len(sku_data) == 0:
            return None
        
        # Generate forecast based on model type
        if model_type == 'Prophet':
            # Create future dates for next month
            last_date = sku_data['date'].max()
            future_dates = pd.date_range(
                start=last_date + timedelta(days=1),
                periods=30,
                freq='D'
            )
            future_df = pd.DataFrame({'ds': future_dates})
            
            forecast = model.predict(future_df)
            point_forecast = forecast['yhat'].sum()  # Sum for monthly forecast
            lower_ci = forecast['yhat_lower'].sum()
            upper_ci = forecast['yhat_upper'].sum()
            
        elif model_type in ['SES', 'MA', 'Naive']:
            # For fallback models, use simple extrapolation
            recent_data = sku_data['sales_qty'].tail(30)
            point_forecast = recent_data.mean() * 30  # Monthly forecast
            
            # Simple confidence intervals
            std_dev = recent_data.std()
            lower_ci = max(0, point_forecast - 1.96 * std_dev * np.sqrt(30))
            upper_ci = point_forecast + 1.96 * std_dev * np.sqrt(30)
        
        else:
            return None
        
        return {
            'point_forecast': point_forecast,
            'lower_ci': lower_ci,
            'upper_ci': upper_ci
        }
    
    def _calculate_safety_stock(self, sku: str, sales_df: pd.DataFrame, 
                               lead_time_days: int) -> float:
        """Calculate safety stock using the specified formula."""
        sku_data = sales_df[sales_df['sku'] == sku]['sales_qty']
        demand_std = sku_data.std()
        z = 1.28  # For ~80% service level
        safety_stock = z * demand_std * np.sqrt(lead_time_days)
        return max(0, safety_stock)
    
    def _generate_recommendation(self, forecast: float, current_stock: float, 
                                safety_stock: float) -> str:
        """Generate stock recommendation based on forecast and current stock."""
        total_required = forecast + safety_stock
        
        if current_stock >= total_required:
            return "Reduce/Hold"
        elif current_stock >= forecast:
            return "Maintain"
        else:
            return "Increase"
    
    def _calculate_mape(self, actual: pd.Series, predicted: pd.Series) -> float:
        """Calculate Mean Absolute Percentage Error."""
        actual = np.array(actual)
        predicted = np.array(predicted)
        
        # Avoid division by zero
        mask = actual != 0
        if not mask.any():
            return float('inf')
        
        return np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask]))
    
    def save_model(self):
        """Save the trained models to disk."""
        model_data = {
            'models': self.models,
            'metadata': self.model_metadata
        }
        
        with open(self.model_path, 'wb') as f:
            pickle.dump(model_data, f)
    
    def load_model(self):
        """Load trained models from disk."""
        try:
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            self.models = model_data['models']
            self.model_metadata = model_data['metadata']
            print(f"Loaded {len(self.models)} trained models.")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            self.models = {}
            self.model_metadata = {}


# Convenience functions for API integration
def train_forecaster(sales_df: pd.DataFrame) -> Dict:
    """Train the TrendWise forecaster with sales data."""
    forecaster = TrendWiseForecaster()
    return forecaster.train_forecaster(sales_df)


def predict_demand(sales_df: pd.DataFrame, inventory_df: pd.DataFrame) -> List[Dict]:
    """Predict demand and generate recommendations."""
    forecaster = TrendWiseForecaster()
    return forecaster.predict_demand(sales_df, inventory_df)


if __name__ == "__main__":
    # Example usage
    print("TrendWise Demand Forecaster")
    print("Example usage:")
    print("from model.trendwise_forecaster import predict_demand")
    print("predictions = predict_demand(sales_df, inventory_df)")
