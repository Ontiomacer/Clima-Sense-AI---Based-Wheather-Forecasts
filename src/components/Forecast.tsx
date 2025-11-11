import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, Download, TrendingUp, Loader2, MapPin } from 'lucide-react';
import { useAIForecast } from '@/hooks/useAIForecast';

const Forecast = () => {
  // Fetch real AI forecast data for Indian subcontinent
  // Coordinates: Central India (20.5937°N, 78.9629°E)
  const { data: forecastData, loading } = useAIForecast(20.5937, 78.9629, 'India');

  // Prepare chart data from AI forecast (using monthly aggregation)
  const temperatureData = forecastData?.forecast.monthly.map(month => ({
    month: month.month,
    predicted: month.temperature.predicted,
    historical: month.temperature.historical,
    lower: month.temperature.lower,
    upper: month.temperature.upper
  })) || [];

  const rainfallData = forecastData?.forecast.monthly.map(month => ({
    month: month.month,
    predicted: month.rainfall.predicted,
    historical: month.rainfall.historical
  })) || [];

  const exportToCSV = () => {
    if (!forecastData) return;
    
    // Create CSV header
    const header = ['Date', 'Month', 'Temperature (°C)', 'Temp Min (°C)', 'Temp Max (°C)', 'Rainfall (mm)', 'Humidity (%)'];
    
    // Create CSV rows from daily data
    const rows = forecastData.forecast.daily.map(day => [
      day.date,
      day.dayLabel,
      day.temperature.predicted.toFixed(1),
      day.temperature.lower.toFixed(1),
      day.temperature.upper.toFixed(1),
      day.rainfall.predicted.toFixed(1),
      day.humidity.predicted.toFixed(1)
    ]);
    
    // Combine header and rows
    const csv = [header, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `climasense-forecast-india-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <section id="forecast" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">AI-Powered Forecasts</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Time series predictions enhanced with NASA POWER and OpenWeather data
          </p>
          {forecastData && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{forecastData.location.name}</span>
              <span>•</span>
              <span>Trained on {forecastData.historical.dataPoints} days</span>
              <span>•</span>
              <span>{forecastData.model.confidence} confidence</span>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <p className="text-muted-foreground">Generating AI forecast...</p>
              <p className="text-sm text-muted-foreground">Fetching NASA POWER data and training model</p>
              <p className="text-xs text-muted-foreground">This may take 5-10 seconds</p>
            </div>
          </div>
        )}

        {!loading && !forecastData && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Unable to load forecast data</p>
              <p className="text-sm text-muted-foreground">Please ensure the AI Forecast server is running on port 3002</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Temperature Forecast */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card animate-fade-in">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-interactive" />
                    Temperature Forecast - Next 180 Days
                  </CardTitle>
                  <CardDescription>
                    {forecastData ? forecastData.model.type : 'AI model with 95% confidence intervals'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!forecastData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="url(#tempGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#00c6ff' }}
                    name="AI Prediction (°C)"
                  />
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00c6ff" />
                      <stop offset="100%" stopColor="#0072ff" />
                    </linearGradient>
                  </defs>
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--muted-foreground))' }}
                    name="Historical Avg"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rainfall Comparison */}
          <Card className="bg-gradient-card backdrop-blur-sm border-border/50 shadow-card animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Rainfall Prediction vs Historical Trend
                  </CardTitle>
                  <CardDescription>
                    {forecastData ? `Monthly aggregated predictions from NASA POWER data` : 'AI prediction comparison'}
                  </CardDescription>
                </div>
                {forecastData?.current && (
                  <div className="text-sm text-muted-foreground">
                    Current: {forecastData.current.temperature}°C, {forecastData.current.description}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={rainfallData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="url(#rainGradient)"
                    fill="url(#rainGradientFill)"
                    strokeWidth={2}
                    name="AI Predicted (mm)"
                  />
                  <defs>
                    <linearGradient id="rainGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00c6ff" />
                      <stop offset="100%" stopColor="#0072ff" />
                    </linearGradient>
                    <linearGradient id="rainGradientFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00c6ff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0072ff" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="historical"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent) / 0.3)"
                    name="Historical Avg (mm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Forecast;
