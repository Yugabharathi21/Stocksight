import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import ProductTable from './components/Products/ProductTable';
import ForecastChart from './components/Dashboard/ForecastChart';
import CSVUpload from './components/Upload/CSVUpload';
import AlertsPanel from './components/Alerts/AlertsPanel';
import { useSupabaseData } from './hooks/useSupabaseData';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { products, forecastData, isLoading } = useSupabaseData();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-[#556B2F] border-t-transparent rounded-full"></div>
          <p className="text-[#8F9779]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-[#556B2F] border-t-transparent rounded-full"></div>
            <p className="text-[#8F9779]">Loading inventory data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">Product Management</h2>
              <p className="text-[#8F9779]">Manage your inventory and view AI-powered recommendations</p>
            </div>
            <ProductTable products={products} />
          </div>
        );
      case 'forecast':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">Demand Forecasting</h2>
              <p className="text-[#8F9779]">AI-powered predictions for optimal inventory planning</p>
            </div>
            <ForecastChart data={forecastData} title="14-Day Demand Forecast Analysis" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
                <h3 className="text-lg font-semibold text-[#2F3E2F] mb-4">Forecast Accuracy</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8F9779]">Overall Accuracy</span>
                    <span className="font-semibold text-[#2F3E2F]">89.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F9779]">This Week</span>
                    <span className="font-semibold text-[#2F3E2F]">91.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F9779]">Last Month</span>
                    <span className="font-semibold text-[#2F3E2F]">87.8%</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
                <h3 className="text-lg font-semibold text-[#2F3E2F] mb-4">Model Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#8F9779]">Processing Time</span>
                    <span className="font-semibold text-[#2F3E2F]">1.2s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F9779]">Data Points</span>
                    <span className="font-semibold text-[#2F3E2F]">2,845</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8F9779]">Last Updated</span>
                    <span className="font-semibold text-[#2F3E2F]">2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'upload':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">Data Upload</h2>
              <p className="text-[#8F9779]">Upload your sales data to generate accurate demand forecasts</p>
            </div>
            <CSVUpload />
          </div>
        );
      case 'alerts':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">Inventory Alerts</h2>
              <p className="text-[#8F9779]">Monitor and configure alerts for your inventory management</p>
            </div>
            <AlertsPanel />
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">Reports & Analytics</h2>
              <p className="text-[#8F9779]">Generate detailed reports and export data</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-[#A3B18A]/20 text-center">
              <h3 className="text-lg font-medium text-[#8F9779] mb-4">Report Generation Coming Soon</h3>
              <p className="text-[#A3B18A]">PDF export and detailed analytics features will be available in the next update.</p>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">User Management</h2>
              <p className="text-[#8F9779]">Manage team access and permissions</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-[#A3B18A]/20 text-center">
              <h3 className="text-lg font-medium text-[#8F9779] mb-4">User Management Coming Soon</h3>
              <p className="text-[#A3B18A]">Role-based access control features will be available in the next update.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2F3E2F] mb-2">Settings</h2>
              <p className="text-[#8F9779]">Configure your application preferences</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-[#A3B18A]/20 text-center">
              <h3 className="text-lg font-medium text-[#8F9779] mb-4">Settings Panel Coming Soon</h3>
              <p className="text-[#A3B18A]">Configuration options will be available in the next update.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F0]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;