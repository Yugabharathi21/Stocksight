import React, { useState } from 'react';
import { AlertTriangle, Bell, BellOff, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { useInventoryData } from '../../hooks/useInventoryData';

const AlertsPanel: React.FC = () => {
  const { products, getLowStockProducts, getOverstockProducts } = useInventoryData();
  const [alertSettings, setAlertSettings] = useState({
    lowStock: { enabled: true, threshold: 30 },
    overstock: { enabled: true, threshold: 200 },
    highDemand: { enabled: true, threshold: 100 },
  });

  const lowStockProducts = getLowStockProducts();
  const overstockProducts = getOverstockProducts();
  const highDemandProducts = products.filter(p => p.predictedDemand > alertSettings.highDemand.threshold);

  const AlertCard: React.FC<{
    title: string;
    count: number;
    icon: React.ReactNode;
    color: string;
    products: any[];
  }> = ({ title, count, icon, color, products }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2F3E2F]">{title}</h3>
            <p className="text-sm text-[#8F9779]">{count} products affected</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {count > 0 ? count : 'None'}
        </span>
      </div>
      
      {products.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {products.slice(0, 3).map((product) => (
            <div key={product.id} className="flex justify-between items-center p-2 bg-[#F5F5F0] rounded">
              <span className="text-sm font-medium text-[#2F3E2F]">{product.name}</span>
              <span className="text-sm text-[#8F9779]">
                Stock: {product.currentStock} | Demand: {product.predictedDemand}
              </span>
            </div>
          ))}
          {products.length > 3 && (
            <p className="text-sm text-[#8F9779] text-center">
              +{products.length - 3} more products
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
        <h2 className="text-xl font-semibold text-[#2F3E2F] mb-6 flex items-center space-x-2">
          <Bell className="h-6 w-6" />
          <span>Inventory Alerts</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AlertCard
            title="Low Stock Alert"
            count={lowStockProducts.length}
            icon={<AlertTriangle className="h-6 w-6 text-white" />}
            color="bg-red-500"
            products={lowStockProducts}
          />
          
          <AlertCard
            title="Overstock Alert"
            count={overstockProducts.length}
            icon={<TrendingDown className="h-6 w-6 text-white" />}
            color="bg-yellow-500"
            products={overstockProducts}
          />
          
          <AlertCard
            title="High Demand Alert"
            count={highDemandProducts.length}
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            color="bg-blue-500"
            products={highDemandProducts}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
        <h3 className="text-lg font-semibold text-[#2F3E2F] mb-4">Alert Settings</h3>
        
        <div className="space-y-4">
          {Object.entries(alertSettings).map(([key, setting]) => {
            const labels = {
              lowStock: 'Low Stock Alerts',
              overstock: 'Overstock Alerts',
              highDemand: 'High Demand Alerts',
            };
            
            return (
              <div key={key} className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {setting.enabled ? (
                      <Bell className="h-5 w-5 text-[#556B2F]" />
                    ) : (
                      <BellOff className="h-5 w-5 text-[#8F9779]" />
                    )}
                    <span className="font-medium text-[#2F3E2F]">
                      {labels[key as keyof typeof labels]}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-[#8F9779]">Threshold:</label>
                    <input
                      type="number"
                      value={setting.threshold}
                      onChange={(e) => setAlertSettings(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], threshold: parseInt(e.target.value) }
                      }))}
                      className="w-20 px-2 py-1 text-sm border border-[#A3B18A]/30 rounded focus:outline-none focus:border-[#556B2F]"
                    />
                  </div>
                  
                  <button
                    onClick={() => setAlertSettings(prev => ({
                      ...prev,
                      [key]: { ...prev[key as keyof typeof prev], enabled: !setting.enabled }
                    }))}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                      setting.enabled
                        ? 'bg-[#556B2F] text-white hover:bg-[#8F9779]'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    {setting.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Notification Preferences:</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="text-[#556B2F]" />
              <span className="text-sm text-blue-700">Email notifications</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="text-[#556B2F]" />
              <span className="text-sm text-blue-700">SMS notifications</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="text-[#556B2F]" />
              <span className="text-sm text-blue-700">Dashboard notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;