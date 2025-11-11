# Fix Claude Desktop Config - Automatic JSON Repair

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Claude Desktop Config - JSON Fixer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$claudeConfigPath = Join-Path $env:APPDATA "Claude\claude_desktop_config.json"

Write-Host "Config file location: $claudeConfigPath" -ForegroundColor Yellow
Write-Host ""

# Backup existing config
if (Test-Path $claudeConfigPath) {
    $backupPath = "$claudeConfigPath.backup"
    Copy-Item $claudeConfigPath $backupPath -Force
    Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Current config:" -ForegroundColor Yellow
    Get-Content $claudeConfigPath | Write-Host
    Write-Host ""
}

# Get the correct path
$currentPath = (Get-Location).Path
$mcpPath = Join-Path $currentPath "dist\index.js"

if (-not (Test-Path $mcpPath)) {
    Write-Host "❌ MCP server not found at: $mcpPath" -ForegroundColor Red
    Write-Host "Please run this script from the agrisense-mcp directory" -ForegroundColor Yellow
    exit 1
}

# Create the correct JSON config
$config = @"
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
        "$($mcpPath -replace '\\', '\\')"
      ],
      "env": {
        "PORT": "9090",
        "AI_BACKEND_URL": "http://localhost:8000",
        "NODE_ENV": "production"
      }
    }
  }
}
"@

Write-Host "Writing corrected config..." -ForegroundColor Yellow
$config | Set-Content $claudeConfigPath -Encoding UTF8

Write-Host "✅ Config file updated!" -ForegroundColor Green
Write-Host ""

# Validate JSON
Write-Host "Validating JSON..." -ForegroundColor Yellow
try {
    $testJson = Get-Content $claudeConfigPath -Raw | ConvertFrom-Json
    Write-Host "✅ JSON is valid!" -ForegroundColor Green
} catch {
    Write-Host "❌ JSON validation failed: $_" -ForegroundColor Red
    Write-Host "Restoring backup..." -ForegroundColor Yellow
    Copy-Item "$claudeConfigPath.backup" $claudeConfigPath -Force
    exit 1
}

Write-Host ""
Write-Host "New config:" -ForegroundColor Cyan
Get-Content $claudeConfigPath | Write-Host
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Close Claude Desktop completely" -ForegroundColor White
Write-Host "2. Make sure servers are running:" -ForegroundColor White
Write-Host "   start-climasense.bat" -ForegroundColor Gray
Write-Host "3. Open Claude Desktop" -ForegroundColor White
Write-Host "4. Test with: 'Can you check if AgriSense is available?'" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Config Fixed! ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
