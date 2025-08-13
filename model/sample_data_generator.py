"""
Sample Data Generator for TrendWise Demand Forecaster
Creates realistic sales and inventory data for testing and demonstration.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

class SampleDataGenerator:
    """Generate realistic sample data for testing the TrendWise Demand Forecaster."""
    
    def __init__(self):
        self.products = {
            'PROD001': {
                'name': 'Smartphone X',
                'category': 'Electronics',
                'base_demand': 20,
                'seasonality': 'weekly',  # Higher on weekends
                'trend': 0.1,  # Slight upward trend
                'volatility': 5,
                'price': 599.99
            },
            'PROD002': {
                'name': 'Cotton T-Shirt',
                'category': 'Clothing',
                'base_demand': 15,
                'seasonality': 'monthly',  # Higher in first week
                'trend': 0.05,
                'volatility': 3,
                'price': 24.99
            },
            'PROD003': {
                'name': 'Organic Apples',
                'category': 'Food',
                'base_demand': 30,
                'seasonality': 'daily',  # Higher on weekdays
                'trend': 0.02,
                'volatility': 4,
                'price': 4.99
            },
            'PROD004': {
                'name': 'Gaming Laptop',
                'category': 'Electronics',
                'base_demand': 8,
                'seasonality': 'weekly',  # Higher on weekends
                'trend': 0.15,
                'volatility': 3,
                'price': 1299.99
            },
            'PROD005': {
                'name': 'Running Shoes',
                'category': 'Sports',
                'base_demand': 12,
                'seasonality': 'monthly',  # Higher in first week
                'trend': 0.08,
                'volatility': 4,
                'price': 89.99
            },
            'PROD006': {
                'name': 'Coffee Beans',
                'category': 'Food',
                'base_demand': 25,
                'seasonality': 'daily',  # Higher on weekdays
                'trend': 0.03,
                'volatility': 5,
                'price': 12.99
            },
            'PROD007': {
                'name': 'Wireless Headphones',
                'category': 'Electronics',
                'base_demand': 18,
                'seasonality': 'weekly',
                'trend': 0.12,
                'volatility': 4,
                'price': 149.99
            },
            'PROD008': {
                'name': 'Denim Jeans',
                'category': 'Clothing',
                'base_demand': 10,
                'seasonality': 'monthly',
                'trend': 0.06,
                'volatility': 3,
                'price': 59.99
            }
        }
    
    def generate_sales_data(self, start_date=None, end_date=None, products=None):
        """
        Generate realistic sales data.
        
        Args:
            start_date (datetime): Start date for sales data
            end_date (datetime): End date for sales data
            products (list): List of product SKUs to generate data for
            
        Returns:
            pd.DataFrame: Sales data with columns [date, sku, sales_qty]
        """
        if start_date is None:
            start_date = datetime(2024, 1, 1)
        if end_date is None:
            end_date = datetime(2024, 6, 30)
        if products is None:
            products = list(self.products.keys())
        
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        sales_data = []
        
        for sku in products:
            if sku not in self.products:
                continue
                
            product = self.products[sku]
            
            for date in dates:
                # Base demand
                demand = product['base_demand']
                
                # Add seasonality
                if product['seasonality'] == 'weekly':
                    # Weekend boost for electronics
                    if date.weekday() >= 5:  # Saturday, Sunday
                        demand += 10
                elif product['seasonality'] == 'monthly':
                    # First week boost for clothing
                    if date.day <= 7:
                        demand += 8
                elif product['seasonality'] == 'daily':
                    # Weekday boost for food
                    if date.weekday() < 5:  # Monday to Friday
                        demand += 15
                
                # Add trend
                days_since_start = (date - start_date).days
                trend_effect = days_since_start * product['trend']
                demand += trend_effect
                
                # Add noise/volatility
                noise = np.random.normal(0, product['volatility'])
                demand += noise
                
                # Ensure non-negative
                demand = max(0, int(demand))
                
                # Add some zero sales days (realistic)
                if random.random() < 0.05:  # 5% chance of zero sales
                    demand = 0
                
                sales_data.append({
                    'date': date,
                    'sku': sku,
                    'sales_qty': demand
                })
        
        return pd.DataFrame(sales_data)
    
    def generate_inventory_data(self, products=None):
        """
        Generate realistic inventory data.
        
        Args:
            products (list): List of product SKUs to generate data for
            
        Returns:
            pd.DataFrame: Inventory data with standard columns
        """
        if products is None:
            products = list(self.products.keys())
        
        inventory_data = []
        
        for sku in products:
            if sku not in self.products:
                continue
                
            product = self.products[sku]
            
            # Generate realistic current stock based on base demand
            base_stock = product['base_demand'] * random.uniform(2, 5)  # 2-5 days of stock
            current_stock = max(0, int(base_stock + np.random.normal(0, base_stock * 0.3)))
            
            # Calculate total value
            total_value = current_stock * product['price']
            
            inventory_data.append({
                'Name': product['name'],
                'SKU': sku,
                'Category': product['category'],
                'Current Stock': current_stock,
                'Price': product['price'],
                'Total Value': round(total_value, 2)
            })
        
        return pd.DataFrame(inventory_data)
    
    def generate_seasonal_sales_data(self, start_date=None, end_date=None):
        """
        Generate sales data with strong seasonal patterns.
        
        Args:
            start_date (datetime): Start date
            end_date (datetime): End date
            
        Returns:
            pd.DataFrame: Sales data with seasonal patterns
        """
        if start_date is None:
            start_date = datetime(2024, 1, 1)
        if end_date is None:
            end_date = datetime(2024, 12, 31)
        
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        sales_data = []
        
        # Seasonal products
        seasonal_products = {
            'WINTER_COAT': {
                'name': 'Winter Coat',
                'category': 'Clothing',
                'base_demand': 5,
                'price': 199.99
            },
            'SUMMER_DRESS': {
                'name': 'Summer Dress',
                'category': 'Clothing',
                'base_demand': 8,
                'price': 79.99
            },
            'CHRISTMAS_TREE': {
                'name': 'Christmas Tree',
                'category': 'Holiday',
                'base_demand': 2,
                'price': 89.99
            }
        }
        
        for sku, product in seasonal_products.items():
            for date in dates:
                demand = product['base_demand']
                
                # Winter coat: high demand in winter months
                if sku == 'WINTER_COAT':
                    month = date.month
                    if month in [12, 1, 2]:  # Winter
                        demand *= 8
                    elif month in [11, 3]:  # Late fall/early spring
                        demand *= 4
                    else:
                        demand *= 0.5
                
                # Summer dress: high demand in summer months
                elif sku == 'SUMMER_DRESS':
                    month = date.month
                    if month in [6, 7, 8]:  # Summer
                        demand *= 6
                    elif month in [5, 9]:  # Late spring/early fall
                        demand *= 3
                    else:
                        demand *= 0.3
                
                # Christmas tree: high demand in December
                elif sku == 'CHRISTMAS_TREE':
                    month = date.month
                    if month == 12:
                        demand *= 15
                    elif month == 11:
                        demand *= 3
                    else:
                        demand *= 0.1
                
                # Add noise
                demand += np.random.normal(0, demand * 0.3)
                demand = max(0, int(demand))
                
                sales_data.append({
                    'date': date,
                    'sku': sku,
                    'sales_qty': demand
                })
        
        return pd.DataFrame(sales_data)
    
    def save_sample_data(self, output_dir="model/sample_data"):
        """
        Generate and save sample data files.
        
        Args:
            output_dir (str): Directory to save sample data files
        """
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate regular sales data
        print("Generating regular sales data...")
        sales_df = self.generate_sales_data()
        sales_df.to_csv(f"{output_dir}/sample_sales.csv", index=False)
        print(f"Saved {len(sales_df)} sales records to {output_dir}/sample_sales.csv")
        
        # Generate inventory data
        print("Generating inventory data...")
        inventory_df = self.generate_inventory_data()
        inventory_df.to_csv(f"{output_dir}/sample_inventory.csv", index=False)
        print(f"Saved {len(inventory_df)} inventory records to {output_dir}/sample_inventory.csv")
        
        # Generate seasonal sales data
        print("Generating seasonal sales data...")
        seasonal_sales_df = self.generate_seasonal_sales_data()
        seasonal_sales_df.to_csv(f"{output_dir}/seasonal_sales.csv", index=False)
        print(f"Saved {len(seasonal_sales_df)} seasonal sales records to {output_dir}/seasonal_sales.csv")
        
        # Generate seasonal inventory data
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
        seasonal_inventory_df = pd.DataFrame(seasonal_inventory_data)
        seasonal_inventory_df.to_csv(f"{output_dir}/seasonal_inventory.csv", index=False)
        print(f"Saved {len(seasonal_inventory_df)} seasonal inventory records to {output_dir}/seasonal_inventory.csv")
        
        print(f"\nAll sample data files saved to {output_dir}/")
        print("Files created:")
        print("  - sample_sales.csv")
        print("  - sample_inventory.csv")
        print("  - seasonal_sales.csv")
        print("  - seasonal_inventory.csv")

def create_minimal_test_data():
    """
    Create minimal test data for quick testing.
    
    Returns:
        tuple: (sales_df, inventory_df)
    """
    generator = SampleDataGenerator()
    
    # Generate minimal data (just 3 products, 3 months)
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 3, 31)
    
    sales_df = generator.generate_sales_data(
        start_date=start_date,
        end_date=end_date,
        products=['PROD001', 'PROD002', 'PROD003']
    )
    
    inventory_df = generator.generate_inventory_data(
        products=['PROD001', 'PROD002', 'PROD003']
    )
    
    return sales_df, inventory_df

if __name__ == "__main__":
    # Generate and save sample data
    generator = SampleDataGenerator()
    generator.save_sample_data()
    
    print("\nSample data generation completed!")
    print("You can now use these files to test the TrendWise Demand Forecaster.")
