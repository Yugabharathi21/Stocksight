import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Play, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  FileText, 
  BarChart3,
  Database,
  RefreshCw,
  Zap,
  Clock,
  Target,
  Activity,
  Shield,
  Settings,
  Download,
  Eye,
  Calendar,
  Package,
  DollarSign
} from 'lucide-react';

interface Prediction {
  sku: string;
  forecast: number;
  recommendation: string;
  confidence?: number;
  model_used?: string;
}

interface ModelStatus {
  modelExists: boolean;
  modelInfo: any;
  database: {
    connected: boolean;
    products: number;
    salesRecords: number;
    lastChecked: string;
  };
}

interface DataSummary {
  products: number;
  totalSalesRecords: number;
  recentSalesRecords: number;
  forecasts: number;
  alerts: number;
  lastUpdated: string;
}

interface RecentPrediction {
  id: string;
  product_id: string;
  forecast_date: string;
  predicted_demand: number;
  confidence_score: number;
  lower_bound: number;
  upper_bound: number;
  model_version: string;
  created_at: string;
  products: {
    name: string;
    sku: string;
    category: string;
    current_stock: number;
  };
}

const TrendWisePro: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'predictions' | 'data' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<RecentPrediction[]>([]);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<'idle' | 'training' | 'predicting' | 'completed' | 'error'>('idle');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        checkModelStatus(),
        loadDataSummary(),
        loadRecentPredictions()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const checkModelStatus = async () => {
    try {
      const response = await fetch('/api/trendwise-db/status');
      const data = await response.json();
      setModelStatus(data);
    } catch (error) {
      console.error('Error checking model status:', error);
    }
  };

  const loadDataSummary = async () => {
    try {
      const response = await fetch('/api/trendwise-db/data-summary');
      const data = await response.json();
      setDataSummary(data.summary);
    } catch (error) {
      console.error('Error loading data summary:', error);
    }
  };

  const loadRecentPredictions = async () => {
    try {
      const response = await fetch('/api/trendwise-db/predictions?days=7');
      const data = await response.json();
      setRecentPredictions(data.predictions || []);
    } catch (error) {
      console.error('Error loading recent predictions:', error);
    }
  };

  const runAutoPipeline = async () => {
    try {
      setIsLoading(true);
      setPipelineStatus('training');
      setMessage({ type: 'info', text: 'Starting auto pipeline...' });

      const response = await fetch('/api/trendwise-db/auto-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadTimeDays })
      });

      const data = await response.json();

      if (data.success) {
        setPipelineStatus('completed');
        setMessage({ type: 'success', text: 'Auto pipeline completed successfully!' });
        
        // Refresh data
        await Promise.all([
          checkModelStatus(),
          loadDataSummary(),
          loadRecentPredictions()
        ]);
      } else {
        throw new Error(data.error || 'Pipeline failed');
      }
    } catch (error) {
      setPipelineStatus('error');
      setMessage({ type: 'error', text: `Pipeline failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const runDemo = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: 'info', text: 'Running demo with database data...' });

      const response = await fetch('/api/trendwise-db/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadTimeDays })
      });

      const data = await response.json();

      if (data.success) {
        setPredictions(data.results.predictions || []);
        setMessage({ 
          type: 'success', 
          text: `Demo completed! ${data.dataSource === 'database' ? 'Used real database data' : 'Used sample data'}`
        });
      } else {
        throw new Error(data.error || 'Demo failed');
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Demo failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: 'info', text: 'Refreshing data...' });

      const response = await fetch('/api/trendwise-db/refresh-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retrain: true, leadTimeDays })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Data refreshed successfully!' });
        await loadInitialData();
      } else {
        throw new Error(data.error || 'Data refresh failed');
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Data refresh failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'increase': return 'text-green-600 bg-green-100';
      case 'reduce': return 'text-red-600 bg-red-100';
      case 'maintain': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPipelineStatusColor = () => {
    switch (pipelineStatus) {
      case 'training': return 'text-blue-600';
      case 'predicting': return 'text-purple-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPipelineStatusIcon = () => {
    switch (pipelineStatus) {
      case 'training': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'predicting': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            TrendWise Pro
          </h1>
          <p className="text-gray-600 mt-1">Professional AI-powered demand forecasting with database integration</p>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-green-600" />
          <span className="text-sm text-gray-600">Database-Driven</span>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
             message.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
             <Loader2 className="w-4 h-4 animate-spin" />}
            {message.text}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'pipeline', label: 'Auto Pipeline', icon: Zap },
            { id: 'predictions', label: 'Predictions', icon: TrendingUp },
            { id: 'data', label: 'Data Health', icon: Database },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Model Status</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {modelStatus?.modelExists ? 'Trained' : 'Not Trained'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    modelStatus?.modelExists ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {modelStatus?.modelExists ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Database</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {modelStatus?.database?.connected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    modelStatus?.database?.connected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <Database className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Products</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dataSummary?.products || 0}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sales Records</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dataSummary?.totalSalesRecords || 0}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={runAutoPipeline}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Auto Pipeline</span>
                </button>

                <button
                  onClick={runDemo}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <Play className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Run Demo</span>
                </button>

                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Refresh Data</span>
                </button>
              </div>
            </div>

            {/* Recent Predictions */}
            {recentPredictions.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Predictions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Demand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecast Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentPredictions.slice(0, 5).map((prediction) => (
                        <tr key={prediction.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{prediction.products.name}</div>
                              <div className="text-sm text-gray-500">{prediction.products.sku}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prediction.predicted_demand} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {(prediction.confidence_score * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(prediction.forecast_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Pipeline Status */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto Pipeline</h3>
              
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`flex items-center gap-2 ${getPipelineStatusColor()}`}>
                    {getPipelineStatusIcon()}
                    Status: {pipelineStatus.charAt(0).toUpperCase() + pipelineStatus.slice(1)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  The auto pipeline automatically trains the model and generates predictions using your database data.
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                    max="30"
                  />
                </div>

                <button
                  onClick={runAutoPipeline}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Run Auto Pipeline
                </button>
              </div>
            </div>

            {/* Pipeline Results */}
            {predictions.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predictions.map((prediction, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{prediction.sku}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(prediction.recommendation)}`}>
                          {prediction.recommendation}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {prediction.forecast.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">units forecasted</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Predictions</h3>
              
              {recentPredictions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Demand</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecast Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentPredictions.map((prediction) => (
                        <tr key={prediction.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{prediction.products.name}</div>
                              <div className="text-sm text-gray-500">{prediction.products.sku}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prediction.products.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prediction.products.current_stock} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prediction.predicted_demand} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {(prediction.confidence_score * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(prediction.forecast_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No predictions available. Run the auto pipeline to generate predictions.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Health</h3>
              
              {dataSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{dataSummary.products}</div>
                    <div className="text-sm text-gray-600">Total Products</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{dataSummary.totalSalesRecords}</div>
                    <div className="text-sm text-gray-600">Sales Records</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{dataSummary.recentSalesRecords}</div>
                    <div className="text-sm text-gray-600">Recent Sales (30 days)</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">{dataSummary.forecasts}</div>
                    <div className="text-sm text-gray-600">Forecasts</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">{dataSummary.alerts}</div>
                    <div className="text-sm text-gray-600">Active Alerts</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Last Updated</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(dataSummary.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h3>
              
              {modelStatus?.database && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Connection Status</span>
                    <span className={`flex items-center gap-2 ${
                      modelStatus.database.connected ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {modelStatus.database.connected ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {modelStatus.database.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Products in Database</span>
                    <span className="text-sm font-medium text-gray-900">{modelStatus.database.products}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sales Records</span>
                    <span className="text-sm font-medium text-gray-900">{modelStatus.database.salesRecords}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Checked</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(modelStatus.database.lastChecked).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                    max="30"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Number of days to forecast into the future
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={refreshData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data & Retrain Model
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendWisePro;
