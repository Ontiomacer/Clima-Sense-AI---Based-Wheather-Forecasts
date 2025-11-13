// Vercel Serverless Function for GraphCast Weather Forecast
// Proxies requests to the AI backend GraphCast service

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { latitude, longitude, forecast_days = 10 } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: latitude and longitude'
      });
    }

    console.log(`GraphCast Forecast Request: lat=${latitude}, lon=${longitude}, days=${forecast_days}`);
    
    // Try to connect to AI backend
    const aiBackendUrl = process.env.AI_BACKEND_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${aiBackendUrl}/api/graphcast_forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          forecast_days
        }),
        signal: AbortSignal.timeout(9000), // 9 second timeout (Vercel has 10s limit)
      });

      if (!response.ok) {
        throw new Error(`AI Backend returned ${response.status}`);
      }

      const data = await response.json();
      return res.status(200).json(data);
      
    } catch (backendError) {
      console.warn('AI Backend unavailable, using fallback data:', backendError.message);
      
      // Return mock forecast data as fallback
      const mockForecast = generateMockForecast(latitude, longitude, forecast_days);
      return res.status(200).json(mockForecast);
    }
    
  } catch (error) {
    console.error('Error in /api/graphcast_forecast:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Generate mock forecast data when backend is unavailable
function generateMockForecast(latitude, longitude, forecast_days) {
  const forecast = [];
  const today = new Date();
  
  for (let i = 0; i < forecast_days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Generate realistic-looking mock data
    const baseTemp = 25 + Math.sin(i / 3) * 5;
    const baseRain = Math.max(0, 10 + Math.random() * 30 - 15);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      rain_risk: Math.min(1, baseRain / 50),
      temp_extreme: Math.min(1, Math.abs(baseTemp - 25) / 15),
      soil_moisture_proxy: 0.4 + Math.random() * 0.3,
      confidence_score: 0.7 + Math.random() * 0.2,
      raw_data: {
        precipitation_mm: baseRain,
        temp_max_c: baseTemp + 5,
        temp_min_c: baseTemp - 5,
        humidity_percent: 60 + Math.random() * 30,
      },
    });
  }
  
  return {
    location: {
      latitude,
      longitude,
      region: 'Unknown Region',
    },
    forecast,
    metadata: {
      model_version: 'mock-v1.0',
      generated_at: new Date().toISOString(),
      cache_hit: false,
      inference_time_ms: 100,
      note: 'Mock data - AI backend unavailable',
    },
  };
}
