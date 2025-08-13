import React from 'react';
import { BarChart3, Package, TrendingUp, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';
import StatsCard from './StatsCard';
import ForecastChart from './ForecastChart';
import ProductTable from '../Products/ProductTable';
import { useInventoryData } from '../../hooks/useInventoryData';

const Dashboard: React.FC = () => {
  const { products, forecastData, getLowStockProducts, getRecommendationCounts } = useInventoryData();
  
  const lowStockProducts = getLowStockProducts();
  const recommendationCounts = getRecommendationCounts();
  const totalStockValue = products.reduce((sum, product) => sum + (product.currentStock * product.price), 0);
  const avgConfidence = products.reduce((sum, product) => sum + product.confidence, 0) / products.length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value={products.length}
          change="+12% from last month"
          changeType="increase"
          icon={Package}
          color="primary"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={lowStockProducts.length}
          change={lowStockProducts.length > 5 ? "Action needed" : "Under control"}
          changeType={lowStockProducts.length > 5 ? "decrease" : "increase"}
          icon={AlertTriangle}
          color={lowStockProducts.length > 5 ? "danger" : "success"}
        />
        <StatsCard
          title="Inventory Value"
          value={`₹${(totalStockValue / 1000).toFixed(1)}K`}
          change="+8% this month"
          changeType="increase"
          icon={DollarSign}
          color="success"
        />
        <StatsCard
          title="Avg Forecast Confidence"
          value={`${Math.round(avgConfidence * 100)}%`}
          change="High accuracy"
          changeType="increase"
          icon={TrendingUp}
          color="primary"
        />
      </div>

      {/* Forecast Chart */}
      <ForecastChart data={forecastData} title="7-Day Demand Forecast" />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
          <h3 className="text-lg font-semibold text-[#2F3E2F] mb-4 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Recommendations Summary</span>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#8F9779]">Increase Stock</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {recommendationCounts.increase || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8F9779]">Reduce Stock</span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                {recommendationCounts.reduce || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8F9779]">Maintain</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                {recommendationCounts.maintain || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
          <h3 className="text-lg font-semibold text-[#2F3E2F] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-[#8F9779]">Forecast updated for 15 products</span>
              <span className="text-xs text-[#A3B18A]">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-[#8F9779]">Low stock alert: Basmati Rice</span>
              <span className="text-xs text-[#A3B18A]">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-[#8F9779]">New CSV data uploaded</span>
              <span className="text-xs text-[#A3B18A]">1 day ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
          <h3 className="text-lg font-semibold text-[#2F3E2F] mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-[#556B2F] text-white py-2 px-4 rounded-lg hover:bg-[#8F9779] transition-all duration-200 flex items-center justify-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span>Generate Orders</span>
            </button>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Export Report</span>
            </button>
            <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-all duration-200 flex items-center justify-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Update Forecasts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#2F3E2F]">Critical Products</h3>
          <p className="text-[#8F9779]">Products requiring immediate attention</p>
        </div>
        <ProductTable 
          products={products.filter(p => 
            p.recommendation === 'increase' || p.currentStock < p.predictedDemand * 0.3
          ).slice(0, 5)}
        />
      </div>
    </div>
  );
};

export default Dashboard;