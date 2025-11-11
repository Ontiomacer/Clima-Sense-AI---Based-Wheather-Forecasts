import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CropSuitabilityProps {
  filters: any;
}

const CropSuitability = ({ filters }: CropSuitabilityProps) => {
  const [suitabilityData, setSuitabilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuitabilityData();
  }, [filters]);

  const fetchSuitabilityData = async () => {
    setLoading(true);
    const mockData = {
      optimal: [
        { crop: 'Rice', score: 92, icon: '🌾' },
        { crop: 'Maize', score: 88, icon: '🌽' },
      ],
      suitable: [
        { crop: 'Soybean', score: 75, icon: '🫘' },
        { crop: 'Cotton', score: 72, icon: '🌱' },
      ],
      alternative: [
        { crop: 'Millets', score: 85, icon: '🌾', reason: 'Drought-resistant option' },
      ],
      recommendation: 'Based on current NDVI (0.68), soil moisture (42%), and temperature (32°C), rice and maize show optimal suitability.',
    };

    setTimeout(() => {
      setSuitabilityData(mockData);
      setLoading(false);
    }, 750);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" />
            AI Crop Suitability
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
          <Sprout className="w-5 h-5 text-primary" />
          AI Crop Suitability
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Optimal Crops */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Optimal Crops</p>
          </div>
          <div className="space-y-3">
            {suitabilityData.optimal.map((crop: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {crop.icon} {crop.crop}
                  </span>
                  <span className="text-sm font-semibold text-green-600">{crop.score}%</span>
                </div>
                <Progress value={crop.score} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Suitable Crops */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Suitable Crops</p>
          </div>
          <div className="space-y-3">
            {suitabilityData.suitable.map((crop: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {crop.icon} {crop.crop}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">{crop.score}%</span>
                </div>
                <Progress value={crop.score} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Options */}
        {suitabilityData.alternative.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                Drought-Resistant Alternatives
              </p>
            </div>
            {suitabilityData.alternative.map((crop: any, idx: number) => (
              <div key={idx} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {crop.icon} {crop.crop}
                  </span>
                  <span className="text-sm font-semibold text-yellow-600">{crop.score}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{crop.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI Recommendation */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            <strong>AI Recommendation:</strong> {suitabilityData.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CropSuitability;
