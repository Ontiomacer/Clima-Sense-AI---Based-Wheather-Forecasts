# AgriSense MCP Server

AI-powered agricultural analysis endpoint for web frontends and AI agents.

## Features

- 🤖 **AI-Powered Analysis**: Integrates AgriBERT and GraphCast models
- 📊 **Structured JSON Responses**: Clean, predictable API responses
- 📝 **Request Logging**: All requests logged to `data/agrisense_logs.json`
- 📈 **Live Dashboard**: View metrics at `/dashboard`
- 🔌 **MCP Compatible**: Works with AI agents and web frontends

## Quick Start

### 1. Install Dependencies

```bash
cd agrisense-mcp
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Start Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### POST /analyze

Analyze crop data with AI models.

**Request:**
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

### GET /dashboard

View server metrics and recent requests in a web interface.

### GET /health

Check server health and AI backend connectivity.

## Integration Examples

### Frontend (React/TypeScript)

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

### AI Agent (Claude/GPT)

AI agents can call this endpoint directly:

```
Please analyze crop data using the AgriSense MCP server at http://localhost:9090/analyze
```

### MCP Configuration

Add to your `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "agrisense": {
      "command": "node",
      "args": ["agrisense-mcp/dist/index.js"],
      "env": {
        "PORT": "9090",
        "AI_BACKEND_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Architecture

```
┌─────────────────┐
│  Web Frontend   │
│   or AI Agent   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AgriSense MCP  │  Port 9090
│     Server      │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│   AgriBERT   │  │  GraphCast   │
│   Analysis   │  │   Forecast   │
└──────────────┘  └──────────────┘
         │              │
         └──────┬───────┘
                ▼
        ┌──────────────┐
        │ AI Backend   │  Port 8000
        │  (FastAPI)   │
        └──────────────┘
```

## Environment Variables

- `PORT`: Server port (default: 9090)
- `AI_BACKEND_URL`: FastAPI backend URL (default: http://localhost:8000)
- `LOG_FILE`: Path to log file (default: ./data/agrisense_logs.json)
- `NODE_ENV`: Environment (development/production)

## Logging

All requests and responses are logged to `data/agrisense_logs.json`:

```json
[
  {
    "timestamp": "2024-11-09T20:00:00.000Z",
    "request": { ... },
    "response": { ... },
    "processing_time_ms": 1234
  }
]
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Watch for changes
npm run watch
```

## License

MIT
