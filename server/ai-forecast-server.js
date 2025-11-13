import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.AI_FORECAST_PORT || 3002;

// NASA POWER API endpoint
const NASA_POWER_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

// OpenWeather API
const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5';
const OPENWEATHER_API_KEY = process.env.VITE_OPENWHEATHER_API_KEY;

/**
 * Fetch historical climate data from NASA POWER API
 */
async function fetchNASAData(lat, lon, startDate, endDate) {
  try {
    const params = {
      parameters: 'T2M,PRECTOTCORR,RH2M', // Temperature, Precipitation, Humidity
      community: 'AG',
      longitude: lon,
      latitude: lat,
      start: startDate.replace(/-/g, ''),
      end: endDate.replace(/-/g, ''),
      format: 'JSON'
    };

    const response = await axios.get(NASA_POWER_URL, { params });
    return response.data.properties.parameter;
  } catch (error) {
    console.error('NASA POWER API Error:', error.message);
    throw error;
  }
}

/**
 * Fetch current weather data from OpenWeather
 */
async function fetchOpenWeatherData(lat, lon) {
  try {
    const response = await axios.get(`${OPENWEATHER_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });
    return response.data;
  } catch (error) {
    console.error('OpenWeather API Error:', error.message);
    return null;
  }
}

/**
 * Simple Moving Average for baseline prediction
 */
function calculateMovingAverage(data, window = 7) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  return result;
}

/**
 * Exponential Smoothing for trend prediction
 */
function exponentialSmoothing(data, alpha = 0.3) {
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

/**
 * Simple ARIMA-like forecasting using linear regression with seasonality
 */
function forecastTimeSeries(historicalData, daysToForecast = 180) {
  const n = historicalData.length;
  
  // Calculate trend using linear regression
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += historicalData[i];
    sumXY += i * historicalData[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate seasonality (365-day cycle)
  const seasonality = new Array(365).fill(0);
  const seasonalCounts = new Array(365).fill(0);
  
  for (let i = 0; i < n; i++) {
    const dayOfYear = i % 365;
    const trend = slope * i + intercept;
    const seasonal = historicalData[i] - trend;
    seasonality[dayOfYear] += seasonal;
    seasonalCounts[dayOfYear]++;
  }
  
  for (let i = 0; i < 365; i++) {
    if (seasonalCounts[i] > 0) {
      seasonality[i] /= seasonalCounts[i];
    }
  }
  
  // Generate forecast
  const forecast = [];
  const confidenceIntervals = [];
  
  // Calculate standard deviation for confidence intervals
  const residuals = historicalData.map((val, i) => {
    const dayOfYear = i % 365;
    const predicted = slope * i + intercept + seasonality[dayOfYear];
    return val - predicted;
  });
  
  const stdDev = Math.sqrt(
    residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
  );
  
  for (let i = 0; i < daysToForecast; i++) {
    const futureIndex = n + i;
    const dayOfYear = futureIndex % 365;
    const trend = slope * futureIndex + intercept;
    const predicted = trend + seasonality[dayOfYear];
    
    // Light smoothing to reduce noise but preserve variation
    const smoothed = i === 0 ? predicted : 
      0.85 * predicted + 0.15 * forecast[i - 1];
    
    forecast.push(smoothed);
    
    // 95% confidence interval (±1.96 * stdDev)
    confidenceIntervals.push({
      lower: smoothed - 1.96 * stdDev,
      upper: smoothed + 1.96 * stdDev
    });
  }
  
  return { forecast, confidenceIntervals, stdDev };
}

/**
 * Main AI Forecast endpoint
 */
app.post('/api/ai-forecast', async (req, res) => {
  try {
    const { lat = 20.5937, lon = 78.9629, location = 'India' } = req.body;
    
    console.log(`Generating AI forecast for: ${location} (${lat}, ${lon})`);
    
    // Calculate date range (last 365 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Fetch historical data from NASA POWER
    console.log('Fetching NASA POWER data...');
    const nasaData = await fetchNASAData(lat, lon, startDateStr, endDateStr);
    
    // Fetch current weather from OpenWeather
    console.log('Fetching OpenWeather data...');
    const currentWeather = await fetchOpenWeatherData(lat, lon);
    
    // Process temperature data (filter out NASA's -999 fill values)
    const temperatureData = Object.values(nasaData.T2M || {}).filter(v => v !== null && v !== undefined && v > -900);
    const rainfallData = Object.values(nasaData.PRECTOTCORR || {}).filter(v => v !== null && v !== undefined && v > -900);
    const humidityData = Object.values(nasaData.RH2M || {}).filter(v => v !== null && v !== undefined && v > -900);
    
    console.log(`Processing ${temperatureData.length} days of historical data...`);
    console.log(`Temperature range: ${Math.min(...temperatureData).toFixed(1)}°C to ${Math.max(...temperatureData).toFixed(1)}°C`);
    console.log(`Average temperature: ${(temperatureData.reduce((a,b) => a+b, 0) / temperatureData.length).toFixed(1)}°C`);
    
    // Generate 180-day forecasts
    const tempForecast = forecastTimeSeries(temperatureData, 180);
    const rainForecast = forecastTimeSeries(rainfallData, 180);
    const humidityForecast = forecastTimeSeries(humidityData, 180);
    
    // Calculate historical averages for comparison
    const avgTemp = temperatureData.reduce((a, b) => a + b, 0) / temperatureData.length;
    const avgRain = rainfallData.reduce((a, b) => a + b, 0) / rainfallData.length;
    const avgHumidity = humidityData.reduce((a, b) => a + b, 0) / humidityData.length;
    
    // Generate daily forecast data
    const forecastDays = [];
    const today = new Date();
    
    for (let i = 0; i < 180; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      forecastDays.push({
        date: forecastDate.toISOString().split('T')[0],
        dayLabel: forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        temperature: {
          predicted: Math.round(tempForecast.forecast[i] * 10) / 10,
          historical: Math.round(avgTemp * 10) / 10,
          lower: Math.round(tempForecast.confidenceIntervals[i].lower * 10) / 10,
          upper: Math.round(tempForecast.confidenceIntervals[i].upper * 10) / 10
        },
        rainfall: {
          predicted: Math.max(0, Math.round(rainForecast.forecast[i] * 10) / 10),
          historical: Math.round(avgRain * 10) / 10,
          lower: Math.max(0, Math.round(rainForecast.confidenceIntervals[i].lower * 10) / 10),
          upper: Math.round(rainForecast.confidenceIntervals[i].upper * 10) / 10
        },
        humidity: {
          predicted: Math.min(100, Math.max(0, Math.round(humidityForecast.forecast[i] * 10) / 10)),
          historical: Math.round(avgHumidity * 10) / 10
        }
      });
    }
    
    // Aggregate by month for cleaner visualization
    const monthlyForecast = [];
    const monthMap = new Map();
    
    forecastDays.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          monthKey,
          monthLabel,
          days: [],
          temps: [],
          rains: [],
          humidities: []
        });
      }
      
      const monthData = monthMap.get(monthKey);
      monthData.days.push(day);
      monthData.temps.push(day.temperature.predicted);
      monthData.rains.push(day.rainfall.predicted);
      monthData.humidities.push(day.humidity.predicted);
    });
    
    // Calculate monthly averages
    monthMap.forEach((monthData) => {
      const avgTemp = monthData.temps.reduce((a, b) => a + b, 0) / monthData.temps.length;
      const totalRain = monthData.rains.reduce((a, b) => a + b, 0);
      const avgHumidity = monthData.humidities.reduce((a, b) => a + b, 0) / monthData.humidities.length;
      
      // Get min/max for confidence
      const minTemp = Math.min(...monthData.temps);
      const maxTemp = Math.max(...monthData.temps);
      
      monthlyForecast.push({
        month: monthData.monthLabel,
        monthKey: monthData.monthKey,
        temperature: {
          predicted: Math.round(avgTemp * 10) / 10,
          historical: Math.round(avgTemp * 10) / 10,
          lower: Math.round(minTemp * 10) / 10,
          upper: Math.round(maxTemp * 10) / 10
        },
        rainfall: {
          predicted: Math.round(totalRain * 10) / 10,
          historical: Math.round(avgRain * monthData.days.length * 10) / 10
        },
        humidity: {
          predicted: Math.round(avgHumidity * 10) / 10,
          historical: Math.round(avgHumidity * 10) / 10
        }
      });
    });
    
    res.json({
      success: true,
      location: {
        name: location,
        lat,
        lon
      },
      current: currentWeather ? {
        temperature: currentWeather.main.temp,
        humidity: currentWeather.main.humidity,
        description: currentWeather.weather[0].description
      } : null,
      historical: {
        avgTemperature: Math.round(avgTemp * 10) / 10,
        avgRainfall: Math.round(avgRain * 10) / 10,
        avgHumidity: Math.round(avgHumidity * 10) / 10,
        dataPoints: temperatureData.length
      },
      forecast: {
        daily: forecastDays,
        monthly: monthlyForecast
      },
      model: {
        type: 'Time Series Regression with Seasonality',
        trainingDays: temperatureData.length,
        forecastDays: 180,
        confidence: '95%',
        temperatureStdDev: Math.round(tempForecast.stdDev * 100) / 100,
        rainfallStdDev: Math.round(rainForecast.stdDev * 100) / 100
      },
      generatedAt: new Date().toISOString()
    });
    
    console.log('✓ Forecast generated successfully');
    
  } catch (error) {
    console.error('Forecast generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to generate AI forecast'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Forecast Server',
    nasaApiConfigured: !!process.env.VITE_NASA_API_KEY,
    openWeatherConfigured: !!process.env.VITE_OPENWHEATHER_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`\n🤖 AI Forecast Server running on http://localhost:${PORT}`);
  console.log(`📊 NASA POWER API: ${process.env.VITE_NASA_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`🌤️  OpenWeather API: ${OPENWEATHER_API_KEY ? 'Configured' : 'Missing'}\n`);
});
