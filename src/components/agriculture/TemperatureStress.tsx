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
    
    try {
      // Region coordinates mapping
      const regionCoords: Record<string, { lat: number; lon: number }> = {
        maharashtra: { lat: 19.5, lon: 75.0 },
        pune: { lat: 18.5204, lon: 73.8567 },
        mumbai: { lat: 19.0760, lon: 72.8777 },
        nagpur: { lat: 21.1458, lon: 79.0882 },
        nashik: { lat: 19.9975, lon: 73.7898 },
      };

      const coords = regionCoords[filters.region] || regionCoords.maharashtra;
      const apiKey = import.meta.env.VITE_OPENWHEATHER_API_KEY;

      if (!apiKey) {
        throw new Error('OpenWeather API key not configured');
      }

      // Fetch current weather and 7-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`
      );

      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const forecastData = await forecastResponse.json();
      
      // Get current temperature from first forecast entry
      const currentTemp = Math.round(forecastData.list[0].main.temp);
      
      // Process 7-day forecast (group by day and get daily min/max/avg)
      const dailyData: Record<string, { temps: number[]; maxs: number[]; mins: number[] }> = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      forecastData.list.slice(0, 40).forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dayName = days[date.getDay()];
        
        if (!dailyData[dayName]) {
          dailyData[dayName] = { temps: [], maxs: [], mins: [] };
        }
        
        dailyData[dayName].temps.push(item.main.temp);
        dailyData[dayName].maxs.push(item.main.temp_max);
        dailyData[dayName].mins.push(item.main.temp_min);
      });

      // Convert to weekly data array
      const weeklyData = Object.entries(dailyData).slice(0, 7).map(([day, data]) => ({
        day,
        temp: Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length),
        max: Math.round(Math.max(...data.maxs)),
        min: Math.round(Math.min(...data.mins)),
      }));

      // Determine temperature status based on crop type
      let status = 'normal';
      let impact = '';
      
      // Rice optimal temperature range: 20-35°C
      if (filters.crop === 'rice') {
        if (currentTemp > 35) {
          status = 'heat';
          impact = 'High temperatures may stress rice plants. Consider increasing irrigation frequency.';
        } else if (currentTemp < 20) {
          status = 'cold';
          impact = 'Low temperatures may slow rice growth. Monitor for cold stress symptoms.';
        } else {
          status = 'normal';
          impact = 'Temperatures within optimal range for rice cultivation.';
        }
      } else if (filters.crop === 'wheat') {
        if (currentTemp > 30) {
          status = 'heat';
          impact = 'High temperatures during grain filling may reduce wheat yield.';
        } else if (currentTemp < 10) {
          status = 'cold';
          impact = 'Cold temperatures may affect wheat germination and growth.';
        } else {
          status = 'normal';
          impact = 'Temperatures suitable for wheat cultivation.';
        }
      } else {
        // Default for other crops
        if (currentTemp > 35) {
          status = 'heat';
          impact = 'High temperatures may cause heat stress. Ensure adequate irrigation.';
        } else if (currentTemp < 15) {
          status = 'cold';
          impact = 'Low temperatures may slow crop growth.';
        } else {
          status = 'normal';
          impact = 'Temperatures within acceptable range for crop cultivation.';
        }
      }

      const processedData = {
        current: currentTemp,
        status,
        stressLevel: status === 'normal' ? 'low' : 'medium',
        weeklyData,
        impact,
      };

      setTempData(processedData);
    } catch (error) {
      console.error('Error fetching temperature data:', error);
      
      // Fallback to mock data if API fails
      const mockData = {
        current: 28,
        status: 'normal',
        stressLevel: 'low',
        weeklyData: [
          { day: 'Mon', temp: 26, max: 30, min: 22 },
          { day: 'Tue', temp: 27, max: 31, min: 23 },
          { day: 'Wed', temp: 28, max: 32, min: 24 },
          { day: 'Thu', temp: 29, max: 33, min: 25 },
          { day: 'Fri', temp: 28, max: 32, min: 24 },
          { day: 'Sat', temp: 27, max: 31, min: 23 },
          { day: 'Sun', temp: 26, max: 30, min: 22 },
        ],
        impact: 'Unable to fetch real-time data. Showing estimated temperatures.',
      };
      setTempData(mockData);
    } finally {
      setLoading(false);
    }
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
