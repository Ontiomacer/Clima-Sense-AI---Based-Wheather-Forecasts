import { Card, CardContent } from '@/components/ui/card';
import { Sprout, Droplets, Flame, Wind } from 'lucide-react';

interface IndicatorsProps {
  forecastData: any;
}

const ClimateIndicators = ({ forecastData }: IndicatorsProps) => {
  if (!forecastData) return null;

  const monthly = forecastData.forecast.monthly;
  const avgTemp = monthly.reduce((sum: number, m: any) => sum + m.temperature.predicted, 0) / monthly.length;
  const totalRain = monthly.reduce((sum: number, m: any) => sum + m.rainfall.predicted, 0);
  const avgHumidity = monthly.reduce((sum: number, m: any) => sum + m.humidity.predicted, 0) / monthly.length;

  // Calculate indicators
  const ndviIndex = Math.min(1, Math.max(0, (totalRain / 1500) * 0.8 + 0.2)); // Simplified NDVI estimation
  const waterStress = Math.max(0, 100 - (totalRain / 15)); // % deficit
  const heatwaveRisk = avgTemp > 38 ? 'High' : avgTemp > 35 ? 'Moderate' : 'Low';
  const humidityDeviation = avgHumidity - 65; // Baseline 65%

  const indicators = [
    {
      icon: Sprout,
      label: 'Crop Growth Index',
      value: ndviIndex.toFixed(2),
      change: ndviIndex > 0.6 ? '+Good' : ndviIndex > 0.4 ? 'Moderate' : 'Low',
      color: ndviIndex > 0.6 ? 'text-green-600' : ndviIndex > 0.4 ? 'text-yellow-600' : 'text-orange-600',
      bgColor: ndviIndex > 0.6 ? 'bg-green-50 dark:bg-green-950/20' : ndviIndex > 0.4 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-orange-50 dark:bg-orange-950/20',
    },
    {
      icon: Droplets,
      label: 'Water Stress Level',
      value: `${waterStress.toFixed(0)}%`,
      change: waterStress > 30 ? 'High Deficit' : waterStress > 15 ? 'Moderate' : 'Adequate',
      color: waterStress > 30 ? 'text-red-600' : waterStress > 15 ? 'text-orange-600' : 'text-blue-600',
      bgColor: waterStress > 30 ? 'bg-red-50 dark:bg-red-950/20' : waterStress > 15 ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      icon: Flame,
      label: 'Heatwave Risk',
      value: heatwaveRisk,
      change: `${avgTemp.toFixed(1)}°C avg`,
      color: heatwaveRisk === 'High' ? 'text-red-600' : heatwaveRisk === 'Moderate' ? 'text-orange-600' : 'text-green-600',
      bgColor: heatwaveRisk === 'High' ? 'bg-red-50 dark:bg-red-950/20' : heatwaveRisk === 'Moderate' ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-green-50 dark:bg-green-950/20',
    },
    {
      icon: Wind,
      label: 'Humidity Deviation',
      value: `${humidityDeviation > 0 ? '+' : ''}${humidityDeviation.toFixed(1)}%`,
      change: humidityDeviation > 10 ? 'Above Normal' : humidityDeviation < -10 ? 'Below Normal' : 'Normal',
      color: Math.abs(humidityDeviation) > 10 ? 'text-orange-600' : 'text-green-600',
      bgColor: Math.abs(humidityDeviation) > 10 ? 'bg-orange-50 dark:bg-orange-950/20' : 'bg-green-50 dark:bg-green-950/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {indicators.map((indicator, index) => (
        <Card key={index} className={`${indicator.bgColor} border-none shadow-sm`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <indicator.icon className={`w-5 h-5 ${indicator.color}`} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {indicator.label}
                  </span>
                </div>
                <div className={`text-2xl font-bold ${indicator.color}`}>
                  {indicator.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {indicator.change}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClimateIndicators;
