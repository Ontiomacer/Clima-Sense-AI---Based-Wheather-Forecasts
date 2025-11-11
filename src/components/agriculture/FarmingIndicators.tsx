import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CropHealthIndex from './CropHealthIndex';
import SoilMoisturePanel from './SoilMoisturePanel';
import TemperatureStress from './TemperatureStress';
import RainfallAdequacy from './RainfallAdequacy';
import CropSuitability from './CropSuitability';
import Evapotranspiration from './Evapotranspiration';
import AIAdvisory from './AIAdvisory';
import SatelliteView from './SatelliteView';
import FarmingFilters from './FarmingFilters';
import GraphCastHeatmap from './GraphCastHeatmap';
import ForecastMetricsTable from './ForecastMetricsTable';
import { useGraphCastForecast } from '@/hooks/useGraphCastForecast';
import { Sprout, Leaf, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Region coordinates for GraphCast forecast
const REGION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  maharashtra: { lat: 19.5, lon: 75.0 },
  pune: { lat: 18.5204, lon: 73.8567 },
  mumbai: { lat: 19.0760, lon: 72.8777 },
  nagpur: { lat: 21.1458, lon: 79.0882 },
  nashik: { lat: 19.9975, lon: 73.7898 },
};

const FarmingIndicators = () => {
  const [filters, setFilters] = useState({
    region: 'maharashtra',
    crop: 'rice',
    season: 'kharif',
  });

  const [showAIAdvisory, setShowAIAdvisory] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Get coordinates for selected region
  const regionCoords = REGION_COORDINATES[filters.region] || REGION_COORDINATES.maharashtra;

  // Fetch GraphCast forecast data
  const {
    data: forecastData,
    loading: forecastLoading,
    error: forecastError,
    refetch: refetchForecast,
  } = useGraphCastForecast({
    latitude: regionCoords.lat,
    longitude: regionCoords.lon,
    forecast_days: 10,
    enabled: true,
  });

  return (
    <section className="py-12 px-4 min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sprout className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Farming Intelligence</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            AI-powered agricultural insights combining satellite data, climate forecasts, and machine learning
            for optimal farming decisions
          </p>
        </div>

        {/* Filters */}
        <FarmingFilters
          filters={filters}
          setFilters={setFilters}
          showAIAdvisory={showAIAdvisory}
          setShowAIAdvisory={setShowAIAdvisory}
          compareMode={compareMode}
          setCompareMode={setCompareMode}
        />

        {/* AI Advisory Banner */}
        {showAIAdvisory && (
          <AIAdvisory filters={filters} />
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="soil-water">Soil & Water</TabsTrigger>
            <TabsTrigger value="climate">Climate Risk</TabsTrigger>
            <TabsTrigger value="forecast">Weather Forecast</TabsTrigger>
            <TabsTrigger value="satellite">Satellite</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CropHealthIndex filters={filters} compareMode={compareMode} />
              <CropSuitability filters={filters} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SoilMoisturePanel filters={filters} />
              <TemperatureStress filters={filters} />
            </div>
          </TabsContent>

          {/* Soil & Water Tab */}
          <TabsContent value="soil-water" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SoilMoisturePanel filters={filters} detailed />
              <Evapotranspiration filters={filters} />
            </div>
            <RainfallAdequacy filters={filters} compareMode={compareMode} />
          </TabsContent>

          {/* Climate Risk Tab */}
          <TabsContent value="climate" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TemperatureStress filters={filters} detailed />
              <RainfallAdequacy filters={filters} />
            </div>
          </TabsContent>

          {/* Weather Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6 mt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">10-Day Weather Forecast</h2>
              <p className="text-muted-foreground">
                AI-powered weather predictions using GraphCast model with agricultural risk metrics
              </p>
            </div>
            
            {/* Loading State */}
            {forecastLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">Loading weather forecast...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {forecastError && !forecastLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Forecast Unavailable</AlertTitle>
                <AlertDescription>
                  {forecastError}
                  <button
                    onClick={refetchForecast}
                    className="ml-2 underline hover:no-underline"
                  >
                    Try again
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Empty State */}
            {!forecastLoading && !forecastError && !forecastData && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Forecast Data</AlertTitle>
                <AlertDescription>
                  No forecast data is currently available for this region.
                </AlertDescription>
              </Alert>
            )}

            {/* Forecast Content */}
            {!forecastLoading && !forecastError && forecastData && (
              <>
                {/* Desktop Layout: Side by Side */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-6">
                  <GraphCastHeatmap
                    forecastData={forecastData}
                    selectedDate={selectedDate}
                    metric="rain_risk"
                  />
                  <ForecastMetricsTable
                    forecastData={forecastData}
                    onDateSelect={setSelectedDate}
                  />
                </div>
                
                {/* Mobile Layout: Stacked */}
                <div className="lg:hidden space-y-6">
                  <GraphCastHeatmap
                    forecastData={forecastData}
                    selectedDate={selectedDate}
                    metric="rain_risk"
                  />
                  <ForecastMetricsTable
                    forecastData={forecastData}
                    onDateSelect={setSelectedDate}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Satellite Tab */}
          <TabsContent value="satellite" className="mt-6">
            <SatelliteView filters={filters} />
          </TabsContent>
        </Tabs>

        {/* Info Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Real-Time Data</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Powered by Google Earth Engine, NASA POWER, and OpenWeather APIs
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Sprout className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">AI Predictions</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Machine learning models for yield forecasting and crop recommendations
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Sprout className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Actionable Insights</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Context-aware recommendations for irrigation, sowing, and crop management
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FarmingIndicators;
