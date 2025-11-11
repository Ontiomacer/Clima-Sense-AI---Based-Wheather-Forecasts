# Using AgriSense MCP with AI Agents

## Overview

AI agents (like Claude, GPT, or other LLMs) can call the AgriSense MCP server to get agricultural insights.

## Example Prompts for AI Agents

### Basic Analysis Request

```
Please analyze crop data using the AgriSense MCP server at http://localhost:9090/analyze

Send this data:
- Crop: wheat
- Location: Pune,IN
- Soil moisture: 0.34 (34%)
- Temperature: 29.5°C
- Rainfall: 12.7mm
- NDVI: 0.56
```

### Batch Analysis

```
I have multiple fields to analyze. Please use the AgriSense MCP server to analyze each:

Field 1: Rice in Mumbai,IN - soil_moisture: 0.65, temp: 31°C, rainfall: 45mm
Field 2: Cotton in Nagpur,IN - soil_moisture: 0.28, temp: 35°C, rainfall: 5mm
Field 3: Wheat in Pune,IN - soil_moisture: 0.42, temp: 27°C, rainfall: 15mm

Compare the results and tell me which field needs immediate attention.
```

### Integration with Other Data

```
I have satellite NDVI data showing vegetation health of 0.42 for my wheat field in Nashik.
The weather station reports 28°C temperature, 8mm rainfall in the last week, and soil moisture at 35%.

Please use AgriSense MCP to analyze this and recommend actions.
```

## MCP Configuration for Kiro

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "agrisense": {
      "command": "node",
      "args": ["agrisense-mcp/dist/index.js"],
      "env": {
        "PORT": "9090",
        "AI_BACKEND_URL": "http://localhost:8000"
      },
      "disabled": false,
      "autoApprove": ["analyze", "health"]
    }
  }
}
```

## API Reference for AI Agents

### Endpoint: POST /analyze

**URL:** `http://localhost:9090/analyze`

**Request Body:**
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

**Response:**
```json
{
  "crop_health": "Moderate",
  "risk_score": 0.72,
  "suggestions": [
    "Increase irrigation by 10%.",
    "Expect mild pest risk next week.",
    "Fertilizer application recommended: NPK 20-20-0."
  ],
  "confidence": "92%",
  "ai_source": "AgriSense AI Engine v1.0 (AgriBERT + GraphCast)",
  "metadata": {
    "timestamp": "2024-11-09T20:00:00.000Z",
    "location": "Pune,IN",
    "crop": "wheat",
    "processing_time_ms": 1234
  }
}
```

## Supported Locations

- Pune,IN (18.5204°N, 73.8567°E)
- Mumbai,IN (19.0760°N, 72.8777°E)
- Nagpur,IN (21.1458°N, 79.0882°E)
- Nashik,IN (19.9975°N, 73.7898°E)
- Maharashtra,IN (default: 19.7515°N, 75.7139°E)

## Supported Crops

- Rice
- Wheat
- Cotton
- Sugarcane
- Soybean
- Maize

## Parameter Ranges

- **soil_moisture**: 0.0 to 1.0 (0% to 100%)
- **temperature**: -10 to 50 (°C)
- **rainfall_mm**: 0 to 500 (mm)
- **ndvi**: 0.0 to 1.0 (optional, vegetation health index)
- **humidity**: 0 to 100 (optional, %)

## Health Check

Before making analysis requests, agents can check server health:

```
GET http://localhost:9090/health
```

Response:
```json
{
  "status": "healthy",
  "ai_backend": "connected",
  "uptime_seconds": 3600,
  "version": "1.0.0",
  "timestamp": "2024-11-09T20:00:00.000Z"
}
```
