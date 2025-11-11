# 🚀 Getting Started with ClimaSense AI

Welcome to ClimaSense AI! This guide will help you get up and running quickly.

## 📦 What You Need

- **Windows** PC (for .bat scripts) or Mac/Linux
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

## ⚡ Quick Start (Windows)

### 1. Clone the Repository

```bash
git clone https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts.git
cd Clima-Sense-AI---Based-Wheather-Forecasts
```

### 2. Run Setup Script

Double-click `setup.bat` or run:
```bash
setup.bat
```

This will:
- ✅ Check prerequisites
- ✅ Install all dependencies
- ✅ Build AgriSense MCP
- ✅ Create .env file

### 3. Configure Environment

Edit `.env` file with your API keys:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 4. Start the Application

Double-click `start-climasense.bat` or run:
```bash
start-climasense.bat
```

### 5. Open in Browser

The app will automatically open at:
**http://localhost:5173**

## 🐧 Quick Start (Mac/Linux)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/climasense-ai.git
cd climasense-ai

# Install frontend
npm install

# Install backend
cd ai-backend
pip install -r requirements.txt
cd ..

# Setup AgriSense MCP
cd agrisense-mcp
npm install
npm run build
cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Services

Open 5 terminal windows:

**Terminal 1 - AI Backend:**
```bash
python ai-backend/main.py
```

**Terminal 2 - AgriSense MCP:**
```bash
cd agrisense-mcp && npm start
```

**Terminal 3 - GEE Server:**
```bash
npm run gee-server
```

**Terminal 4 - AI Forecast:**
```bash
npm run ai-forecast
```

**Terminal 5 - Frontend:**
```bash
npm run dev
```

## 🎯 What's Running?

After startup, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Main web app |
| AI Backend | http://localhost:8000 | AI models & forecasting |
| AgriSense MCP | http://localhost:9090 | MCP server for AI agents |
| MCP Dashboard | http://localhost:9090/dashboard | Monitor MCP requests |
| GEE Server | http://localhost:3001 | Google Earth Engine data |
| AI Forecast | http://localhost:3002 | Weather forecasting |

## 🌐 Using the Application

### 1. Dashboard
- View real-time climate metrics
- See AI risk assessments
- Get key insights

### 2. Map
- Explore satellite imagery
- View rainfall patterns
- Check vegetation health

### 3. Agriculture
- Analyze crop health
- Get AI recommendations
- Monitor soil conditions

### 4. AI Chat
- Ask weather questions
- Get farming advice
- Natural language queries
- **Try different languages!**

### 5. Language Switching
- Click globe icon (🌐) in navigation
- Select: English | हिंदी | मराठी
- Entire app switches instantly

## 🔑 Getting API Keys

### Supabase (Database)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and anon key from Settings → API

### Google Maps
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API
3. Create API key
4. Restrict to your domain

## 🐛 Troubleshooting

### "Node.js not found"
- Install from [nodejs.org](https://nodejs.org/)
- Restart terminal after installation

### "Python not found"
- Install from [python.org](https://python.org/)
- Check "Add to PATH" during installation

### "Port already in use"
- Close other applications using the port
- Or change port in configuration

### "Module not found"
- Run `npm install` again
- Delete `node_modules` and reinstall

### "AI Backend not responding"
- Check if Python server is running
- Look for errors in AI Backend terminal
- Verify port 8000 is not blocked

## 📚 Next Steps

### Learn More
- [README.md](README.md) - Full documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy to production

### Explore Features
- Try the AI Chat in different languages
- Explore the interactive map
- Check the agriculture dashboard
- Test the weather forecasting

### Customize
- Add your own data sources
- Customize the UI theme
- Add new languages
- Extend AI capabilities

## 🤝 Need Help?

- **Documentation**: Check `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/Ontiomacer/Clima-Sense-AI---Based-Wheather-Forecasts/issues)
- **Contributing**: See [CONTRIBUTING.md](.github/CONTRIBUTING.md)

## ✨ Tips

1. **Use Chrome/Edge** for best experience
2. **Enable location** for accurate weather
3. **Try Hindi/Marathi** to test translations
4. **Check MCP Dashboard** to see AI requests
5. **Monitor logs** in terminal windows

## 🎉 You're Ready!

Start exploring ClimaSense AI and help farmers make better decisions with AI-powered climate intelligence!

---

**Happy Coding!** 🌾🤖

Made with ❤️ for Indian farmers
