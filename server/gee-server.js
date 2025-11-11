import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.GEE_SERVER_PORT || 3001;

// Load GEE service account
const serviceAccountPath = path.join(__dirname, '..', process.env.GEE_SERVICE_ACCOUNT_PATH || 'massive-hexagon-452605-m0-8ada8fb9ccf6.json');
let serviceAccount;
let ee;

try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  console.log('✓ GEE Service Account loaded successfully');
  console.log(`  Project: ${serviceAccount.project_id}`);
  console.log(`  Email: ${serviceAccount.client_email}`);
  
  // Try to load Earth Engine SDK
  try {
    const eeModule = await import('@google/earthengine');
    ee = eeModule.default;
    console.log('✓ Earth Engine SDK found');
    console.log('  Attempting to initialize with service account...');
  } catch (err) {
    console.log('⚠ Earth Engine SDK not installed - using OpenStreetMap tiles');
    console.log('  Install with: npm install @google/earthengine');
    ee = null;
  }
} catch (error) {
  console.error('✗ Failed to load GEE service account:', error.message);
  console.error(`  Looking for: ${serviceAccountPath}`);
}

// Initialize Earth Engine if SDK is available
let eeInitialized = false;

async function initializeEE() {
  if (eeInitialized || !ee || !serviceAccount) {
    return false;
  }
  
  return new Promise((resolve) => {
    try {
      ee.data.authenticateViaPrivateKey(
        serviceAccount,
        () => {
          ee.initialize(null, null, () => {
            eeInitialized = true;
            console.log('✓ Earth Engine initialized successfully');
            console.log('  Real satellite data is now available!');
            resolve(true);
          }, (error) => {
            console.error('✗ Earth Engine initialization failed:', error.message || error);
            console.log('  Falling back to OpenStreetMap tiles');
            eeInitialized = false;
            resolve(false);
          });
        },
        (error) => {
          console.error('✗ Earth Engine authentication failed:', error.message || error);
          console.log('  Falling back to OpenStreetMap tiles');
          eeInitialized = false;
          resolve(false);
        }
      );
    } catch (error) {
      console.error('✗ Earth Engine setup error:', error.message || error);
      console.log('  Falling back to OpenStreetMap tiles');
      eeInitialized = false;
      resolve(false);
    }
  });
}

// GEE data endpoint with real Earth Engine integration
app.post('/api/gee-data', async (req, res) => {
  console.log('📥 Received GEE data request:', req.body);
  
  try {
    const { dataset, startDate, endDate } = req.body;
    
    console.log(`  Dataset: ${dataset}, Dates: ${startDate} to ${endDate}`);
    console.log(`  EE available: ${!!ee}, EE initialized: ${eeInitialized}`);
    
    if (!serviceAccount) {
      console.log('  ❌ No service account configured');
      return res.status(500).json({
        success: false,
        error: 'GEE service account not configured'
      });
    }

    // Try to initialize EE if available
    if (ee && !eeInitialized) {
      const initialized = await initializeEE();
      if (!initialized) {
        console.log('  ⚠️  Could not initialize Earth Engine, using fallback tiles');
      }
    }

    // If EE is initialized, use real data
    if (eeInitialized) {
      let imageCollection, bandName, visParams;
      
      switch (dataset) {
        case 'rainfall':
          imageCollection = 'UCSB-CHG/CHIRPS/DAILY';
          bandName = 'precipitation';
          visParams = {
            min: 0.1,
            max: 100,
            palette: ['000000', '0000FF', '00FFFF', '00FF00', 'FFFF00', 'FF0000', 'FF00FF']
          };
          break;
        case 'ndvi':
          imageCollection = 'MODIS/061/MOD13Q1';
          bandName = 'NDVI';
          visParams = {
            min: 0,
            max: 9000,
            palette: ['8B4513', 'D2691E', 'FFFF00', '90EE90', '228B22', '006400']
          };
          break;
        case 'temperature':
          // Use ERA5 Land Temperature - more reliable and complete coverage
          imageCollection = 'ECMWF/ERA5_LAND/DAILY_AGGR';
          bandName = 'temperature_2m';
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

      console.log(`Fetching ${dataset} data from ${startDate} to ${endDate}`);
      
      const collection = ee.ImageCollection(imageCollection)
        .filterDate(startDate, endDate)
        .select(bandName);
      
      const image = collection.mean();
      const mapId = image.getMap(visParams);

      console.log(`✓ Generated map tiles for ${dataset}`);

      return res.json({
        success: true,
        dataset,
        startDate,
        endDate,
        tileUrl: mapId.urlFormat,
        visParams,
        mapId: mapId.mapid,
        token: mapId.token,
        source: 'real-gee-data'
      });
    }

    // Fallback to mock data with OpenStreetMap tiles (no authentication needed)
    console.log('  ℹ️  Using mock data (EE not available)');
    let tileUrl, visParams;
    
    // Use OpenStreetMap as base - it doesn't require authentication
    // In production, you would use actual GEE tiles with proper authentication
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

    res.json({
      success: true,
      dataset,
      startDate,
      endDate,
      tileUrl,
      visParams,
      mapId: `mock-${dataset}-${Date.now()}`,
      token: 'no-auth-needed',
      source: 'mock-data',
      message: 'Using OpenStreetMap tiles as fallback. Real GEE data requires authentication setup.'
    });
  } catch (error) {
    console.error('Error in /api/gee-data:', error.message);
    
    // Return mock data with OpenStreetMap tiles instead of error
    const { dataset, startDate, endDate } = req.body;
    let visParams;
    
    // Use OpenStreetMap as fallback
    const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    
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
        visParams = {};
    }
    
    res.json({
      success: true,
      dataset: dataset || 'unknown',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
      tileUrl,
      visParams,
      mapId: `mock-${dataset}-${Date.now()}`,
      token: 'no-auth-needed',
      source: 'mock-data-fallback',
      message: 'Using OpenStreetMap tiles as fallback. GEE authentication requires additional setup.'
    });
  }
});

// Point data endpoint - fetch value at specific coordinates
app.post('/api/point-data', async (req, res) => {
  console.log('📍 Received point data request:', req.body);
  
  try {
    const { lat, lon, dataset, startDate, endDate } = req.body;
    
    console.log(`  Location: ${lat}, ${lon}`);
    console.log(`  Dataset: ${dataset}, Dates: ${startDate} to ${endDate}`);
    
    // If EE is initialized, try to get real point data
    if (eeInitialized && ee) {
      let imageCollection, bandName;
      
      switch (dataset) {
        case 'rainfall':
          imageCollection = 'UCSB-CHG/CHIRPS/DAILY';
          bandName = 'precipitation';
          break;
        case 'ndvi':
          imageCollection = 'MODIS/061/MOD13Q1';
          bandName = 'NDVI';
          break;
        case 'temperature':
          imageCollection = 'ECMWF/ERA5_LAND/DAILY_AGGR';
          bandName = 'temperature_2m';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid dataset type'
          });
      }
      
      console.log(`  Fetching ${dataset} value at point...`);
      
      const point = ee.Geometry.Point([lon, lat]);
      const collection = ee.ImageCollection(imageCollection)
        .filterDate(startDate, endDate)
        .select(bandName);
      
      const meanImage = collection.mean();
      
      // Get the value at the point
      const value = await new Promise((resolve, reject) => {
        meanImage.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: point,
          scale: 1000,
        }).evaluate((result, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(result[bandName]);
          }
        });
      });
      
      console.log(`  ✓ Point value: ${value}`);
      
      return res.json({
        success: true,
        lat,
        lon,
        dataset,
        value: value !== null && value !== undefined ? value : null,
        startDate,
        endDate,
        source: 'real-gee-data'
      });
    }
    
    // Fallback to mock data
    console.log('  ℹ️  Using mock point data (EE not available)');
    
    // Generate mock value based on location and dataset
    let mockValue;
    switch (dataset) {
      case 'rainfall':
        mockValue = Math.random() * 50 + 10; // 10-60mm
        break;
      case 'ndvi':
        mockValue = Math.random() * 5000 + 2000; // 2000-7000
        break;
      case 'temperature':
        mockValue = Math.random() * 30 + 270; // 270-300K
        break;
      default:
        mockValue = Math.random() * 100;
    }
    
    res.json({
      success: true,
      lat,
      lon,
      dataset,
      value: mockValue,
      startDate,
      endDate,
      source: 'mock-data'
    });
    
  } catch (error) {
    console.error('Error in /api/point-data:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    geeConfigured: !!serviceAccount,
    eeInitialized: false, // Disabled for now
    eeAvailable: !!ee,
    usingMockData: !ee || !eeInitialized,
    projectId: serviceAccount?.project_id || process.env.VITE_GEE_PROJECT_ID || 'massive-hexagon-452605-m0',
    serviceAccountEmail: serviceAccount?.client_email || 'not-loaded'
  });
});

app.listen(PORT, () => {
  console.log(`\n🌍 GEE Server running on http://localhost:${PORT}`);
  console.log(`📊 Project ID: ${process.env.VITE_GEE_PROJECT_ID || 'massive-hexagon-452605-m0'}`);
  console.log(`🔑 Service Account: ${serviceAccount ? 'Loaded' : 'Not found'}\n`);
});
