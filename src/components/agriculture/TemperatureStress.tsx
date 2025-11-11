import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TemperatureStressProps {
  filters: any;
  detailed?: boolean;
}

const TemperatureStress = ({ filters, detailed }: TemperatureStressProps) => {
  const [tempData, setTempData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemperatureData();
  }, [filters]);

  const fetchTemperatureData = async () => {
    setLoading(true);
    const mockData = {
      current: 32,
      status: 'normal',
      stressLevel: 'low',
      weeklyData: [
        { day: 'Mon', temp: 30, max: 34, min: 26 },
        { day: 'Tue', temp: 31, max: 35, min: 27 },
        { day: 'Wed', temp: 32, max: 36, min: 28 },
        { day: 'Thu', temp: 33, max: 37, min: 29 },
        { day: 'Fri', temp: 32, max: 36, min: 28 },
        { day: 'Sat', temp: 31, max: 35, min: 27 },
        { day: 'Sun', temp: 30, max: 34, min: 26 },
      ],
      impact: 'Temperatures within optimal range for rice cultivation',
    };

    setTimeout(() => {
      setTempData(mockData);
      setLoading(false);
    }, 700);
  };

  const getStressColor = (status: string) => {
    if (status === 'normal') return 'text-green-500';
    if (status === 'heat') return 'text-orange-500';
    if (status === 'cold') return 'text-blue-500';
    return 'text-gray-500';
  };

  const getStressIcon = (status: string) => {
    if (status === 'normal') return '🟢';
    if (status === 'heat') return '🟠';
    if (status === 'cold') return '🔵';
    return '⚪';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Temperature & Heat Stress
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
          <Thermometer className="w-5 h-5 text-primary" />
          Temperature & Heat Stress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-4xl font-bold">{tempData.current}°C</span>
              <span className="text-2xl">{getStressIcon(tempData.status)}</span>
            </div>
            <p className={`text-sm font-medium ${getStressColor(tempData.status)}`}>
              {tempData.status.charAt(0).toUpperCase() + tempData.status.slice(1)} Range
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">7-Day Temperature Forecast</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={tempData.weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis domain={[20, 40]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <ReferenceLine y={34} stroke="#f97316" strokeDasharray="3 3" label="Heat Stress" />
              <ReferenceLine y={15} stroke="#3b82f6" strokeDasharray="3 3" label="Cold Stress" />
              <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="temp" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={1} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong>Impact:</strong> {tempData.impact}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemperatureStress;
