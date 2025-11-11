# 🌾 ClimaSense AI - Climate Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-green.svg)](https://www.python.org/)

AI-powered climate intelligence platform for smart agriculture in Maharashtra, India. Features real-time weather forecasting, satellite imagery analysis, and multilingual support (English, Hindi, Marathi).

![ClimaSense Dashboard](https://via.placeholder.com/800x400?text=ClimaSense+Dashboard)

## ✨ Features

### 🤖 AI-Powered Analysis
- **AgriBERT**: Agricultural text classification and recommendations
- **GraphCast**: 10-day weather forecasting with agricultural metrics
- **AgriSense MCP**: Model Context Protocol server for AI agents

### 🌍 Real-Time Data
- **CHIRPS**: Satellite rainfall data
- **OpenWeather**: Live weather conditions
- **Google Earth Engine**: NDVI vegetation health index
- **NASA POWER**: Historical climate data

### 🗺️ Interactive Visualization
- 3D Globe with climate overlays
- Real-time satellite imagery
- Temperature, rainfall, and vegetation maps
- Maharashtra-focused regional data

### 💬 AI Chat Assistant
- Natural language queries
- Weather forecasts for all Indian states
- Crop recommendations
- Pest control advice
- **Responds in English, Hindi, or Marathi**

### 🌐 Multilingual Support
- **English** - Default
- **हिंदी (Hindi)** - Full translation
- **मराठी (Marathi)** - Full translation
- Instant language switching
- AI responses in selected language

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Git**

### One-Click Startup (Windows)

```bash
start-climasense.bat
```

This starts all services:
- ✅ AI Backend (FastAPI) - Port 8000
- ✅ AgriSense MCP Server - Port 9090
- ✅ GEE Server - Port 3001
- ✅ AI Forecast Server - Port 3002
- ✅ React Frontend - Port 5173

### Manual Setup

#### 1. Clone Repository

```bash
git clone https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts.git
cd Clima-Sense-AI---Based-Wheather-Forecasts
```

#### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**AI Backend:**
```bash
cd ai-backend
pip install -r requirements.txt
cd ..
```

**AgriSense MCP:**
```bash
cd agrisense-mcp
npm install
npm run build
cd ..
```

#### 3. Environment Setup

Create `.env` file in root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

#### 4. Start Services

**Terminal 1 - AI Backend:**
```bash
python ai-backend/main.py
```

**Terminal 2 - AgriSense MCP:**
```bash
cd agrisense-mcp
npm start
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

**Terminal 4 - GEE Server:**
```bash
npm run gee-server
```

**Terminal 5 - AI Forecast:**
```bash
npm run ai-forecast
```

### Access the Application

- **Frontend**: http://localhost:5173
- **AI Backend**: http://localhost:8000
- **AgriSense MCP**: http://localhost:9090
- **MCP Dashboard**: http://localhost:9090/dashboard

## 📚 Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Setup Instructions](SETUP_INSTRUCTIONS.md)
- [Quick Start Guide](QUICK_START.md)
- [AgriSense MCP Guide](AGRISENSE_MCP_GUIDE.md)
- [Language Support](LANGUAGE_SUPPORT.md)
- [GraphCast Integration](ai-backend/graphcast/ERA5_SETUP.md)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Dashboard │  │   Map    │  │ AI Chat  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼───────────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────┐          ┌──────────────────┐
│  AI Backend  │          │  AgriSense MCP   │
│  (FastAPI)   │          │  (Node.js)       │
│              │          │                  │
│  • AgriBERT  │          │  • HTTP API      │
│  • GraphCast │          │  • MCP Protocol  │
│  • ERA5 Data │          │  • Claude Desktop│
└──────────────┘          └──────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Shadcn/ui** component library
- **React Router** for navigation
- **Tanstack Query** for data fetching

### Backend
- **FastAPI** (Python) for AI services
- **Node.js/Express** for MCP server
- **PyTorch** for ML models
- **JAX** for GraphCast
- **Transformers** for AgriBERT

### AI Models
- **AgriBERT**: `GautamR/agri_bert_classifier`
- **GraphCast**: DeepMind weather forecasting
- **Custom**: Agricultural metrics calculator

### Data Sources
- **CHIRPS**: Climate Hazards Group
- **OpenWeather**: Weather API
- **Google Earth Engine**: Satellite data
- **NASA POWER**: Climate data

## 📱 Features by Page

### Dashboard
- Real-time climate metrics
- AI Climate Risk Index
- Key insights and recommendations
- Temperature, rainfall, wind speed, NDVI

### Agriculture
- Crop health analysis
- Soil moisture monitoring
- AI farming advisory
- Yield predictions

### Weather Forecast
- 10-day GraphCast forecasts
- Agricultural risk scores
- Temperature extremes
- Rainfall predictions

### Interactive Map
- Satellite imagery layers
- CHIRPS rainfall visualization
- MODIS NDVI vegetation health
- ECMWF temperature anomalies

### AI Chat
- Natural language queries
- Weather forecasts for Indian states
- Crop recommendations
- Multilingual responses

## 🌐 Language Support

Switch between languages using the globe icon (🌐) in the navigation bar.

**Supported Languages:**
- 🇬🇧 English (Default)
- 🇮🇳 हिंदी (Hindi)
- 🇮🇳 मराठी (Marathi)

**What's Translated:**
- ✅ All UI elements
- ✅ Navigation menus
- ✅ Form labels
- ✅ Dashboard metrics
- ✅ AI Chat responses
- ✅ Error messages

## 🤖 AgriSense MCP Server

Model Context Protocol server for AI agents (Claude Desktop, GPT, etc.)

**Features:**
- Analyze crop data with AI models
- Calculate risk scores
- Generate farming recommendations
- Request logging and dashboard

**Usage with Claude Desktop:**

Add to `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "agrisense": {
      "command": "node",
      "args": ["path/to/agrisense-mcp/dist/mcp-server.js"],
      "env": {
        "PORT": "9090",
        "AI_BACKEND_URL": "http://localhost:8000"
      }
    }
  }
}
```

See [CONNECT_TO_CLAUDE.md](CONNECT_TO_CLAUDE.md) for details.

## 📊 API Endpoints

### AI Backend (Port 8000)

```
POST /api/agri_analysis
POST /api/graphcast_forecast
POST /api/analyze-farm
GET  /api/health
```

### AgriSense MCP (Port 9090)

```
POST /analyze
GET  /dashboard
GET  /health
```

## 🔧 Configuration

### Frontend Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Backend Configuration

Edit `ai-backend/graphcast/config.py` for:
- Model paths
- Cache settings
- Region boundaries
- Agricultural thresholds

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd ai-backend
pytest

# MCP server tests
cd agrisense-mcp
npm test
```

## 📦 Building for Production

### Frontend

```bash
npm run build
```

Output in `dist/` directory.

### AI Backend

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r ai-backend/requirements.txt

# Run with gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker ai-backend.main:app
```

### AgriSense MCP

```bash
cd agrisense-mcp
npm run build
npm start
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Backend (Railway/Render)

1. Create new service
2. Connect repository
3. Set Python buildpack
4. Configure environment variables
5. Deploy

### Docker (Optional)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Ontiomacer** - *Initial work* - [GitHub](https://github.com/Ontiomacer)

## 🙏 Acknowledgments

- **DeepMind** for GraphCast model
- **Hugging Face** for AgriBERT model
- **Google Earth Engine** for satellite data
- **CHIRPS** for rainfall data
- **OpenWeather** for weather API
- **NASA POWER** for climate data

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts/discussions)

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] More Indian languages (Gujarati, Tamil, Telugu)
- [ ] Offline mode
- [ ] SMS alerts
- [ ] WhatsApp integration
- [ ] Farmer community features
- [ ] Marketplace integration

## 📈 Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: November 2024

---

**Made with ❤️ for Indian farmers**

🌾 Empowering agriculture through AI and climate intelligence
