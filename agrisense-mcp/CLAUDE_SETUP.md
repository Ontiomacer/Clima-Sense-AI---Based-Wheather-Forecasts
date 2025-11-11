# Connecting AgriSense MCP to Claude Desktop

## Quick Setup Guide

### Step 1: Find Your Claude Config File

Open PowerShell and run:

```powershell
# Open the Claude config directory
explorer $env:APPDATA\Claude
```

Look for `claude_desktop_config.json`. If it doesn't exist, create it.

### Step 2: Get Your Full Path

Run this in PowerShell to get the exact path:

```powershell
# Get current directory
$currentPath = Get-Location
Write-Host "Your AgriSense MCP path:"
Write-Host "$currentPath\agrisense-mcp\dist\index.js"
```

### Step 3: Edit Claude Config

Open `%APPDATA%\Claude\claude_desktop_config.json` in a text editor and add:

```json
{
  "mcpServers": {
    "agrisense": {
      "command": "node",
      "args": [
        "C:\\Users\\Anil\\Desktop\\Hackathons\\clima-aware-ai-main\\clima-aware-ai-main\\agrisense-mcp\\dist\\index.js"
      ],
      "env": {
        "PORT": "9090",
        "AI_BACKEND_URL": "http://localhost:8000",
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important:** Replace the path with your actual path from Step 2. Use double backslashes `\\` in the path.

### Step 4: Restart Claude Desktop

1. Close Claude Desktop completely
2. Make sure your AI backend is running:
   ```bash
   python ai-backend/main.py
   ```
3. Start Claude Desktop again

### Step 5: Test the Connection

In Claude Desktop, try asking:

```
Can you check if the AgriSense MCP server is available?
```

Or:

```
Please analyze crop data using AgriSense:
- Crop: wheat
- Location: Pune, India
- Soil moisture: 34%
- Temperature: 29.5°C
- Rainfall: 12.7mm
- NDVI: 0.56
```

## Alternative: Use MCP Inspector

If you want to test without Claude Desktop first:

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run inspector
mcp-inspector agrisense-mcp/dist/index.js
```

## Troubleshooting

### Claude Can't Find the Server

1. **Check the path is correct:**
   ```powershell
   Test-Path "C:\Users\Anil\Desktop\Hackathons\clima-aware-ai-main\clima-aware-ai-main\agrisense-mcp\dist\index.js"
   ```
   Should return `True`

2. **Verify Node.js is in PATH:**
   ```powershell
   node --version
   ```
   Should show your Node version

3. **Check the config file syntax:**
   - Use a JSON validator
   - Ensure double backslashes in paths
   - No trailing commas

### Server Starts But Doesn't Respond

1. **Ensure AI backend is running:**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Check server logs:**
   - Look in Claude Desktop logs
   - Check `agrisense-mcp/data/agrisense_logs.json`

3. **Test server directly:**
   ```powershell
   $body = @{crop='wheat';location='Pune,IN';soil_moisture=0.34;temperature=29.5;rainfall_mm=12.7} | ConvertTo-Json
   Invoke-WebRequest -Uri http://localhost:9090/analyze -Method POST -Body $body -ContentType 'application/json'
   ```

### Port Conflicts

If port 9090 is already in use, change it in the config:

```json
{
  "mcpServers": {
    "agrisense": {
      "command": "node",
      "args": ["..."],
      "env": {
        "PORT": "9091",  // Changed port
        "AI_BACKEND_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Example Prompts for Claude

Once connected, try these:

### Basic Analysis
```
Analyze my wheat crop in Pune with:
- Soil moisture: 45%
- Temperature: 28°C
- Rainfall: 20mm
- NDVI: 0.65
```

### Comparative Analysis
```
Compare these two fields using AgriSense:

Field A: Rice in Mumbai, soil 60%, temp 31°C, rain 45mm
Field B: Wheat in Pune, soil 35%, temp 27°C, rain 15mm

Which needs immediate attention?
```

### Batch Processing
```
I have 5 fields to analyze. Use AgriSense for each and create a priority list.
```

## Configuration Options

### Full Configuration Schema

```json
{
  "mcpServers": {
    "agrisense": {
      "command": "node",
      "args": ["path/to/agrisense-mcp/dist/index.js"],
      "env": {
        "PORT": "9090",
        "AI_BACKEND_URL": "http://localhost:8000",
        "LOG_FILE": "./data/agrisense_logs.json",
        "NODE_ENV": "production"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

### Environment Variables

- `PORT`: Server port (default: 9090)
- `AI_BACKEND_URL`: FastAPI backend URL (default: http://localhost:8000)
- `LOG_FILE`: Path to log file
- `NODE_ENV`: Environment (development/production)

## Verifying Connection

### In Claude Desktop

Look for:
- 🔌 MCP icon in the chat interface
- "AgriSense" in the available tools list
- No error messages in Claude's developer console

### Check Logs

Claude Desktop logs location:
```
%APPDATA%\Claude\logs\
```

Look for MCP connection messages.

## Security Notes

- The server runs locally on your machine
- No data is sent to external services
- All analysis happens through your local AI backend
- Logs are stored locally in `data/agrisense_logs.json`

## Next Steps

1. ✅ Configure Claude Desktop
2. ✅ Restart Claude
3. ✅ Test with a simple query
4. ✅ Try batch analysis
5. ✅ Monitor dashboard at http://localhost:9090/dashboard

## Support

If you encounter issues:
1. Check Claude Desktop logs
2. Verify server is running: http://localhost:9090/health
3. Test API directly with PowerShell
4. Review `agrisense-mcp/data/agrisense_logs.json`

---

**Ready to use AgriSense with Claude Desktop!** 🚀
