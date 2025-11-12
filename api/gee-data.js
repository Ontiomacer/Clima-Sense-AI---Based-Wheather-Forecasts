// Vercel Serverless Function for Google Earth Engine Data
// This is a simplified version that works within Vercel's 10s timeout

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { dataset, startDate, endDate } = req.body;
    
    console.log(`GEE Data Request: ${dataset}, ${startDate} to ${endDate}`);
    
    // For Vercel deployment, we'll use OpenStreetMap tiles as fallback
    // Real GEE integration requires longer timeout (use Render.com for that)
    
    let tileUrl, visParams;
    
    // Use OpenStreetMap as base - it doesn't require authentication
    tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    
    switch (dataset) {
      case 'rainfall':
        visParams = {
          min: 0.1,
          max: 100,
          palette: ['000000', '0000FF', '00FFFF', '00FF00', 'FFFF00', 'FF0000', 'FF00FF']
        };
        break;
      case 'ndvi':
        visParams = {
          min: 0,
          max: 9000,
          palette: ['8B4513', 'D2691E', 'FFFF00', '90EE90', '228B22', '006400']
        };
        break;
      case 'temperature':
        visParams = {
          min: 250,
          max: 320,
          palette: ['0000FF', '00FFFF', '00FF00', 'FFFF00', 'FFA500', 'FF0000']
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid dataset type'
        });
    }

    res.status(200).json({
      success: true,
      dataset,
      startDate,
      endDate,
      tileUrl,
      visParams,
      mapId: `vercel-${dataset}-${Date.now()}`,
      token: 'no-auth-needed',
      source: 'vercel-serverless',
      message: 'Using OpenStreetMap tiles. For real GEE data, deploy GEE server separately.'
    });
    
  } catch (error) {
    console.error('Error in /api/gee-data:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
