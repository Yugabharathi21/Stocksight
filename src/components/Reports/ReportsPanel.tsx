import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { useInventoryData } from '../../hooks/useInventoryData';

interface ReportData {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  overstockItems: number;
}

const ReportsPanel: React.FC = () => {
  const { products } = useInventoryData();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReportData = React.useCallback(() => {
    if (!products?.length) return;

    const lowStockItems = products.filter(p => p.currentStock <= 10).length;
    const overstockItems = products.filter(p => p.currentStock > 100).length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.price), 0);

    setReportData({
      totalProducts: products.length,
      totalValue,
      lowStockItems,
      overstockItems,
    });
  }, [products]);

  useEffect(() => {
    generateReportData();
  }, [generateReportData]);

  const exportToCSV = () => {
    if (!products?.length) return;

    const headers = ['Name', 'SKU', 'Category', 'Current Stock', 'Price', 'Total Value'];
    const csvContent = [
      headers.join(','),
      ...products.map(product => [
        `"${product.name}"`,
        product.sku,
        `"${product.category}"`,
        product.currentStock,
        product.price,
        (product.currentStock * product.price).toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stocksight-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      if (!reportData) return;
      
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stocksight Report</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #A3B18A; padding-bottom: 20px; }
            .logo { color: #2F3E2F; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .date { color: #8F9779; }
            .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .metric-card { padding: 20px; border: 1px solid #A3B18A; border-radius: 8px; text-align: center; background: #f8f9fa; }
            .metric-value { font-size: 32px; font-weight: bold; color: #2F3E2F; margin-bottom: 8px; }
            .metric-label { color: #8F9779; font-size: 14px; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #2F3E2F; border-bottom: 1px solid #A3B18A; padding-bottom: 10px; }
            .product-list { display: grid; gap: 10px; }
            .product-item { padding: 15px; border: 1px solid #ddd; border-radius: 6px; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #8F9779; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">📊 Stocksight</div>
            <h1>Inventory Analytics Report</h1>
            <p class="date">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="metrics">
            <div class="metric-card">
              <div class="metric-value">${reportData.totalProducts}</div>
              <div class="metric-label">Total Products</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">₹${reportData.totalValue.toLocaleString()}</div>
              <div class="metric-label">Total Inventory Value</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #dc3545;">${reportData.lowStockItems}</div>
              <div class="metric-label">Low Stock Alerts</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" style="color: #007bff;">${reportData.overstockItems}</div>
              <div class="metric-label">Overstock Items</div>
            </div>
          </div>

          <div class="section">
            <h3>📦 Product Overview</h3>
            <p>This report provides a comprehensive overview of your current inventory status, including stock levels, values, and key metrics for informed decision making.</p>
            <div class="product-list">
              ${products?.slice(0, 10).map(product => `
                <div class="product-item">
                  <div>
                    <strong>${product.name}</strong><br>
                    <small>SKU: ${product.sku} | Category: ${product.category}</small>
                  </div>
                  <div style="text-align: right;">
                    <strong>₹${(product.currentStock * product.price).toLocaleString()}</strong><br>
                    <small>${product.currentStock} units in stock</small>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>This report was automatically generated by Stocksight AI Inventory Management System.</p>
            <p>For support or questions, please contact your system administrator.</p>
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stocksight-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('📄 Report downloaded successfully!\n\nNote: HTML format provided. For PDF conversion, you can:\n• Print to PDF from your browser\n• Use online HTML-to-PDF converters\n• Install PDF libraries like jsPDF for direct PDF generation');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('❌ Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#8F9779] mx-auto mb-4" />
          <p className="text-[#8F9779]">Generating report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-[#8F9779]" />
            <span className="text-sm font-medium text-[#2F3E2F]">
              Report generated on: {new Date().toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#8F9779] text-white rounded-lg hover:bg-[#7A8869] transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-[#2F3E2F] text-white rounded-lg hover:bg-[#1F2D1F] transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8F9779]">Total Products</p>
              <p className="text-2xl font-bold text-[#2F3E2F]">{reportData.totalProducts}</p>
            </div>
            <Package className="h-8 w-8 text-[#A3B18A]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8F9779]">Total Value</p>
              <p className="text-2xl font-bold text-[#2F3E2F]">₹{reportData.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-[#A3B18A]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8F9779]">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600">{reportData.lowStockItems}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#8F9779]">Overstock Items</p>
              <p className="text-2xl font-bold text-blue-600">{reportData.overstockItems}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20">
        <div className="p-6 border-b border-[#A3B18A]/20">
          <h3 className="text-lg font-semibold text-[#2F3E2F] flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Summary
          </h3>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-[#2F3E2F] mb-3">📊 Key Insights</h4>
              <ul className="space-y-2 text-sm text-[#8F9779]">
                <li>• Total inventory value: ₹{reportData.totalValue.toLocaleString()}</li>
                <li>• Average product value: ₹{Math.round(reportData.totalValue / reportData.totalProducts).toLocaleString()}</li>
                <li>• Stock health: {reportData.lowStockItems === 0 ? 'Excellent' : 'Needs attention'}</li>
                <li>• Overstock ratio: {((reportData.overstockItems / reportData.totalProducts) * 100).toFixed(1)}%</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#2F3E2F] mb-3">🎯 Recommendations</h4>
              <ul className="space-y-2 text-sm text-[#8F9779]">
                {reportData.lowStockItems > 0 && (
                  <li>• Review and restock {reportData.lowStockItems} low-stock items</li>
                )}
                {reportData.overstockItems > 0 && (
                  <li>• Consider promotions for {reportData.overstockItems} overstocked items</li>
                )}
                <li>• Monitor demand patterns for better forecasting</li>
                <li>• Set up automated alerts for critical stock levels</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#A3B18A]/10 to-[#8F9779]/10 rounded-xl p-6 border border-[#A3B18A]/20">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#2F3E2F] mb-2">📈 Advanced Analytics Coming Soon</h3>
          <p className="text-[#8F9779] mb-4">
            Enhanced features including demand forecasting, trend analysis, and predictive insights will be available in the next update.
          </p>
          <div className="flex justify-center gap-4 text-sm text-[#8F9779]">
            <span>• Demand Forecasting</span>
            <span>• Trend Analysis</span>
            <span>• Predictive Alerts</span>
            <span>• Interactive Charts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;
