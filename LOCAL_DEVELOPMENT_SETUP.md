# 🛠️ Local Development Setup Guide

## Environment Configuration

For local development, the `.env` file has been configured to use localhost URLs for all backend services.

### Current Configuration

```env
# Local Development - Backend Services
VITE_AI_BACKEND_URL=http://localhost:8000
VITE_GEE_SERVER_URL=http://localhost:3001
VITE_AI_FORECAST_URL=http://localhost:3002
```

### For Production Deployment

When deploying to Vercel, change these to relative paths:

```env
# Production - Vercel Serverless Functions
VITE_AI_BACKEND_URL=/api
VITE_GEE_SERVER_URL=/api
VITE_AI_FORECAST_URL=/api
```

## Running All Services

### Option 1: Use the Batch Script (Windows)

```bash
start-climasense.bat
```

This will automatically start all 5 services:
1. AI Backend (FastAPI) - http://localhost:8000
2. AgriSense MCP Server - http://localhost:9090
3. GEE Server - http://localhost:3001
4. AI Forecast Server - http://localhost:3002
5. React Frontend - http://localhost:5173

### Option 2: Manual Start (All Platforms)

Start each service in a separate terminal:

```bash
# Terminal 1: AI Backend
python ai-backend/main.py

# Terminal 2: AgriSense MCP
cd agrisense-mcp
npm start

# Terminal 3: GEE Server
npm run gee-server

# Terminal 4: AI Forecast Server
npm run ai-forecast

# Terminal 5: React Frontend
npm run dev
```

## Service Endpoints

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| React Frontend | 5170 | http://localhost:5170 | Main application UI |
| AI Backend | 8000 | http://localhost:8000 | AgriBERT & GraphCast models |
| GEE Server | 3001 | http://localhost:3001 | Google Earth Engine data |
| AI Forecast | 3002 | http://localhost:3002 | Weather forecasting |
| MCP Server | 9090 | http://localhost:9090 | Agricultural insights API |
| MCP Dashboard | 9090 | http://localhost:9090/dashboard | MCP admin interface |

## Troubleshooting

### Issue: "Failed to fetch GEE data" or "Failed to fetch AI forecast"

**Cause:** Environment variables pointing to `/api` instead of localhost

**Solution:** 
1. Open `.env` file
2. Ensure these lines are uncommented:
   ```env
   VITE_AI_BACKEND_URL=http://localhost:8000
   VITE_GEE_SERVER_URL=http://localhost:3001
   VITE_AI_FORECAST_URL=http://localhost:3002
   ```
3. Restart the dev server: `npm run dev`

### Issue: Port Already in Use

**Solution:**
- Check if another instance is running
- Kill the process using that port
- Or change the port in the respective server file

### Issue: Python Dependencies Missing

**Solution:**
```bash
cd ai-backend
pip install -r requirements.txt
```

### Issue: Node Modules Missing

**Solution:**
```bash
npm install
cd agrisense-mcp
npm install
```

## Recent Fixes Applied

### 1. Navigation for About/Contact Pages ✅
- Fixed navigation to show AppNav for authenticated users on all pages
- About and Contact pages now have proper navigation links

### 2. Real Temperature Data in Agriculture Page ✅
- Updated TemperatureStress component to fetch real data from OpenWeather API
- Shows current temperature and 7-day forecast
- Crop-specific temperature stress analysis
- Dynamic impact messages based on temperature and crop type

### 3. Environment Variables for Local Development ✅
- Updated `.env` to use localhost URLs for all backend services
- Frontend now connects to local servers instead of trying to use `/api` routes

## API Keys Required

### Required for Full Functionality:
- ✅ **OpenWeather API** - Configured (`VITE_OPENWHEATHER_API_KEY`)
- ✅ **Google Maps API** - Configured (`VITE_GOOGLE_MAPS_API_KEY`)
- ✅ **GEE Service Account** - Configured (JSON file)
- ✅ **Clerk Auth** - Configured (`VITE_CLERK_PUBLISHABLE_KEY`)

### Optional:
- ⚠️ **NASA POWER API** - Not required (public API)

## Development Workflow

1. **Start all services** using `start-climasense.bat` or manually
2. **Access frontend** at http://localhost:5170
3. **Sign in** using Clerk authentication
4. **Test features:**
   - Dashboard - Overview and metrics
   - Forecast - AI-powered weather predictions
   - Agriculture - Crop insights with real temperature data
   - Map - GEE satellite imagery
   - Insights - Data analysis
   - Chat - AI assistant

## Production Deployment

Before deploying to Vercel:

1. **Update `.env` file:**
   ```env
   VITE_AI_BACKEND_URL=/api
   VITE_GEE_SERVER_URL=/api
   VITE_AI_FORECAST_URL=/api
   ```

2. **Configure Vercel environment variables:**
   - Add all `VITE_*` variables
   - Add `CLERK_SECRET_KEY`
   - Add GEE service account JSON

3. **Deploy:**
   ```bash
   git push origin main
   ```
   Vercel will automatically deploy

## Notes

- The `.env` file is gitignored and should never be committed
- Use `.env.example` as a template for new setups
- Local development uses separate backend servers
- Production uses Vercel serverless functions in the `/api` directory

---

**Last Updated:** November 2024
**Status:** All services operational ✅
