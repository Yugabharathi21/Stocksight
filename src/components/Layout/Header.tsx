import React from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { alerts } = useSupabaseData();
  const unreadAlerts = alerts.filter(alert => !alert.is_read);

  return (
    <header className="bg-white shadow-sm border-b border-[#A3B18A]/20 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8F9779] h-5 w-5" />
            <input
              type="text"
              placeholder="Search products, SKUs, or categories..."
              className="w-full pl-10 pr-4 py-2 bg-[#F5F5F0] border border-[#A3B18A]/30 rounded-lg focus:outline-none focus:border-[#556B2F] focus:ring-2 focus:ring-[#556B2F]/20 transition-all duration-200"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-[#8F9779] hover:text-[#556B2F] hover:bg-[#F5F5F0] rounded-lg transition-all duration-200">
            <Bell className="h-6 w-6" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </button>
          
          <div className="flex items-center space-x-3 pl-4 border-l border-[#A3B18A]/30">
            <div className="flex items-center space-x-3">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name || user.email}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-[#556B2F] rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-[#2F3E2F]">{user?.full_name || user?.email}</p>
                <p className="text-xs text-[#8F9779] capitalize">{user?.role}</p>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 text-[#8F9779] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;