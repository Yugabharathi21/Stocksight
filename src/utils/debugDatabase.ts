// Debug utility to test database connection
// Add this to your console to test database manually

import { supabase } from '../lib/supabase';

export const testDatabaseConnection = async () => {
  console.log('[DEBUG] 🔍 Testing database connection...');
  
  try {
    // Test 1: Check users table structure
    console.log('[DEBUG] 📋 Checking users table structure...');
    const { error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('[DEBUG] ❌ Users table error:', tableError);
    } else {
      console.log('[DEBUG] ✅ Users table accessible');
    }
    
    // Test 2: Check all users
    console.log('[DEBUG] 👥 Checking all users in database...');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('[DEBUG] ❌ Error fetching users:', usersError);
    } else {
      console.log('[DEBUG] 📊 All users:', allUsers);
      console.log('[DEBUG] 📈 Total users count:', allUsers?.length || 0);
    }
    
    // Test 3: Check auth users
    console.log('[DEBUG] 🔐 Checking current auth user...');
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[DEBUG] ❌ Auth error:', authError);
    } else {
      console.log('[DEBUG] 👤 Current auth user:', authUser.user);
    }
    
    return {
      tableAccessible: !tableError,
      usersCount: allUsers?.length || 0,
      currentAuthUser: authUser.user,
      allUsers: allUsers
    };
    
  } catch (error) {
    console.error('[DEBUG] 💥 Database test failed:', error);
    return { error };
  }
};

export const testUserCreation = async (email: string, fullName: string) => {
  console.log('[DEBUG] 👤 Testing manual user creation...');
  console.log('[DEBUG] 📧 Email:', email);
  console.log('[DEBUG] 👤 Name:', fullName);
  
  try {
    // First check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[DEBUG] ❌ Error checking existing user:', checkError);
      return { error: checkError };
    }
    
    if (existingUser) {
      console.log('[DEBUG] ⚠️ User already exists:', existingUser);
      return { user: existingUser, existed: true };
    }
    
    // Try to create user
    const userData = {
      email: email,
      full_name: fullName,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('[DEBUG] 📝 Creating user with data:', userData);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (createError) {
      console.error('[DEBUG] ❌ User creation failed:', createError);
      return { error: createError };
    }
    
    console.log('[DEBUG] ✅ User created successfully:', newUser);
    return { user: newUser, created: true };
    
  } catch (error) {
    console.error('[DEBUG] 💥 Manual user creation failed:', error);
    return { error };
  }
};

// Add functions to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testDB = testDatabaseConnection; // eslint-disable-line @typescript-eslint/no-explicit-any
  (window as any).testCreateUser = testUserCreation; // eslint-disable-line @typescript-eslint/no-explicit-any
}
