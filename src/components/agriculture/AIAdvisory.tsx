import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

interface AIAdvisoryProps {
  filters: any;
}

interface GraphCastForecastResponse {
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  forecast: Array<{
    date: string;
    rain_risk: number;
    temp_extreme: number;
    soil_moisture_proxy: number;
    confidence_score: number;
    raw_data: {
      precipitation_mm: number;
      temp_max_c: number;
      temp_min_c: number;
      humidity_percent: number;
    };
  }>;
  metadata: {
    model_version: string;
    generated_at: string;
    cache_hit: boolean;
    inference_time_ms: number;
  };
}

interface AgriAnalysisResponse {
  model: string;
  analysis: {
    category: string;
    confidence: number;
    recommendations: string[];
  };
  timestamp: string;
}

const AIAdvisory = ({ filters }: AIAdvisoryProps) => {
  const [advisory, setAdvisory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<GraphCastForecastResponse | null>(null);
  const [agriBertAnalysis, setAgriBertAnalysis] = useState<AgriAnalysisResponse | null>(null);

  useEffect(() => {
    fetchAIAdvisory();
  }, [filters]);

  // Region coordinates mapping (center points for Maharashtra regions)
  const getRegionCoordinates = (region: string): { lat: number; lon: number } => {
    const coordinates: Record<string, { lat: number; lon: number }> = {
      maharashtra: { lat: 19.7515, lon: 75.7139 }, // Pune
      pune: { lat: 18.5204, lon: 73.8567 },
      mumbai: { lat: 19.0760, lon: 72.8777 },
      nagpur: { lat: 21.1458, lon: 79.0882 },
      nashik: { lat: 19.9975, lon: 73.7898 },
    };
    return coordinates[region.toLowerCase()] || coordinates.maharashtra;
  };

  const fetchAIAdvisory = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get coordinates for the selected region
      const coords = getRegionCoordinates(filters.region);

      // Fetch GraphCast forecast
      const forecastResponse = await fetch('http://localhost:8000/api/graphcast_forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lon,
          forecast_days: 10,
        }),
      });

      if (!forecastResponse.ok) {
        throw new Error(`GraphCast API error: ${forecastResponse.status}`);
      }

      const forecastData: GraphCastForecastResponse = await forecastResponse.json();
      setForecastData(forecastData);

      // Generate advisory from forecast data
      const generatedAdvisory = generateAdvisoryFromForecast(forecastData, filters);
      
      // Call AgriBERT for additional recommendations
      try {
        const agriBertResponse = await fetch('http://localhost:8000/api/agri_analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: generatedAdvisory.summary,
            context: {
              crop: filters.crop,
              region: filters.region,
              season: filters.season,
            },
          }),
        });

        if (agriBertResponse.ok) {
          const agriBertData: AgriAnalysisResponse = await agriBertResponse.json();
          setAgriBertAnalysis(agriBertData);
          
          // Enhance advisory with AgriBERT recommendations
          if (agriBertData.analysis.recommendations.length > 0) {
            generatedAdvisory.keyPoints = [
              ...generatedAdvisory.keyPoints,
              ...agriBertData.analysis.recommendations.slice(0, 2).map(rec => `🤖 ${rec}`),
            ];
          }
        }
      } catch (agriBertError) {
        console.warn('AgriBERT analysis unavailable:', agriBertError);
        // Continue without AgriBERT - not critical
      }

      setAdvisory(generatedAdvisory);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching AI advisory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast data');
      setLoading(false);
    }
  };

  const generateAdvisoryFromForecast = (
    forecast: GraphCastForecastResponse,
    filters: any
  ) => {
    // Extract metrics from first 7 days (most reliable)
    const next7Days = forecast.forecast.slice(0, 7);
    
    // Calculate average metrics
    const avgRainRisk = next7Days.reduce((sum, day) => sum + day.rain_risk, 0) / next7Days.length;
    const avgTempExtreme = next7Days.reduce((sum, day) => sum + day.temp_extreme, 0) / next7Days.length;
    const avgSoilMoisture = next7Days.reduce((sum, day) => sum + day.soil_moisture_proxy, 0) / next7Days.length;
    const avgConfidence = next7Days.reduce((sum, day) => sum + day.confidence_score, 0) / next7Days.length;
    
    // Calculate total precipitation
    const totalPrecip = next7Days.reduce((sum, day) => sum + day.raw_data.precipitation_mm, 0);
    const avgTemp = next7Days.reduce((sum, day) => sum + (day.raw_data.temp_max_c + day.raw_data.temp_min_c) / 2, 0) / next7Days.length;
    
    // Generate summary based on metrics
    let summary = '';
    const cropName = filters.crop.charAt(0).toUpperCase() + filters.crop.slice(1);
    
    // Rainfall assessment
    if (avgRainRisk < 30) {
      summary += `Low rainfall expected (${totalPrecip.toFixed(1)}mm over 7 days). `;
    } else if (avgRainRisk < 60) {
      summary += `Moderate rainfall expected (${totalPrecip.toFixed(1)}mm over 7 days). `;
    } else {
      summary += `High rainfall risk (${totalPrecip.toFixed(1)}mm over 7 days). `;
    }
    
    // Temperature assessment
    if (avgTempExtreme < 30) {
      summary += `Temperature conditions favorable for ${cropName} cultivation (avg ${avgTemp.toFixed(1)}°C). `;
    } else if (avgTempExtreme < 60) {
      summary += `Moderate temperature stress expected for ${cropName} (avg ${avgTemp.toFixed(1)}°C). `;
    } else {
      summary += `High temperature stress risk for ${cropName} (avg ${avgTemp.toFixed(1)}°C). `;
    }
    
    // Soil moisture assessment
    if (avgSoilMoisture < 40) {
      summary += `Soil moisture low (${avgSoilMoisture.toFixed(0)}%) - irrigation recommended.`;
    } else if (avgSoilMoisture < 70) {
      summary += `Soil moisture adequate (${avgSoilMoisture.toFixed(0)}%).`;
    } else {
      summary += `Soil moisture high (${avgSoilMoisture.toFixed(0)}%) - monitor drainage.`;
    }
    
    // Generate key points based on thresholds
    const keyPoints: string[] = [];
    
    // Rainfall recommendations
    if (avgRainRisk < 30) {
      keyPoints.push('💧 Plan irrigation - low rainfall expected');
    } else if (avgRainRisk > 60) {
      keyPoints.push('🌧️ Heavy rainfall expected - ensure proper drainage');
    } else {
      keyPoints.push('🌧️ Moderate rainfall - monitor soil moisture');
    }
    
    // Temperature recommendations
    if (avgTempExtreme < 30) {
      keyPoints.push(`✅ Temperature optimal for ${cropName} growth`);
    } else if (avgTempExtreme < 60) {
      keyPoints.push('🌡️ Monitor temperature stress - consider shade/mulching');
    } else {
      keyPoints.push('⚠️ High temperature stress - implement cooling measures');
    }
    
    // Soil moisture recommendations
    if (avgSoilMoisture < 40) {
      keyPoints.push('💧 Irrigation required within 2-3 days');
    } else if (avgSoilMoisture > 70) {
      keyPoints.push('💦 Excess moisture - check drainage systems');
    } else {
      keyPoints.push('✅ Soil moisture levels adequate');
    }
    
    // Confidence-based recommendation
    if (avgConfidence > 0.7) {
      keyPoints.push(`📊 High forecast confidence (${(avgConfidence * 100).toFixed(0)}%)`);
    } else {
      keyPoints.push(`📊 Moderate forecast confidence (${(avgConfidence * 100).toFixed(0)}%) - monitor updates`);
    }
    
    // Calculate yield forecast based on conditions
    // Simple correlation: optimal conditions = higher yield
    const baseYield = getCropBaseYield(filters.crop);
    const rainFactor = avgRainRisk < 30 ? 0.85 : (avgRainRisk > 60 ? 0.90 : 1.0);
    const tempFactor = avgTempExtreme < 30 ? 1.0 : (avgTempExtreme > 60 ? 0.80 : 0.90);
    const moistureFactor = avgSoilMoisture < 40 ? 0.85 : (avgSoilMoisture > 70 ? 0.90 : 1.0);
    
    const predictedYield = baseYield * rainFactor * tempFactor * moistureFactor;
    const yieldRange = [predictedYield * 0.9, predictedYield * 1.1];
    
    return {
      summary,
      keyPoints,
      yieldForecast: {
        predicted: parseFloat(predictedYield.toFixed(1)),
        range: [parseFloat(yieldRange[0].toFixed(1)), parseFloat(yieldRange[1].toFixed(1))],
        unit: 'tons/ha',
      },
    };
  };
  
  const getCropBaseYield = (crop: string): number => {
    // Base yields for Maharashtra crops (tons/ha)
    const baseYields: Record<string, number> = {
      rice: 4.2,
      wheat: 3.5,
      cotton: 2.8,
      sugarcane: 85.0,
      soybean: 1.8,
      maize: 3.2,
    };
    return baseYields[crop.toLowerCase()] || 3.0;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Generating AI advisory with GraphCast...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Unable to Generate Advisory</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Please ensure the AI backend is running on port 8000.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              AI Farming Advisory
              <span className="text-xs font-normal text-muted-foreground">
                for {filters.region.charAt(0).toUpperCase() + filters.region.slice(1)} • {filters.crop.charAt(0).toUpperCase() + filters.crop.slice(1)}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{advisory.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                {advisory.keyPoints.map((point: string, idx: number) => (
                  <p key={idx} className="text-sm">
                    {point}
                  </p>
                ))}
              </div>
              <div className="bg-background/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold">Predicted Yield</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {advisory.yieldForecast.predicted} <span className="text-lg">tons/ha</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Range: {advisory.yieldForecast.range[0]} - {advisory.yieldForecast.range[1]} tons/ha
                </p>
              </div>
            </div>

            {agriBertAnalysis && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">AgriBERT Analysis</span>
                  <span className="text-xs text-muted-foreground">
                    {agriBertAnalysis.analysis.category} • {(agriBertAnalysis.analysis.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                {agriBertAnalysis.analysis.recommendations.length > 0 && (
                  <div className="space-y-1">
                    {agriBertAnalysis.analysis.recommendations.map((rec, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">• {rec}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              💡 Powered by GraphCast + AgriBERT • {forecastData?.metadata.cache_hit ? 'Cached' : 'Live'} forecast
              {forecastData?.metadata.inference_time_ms && ` • ${forecastData.metadata.inference_time_ms}ms`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAdvisory;
