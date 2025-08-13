import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch {
      // Error is handled by the auth context
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-[#A3B18A]/20 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#556B2F] rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2F3E2F] mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-[#8F9779]">
            {isSignUp 
              ? 'Sign up to start managing your inventory with AI' 
              : 'Sign in to your Stocksight account'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-[#2F3E2F] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#F5F5F0] border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:border-[#556B2F] focus:ring-2 focus:ring-[#556B2F]/20 transition-all duration-200"
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#2F3E2F] mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F5F0] border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:border-[#556B2F] focus:ring-2 focus:ring-[#556B2F]/20 transition-all duration-200"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2F3E2F] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#F5F5F0] border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:border-[#556B2F] focus:ring-2 focus:ring-[#556B2F]/20 transition-all duration-200 pr-12"
                placeholder="Enter your password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8F9779] hover:text-[#556B2F] transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#556B2F] text-white py-3 px-4 rounded-lg hover:bg-[#8F9779] transition-all duration-200 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <>
                {isSignUp ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#556B2F] hover:text-[#8F9779] transition-colors font-medium"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        {!isSignUp && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h4>
            <p className="text-sm text-blue-700">
              Email: admin@stocksight.com<br />
              Password: admin123
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;