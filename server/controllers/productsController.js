import { dbHelpers } from '../config/database.js';

export const productsController = {
  // Get all products
  async getProducts(req, res) {
    try {
      const { page = 1, limit = 50, category } = req.query;
      const offset = (page - 1) * limit;
      
      console.debug('[DEBUG] Getting products:', { page, limit, category });

      let products = await dbHelpers.getProducts(parseInt(limit), offset);
      
      // Filter by category if provided
      if (category) {
        products = products.filter(product => 
          product.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      res.json({
        success: true,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: products.length
        }
      });

    } catch (error) {
      console.error('[ERROR] Get products error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch products', 
        details: error.message 
      });
    }
  },

  // Get single product
  async getProduct(req, res) {
    try {
      const { id } = req.params;
      console.debug('[DEBUG] Getting product:', id);

      const product = await dbHelpers.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({
        success: true,
        product
      });

    } catch (error) {
      console.error('[ERROR] Get product error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch product', 
        details: error.message 
      });
    }
  },

  // Create new product (Admin only)
  async createProduct(req, res) {
    try {
      const { 
        name, 
        sku, 
        category, 
        currentStock, 
        minStockLevel, 
        maxStockLevel, 
        unitPrice,
        supplierInfo 
      } = req.body;
      
      console.debug('[DEBUG] Creating product:', { name, sku, category });

      // Validation
      if (!name || !sku || !category || unitPrice === undefined) {
        return res.status(400).json({ 
          error: 'Name, SKU, category, and unit price are required' 
        });
      }

      const productData = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim(),
        current_stock: currentStock || 0,
        min_stock_level: minStockLevel || 10,
        max_stock_level: maxStockLevel || 1000,
        unit_price: parseFloat(unitPrice),
        supplier_info: supplierInfo || {}
      };

      const newProduct = await dbHelpers.createProduct(productData);

      // Check if stock is low and create alert
      if (newProduct.current_stock <= newProduct.min_stock_level) {
        await dbHelpers.createAlert({
          product_id: newProduct.id,
          alert_type: 'low_stock',
          message: `Low stock alert: ${newProduct.name} is running low (${newProduct.current_stock} units)`
        });
      }

      console.debug('[DEBUG] Product created successfully:', newProduct.id);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product: newProduct
      });

    } catch (error) {
      console.error('[ERROR] Create product error:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ 
          error: 'Product with this SKU already exists' 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to create product', 
        details: error.message 
      });
    }
  },

  // Update product (Admin only)
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      console.debug('[DEBUG] Updating product:', id, updates);

      // Remove non-updatable fields
      delete updates.id;
      delete updates.created_at;
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updates.updated_at = new Date().toISOString();

      const updatedProduct = await dbHelpers.updateProduct(id, updates);

      // Check stock levels and create alerts if needed
      if (updates.current_stock !== undefined) {
        if (updatedProduct.current_stock <= updatedProduct.min_stock_level) {
          await dbHelpers.createAlert({
            product_id: updatedProduct.id,
            alert_type: 'low_stock',
            message: `Low stock alert: ${updatedProduct.name} is running low (${updatedProduct.current_stock} units)`
          });
        } else if (updatedProduct.current_stock >= updatedProduct.max_stock_level) {
          await dbHelpers.createAlert({
            product_id: updatedProduct.id,
            alert_type: 'overstock',
            message: `Overstock alert: ${updatedProduct.name} has excess inventory (${updatedProduct.current_stock} units)`
          });
        }
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct
      });

    } catch (error) {
      console.error('[ERROR] Update product error:', error);
      res.status(500).json({ 
        error: 'Failed to update product', 
        details: error.message 
      });
    }
  },

  // Get low stock products
  async getLowStockProducts(req, res) {
    try {
      console.debug('[DEBUG] Getting low stock products');

      const products = await dbHelpers.getProducts(100, 0);
      const lowStockProducts = products.filter(product => 
        product.current_stock <= product.min_stock_level
      );

      res.json({
        success: true,
        products: lowStockProducts,
        count: lowStockProducts.length
      });

    } catch (error) {
      console.error('[ERROR] Get low stock products error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch low stock products', 
        details: error.message 
      });
    }
  },

  // Get product analytics
  async getProductAnalytics(req, res) {
    try {
      const { id } = req.params;
      console.debug('[DEBUG] Getting product analytics:', id);

      const product = await dbHelpers.getProductById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Get sales data for the product
      const salesData = await dbHelpers.getSalesData(id, 100);
      
      // Get forecasts for the product
      const forecasts = await dbHelpers.getForecastsByProduct(id, 14);

      // Calculate analytics
      const totalSales = salesData.reduce((sum, sale) => sum + sale.quantity_sold, 0);
      const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.quantity_sold * sale.sale_price), 0);
      const avgDailySales = salesData.length > 0 ? totalSales / salesData.length : 0;

      const analytics = {
        product,
        sales: {
          totalSales,
          totalRevenue,
          avgDailySales,
          recentSales: salesData.slice(0, 10)
        },
        forecasts: forecasts.slice(0, 7), // Next 7 days
        stockStatus: {
          current: product.current_stock,
          min: product.min_stock_level,
          max: product.max_stock_level,
          daysRemaining: avgDailySales > 0 ? Math.floor(product.current_stock / avgDailySales) : null
        }
      };

      res.json({
        success: true,
        analytics
      });

    } catch (error) {
      console.error('[ERROR] Get product analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch product analytics', 
        details: error.message 
      });
    }
  }
};
