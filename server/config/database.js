import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Check your .env file.');
  process.exit(1);
}

// Create admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabaseAdmin.from('products').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('[DB] Connection test failed:', error.message);
      return false;
    }
    console.log('[DB] ✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('[DB] Connection test error:', error.message);
    return false;
  }
};

// Database helper functions
export const dbHelpers = {
  // Users
  async getUserByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Get user by email:', error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Create user:', error);
      throw error;
    }
  },

  async updateUser(id, updates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Update user:', error);
      throw error;
    }
  },

  // Products
  async getProducts(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Get products:', error);
      throw error;
    }
  },

  async getProductById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Get product by ID:', error);
      throw error;
    }
  },

  async createProduct(productData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Create product:', error);
      throw error;
    }
  },

  async updateProduct(id, updates) {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Update product:', error);
      throw error;
    }
  },

  // Sales Data
  async getSalesData(productId = null, limit = 100) {
    try {
      let query = supabaseAdmin
        .from('sales_data')
        .select('*, products(name, sku)')
        .order('sale_date', { ascending: false })
        .limit(limit);
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Get sales data:', error);
      throw error;
    }
  },

  async createSalesRecord(salesData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sales_data')
        .insert([salesData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Create sales record:', error);
      throw error;
    }
  },

  // Alerts
  async getAlerts(isRead = null, limit = 50) {
    try {
      let query = supabaseAdmin
        .from('inventory_alerts')
        .select('*, products(name, sku)')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (isRead !== null) {
        query = query.eq('is_read', isRead);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Get alerts:', error);
      throw error;
    }
  },

  async createAlert(alertData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_alerts')
        .insert([alertData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Create alert:', error);
      throw error;
    }
  },

  async markAlertAsRead(alertId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('inventory_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Mark alert as read:', error);
      throw error;
    }
  },

  // Forecasts
  async getForecastsByProduct(productId, days = 14) {
    try {
      const { data, error } = await supabaseAdmin
        .from('demand_forecasts')
        .select('*')
        .eq('product_id', productId)
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true })
        .limit(days);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Get forecasts by product:', error);
      throw error;
    }
  },

  async createForecast(forecastData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('demand_forecasts')
        .insert([forecastData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ERROR] Create forecast:', error);
      throw error;
    }
  }
};
