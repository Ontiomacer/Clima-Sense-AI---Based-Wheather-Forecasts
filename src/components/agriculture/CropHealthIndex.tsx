import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CropHealthIndexProps {
  filters: any;
  compareMode?: boolean;
}

const CropHealthIndex = ({ filters, compareMode }: CropHealthIndexProps) => {
  const [ndviData, setNdviData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNDVIData();
  }, [filters]);

  const fetchNDVIData = async () => {
    setLoading(true);
    try {
      // Simulate GEE NDVI data fetch
      const mockData = {
        current: 0.68,
        trend: 'up',
        status: 'healthy',
        weeklyData: [
          { week: 'W1', ndvi: 0.62 },
          { week: 'W2', ndvi: 0.64 },
          { week: 'W3', ndvi: 0.66 },
          { week: 'W4', ndvi: 0.68 },
        ],
        previous: compareMode ? 0.61 : null,
      };
      
      setTimeout(() => {
        setNdviData(mockData);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching NDVI:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'moderate':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (!ndviData) return <Minus className="w-5 h-5" />;
    if (ndviData.trend === 'up') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (ndviData.trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            Crop Health Index (NDVI)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" />
          Crop Health Index (NDVI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current NDVI */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-4xl font-bold">{ndviData.current.toFixed(2)}</span>
              {getStatusIcon()}
            </div>
            <p className={`text-sm font-medium ${getStatusColor(ndviData.status)}`}>
              🟢 {ndviData.status.charAt(0).toUpperCase() + ndviData.status.slice(1)} Vegetation
            </p>
          </div>
          {compareMode && ndviData.previous && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Previous Season</p>
              <p className="text-2xl font-semibold">{ndviData.previous.toFixed(2)}</p>
              <p className="text-xs text-green-500">
                +{((ndviData.current - ndviData.previous) * 100).toFixed(1)}% improvement
              </p>
            </div>
          )}
        </div>

        {/* Weekly Trend */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">4-Week Trend</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={ndviData.weeklyData}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis domain={[0.5, 0.8]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="ndvi"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Insight:</strong> Vegetation health is improving steadily. Current NDVI indicates
            optimal photosynthetic activity for {filters.crop}. Continue monitoring for pest stress.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CropHealthIndex;
