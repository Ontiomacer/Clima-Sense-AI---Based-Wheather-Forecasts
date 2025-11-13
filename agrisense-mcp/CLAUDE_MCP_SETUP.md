# 🤖 ClimaSense MCP Server for Claude Desktop

## Overview

This MCP (Model Context Protocol) server integrates ClimaSense's AI-powered climate and agricultural intelligence with Claude Desktop, allowing Claude to provide comprehensive weather forecasts and farming advice for any location in India.

## Features

### 🌤️ Weather Forecasting
- **180-day AI predictions** for any Indian state or city
- Current weather conditions
- Temperature, rainfall, and humidity forecasts
- Confidence intervals and historical comparisons
- Powered by NASA POWER API + OpenWeather

### 🌾 Agricultural Intelligence
- AI-powered crop recommendations
- Soil condition analysis
- Pest and disease management advice
- Irrigation and fertilization guidance
- Powered by AgriBERT model

### 🌍 Climate Summaries
- Comprehensive 6-month climate outlook
- Agricultural suitability analysis
- Risk assessments and recommendations

---

## Installation

### Step 1: Build the MCP Server

```bash
cd agrisense-mcp
npm install
npm run build
```

This will compile the TypeScript code to JavaScript in the `dist` folder.

### Step 2: Configure Claude Desktop

1. **Locate Claude Desktop Config File:**
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Add ClimaSense MCP Server:**

Open the config file and add:

```json
{
  "mcpServers": {
    "climasense": {
      "command": "node",
      "args": [
        "C:\\Users\\Anil\\Desktop\\Hackathons\\clima-aware-ai-main\\clima-aware-ai-main\\agrisense-mcp\\dist\\climasense-mcp.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important:** Update the path in `args` to match your actual installation directory!

### Step 3: Start Required Services

Before using the MCP server, ensure these services are running:

```bash
# Terminal 1: AI Forecast Server
npm run ai-forecast

# Terminal 2: AI Backend (AgriBERT)
python ai-backend/main.py

# Terminal 3: (Optional) GEE Server
npm run gee-server
```

Or use the batch script:
```bash
start-climasense.bat
```

### Step 4: Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server configuration.

---

## Usage Examples

Once configured, you can ask Claude questions like:

### Weather Queries

```
What's the weather forecast for Maharashtra?
```

```
Give me a 6-month climate outlook for Uttar Pradesh
```

```
What are the current conditions in Mumbai?
```

```
Show me temperature and rainfall predictions for Tamil Nadu
```

### Agricultural Queries

```
My soil is dry and temperature is rising. What should I do?
```

```
Suggest crops suitable for high humidity conditions
```

```
What are the best crops for monsoon season in Kerala?
```

```
How should I manage pest control for rice crops?
```

### Combined Queries

```
What's the climate like in Punjab and what crops should I plant?
```

```
Give me a complete agricultural plan for Madhya Pradesh based on the forecast
```

---

## Available Tools

Claude will have access to these tools:

### 1. `get_weather_forecast`
**Description:** Get comprehensive 180-day weather forecast for any Indian location

**Parameters:**
- `location` (string): State, city, or village name

**Example:**
```
User: What's the weather in Bangalore?
Claude: [Uses get_weather_forecast with location="Bangalore"]
```

### 2. `get_agricultural_advice`
**Description:** Get AI-powered farming recommendations

**Parameters:**
- `query` (string): Agricultural question or condition description

**Example:**
```
User: Soil is waterlogged, what should I do?
Claude: [Uses get_agricultural_advice with query="soil is waterlogged"]
```

### 3. `get_climate_summary`
**Description:** Get comprehensive climate summary with agricultural insights

**Parameters:**
- `location` (string): State, city, or village name

**Example:**
```
User: Give me a climate summary for Rajasthan
Claude: [Uses get_climate_summary with location="Rajasthan"]
```

---

## Supported Locations

### All Indian States
- Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh
- Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand
- Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur
- Meghalaya, Mizoram, Nagaland, Odisha, Punjab
- Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura
- Uttar Pradesh, Uttarakhand, West Bengal
- Delhi, Jammu and Kashmir, Ladakh, Puducherry

### Major Cities
- Mumbai, Pune, Bangalore, Chennai, Hyderabad
- Kolkata, Delhi, Lucknow, Jaipur, Ahmedabad
- Surat, Kochi, Bhubaneswar, Patna, Ranchi
- And many more...

---

## Troubleshooting

### Issue: Claude doesn't see the MCP server

**Solution:**
1. Check that the path in `claude_desktop_config.json` is correct
2. Ensure the MCP server is built (`npm run build`)
3. Restart Claude Desktop completely
4. Check Claude Desktop logs for errors

### Issue: "Unable to fetch weather data"

**Solution:**
1. Ensure AI Forecast server is running on port 3002
2. Check that the server is accessible: `curl http://localhost:3002/health`
3. Verify environment variables are set in `.env`

### Issue: "Unable to get agricultural advice"

**Solution:**
1. Ensure AI Backend is running on port 8000
2. Check that AgriBERT model is loaded
3. Verify Python dependencies are installed

### Issue: MCP server crashes

**Solution:**
1. Check Node.js version (requires Node 18+)
2. Rebuild the server: `npm run build`
3. Check for TypeScript errors
4. Review Claude Desktop logs

---

## Architecture

```
┌─────────────────┐
│  Claude Desktop │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────────┐
│ ClimaSense MCP      │
│ Server (Node.js)    │
└────────┬────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│ AI Forecast      │  │ AI Backend       │
│ Server (Node.js) │  │ (FastAPI/Python) │
│ Port 3002        │  │ Port 8000        │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ NASA POWER API   │  │ AgriBERT Model   │
│ OpenWeather API  │  │ GraphCast Model  │
└──────────────────┘  └──────────────────┘
```

---

## Development

### Run in Development Mode

```bash
npm run dev:climasense
```

### Watch for Changes

```bash
npm run watch
```

### Test the MCP Server

```bash
# Build first
npm run build

# Test with stdio
node dist/climasense-mcp.js
```

---

## Configuration Files

### For Claude Desktop
- `claude_desktop_config.json` - Main configuration file
- Copy to: `%APPDATA%\Claude\claude_desktop_config.json`

### For Development
- `.env` - Environment variables
- `tsconfig.json` - TypeScript configuration
- `package.json` - Node.js dependencies

---

## API Endpoints Used

### AI Forecast Server (Port 3002)
- `POST /api/ai-forecast` - Get 180-day weather predictions

### AI Backend (Port 8000)
- `POST /api/agri_analysis` - Get agricultural recommendations
- `POST /api/analyze-farm` - Analyze farm conditions

### GEE Server (Port 3001)
- `POST /api/gee-data` - Get satellite imagery data

---

## Data Sources

- **NASA POWER API** - Historical climate data (365 days)
- **OpenWeather API** - Real-time weather conditions
- **AgriBERT Model** - Agricultural text classification
- **GraphCast Model** - Advanced weather forecasting
- **Google Earth Engine** - Satellite imagery

---

## Security Notes

- MCP server runs locally on your machine
- No data is sent to external servers except API calls
- API keys are stored in `.env` file (never commit!)
- Claude Desktop communicates via stdio (secure)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Claude Desktop logs
3. Check server logs in terminal
4. Ensure all services are running

---

## License

MIT License - See LICENSE file for details

---

**Last Updated:** November 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
