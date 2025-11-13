# 🌍 ClimaSense Remote MCP Server - For Anyone to Use!

## Overview

This is a **remote MCP server** that connects to the deployed ClimaSense API at:
**https://clima-sense-ai-based-wheather-forec.vercel.app**

✨ **No local setup required!** Anyone can use this MCP server with Claude Desktop without needing to run local servers or have the project files.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Node.js

If you don't have Node.js installed:
- Download from: https://nodejs.org/
- Install version 18 or higher
- Verify: Open terminal and run `node --version`

### Step 2: Download the MCP Server

**Option A: Clone the Repository**
```bash
git clone https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts.git
cd Clima-Sense-AI---Based-Wheather-Forecasts/agrisense-mcp
npm install
npm run build
```

**Option B: Download Just the MCP Server**
1. Download the `agrisense-mcp` folder
2. Open terminal in that folder
3. Run:
```bash
npm install
npm run build
```

### Step 3: Configure Claude Desktop

1. **Find your Claude config file:**
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Add this configuration:**

```json
{
  "mcpServers": {
    "climasense": {
      "command": "node",
      "args": [
        "/FULL/PATH/TO/agrisense-mcp/dist/climasense-remote-mcp.js"
      ]
    }
  }
}
```

**Important:** Replace `/FULL/PATH/TO/` with the actual path where you downloaded the folder!

**Example paths:**
- Windows: `"C:\\Users\\YourName\\Downloads\\agrisense-mcp\\dist\\climasense-remote-mcp.js"`
- macOS/Linux: `"/Users/YourName/Downloads/agrisense-mcp/dist/climasense-remote-mcp.js"`

### Step 4: Restart Claude Desktop

1. Close Claude Desktop completely
2. Reopen Claude Desktop
3. The ClimaSense tools should now be available!

---

## 💬 How to Use

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

## 🌟 Features

### ✅ No Local Servers Required
- Everything runs through the deployed Vercel API
- No need to install Python, AI models, or run local servers
- Works from anywhere with internet connection

### ✅ Real-Time Data
- **NASA POWER API** - 365 days of historical climate data
- **OpenWeather API** - Real-time weather conditions
- **AgriBERT Model** - AI-powered agricultural recommendations
- **GraphCast Model** - Advanced weather forecasting

### ✅ Comprehensive Coverage
- All 28 Indian states + 8 Union Territories
- 100+ major cities recognized
- 180-day weather forecasts
- Agricultural insights and recommendations

---

## 🛠️ Available Tools

Claude will have access to these tools:

### 1. `get_weather_forecast`
Get comprehensive 180-day weather forecast for any Indian location

**Example:**
```
User: What's the weather in Bangalore?
Claude: [Fetches data from ClimaSense API and provides detailed forecast]
```

### 2. `get_agricultural_advice`
Get AI-powered farming recommendations

**Example:**
```
User: Soil is waterlogged, what should I do?
Claude: [Gets AI recommendations from AgriBERT model]
```

### 3. `get_climate_summary`
Get comprehensive climate summary with agricultural insights

**Example:**
```
User: Give me a climate summary for Rajasthan
Claude: [Provides 6-month outlook with farming recommendations]
```

---

## 📍 Supported Locations

### All Indian States
Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal

### Union Territories
Delhi, Jammu and Kashmir, Ladakh, Puducherry

### Major Cities
Mumbai, Pune, Bangalore, Chennai, Hyderabad, Kolkata, Delhi, Lucknow, Jaipur, Ahmedabad, Surat, Kochi, Bhubaneswar, Patna, Ranchi, and 100+ more!

---

## 🔧 Troubleshooting

### Issue: Claude doesn't see ClimaSense tools

**Solution:**
1. Make sure you **completely closed** Claude Desktop (check Task Manager/Activity Monitor)
2. Verify the path in `claude_desktop_config.json` is correct
3. Check that the file exists: `agrisense-mcp/dist/climasense-remote-mcp.js`
4. Reopen Claude Desktop

### Issue: "Unable to fetch weather data"

**Solution:**
1. Check your internet connection
2. The Vercel API might be temporarily down - try again in a moment
3. Visit https://clima-sense-ai-based-wheather-forec.vercel.app to verify the site is up

### Issue: "Location not recognized"

**Solution:**
- Make sure you're asking about an Indian state or city
- Try the full state name (e.g., "Uttar Pradesh" instead of "UP")
- Try a major city name (e.g., "Mumbai", "Delhi", "Bangalore")

### Issue: MCP server crashes

**Solution:**
1. Check Node.js version: `node --version` (should be 18+)
2. Rebuild the server:
   ```bash
   cd agrisense-mcp
   npm install
   npm run build
   ```
3. Restart Claude Desktop

---

## 🎯 Example Conversation

**You:** What's the weather forecast for Maharashtra?

**Claude:** Let me get the weather forecast for Maharashtra...

# 🌤️ Weather Forecast for MAHARASHTRA

**Location:** Maharashtra (19.75°N, 75.71°E)
**Generated:** November 13, 2024, 8:30 PM
**Data Source:** ClimaSense AI (NASA POWER + OpenWeather)

## 🌡️ Current Conditions
- **Temperature:** 28°C
- **Humidity:** 65%
- **Conditions:** scattered clouds

## 📅 Next Month Forecast (December 2024)
- **Temperature:** 24.5°C (Range: 20.2°C - 28.8°C)
- **Rainfall:** 15mm
- **Humidity:** 58%

## 📊 6-Month Outlook (Dec 2024 - May 2025)
- **Average Temperature:** 26.8°C
- **Total Rainfall:** 245mm
- **Peak Temperature:** 32.1°C in May

## 🌾 Agricultural Insights
- ✅ **Good Winter Conditions:** Favorable for winter crops like wheat, chickpea, and mustard
- 🌾 **Moderate Rainfall:** Suitable for rabi season cultivation

## 🤖 Model Information
- **Model:** Time Series Regression with Seasonality
- **Training Data:** 365 days of historical data
- **Confidence:** 95%
- **Powered by:** ClimaSense AI

---

## 📦 What Gets Installed

The MCP server is lightweight:
- **Size:** ~5 MB (including dependencies)
- **Dependencies:** Just Node.js packages (axios, MCP SDK)
- **No AI models:** Everything runs on the cloud
- **No databases:** All data fetched from APIs

---

## 🔒 Privacy & Security

- ✅ All data fetched from public ClimaSense API
- ✅ No personal data collected or stored
- ✅ Runs locally on your machine
- ✅ Only sends location queries to the API
- ✅ Open source - you can review the code

---

## 🌐 API Endpoints Used

The MCP server connects to these Vercel endpoints:

- `POST /api/ai-forecast` - Weather predictions
- `POST /api/agri-analysis` - Agricultural recommendations

All hosted at: https://clima-sense-ai-based-wheather-forec.vercel.app

---

## 📝 For Developers

### Project Structure
```
agrisense-mcp/
├── src/
│   └── climasense-remote-mcp.ts  # Remote MCP server source
├── dist/
│   └── climasense-remote-mcp.js  # Compiled JavaScript
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript config
```

### Build from Source
```bash
npm install
npm run build
```

### Test the Server
```bash
npm run start:remote
```

### Development Mode
```bash
npm run dev:remote
```

---

## 🤝 Contributing

Found a bug or want to add features?
- GitHub: https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts
- Issues: Report bugs or request features
- Pull Requests: Contributions welcome!

---

## 📄 License

MIT License - Free to use and modify

---

## 🎉 You're Ready!

That's it! You now have access to AI-powered weather forecasting and agricultural intelligence directly in Claude Desktop.

**Try it now:**
- "What's the weather in your city?"
- "Give me farming advice for my region"
- "What crops should I plant this season?"

**Live Website:** https://clima-sense-ai-based-wheather-forec.vercel.app

---

**Last Updated:** November 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
