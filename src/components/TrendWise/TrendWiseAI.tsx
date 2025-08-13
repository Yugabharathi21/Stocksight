import React, { useState, useEffect } from 'react';
import { Upload, Play, Brain, TrendingUp, AlertTriangle, CheckCircle, Loader2, FileText, BarChart3 } from 'lucide-react';

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
  sampleDataExists: {
    sales: boolean;
    inventory: boolean;
  };
}

const TrendWiseAI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'demo' | 'upload' | 'status'>('demo');
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    salesData: File | null;
    inventoryData: File | null;
  }>({ salesData: null, inventoryData: null });
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      const response = await fetch('/api/trendwise/status');
      const data = await response.json();
      setModelStatus(data);
    } catch (error) {
      console.error('Failed to check model status:', error);
    }
  };

  const runDemo = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/trendwise/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadTimeDays }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.results.predictions || []);
        setMessage({ type: 'success', text: 'Demo completed successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Demo failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to run demo' });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleData = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/trendwise/generate-sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: '2024-01-01',
          endDate: '2024-06-30',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Sample data generated successfully!' });
        checkModelStatus(); // Refresh status
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate sample data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate sample data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'salesData' | 'inventoryData') => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const trainModel = async () => {
    if (!uploadedFiles.salesData && !uploadedFiles.inventoryData) {
      setMessage({ type: 'error', text: 'Please upload sales and inventory data files' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    if (uploadedFiles.salesData) {
      formData.append('salesData', uploadedFiles.salesData);
    }
    if (uploadedFiles.inventoryData) {
      formData.append('inventoryData', uploadedFiles.inventoryData);
    }
    formData.append('leadTimeDays', leadTimeDays.toString());

    try {
      const response = await fetch('/api/trendwise/train', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Model trained successfully!' });
        checkModelStatus(); // Refresh status
      } else {
        setMessage({ type: 'error', text: data.error || 'Training failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to train model' });
    } finally {
      setIsLoading(false);
    }
  };

  const makePredictions = async () => {
    if (!uploadedFiles.salesData && !uploadedFiles.inventoryData) {
      setMessage({ type: 'error', text: 'Please upload sales and inventory data files' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    if (uploadedFiles.salesData) {
      formData.append('salesData', uploadedFiles.salesData);
    }
    if (uploadedFiles.inventoryData) {
      formData.append('inventoryData', uploadedFiles.inventoryData);
    }
    formData.append('leadTimeDays', leadTimeDays.toString());

    try {
      const response = await fetch('/api/trendwise/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.predictions || []);
        setMessage({ type: 'success', text: 'Predictions generated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Prediction failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to make predictions' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'increase':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'reduce/hold':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'maintain':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#556B2F] to-[#8F9779] p-6 rounded-xl text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Brain className="w-8 h-8" />
          <h1 className="text-3xl font-bold">TrendWise AI</h1>
        </div>
        <p className="text-[#F5F5F0] opacity-90">
          Advanced demand forecasting powered by machine learning
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {message.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border border-[#A3B18A]/20">
        <button
          onClick={() => setActiveTab('demo')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'demo'
              ? 'bg-[#556B2F] text-white'
              : 'text-[#8F9779] hover:text-[#556B2F]'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Quick Demo</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-[#556B2F] text-white'
              : 'text-[#8F9779] hover:text-[#556B2F]'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload & Train</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'status'
              ? 'bg-[#556B2F] text-white'
              : 'text-[#8F9779] hover:text-[#556B2F]'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Model Status</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20 p-6">
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2F3E2F] mb-2">Quick Demo</h2>
              <p className="text-[#8F9779]">
                Run a quick demonstration with sample data to see the AI in action
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-2">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border border-[#A3B18A] rounded-lg focus:ring-2 focus:ring-[#556B2F] focus:border-transparent"
                    min="1"
                    max="30"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={generateSampleData}
                    disabled={isLoading}
                    className="flex-1 bg-[#8F9779] text-white py-2 px-4 rounded-lg hover:bg-[#556B2F] transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Generate Sample Data</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#F5F5F0] p-4 rounded-lg">
                  <h3 className="font-medium text-[#2F3E2F] mb-2">What this demo does:</h3>
                  <ul className="text-sm text-[#8F9779] space-y-1">
                    <li>• Generates realistic sample sales data</li>
                    <li>• Trains the AI model on the data</li>
                    <li>• Makes demand predictions</li>
                    <li>• Provides inventory recommendations</li>
                  </ul>
                </div>

                <button
                  onClick={runDemo}
                  disabled={isLoading}
                  className="w-full bg-[#556B2F] text-white py-3 px-4 rounded-lg hover:bg-[#2F3E2F] transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                    <span>{isLoading ? 'Running Demo...' : 'Run AI Demo'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2F3E2F] mb-2">Upload & Train</h2>
              <p className="text-[#8F9779]">
                Upload your own sales and inventory data to train a custom model
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-2">
                    Sales Data (CSV)
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e, 'salesData')}
                    className="w-full px-3 py-2 border border-[#A3B18A] rounded-lg focus:ring-2 focus:ring-[#556B2F] focus:border-transparent"
                  />
                  <p className="text-xs text-[#8F9779] mt-1">
                    Required columns: date, sku, sales_qty
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-2">
                    Inventory Data (CSV)
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload(e, 'inventoryData')}
                    className="w-full px-3 py-2 border border-[#A3B18A] rounded-lg focus:ring-2 focus:ring-[#556B2F] focus:border-transparent"
                  />
                  <p className="text-xs text-[#8F9779] mt-1">
                    Required columns: SKU, Current Stock, Price
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2F3E2F] mb-2">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border border-[#A3B18A] rounded-lg focus:ring-2 focus:ring-[#556B2F] focus:border-transparent"
                    min="1"
                    max="30"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#F5F5F0] p-4 rounded-lg">
                  <h3 className="font-medium text-[#2F3E2F] mb-2">File Requirements:</h3>
                  <ul className="text-sm text-[#8F9779] space-y-1">
                    <li>• CSV format only</li>
                    <li>• Maximum 10MB per file</li>
                    <li>• Date format: YYYY-MM-DD</li>
                    <li>• SKU values must match between files</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={trainModel}
                    disabled={isLoading || (!uploadedFiles.salesData && !uploadedFiles.inventoryData)}
                    className="flex-1 bg-[#556B2F] text-white py-2 px-4 rounded-lg hover:bg-[#2F3E2F] transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      <span>{isLoading ? 'Training...' : 'Train Model'}</span>
                    </div>
                  </button>

                  <button
                    onClick={makePredictions}
                    disabled={isLoading || (!uploadedFiles.salesData && !uploadedFiles.inventoryData)}
                    className="flex-1 bg-[#8F9779] text-white py-2 px-4 rounded-lg hover:bg-[#556B2F] transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                      <span>{isLoading ? 'Predicting...' : 'Make Predictions'}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[#2F3E2F] mb-2">Model Status</h2>
              <p className="text-[#8F9779]">
                Check the current status of your AI model and data
              </p>
            </div>

            {modelStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#F5F5F0] p-4 rounded-lg">
                  <h3 className="font-medium text-[#2F3E2F] mb-3">Model Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8F9779]">Model File:</span>
                      <span className={`font-medium ${modelStatus.modelExists ? 'text-green-600' : 'text-red-600'}`}>
                        {modelStatus.modelExists ? 'Available' : 'Not Found'}
                      </span>
                    </div>
                    {modelStatus.modelInfo && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[#8F9779]">File Size:</span>
                          <span className="font-medium text-[#2F3E2F]">
                            {(modelStatus.modelInfo.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#8F9779]">Last Modified:</span>
                          <span className="font-medium text-[#2F3E2F]">
                            {new Date(modelStatus.modelInfo.lastModified).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-[#F5F5F0] p-4 rounded-lg">
                  <h3 className="font-medium text-[#2F3E2F] mb-3">Sample Data</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8F9779]">Sales Data:</span>
                      <span className={`font-medium ${modelStatus.sampleDataExists.sales ? 'text-green-600' : 'text-red-600'}`}>
                        {modelStatus.sampleDataExists.sales ? 'Available' : 'Not Found'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8F9779]">Inventory Data:</span>
                      <span className={`font-medium ${modelStatus.sampleDataExists.inventory ? 'text-green-600' : 'text-red-600'}`}>
                        {modelStatus.sampleDataExists.inventory ? 'Available' : 'Not Found'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#8F9779] mb-4" />
                <p className="text-[#8F9779]">Loading model status...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#2F3E2F]">AI Predictions</h2>
            <span className="text-sm text-[#8F9779]">{predictions.length} products analyzed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((prediction, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-[#2F3E2F]">{prediction.sku}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRecommendationColor(prediction.recommendation)}`}>
                    {prediction.recommendation}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8F9779]">Forecast:</span>
                    <span className="font-medium text-[#2F3E2F]">
                      {prediction.forecast.toFixed(1)} units
                    </span>
                  </div>
                  {prediction.confidence && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8F9779]">Confidence:</span>
                      <span className="font-medium text-[#2F3E2F]">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {prediction.model_used && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8F9779]">Model:</span>
                      <span className="font-medium text-[#2F3E2F]">{prediction.model_used}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendWiseAI;
