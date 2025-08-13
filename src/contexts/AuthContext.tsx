import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = async (authUser: SupabaseUser) => { 
    console.log('[AUTH] 🔍 Loading user profile for:', authUser?.email);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );

      // First, check database state with timeout
      console.log('[AUTH] 📊 Testing database connection...');
      const dbCheckPromise = supabase
        .from('users')
        .select('*')
        .limit(1);
      
      const { data: allUsers, error: dbError } = await Promise.race([
        dbCheckPromise,
        timeoutPromise
      ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      console.log('[AUTH] 📊 Database state - total users:', allUsers?.length || 0);
      if (dbError) {
        console.error('[AUTH] ❌ Database error:', dbError);
        throw dbError;
      }

      // Try to get the user profile with timeout
      console.log('[AUTH] 🔍 Querying user profile for ID:', authUser.id);
      const userQueryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const { data: userData, error } = await Promise.race([
        userQueryPromise,
        timeoutPromise
      ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      if (error) {
        console.error('[AUTH] ❌ Error loading user profile:', error);
        
        // If user doesn't exist, create them (fallback in case trigger didn't work)
        if (error.code === 'PGRST116') {
          console.log('[AUTH] 🔄 User profile not found, creating...');
          
          const newUserData = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || (authUser.email?.split('@')[0] || 'User'),
            role: 'user',
            avatar_url: authUser.user_metadata?.avatar_url || null,
          };

          console.log('[AUTH] 📝 Creating user with data:', newUserData);

          const createPromise = supabase
            .from('users')
            .insert([newUserData])
            .select()
            .single();

          const { data: newUser, error: createError } = await Promise.race([
            createPromise,
            timeoutPromise
          ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

          if (createError) {
            console.error('[AUTH] ❌ Failed to create user profile:', createError);
            throw createError;
          }

          console.log('[AUTH] ✅ User profile created:', newUser);
          setUser(newUser);
          return newUser;
        }
        throw error;
      }

      console.log('[AUTH] ✅ User profile loaded:', userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('[AUTH] 💥 Failed to load user profile:', error);
      
      // If database is completely broken, create a fallback user
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('[AUTH] ⏰ Database timeout - using fallback user');
        const fallbackUser = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || 'User',
          role: 'user',
          avatar_url: null,
          is_admin: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(fallbackUser);
        return fallbackUser;
      }
      
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      console.log('[AUTH] 🔄 Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('[AUTH] 👤 Found existing session for:', session.user.email);
        await loadUserProfile(session.user);
      } else {
        console.log('[AUTH] 🚫 No existing session found');
      }
    };
    
    checkUser();

    // Listen for auth changes
    console.log('[AUTH] 🎧 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH] 🔔 Auth state change:', event, session?.user?.email || 'No user');
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[AUTH] ✅ User signed in, loading profile...');
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AUTH] 👋 User signed out');
        setUser(null);
      }
    });

    return () => {
      console.log('[AUTH] 🔌 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        await loadUserProfile(data.user);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[AUTH] 🚀 Starting sign up process for:', email, 'with name:', name);
      
      // Check if user already exists in database
      console.log('[AUTH] 🔍 Checking if user already exists in database...');
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);
        
      if (checkError) {
        console.log('[AUTH] ⚠️ Error checking existing users:', checkError);
      } else {
        console.log('[AUTH] 📊 Existing users check result:', existingUsers);
        if (existingUsers && existingUsers.length > 0) {
          throw new Error('User already registered');
        }
      }
      
      console.log('[AUTH] 📝 Calling Supabase auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // This will be used by the database trigger
          }
        }
      });

      if (error) {
        console.error('[AUTH] ❌ Supabase auth signup error:', error);
        throw error;
      }

      console.log('[AUTH] ✅ Supabase auth signup successful:', {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          metadata: data.user.user_metadata
        } : null,
        session: data.session ? 'Session created' : 'No session'
      });

      if (data.user) {
        console.log('[AUTH] ⏳ User created in auth, checking database trigger...');
        
        // Check database immediately
        const { data: dbCheck1, error: dbError1 } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id);
          
        console.log('[AUTH] 🔍 Immediate DB check:', dbCheck1, 'Error:', dbError1);
        
        console.log('[AUTH] ⏱️ Waiting 2 seconds for database trigger...');
        // Wait a moment for the database trigger to create the user profile
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check database after delay
        const { data: dbCheck2, error: dbError2 } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id);
          
        console.log('[AUTH] 🔍 After delay DB check:', dbCheck2, 'Error:', dbError2);
        
        console.log('[AUTH] 🔄 Loading user profile...');
        // Now load the user profile that was created by the trigger
        await loadUserProfile(data.user);
      }
    } catch (error) {
      console.error('[AUTH] 💥 Sign up error:', error);
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};