import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'bg-[#556B2F] text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    danger: 'bg-red-600 text-white',
  };

  const changeColorClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-[#8F9779]',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className={`text-sm font-medium ${changeColorClasses[changeType]}`}>
          {change}
        </span>
      </div>
      
      <h3 className="text-2xl font-bold text-[#2F3E2F] mb-1">{value}</h3>
      <p className="text-[#8F9779] text-sm font-medium">{title}</p>
    </div>
  );
};

export default StatsCard;