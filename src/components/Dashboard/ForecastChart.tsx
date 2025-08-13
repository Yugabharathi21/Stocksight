import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { ForecastData } from '../../types';

interface ForecastChartProps {
  data: ForecastData[];
  title?: string;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data, title = "Demand Forecast" }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-[#A3B18A]/30 rounded-lg shadow-lg">
          <p className="font-medium text-[#2F3E2F] mb-2">{`Date: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
      <h3 className="text-lg font-semibold text-[#2F3E2F] mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#A3B18A" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="#8F9779"
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="#8F9779" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Confidence interval area */}
            <Area
              dataKey="upper_bound"
              stroke="none"
              fill="#A3B18A"
              fillOpacity={0.2}
              name="Confidence Interval"
            />
            <Area
              dataKey="lower_bound"
              stroke="none"
              fill="#FFFFFF"
              fillOpacity={1}
            />
            
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#556B2F"
              strokeWidth={3}
              dot={{ fill: '#556B2F', strokeWidth: 2, r: 4 }}
              name="Actual Sales"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#8F9779"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#8F9779', strokeWidth: 2, r: 3 }}
              name="Predicted Sales"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForecastChart;