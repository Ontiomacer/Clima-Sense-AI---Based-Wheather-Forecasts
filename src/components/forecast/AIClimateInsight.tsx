import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AIInsightProps {
  forecastData: any;
  type: 'temperature' | 'rainfall';
}

const AIClimateInsight = ({ forecastData, type }: AIInsightProps) => {
  const [insight, setInsight] = useState<string>('');
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!forecastData) return;

    const generateInsight = () => {
      setLoading(true);
      
      const monthly = forecastData.forecast.monthly;
      if (!monthly || monthly.length === 0) return;

      const firstMonth = monthly[0];
      const lastMonth = monthly[monthly.length - 1];
      
      if (type === 'temperature') {
        const tempChange = lastMonth.temperature.predicted - firstMonth.temperature.predicted;
        const avgTemp = monthly.reduce((sum: number, m: any) => sum + m.temperature.predicted, 0) / monthly.length;
        const percentChange = ((tempChange / firstMonth.temperature.predicted) * 100).toFixed(1);
        
        setTrend(tempChange > 1 ? 'up' : tempChange < -1 ? 'down' : 'stable');
        
        setInsight(
          `Temperature forecast shows ${tempChange > 0 ? 'an increase' : tempChange < 0 ? 'a decrease' : 'stability'} of ${Math.abs(tempChange).toFixed(1)}°C (${percentChange}%) over the next 6 months. ` +
          `Average temperature expected: ${avgTemp.toFixed(1)}°C. ` +
          `${tempChange > 5 ? '⚠️ Significant warming trend detected - prepare for heat stress conditions.' : 
             tempChange < -3 ? '❄️ Cooling trend observed - monitor for cold weather impacts.' : 
             '✓ Moderate temperature variations expected within normal seasonal patterns.'}`
        );
      } else {
        const rainChange = lastMonth.rainfall.predicted - firstMonth.rainfall.predicted;
        const totalRain = monthly.reduce((sum: number, m: any) => sum + m.rainfall.predicted, 0);
        const avgRain = totalRain / monthly.length;
        const percentChange = ((rainChange / (firstMonth.rainfall.predicted || 1)) * 100).toFixed(1);
        
        setTrend(rainChange > 50 ? 'up' : rainChange < -50 ? 'down' : 'stable');
        
        setInsight(
          `Rainfall forecast indicates ${rainChange > 0 ? 'increasing' : rainChange < 0 ? 'decreasing' : 'stable'} precipitation patterns with ${Math.abs(percentChange)}% change. ` +
          `Total expected rainfall: ${totalRain.toFixed(0)}mm over 6 months (avg: ${avgRain.toFixed(1)}mm/month). ` +
          `${avgRain < 50 ? '🌵 Low rainfall alert - water conservation measures recommended.' : 
             avgRain > 300 ? '🌧️ High precipitation expected - monitor for flood risks.' : 
             '💧 Moderate rainfall levels support normal agricultural activities.'}`
        );
      }
      
      setLoading(false);
    };

    generateInsight();
  }, [forecastData, type]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-orange-500' : trend === 'down' ? 'text-blue-500' : 'text-green-500';

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          AI Climate Insight
          <TrendIcon className={`w-4 h-4 ml-auto ${trendColor}`} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent" />
            Analyzing forecast patterns...
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {insight}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AIClimateInsight;
