import React, { useState } from 'react';
import { Package, TrendingUp, TrendingDown, Minus, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Product } from '../../types';

interface ProductTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onView?: (product: Product) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ 
  products, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * direction;
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * direction;
    }
    return 0;
  });

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'reduce':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-[#8F9779]" />;
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'increase':
        return 'Increase Stock';
      case 'reduce':
        return 'Reduce Stock';
      default:
        return 'Maintain';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'increase':
        return 'bg-green-100 text-green-800';
      case 'reduce':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatus = (currentStock: number, predictedDemand: number) => {
    const ratio = currentStock / predictedDemand;
    if (ratio < 0.3) return { label: 'Low', color: 'bg-red-100 text-red-800' };
    if (ratio > 2) return { label: 'High', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Normal', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#A3B18A]/20 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#A3B18A]/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2F3E2F] flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Product Inventory</span>
          </h3>
          <div className="text-sm text-[#8F9779]">
            {products.length} products
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#8F9779] text-white">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#7A8569] transition-colors"
                onClick={() => handleSort('name')}
              >
                Product Name
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#7A8569] transition-colors"
                onClick={() => handleSort('sku')}
              >
                SKU
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#7A8569] transition-colors"
                onClick={() => handleSort('currentStock')}
              >
                Current Stock
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#7A8569] transition-colors"
                onClick={() => handleSort('predictedDemand')}
              >
                Predicted Demand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Recommendation
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#7A8569] transition-colors"
                onClick={() => handleSort('price')}
              >
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#A3B18A]/20">
            {sortedProducts.map((product) => {
              const stockStatus = getStockStatus(product.currentStock, product.predictedDemand);
              return (
                <tr 
                  key={product.id} 
                  className="hover:bg-[#EAEDE1] transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[#2F3E2F]">{product.name}</div>
                      <div className="text-sm text-[#8F9779]">{product.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2F3E2F] font-mono">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2F3E2F] font-semibold">
                    {product.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2F3E2F] font-semibold">
                    {product.predictedDemand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-[#2F3E2F] font-medium">
                        {Math.round(product.confidence * 100)}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#556B2F] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${product.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getRecommendationIcon(product.recommendation)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRecommendationColor(product.recommendation)}`}>
                        {getRecommendationText(product.recommendation)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2F3E2F] font-medium">
                    ₹{product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === product.id ? null : product.id)}
                      className="text-[#8F9779] hover:text-[#556B2F] p-1 rounded transition-colors"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    
                    {openDropdown === product.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-[#A3B18A]/20 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            onView?.(product);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-[#2F3E2F] hover:bg-[#F5F5F0] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            onEdit?.(product);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-[#2F3E2F] hover:bg-[#F5F5F0] transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            onDelete?.(product.id);
                            setOpenDropdown(null);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;