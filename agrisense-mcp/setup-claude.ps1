# AgriSense MCP - Claude Desktop Setup Script
# This script configures Claude Desktop to use AgriSense MCP

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AgriSense MCP - Claude Desktop Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$currentPath = (Get-Location).Path
$mcpPath = Join-Path $currentPath "dist\index.js"

# Check if MCP server is built
if (-not (Test-Path $mcpPath)) {
    Write-Host "❌ MCP server not found at: $mcpPath" -ForegroundColor Red
    Write-Host "Please run 'npm run build' first" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found MCP server at: $mcpPath" -ForegroundColor Green
Write-Host ""

# Claude config path
$claudeConfigDir = Join-Path $env:APPDATA "Claude"
$claudeConfigPath = Join-Path $claudeConfigDir "claude_desktop_config.json"

Write-Host "Claude config location: $claudeConfigPath" -ForegroundColor Cyan
Write-Host ""

# Create Claude directory if it doesn't exist
if (-not (Test-Path $claudeConfigDir)) {
    Write-Host "Creating Claude config directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
}

# Prepare the configuration
$mcpPathEscaped = $mcpPath -replace '\\', '\\'
$config = @{
    mcpServers = @{
        agrisense = @{
            command = "node"
            args = @($mcpPath)
            env = @{
                PORT = "9090"
                AI_BACKEND_URL = "http://localhost:8000"
                NODE_ENV = "production"
            }
        }
    }
}

# Check if config file exists
if (Test-Path $claudeConfigPath) {
    Write-Host "⚠️  Claude config file already exists" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current config:" -ForegroundColor Cyan
    Get-Content $claudeConfigPath | Write-Host
    Write-Host ""
    
    $response = Read-Host "Do you want to overwrite it? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host ""
        Write-Host "Setup cancelled. Please manually add this to your config:" -ForegroundColor Yellow
        Write-Host ""
        $config | ConvertTo-Json -Depth 10 | Write-Host
        Write-Host ""
        Write-Host "Config file location: $claudeConfigPath" -ForegroundColor Cyan
        exit 0
    }
}

# Write the configuration
Write-Host "Writing configuration..." -ForegroundColor Yellow
$config | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigPath -Encoding UTF8

Write-Host "✅ Configuration written successfully!" -ForegroundColor Green
Write-Host ""

# Display the configuration
Write-Host "Configuration:" -ForegroundColor Cyan
Get-Content $claudeConfigPath | Write-Host
Write-Host ""

# Check if AI backend is running
Write-Host "Checking AI backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ AI backend is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  AI backend is not running on port 8000" -ForegroundColor Yellow
    Write-Host "Please start it with: python ai-backend/main.py" -ForegroundColor Yellow
}
Write-Host ""

# Instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Make sure AI backend is running:" -ForegroundColor White
Write-Host "   python ai-backend/main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Restart Claude Desktop completely" -ForegroundColor White
Write-Host ""
Write-Host "3. Test in Claude with:" -ForegroundColor White
Write-Host '   "Analyze my wheat crop using AgriSense"' -ForegroundColor Gray
Write-Host ""
Write-Host "4. Monitor at: http://localhost:9090/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
