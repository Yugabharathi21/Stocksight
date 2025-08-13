import React, { useState } from 'react';
import { 
  BarChart3, 
  Package, 
  Upload, 
  Settings, 
  Bell, 
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const shouldShowExpanded = !isCollapsed || isHovered;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div 
      className={`${shouldShowExpanded ? 'w-64' : 'w-16'} bg-white shadow-lg min-h-screen border-r border-[#A3B18A]/20 transition-all duration-300 ease-in-out relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-[#556B2F] text-white rounded-full flex items-center justify-center hover:bg-[#8F9779] transition-colors duration-200 z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      <div className="p-6 border-b border-[#A3B18A]/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#556B2F] rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          {shouldShowExpanded && (
            <div className="transition-opacity duration-200">
              <h1 className="text-xl font-bold text-[#2F3E2F]">Stocksight</h1>
              <p className="text-sm text-[#8F9779]">AI Inventory</p>
            </div>
          )}
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center ${shouldShowExpanded ? 'space-x-3 px-4' : 'justify-center px-2'} py-3 text-left rounded-lg transition-all duration-200 group relative ${
                    activeTab === item.id
                      ? 'bg-[#556B2F] text-white shadow-md'
                      : 'text-[#2F3E2F] hover:bg-[#F5F5F0] hover:text-[#556B2F]'
                  }`}
                  title={!shouldShowExpanded ? item.label : ''}
                >
                  <Icon className="h-5 w-5" />
                  {shouldShowExpanded && (
                    <span className="font-medium transition-opacity duration-200">{item.label}</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!shouldShowExpanded && !isHovered && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#2F3E2F] text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;