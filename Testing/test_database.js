import { supabaseAdmin } from './server/config/database.js';

async function testDatabase() {
  console.log('Testing database connection...\n');

  try {
    // Test products table
    console.log('1. Testing products table...');
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    if (productsError) {
      console.error('Products table error:', productsError);
    } else {
      console.log('Products count:', products);
    }

    // Test sales_data table
    console.log('\n2. Testing sales_data table...');
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales_data')
      .select('count', { count: 'exact', head: true });
    
    if (salesError) {
      console.error('Sales data table error:', salesError);
    } else {
      console.log('Sales records count:', sales);
    }

    // Test if we can fetch some actual data
    console.log('\n3. Testing data fetching...');
    const { data: sampleProducts, error: sampleError } = await supabaseAdmin
      .from('products')
      .select('id, name, sku')
      .limit(5);
    
    if (sampleError) {
      console.error('Sample data fetch error:', sampleError);
    } else {
      console.log('Sample products:', sampleProducts);
    }

  } catch (error) {
    console.error('Database test failed:', error.message);
  }
}

testDatabase();
