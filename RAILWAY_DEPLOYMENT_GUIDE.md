# Railway Deployment Guide - ClimaSense AI

## Service 1: AI Backend (Python FastAPI)

### Step-by-Step Configuration:

1. **Create New Service**
   - Go to Railway Dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select: `Clima-Sense-AI---Based-Wheather-Forecasts`

2. **Configure Service Settings**
   - Click on the deployed service
   - Go to "Settings" tab
   - Set the following:

   **Root Directory:**
   ```
   ai-backend
   ```

   **Build Command:**
   ```
   pip install -r requirements.txt
   ```

   **Start Command:**
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Add Environment Variables**
   - Go to "Variables" tab
   - Click "New Variable" and add each:

   ```
   PORT=8000
   ENVIRONMENT=production
   PYTHONUNBUFFERED=1
   PYTHON_VERSION=3.11
   LOG_LEVEL=INFO
   MODEL_CACHE_DIR=/app/models
   CORS_ORIGINS=http://localhost:5170
   ```

   **Note:** We'll update CORS_ORIGINS after deploying the frontend

4. **Deploy**
   - Railway will automatically deploy
   - Wait 3-5 minutes for first deployment (downloading models)
   - Check logs for "ClimaSense AI Backend Ready!"

5. **Get Your URL**
   - Go to "Settings" → "Networking"
   - Copy the public URL (e.g., `https://your-service.railway.app`)
   - Test it: `https://your-service.railway.app/health`

---

## Service 2: GEE Server (Node.js)

### Step-by-Step Configuration:

1. **Add New Service**
   - In same Railway project, click "+ New"
   - Select "GitHub Repo" → Choose your repo again

2. **Configure Service Settings**
   
   **Root Directory:**
   ```
   server
   ```

   **Build Command:**
   ```
   npm install
   ```

   **Start Command:**
   ```
   node gee-server.js
   ```

3. **Add Environment Variables**
   
   ```
   GEE_SERVER_PORT=3001
   VITE_GEE_PROJECT_ID=massive-hexagon-452605-m0
   NODE_ENV=production
   ```

   **IMPORTANT - Add Google Cloud Credentials:**
   
   Option A: As JSON string (Recommended)
   ```
   GEE_SERVICE_ACCOUNT={"type":"service_account","project_id":"massive-hexagon-452605-m0",...}
   ```
   Copy the entire content of your `massive-hexagon-452605-m0-8ada8fb9ccf6.json` file

   Option B: As file path (if you upload the file)
   ```
   GEE_SERVICE_ACCOUNT_PATH=./massive-hexagon-452605-m0-8ada8fb9ccf6.json
   ```

4. **Deploy and Test**
   - Get URL from Settings → Networking
   - Test: `https://your-gee-service.railway.app/health`

---

## Service 3: AI Forecast Server (Node.js)

### Step-by-Step Configuration:

1. **Add New Service**
   - Click "+ New" → "GitHub Repo"

2. **Configure Service Settings**
   
   **Root Directory:**
   ```
   server
   ```

   **Build Command:**
   ```
   npm install
   ```

   **Start Command:**
   ```
   node ai-forecast-server.js
   ```

3. **Add Environment Variables**
   
   ```
   AI_FORECAST_PORT=3002
   NODE_ENV=production
   VITE_OPENWHEATHER_API_KEY=your_openweather_key
   ```

4. **Deploy and Test**
   - Get URL from Settings → Networking
   - Test: `https://your-forecast-service.railway.app/health`

---

## After All Services Are Deployed:

### Update CORS Settings

1. **Update AI Backend CORS**
   - Go to AI Backend service → Variables
   - Update `CORS_ORIGINS` to include all your URLs:
   ```
   CORS_ORIGINS=http://localhost:5170,https://your-frontend.vercel.app
   ```

2. **Redeploy Services**
   - Railway will auto-redeploy when you change variables

### Save Your URLs

Create a file to track your deployment URLs:

```
AI Backend: https://your-ai-backend.railway.app
GEE Server: https://your-gee-server.railway.app
AI Forecast: https://your-forecast-server.railway.app
Frontend: (will deploy next to Vercel)
```

---

## Troubleshooting

### AI Backend Issues:

**Problem:** Service crashes on startup
**Solution:** Check logs for Python errors. Ensure all dependencies in requirements.txt

**Problem:** First request times out
**Solution:** Normal - GraphCast model loading takes 30-60 seconds on first request

**Problem:** Out of memory
**Solution:** Upgrade Railway plan or optimize model loading

### GEE Server Issues:

**Problem:** "Earth Engine authentication failed"
**Solution:** 
1. Verify GEE_SERVICE_ACCOUNT variable is set correctly
2. Check that the JSON is valid (no extra quotes)
3. Ensure service account has Earth Engine API enabled

### General Issues:

**Problem:** Build fails
**Solution:** Check build logs, ensure correct root directory

**Problem:** Service won't start
**Solution:** Check start command, verify PORT variable is used

---

## Cost Monitoring

Railway provides $5 free credit per month. Monitor usage:
- Go to Project Settings → Usage
- Each service costs ~$5-15/month depending on resources
- Set up billing alerts to avoid surprises

---

## Next Steps

After all backend services are deployed:
1. Test all health endpoints
2. Update frontend .env with production URLs
3. Deploy frontend to Vercel
4. Update CORS settings with frontend URL
5. Test end-to-end functionality
