# 🌍 ClimaSense MCP for Claude Desktop

## What is This?

This is an MCP (Model Context Protocol) server that gives Claude Desktop access to **ClimaSense AI** - an advanced weather forecasting and agricultural intelligence platform for India.

## ✨ Features

- 🌤️ **180-day weather forecasts** for any Indian location
- 🌾 **AI-powered agricultural recommendations**
- 📊 **Real-time climate data** from NASA POWER + OpenWeather
- 🤖 **AgriBERT model** for farming advice
- 🌍 **All 28 Indian states** + Union Territories supported

## 🚀 Quick Install

### 1. Prerequisites
- Node.js 18+ ([Download here](https://nodejs.org/))
- Claude Desktop ([Download here](https://claude.ai/download))

### 2. Install MCP Server

```bash
# Clone or download this folder
cd agrisense-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

### 3. Configure Claude Desktop

Add this to your Claude config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

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

Replace `/FULL/PATH/TO/` with your actual path!

### 4. Restart Claude Desktop

Close and reopen Claude Desktop. Done!

## 💬 Usage Examples

Ask Claude:
- "What's the weather forecast for Maharashtra?"
- "Give me agricultural advice for dry soil conditions"
- "What crops should I plant in Punjab during monsoon?"
- "Show me the climate summary for Tamil Nadu"

## 📚 Full Documentation

See [REMOTE_MCP_SETUP.md](./REMOTE_MCP_SETUP.md) for complete setup instructions and troubleshooting.

## 🌐 Live Website

https://clima-sense-ai-based-wheather-forec.vercel.app

## 📄 License

MIT License

---

**Made with ❤️ by ClimaSense Team**
