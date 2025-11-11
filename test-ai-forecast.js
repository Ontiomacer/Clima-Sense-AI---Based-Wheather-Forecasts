// Test script for AI Forecast API
import axios from 'axios';

const AI_FORECAST_URL = 'http://localhost:3002';

async function testAIForecast() {
  console.log('🧪 Testing AI Forecast API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${AI_FORECAST_URL}/health`);
    console.log('✓ Health check:', healthResponse.data);
    console.log('');

    // Test forecast generation
    console.log('2. Generating AI forecast...');
    console.log('   Location: Global (0, 20)');
    console.log('   This may take 5-10 seconds...\n');
    
    const startTime = Date.now();
    const forecastResponse = await axios.post(`${AI_FORECAST_URL}/api/ai-forecast`, {
      lat: 0,
      lon: 20,
      location: 'Global'
    });
    const endTime = Date.now();

    const data = forecastResponse.data;
    
    console.log('✓ Forecast generated successfully!');
    console.log(`   Time taken: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log('');
    
    console.log('📊 Forecast Summary:');
    console.log(`   Location: ${data.location.name}`);
    console.log(`   Coordinates: (${data.location.lat}, ${data.location.lon})`);
    console.log('');
    
    if (data.current) {
      console.log('🌤️  Current Weather:');
      console.log(`   Temperature: ${data.current.temperature}°C`);
      console.log(`   Humidity: ${data.current.humidity}%`);
      console.log(`   Conditions: ${data.current.description}`);
      console.log('');
    }
    
    console.log('📈 Historical Data:');
    console.log(`   Avg Temperature: ${data.historical.avgTemperature}°C`);
    console.log(`   Avg Rainfall: ${data.historical.avgRainfall}mm`);
    console.log(`   Avg Humidity: ${data.historical.avgHumidity}%`);
    console.log(`   Training Days: ${data.historical.dataPoints}`);
    console.log('');
    
    console.log('🤖 Model Info:');
    console.log(`   Type: ${data.model.type}`);
    console.log(`   Forecast Days: ${data.model.forecastDays}`);
    console.log(`   Confidence: ${data.model.confidence}`);
    console.log(`   Temperature StdDev: ±${data.model.temperatureStdDev}°C`);
    console.log(`   Rainfall StdDev: ±${data.model.rainfallStdDev}mm`);
    console.log('');
    
    console.log('📅 Sample Forecast (First 7 Days):');
    data.forecast.daily.slice(0, 7).forEach(day => {
      console.log(`   ${day.dayLabel}: ${day.temperature.predicted}°C, ${day.rainfall.predicted}mm rain`);
    });
    console.log('');
    
    console.log('📊 Weekly Summary (First 4 Weeks):');
    data.forecast.weekly.slice(0, 4).forEach(week => {
      console.log(`   ${week.week}: ${week.temperature.predicted}°C, ${week.rainfall.predicted}mm total`);
    });
    console.log('');
    
    console.log('✅ All tests passed!');
    console.log('🎉 AI Forecast API is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure the AI Forecast server is running on port 3002');
      console.error('   Run: npm run ai-forecast');
    }
  }
}

testAIForecast();
