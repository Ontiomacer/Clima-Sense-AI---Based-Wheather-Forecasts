# AgriSense MCP - Deployment & Usage

## ✅ Successfully Deployed!

Your AgriSense MCP server is now running and ready to accept requests.

## Current Status

- **Server**: Running on http://localhost:9090
- **Dashboard**: http://localhost:9090/dashboard
- **Health**: http://localhost:9090/health
- **Logs**: `data/agrisense_logs.json`

## Test Results

✅ Server started successfully
✅ AI backend connection established
✅ First analysis request completed (2.3s)
✅ Request logging working
✅ Dashboard accessible

### Sample Request Tested:
```json
{
  "crop": "wheat",
  "location": "Pune,IN",
  "soil_moisture": 0.34,
  "temperature": 29.5,
  "rainfall_mm": 12.7,
  "ndvi": 0.56
}
```

### Response Received:
```json
{
  "crop_health": "Moderate",
  "risk_score": 0.1,
  "suggestions": [
    "Monitor crop conditions regularly",
    "Consult with local agricultural extension services",
    "Keep detailed records of observations and interventions",
    "Heat stress expected - consider shade nets or increased irrigation frequency."
  ],
  "confidence": "69%",
  "ai_source": "AgriSense AI Engine v1.0 (AgriBERT + GraphCast)"
}
```

## How to Use

### 1. From Your Frontend

Add this to your React component:

```typescript
const analyzeData = async () => {
  const response = await fetch('http://localhost:9090/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crop: 'wheat',
      location: 'Pune,IN',
      soil_moisture: 0.34,
      temperature: 29.5,
      rainfall_mm: 12.7,
      ndvi: 0.56
    })
  });
  
  const result = await response.json();
  console.log(result);
};
```

### 2. From AI Agents (Claude, GPT)

Simply tell the AI:

```
Please analyze my crop data using AgriSense MCP at http://localhost:9090/analyze

Crop: wheat
Location: Pune, India
Soil moisture: 34%
Temperature: 29.5°C
Rainfall: 12.7mm
NDVI: 0.56
```

### 3. From Command Line

PowerShell:
```powershell
$body = @{
    crop = 'wheat'
    location = 'Pune,IN'
    soil_moisture = 0.34
    temperature = 29.5
    rainfall_mm = 12.7
    ndvi = 0.56
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:9090/analyze `
    -Method POST `
    -Body $body `
    -ContentType 'application/json'
```

## Integration Points

### Current Services Running:

1. **AI Backend (FastAPI)** - Port 8000
   - AgriBERT classification
   - GraphCast weather forecasting
   
2. **AgriSense MCP** - Port 9090 ⭐ NEW
   - Unified analysis endpoint
   - Request logging
   - Dashboard
   
3. **GEE Server** - Port 3001
   - Google Earth Engine data
   
4. **AI Forecast** - Port 3002
   - Weather forecasts
   
5. **React Frontend** - Port 5173
   - User interface

## Next Steps

### Immediate Actions:

1. ✅ **Test the Dashboard**
   - Open http://localhost:9090/dashboard
   - View metrics and recent requests
   
2. ✅ **Integrate into Frontend**
   - See `examples/frontend-integration.tsx`
   - Add AgriSense hook to your components
   
3. ✅ **Test with AI Agents**
   - Use Claude or GPT to call the endpoint
   - See `examples/ai-agent-usage.md`

### Future Enhancements:

- [ ] Add authentication/API keys
- [ ] Implement rate limiting
- [ ] Add more crop types
- [ ] Expand location database
- [ ] Add batch analysis endpoint
- [ ] Create WebSocket support for real-time updates
- [ ] Add data export functionality

## Monitoring

### View Metrics:
- Dashboard: http://localhost:9090/dashboard
- Logs: `data/agrisense_logs.json`
- Health: http://localhost:9090/health

### Key Metrics Tracked:
- Total requests
- Success rate
- Average response time
- Failed requests
- Uptime

## Troubleshooting

### Server Not Responding:
```bash
# Check if server is running
curl http://localhost:9090/health

# Restart server
cd agrisense-mcp
npm start
```

### AI Backend Connection Failed:
```bash
# Check AI backend
curl http://localhost:8000/api/health

# Restart AI backend
python ai-backend/main.py
```

### Port Already in Use:
```bash
# Find process using port 9090
netstat -ano | findstr :9090

# Kill process (replace PID)
taskkill /PID <PID> /F
```

## Files Created

```
agrisense-mcp/
├── src/
│   ├── index.ts          # Main server
│   ├── analyzer.ts       # Analysis logic
│   ├── aiService.ts      # AI backend integration
│   ├── logger.ts         # Request logging
│   └── types.ts          # TypeScript types
├── dist/                 # Compiled JavaScript
├── data/
│   └── agrisense_logs.json  # Request logs
├── examples/
│   ├── frontend-integration.tsx
│   └── ai-agent-usage.md
├── package.json
├── tsconfig.json
├── mcp.config.json
├── .env
└── README.md
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/analyze` | POST | Analyze crop data |
| `/dashboard` | GET | View metrics UI |
| `/health` | GET | Health check |
| `/` | GET | API documentation |

## Support

- **Documentation**: See `README.md` and `AGRISENSE_MCP_GUIDE.md`
- **Examples**: Check `examples/` directory
- **Logs**: Review `data/agrisense_logs.json`
- **Dashboard**: Monitor at http://localhost:9090/dashboard

---

**Status**: ✅ Deployed and Running
**Version**: 1.0.0
**Last Updated**: 2024-11-09
