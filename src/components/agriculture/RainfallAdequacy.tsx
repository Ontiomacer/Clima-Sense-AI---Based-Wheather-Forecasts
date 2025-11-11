import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudRain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';

interface RainfallAdequacyProps {
  filters: any;
  compareMode?: boolean;
}

const RainfallAdequacy = ({ filters, compareMode }: RainfallAdequacyProps) => {
  const [rainfallData, setRainfallData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRainfallData();
  }, [filters]);

  const fetchRainfallData = async () => {
    setLoading(true);
    const mockData = {
      cumulative: 285,
      normal: 320,
      deviation: -10.9,
      status: 'slight_deficit',
      monthlyData: [
          { month: 'Jun', current: 120, normal: 140 },
        { month: 'Jul', current: 95, normal: 110 },
        { month: 'Aug', current: 70, normal: 70 },
      ],
    };

    setTimeout(() => {
      setRainfallData(mockData);
      setLoading(false);
    }, 650);
  };

  const getStatusColor = (status: string) => {
    if (status === 'adequate') return 'text-green-500';
    if (status === 'slight_deficit') return 'text-yellow-500';
    if (status === 'severe_deficit') return 'text-red-500';
    return 'text-gray-500';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'adequate') return '🟢 Adequate';
    if (status === 'slight_deficit') return '🟠 Slight Deficit';
    if (status === 'severe_deficit') return '🔴 Severe Deficit';
    return 'Unknown';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-primary" />
            Rainfall Adequacy Index
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
          <CloudRain className="w-5 h-5 text-primary" />
          Rainfall Adequacy Index
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cumulative (90 days)</p>
            <p className="text-2xl font-bold">{rainfallData.cumulative}mm</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Normal</p>
            <p className="text-2xl font-bold">{rainfallData.normal}mm</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Deviation</p>
            <p className={`text-2xl font-bold ${rainfallData.deviation < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {rainfallData.deviation > 0 ? '+' : ''}{rainfallData.deviation}%
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className={`text-sm font-medium ${getStatusColor(rainfallData.status)}`}>
            {getStatusLabel(rainfallData.status)}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Monthly Comparison</p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={rainfallData.monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="current" fill="#3b82f6" name="Current" />
              <Bar dataKey="normal" fill="#94a3b8" name="Normal" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Advisory:</strong> Rainfall is {Math.abs(rainfallData.deviation)}% below normal.
            {rainfallData.status === 'slight_deficit' && ' Monitor soil moisture and plan supplemental irrigation.'}
            {rainfallData.status === 'severe_deficit' && ' Immediate irrigation required. Consider drought-resistant crops.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RainfallAdequacy;
