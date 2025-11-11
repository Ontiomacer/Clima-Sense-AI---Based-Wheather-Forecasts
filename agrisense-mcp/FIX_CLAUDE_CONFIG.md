# Fix Claude Desktop Config Error

## The Problem

You're getting: "Unexpected token", "{ "mcp"... is not valid JSON"

This means there's a syntax error in your `claude_desktop_config.json` file.

## The Solution

### Step 1: Open the Config File

```
notepad %APPDATA%\Claude\claude_desktop_config.json
```

### Step 2: Replace with This EXACT Content

Copy and paste this ENTIRE content (replace everything):

```json
{
  "mcpServers": {
    "zomato-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp-server.zomato.com/mcp"
      ]
    },
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

### Step 3: Save and Close

- Press `Ctrl + S` to save
- Close Notepad

### Step 4: Restart Claude Desktop

Close Claude Desktop completely and reopen it.

## Common JSON Mistakes to Avoid

❌ **Missing comma between entries:**
```json
{
  "mcpServers": {
    "zomato-mcp": { ... }  // Missing comma here!
    "agrisense": { ... }
  }
}
```

✅ **Correct - comma after first entry:**
```json
{
  "mcpServers": {
    "zomato-mcp": { ... },  // Comma here!
    "agrisense": { ... }
  }
}
```

❌ **Extra comma at the end:**
```json
{
  "mcpServers": {
    "agrisense": { ... },  // Extra comma - remove it!
  }
}
```

✅ **Correct - no comma after last entry:**
```json
{
  "mcpServers": {
    "agrisense": { ... }  // No comma here!
  }
}
```

## Validate Your JSON

Before saving, you can validate at: https://jsonlint.com/

Or use this PowerShell command:
```powershell
Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" | ConvertFrom-Json
```

If it shows no errors, your JSON is valid!

## Still Having Issues?

### Option 1: Start Fresh (AgriSense Only)

If you want to test AgriSense first without zomato:

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
        "AI_BACKEND_URL": "http://localhost:8000"
      }
    }
  }
}
```

### Option 2: Check File Encoding

Make sure the file is saved as UTF-8:
1. Open in Notepad
2. File → Save As
3. Encoding: UTF-8
4. Save

### Option 3: Use PowerShell to Create It

Run this in PowerShell:

```powershell
$config = @'
{
  "mcpServers": {
    "zomato-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp-server.zomato.com/mcp"
      ]
    },
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
'@

$config | Set-Content "$env:APPDATA\Claude\claude_desktop_config.json" -Encoding UTF8
```

Then restart Claude Desktop.

## Verify It Works

After fixing and restarting Claude:

1. Open Claude Desktop
2. Look for the MCP icon (🔌) in the interface
3. You should see "agrisense" in the available tools
4. Try: "Can you check if AgriSense is available?"

---

**The key is making sure the JSON syntax is perfect - no missing commas, no extra commas, proper brackets!**
