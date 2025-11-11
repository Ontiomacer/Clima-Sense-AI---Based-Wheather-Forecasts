import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EvapotranspirationProps {
  filters: any;
}

const Evapotranspiration = ({ filters }: EvapotranspirationProps) => {
  const [etData, setEtData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchETData();
  }, [filters]);

  const fetchETData = async () => {
    setLoading(true);
    const mockData = {
      currentET: 5.2,
      waterStressIndex: 1.3,
      status: 'mild_stress',
      weeklyData: [
        { day: 'Mon', et: 4.8, rainfall: 5 },
        { day: 'Tue', et: 5.0, rainfall: 2 },
        { day: 'Wed', et: 5.2, rainfall: 0 },
        { day: 'Thu', et: 5.4, rainfall: 0 },
        { day: 'Fri', et: 5.3, rainfall: 3 },
        { day: 'Sat', et: 5.1, rainfall: 5 },
        { day: 'Sun', et: 4.9, rainfall: 4 },
      ],
    };

    setTimeout(() => {
      setEtData(mockData);
      setLoading(false);
    }, 700);
  };

  const getStressColor = (wsi: number) => {
    if (wsi <= 1) return 'text-green-500';
    if (wsi <= 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStressLabel = (wsi: number) => {
    if (wsi <= 1) return '🟢 Balanced';
    if (wsi <= 2) return '🟠 Mild Stress';
    return '🔴 Severe Stress';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-primary" />
            Evapotranspiration & Water Stress
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
          <Waves className="w-5 h-5 text-primary" />
          Evapotranspiration & Water Stress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current ET₀</p>
            <p className="text-2xl font-bold">{etData.currentET} mm/day</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Water Stress Index</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${getStressColor(etData.waterStressIndex)}`}>
                {etData.waterStressIndex.toFixed(1)}
              </p>
            </div>
            <p className={`text-xs font-medium ${getStressColor(etData.waterStressIndex)}`}>
              {getStressLabel(etData.waterStressIndex)}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">ET₀ vs Rainfall (7 Days)</p>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={etData.weeklyData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rainfall" fill="#3b82f6" name="Rainfall (mm)" />
              <Line
                type="monotone"
                dataKey="et"
                stroke="#f97316"
                strokeWidth={2}
                name="ET₀ (mm/day)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Interpretation:</strong> Water Stress Index = ET₀ / Rainfall.
            {etData.waterStressIndex <= 1 && ' Water supply is balanced with crop demand.'}
            {etData.waterStressIndex > 1 && etData.waterStressIndex <= 2 && ' Mild water stress detected. Consider supplemental irrigation.'}
            {etData.waterStressIndex > 2 && ' Severe water stress. Immediate irrigation required.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Evapotranspiration;
