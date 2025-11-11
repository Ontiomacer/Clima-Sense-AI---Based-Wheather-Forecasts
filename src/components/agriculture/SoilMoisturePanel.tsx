import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SoilMoisturePanelProps {
  filters: any;
  detailed?: boolean;
}

const SoilMoisturePanel = ({ filters, detailed }: SoilMoisturePanelProps) => {
  const [moistureData, setMoistureData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoistureData();
  }, [filters]);

  const fetchMoistureData = async () => {
    setLoading(true);
    try {
      // Simulate NASA POWER / SMAP data
      const mockData = {
        current: 42,
        status: 'moderate',
        recommendation: 'Irrigate within 3 days',
        weeklyData: [
          { day: 'Mon', moisture: 48 },
          { day: 'Tue', moisture: 46 },
          { day: 'Wed', moisture: 44 },
          { day: 'Thu', moisture: 43 },
          { day: 'Fri', moisture: 42 },
          { day: 'Sat', moisture: 41 },
          { day: 'Sun', moisture: 40 },
        ],
        rainfall: [
          { day: 'Mon', rain: 0 },
          { day: 'Tue', rain: 2 },
          { day: 'Wed', rain: 0 },
          { day: 'Thu', rain: 0 },
          { day: 'Fri', rain: 0 },
          { day: 'Sat', rain: 5 },
          { day: 'Sun', rain: 3 },
        ],
      };

      setTimeout(() => {
        setMoistureData(mockData);
        setLoading(false);
      }, 600);
    } catch (error) {
      console.error('Error fetching moisture:', error);
      setLoading(false);
    }
  };

  const getMoistureColor = (value: number) => {
    if (value > 60) return 'text-blue-500';
    if (value > 40) return 'text-green-500';
    if (value > 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMoistureIcon = (value: number) => {
    if (value < 30) return '💧';
    if (value < 50) return '🌦';
    return '🌧';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            Soil Moisture & Irrigation
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
          <Droplets className="w-5 h-5 text-primary" />
          Soil Moisture & Irrigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Moisture */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-4xl font-bold">{moistureData.current}%</span>
              <span className="text-2xl">{getMoistureIcon(moistureData.current)}</span>
            </div>
            <p className={`text-sm font-medium ${getMoistureColor(moistureData.current)}`}>
              {moistureData.status.charAt(0).toUpperCase() + moistureData.status.slice(1)} Level
            </p>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              {moistureData.recommendation}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current moisture levels and 7-day rainfall forecast
            </p>
          </div>
        </div>

        {/* 7-Day Trend */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">7-Day Moisture Trend</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={moistureData.weeklyData}>
              <defs>
                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="moisture"
                stroke="#3b82f6"
                fill="url(#moistureGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {detailed && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Expected Rainfall (Next 7 Days)</p>
            <div className="flex justify-between items-end h-16">
              {moistureData.rainfall.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 bg-blue-500 rounded-t"
                    style={{ height: `${item.rain * 4}px` }}
                  ></div>
                  <span className="text-xs text-muted-foreground">{item.day.slice(0, 1)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total expected: {moistureData.rainfall.reduce((sum: number, d: any) => sum + d.rain, 0)}mm
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SoilMoisturePanel;
