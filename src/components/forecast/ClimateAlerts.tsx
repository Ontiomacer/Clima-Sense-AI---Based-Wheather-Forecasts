import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface AlertsProps {
  forecastData: any;
}

const ClimateAlerts = ({ forecastData }: AlertsProps) => {
  if (!forecastData) return null;

  const monthly = forecastData.forecast.monthly;
  const nextMonth = monthly[0];
  const avgTemp = monthly.slice(0, 2).reduce((sum: number, m: any) => sum + m.temperature.predicted, 0) / 2;
  const totalRain = monthly.slice(0, 2).reduce((sum: number, m: any) => sum + m.rainfall.predicted, 0);

  const alerts = [];

  // Drought alert
  if (totalRain < 100) {
    alerts.push({
      level: 'high',
      icon: AlertTriangle,
      title: 'Drought Watch',
      message: `Rainfall predicted below 100mm for the next 60 days (${totalRain.toFixed(0)}mm expected).`,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
    });
  }

  // Heatwave alert
  if (avgTemp > 38) {
    alerts.push({
      level: 'high',
      icon: AlertTriangle,
      title: 'Heatwave Warning',
      message: `Extreme temperatures expected (avg ${avgTemp.toFixed(1)}°C). Heat stress conditions likely.`,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
    });
  } else if (avgTemp > 35) {
    alerts.push({
      level: 'moderate',
      icon: AlertCircle,
      title: 'Heat Advisory',
      message: `Above-normal temperatures forecast (${avgTemp.toFixed(1)}°C). Stay hydrated.`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    });
  }

  // Heavy rainfall alert
  if (totalRain > 500) {
    alerts.push({
      level: 'moderate',
      icon: AlertCircle,
      title: 'Heavy Rainfall Expected',
      message: `Significant precipitation forecast (${totalRain.toFixed(0)}mm). Monitor for flooding.`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    });
  }

  // Stable conditions
  if (alerts.length === 0) {
    alerts.push({
      level: 'stable',
      icon: CheckCircle,
      title: 'Stable Conditions',
      message: 'No significant climate risks detected for the forecast period.',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      borderColor: 'border-green-200 dark:border-green-800',
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Climate Alerts & Warnings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg border ${alert.bgColor} ${alert.borderColor}`}
          >
            <alert.icon className={`w-5 h-5 ${alert.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <div className={`font-semibold ${alert.color} mb-1`}>
                {alert.title}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {alert.message}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ClimateAlerts;
