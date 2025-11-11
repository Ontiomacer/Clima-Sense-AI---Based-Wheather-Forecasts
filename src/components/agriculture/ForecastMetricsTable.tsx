import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronUp,
  Download,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  ArrowUpDown,
} from 'lucide-react';

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
      wind_speed_ms?: number;
    };
  }>;
  metadata: {
    model_version: string;
    generated_at: string;
    cache_hit: boolean;
    inference_time_ms: number;
  };
}

interface ForecastMetricsTableProps {
  forecastData?: GraphCastForecastResponse;
  onDateSelect?: (date: string) => void;
}

type SortColumn = 'date' | 'rain_risk' | 'temp_extreme' | 'soil_moisture_proxy' | 'confidence_score';
type SortDirection = 'asc' | 'desc';

const ForecastMetricsTable = memo(({ forecastData, onDateSelect }: ForecastMetricsTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Memoize callbacks to prevent unnecessary re-renders
  const toggleRow = useCallback((date: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(date)) {
        newExpanded.delete(date);
      } else {
        newExpanded.add(date);
      }
      return newExpanded;
    });
  }, []);

  const handleSort = useCallback((column: SortColumn) => {
    setSortColumn(prevColumn => {
      if (prevColumn === column) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        return column;
      } else {
        setSortDirection('asc');
        return column;
      }
    });
  }, []);

  // Memoize sorted data to avoid recalculation on every render
  const sortedData = useMemo(() => {
    if (!forecastData?.forecast) return [];

    return [...forecastData.forecast].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortColumn === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else {
        aValue = a[sortColumn];
        bValue = b[sortColumn];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [forecastData, sortColumn, sortDirection]);

  // Memoize helper functions
  const getRiskColor = useCallback((value: number): string => {
    if (value < 30) return 'text-green-600 bg-green-50';
    if (value < 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getRiskLevel = useCallback((value: number): string => {
    if (value < 30) return 'Low';
    if (value < 60) return 'Moderate';
    return 'High';
  }, []);

  const getWeatherIcon = useCallback((forecast: any) => {
    const { precipitation_mm, temp_max_c } = forecast.raw_data;
    
    if (precipitation_mm > 10) {
      return <CloudRain className="w-4 h-4 text-blue-500" />;
    } else if (temp_max_c > 35) {
      return <Thermometer className="w-4 h-4 text-red-500" />;
    } else {
      return <Droplets className="w-4 h-4 text-green-500" />;
    }
  }, []);

  // Memoize CSV export function
  const exportToCSV = useCallback(() => {
    if (!forecastData?.forecast) return;

    const headers = [
      'Date',
      'Rain Risk',
      'Temp Extreme',
      'Soil Moisture',
      'Confidence',
      'Precipitation (mm)',
      'Temp Max (°C)',
      'Temp Min (°C)',
      'Humidity (%)',
      'Wind Speed (m/s)',
    ];

    const rows = forecastData.forecast.map((f) => [
      new Date(f.date).toLocaleDateString(),
      f.rain_risk.toFixed(1),
      f.temp_extreme.toFixed(1),
      f.soil_moisture_proxy.toFixed(1),
      (f.confidence_score * 100).toFixed(0),
      f.raw_data.precipitation_mm.toFixed(1),
      f.raw_data.temp_max_c.toFixed(1),
      f.raw_data.temp_min_c.toFixed(1),
      f.raw_data.humidity_percent.toFixed(0),
      (f.raw_data.wind_speed_ms || 0).toFixed(1),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `forecast_${forecastData.location.region}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [forecastData]);

  if (!forecastData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Forecast Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No forecast data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Forecast Metrics</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('rain_risk')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Rain Risk
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('temp_extreme')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Temp Extreme
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('soil_moisture_proxy')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Soil Moisture
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('confidence_score')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Confidence
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((forecast) => {
                const isExpanded = expandedRows.has(forecast.date);
                return (
                  <>
                    <TableRow
                      key={forecast.date}
                      className="cursor-pointer"
                      onClick={() => {
                        toggleRow(forecast.date);
                        onDateSelect?.(forecast.date);
                      }}
                    >
                      <TableCell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(forecast.date);
                          }}
                          className="hover:bg-muted rounded p-1"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getWeatherIcon(forecast)}
                          <span className="font-medium">
                            {new Date(forecast.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-md font-medium ${getRiskColor(
                              forecast.rain_risk
                            )}`}
                          >
                            {forecast.rain_risk.toFixed(0)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getRiskLevel(forecast.rain_risk)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-md font-medium ${getRiskColor(
                              forecast.temp_extreme
                            )}`}
                          >
                            {forecast.temp_extreme.toFixed(0)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {getRiskLevel(forecast.temp_extreme)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-md font-medium ${getRiskColor(
                              100 - forecast.soil_moisture_proxy
                            )}`}
                          >
                            {forecast.soil_moisture_proxy.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${forecast.confidence_score * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {(forecast.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <TableRow key={`${forecast.date}-details`}>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            <h4 className="font-semibold text-sm mb-3">
                              Raw Weather Data - {new Date(forecast.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </h4>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {/* Precipitation */}
                              <div className="bg-background rounded-lg p-3 border">
                                <div className="flex items-center gap-2 mb-2">
                                  <CloudRain className="w-4 h-4 text-blue-500" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Precipitation
                                  </span>
                                </div>
                                <p className="text-2xl font-bold">
                                  {forecast.raw_data.precipitation_mm.toFixed(1)}
                                </p>
                                <p className="text-xs text-muted-foreground">mm</p>
                              </div>

                              {/* Temperature */}
                              <div className="bg-background rounded-lg p-3 border">
                                <div className="flex items-center gap-2 mb-2">
                                  <Thermometer className="w-4 h-4 text-red-500" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Temperature
                                  </span>
                                </div>
                                <p className="text-2xl font-bold">
                                  {forecast.raw_data.temp_max_c.toFixed(1)}°
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Min: {forecast.raw_data.temp_min_c.toFixed(1)}°C
                                </p>
                              </div>

                              {/* Humidity */}
                              <div className="bg-background rounded-lg p-3 border">
                                <div className="flex items-center gap-2 mb-2">
                                  <Droplets className="w-4 h-4 text-cyan-500" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Humidity
                                  </span>
                                </div>
                                <p className="text-2xl font-bold">
                                  {forecast.raw_data.humidity_percent.toFixed(0)}
                                </p>
                                <p className="text-xs text-muted-foreground">%</p>
                              </div>

                              {/* Wind Speed */}
                              <div className="bg-background rounded-lg p-3 border">
                                <div className="flex items-center gap-2 mb-2">
                                  <Wind className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Wind Speed
                                  </span>
                                </div>
                                <p className="text-2xl font-bold">
                                  {(forecast.raw_data.wind_speed_ms || 0).toFixed(1)}
                                </p>
                                <p className="text-xs text-muted-foreground">m/s</p>
                              </div>
                            </div>

                            {/* Mini-charts for daily trends */}
                            <div className="mt-4">
                              <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                Risk Indicators
                              </h5>
                              <div className="space-y-2">
                                {/* Rain Risk Bar */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Rainfall Risk</span>
                                    <span className="font-medium">{forecast.rain_risk.toFixed(0)}/100</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        forecast.rain_risk < 30
                                          ? 'bg-green-500'
                                          : forecast.rain_risk < 60
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                      }`}
                                      style={{ width: `${forecast.rain_risk}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Temp Extreme Bar */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Temperature Extreme</span>
                                    <span className="font-medium">{forecast.temp_extreme.toFixed(0)}/100</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        forecast.temp_extreme < 30
                                          ? 'bg-green-500'
                                          : forecast.temp_extreme < 60
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                      }`}
                                      style={{ width: `${forecast.temp_extreme}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Soil Moisture Bar */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Soil Moisture</span>
                                    <span className="font-medium">{forecast.soil_moisture_proxy.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all"
                                      style={{ width: `${forecast.soil_moisture_proxy}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Showing {sortedData.length} days of forecast data for {forecastData.location.region}
        </div>
      </CardContent>
    </Card>
  );
});

ForecastMetricsTable.displayName = 'ForecastMetricsTable';

export default ForecastMetricsTable;
