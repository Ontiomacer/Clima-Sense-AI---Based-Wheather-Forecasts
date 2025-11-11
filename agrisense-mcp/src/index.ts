import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CropAnalyzer } from './analyzer';
import { Logger } from './logger';
import { AIService } from './aiService';
import { AnalyzeRequest } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9090;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const analyzer = new CropAnalyzer();
const logger = new Logger();
const aiService = new AIService();

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const aiBackendHealthy = await aiService.checkHealth();
    const metrics = logger.getMetrics();

    res.json({
      status: 'healthy',
      ai_backend: aiBackendHealthy ? 'connected' : 'disconnected',
      uptime_seconds: metrics.uptime_seconds,
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Main analyze endpoint
app.post('/analyze', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Validate request
    const request: AnalyzeRequest = req.body;

    if (!request.crop || !request.location) {
      return res.status(400).json({
        error: 'Missing required fields: crop and location are required'
      });
    }

    if (typeof request.soil_moisture !== 'number' || 
        typeof request.temperature !== 'number' || 
        typeof request.rainfall_mm !== 'number') {
      return res.status(400).json({
        error: 'Invalid data types: soil_moisture, temperature, and rainfall_mm must be numbers'
      });
    }

    console.log(`📥 Analyze request received for ${request.crop} at ${request.location}`);

    // Perform analysis
    const result = await analyzer.analyze(request);

    const processingTime = Date.now() - startTime;

    // Log the request/response
    logger.logRequest({
      timestamp: new Date().toISOString(),
      request,
      response: result,
      processing_time_ms: processingTime
    });

    console.log(`✅ Analysis completed in ${processingTime}ms`);

    res.json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Analysis failed:', error);

    logger.logError(req.body, error as Error, processingTime);

    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: processingTime
    });
  }
});

// Dashboard endpoint
app.get('/dashboard', (req: Request, res: Response) => {
  try {
    const metrics = logger.getMetrics();
    const recentLogs = logger.getRecentLogs(10);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriSense MCP Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .header h1 {
      color: #667eea;
      margin-bottom: 10px;
    }
    .header p {
      color: #666;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .metric-card h3 {
      color: #667eea;
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .metric-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
    .metric-card .label {
      font-size: 12px;
      color: #999;
      margin-top: 5px;
    }
    .logs {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .logs h2 {
      color: #667eea;
      margin-bottom: 20px;
    }
    .log-entry {
      border-left: 4px solid #667eea;
      padding: 15px;
      margin-bottom: 15px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .log-entry .timestamp {
      font-size: 12px;
      color: #999;
      margin-bottom: 5px;
    }
    .log-entry .crop {
      font-weight: bold;
      color: #667eea;
    }
    .log-entry .health {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 5px;
    }
    .health.excellent { background: #d4edda; color: #155724; }
    .health.good { background: #d1ecf1; color: #0c5460; }
    .health.moderate { background: #fff3cd; color: #856404; }
    .health.poor { background: #f8d7da; color: #721c24; }
    .status {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 5px;
    }
    .status.online { background: #28a745; }
    .status.offline { background: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌾 AgriSense MCP Dashboard</h1>
      <p>AI-Powered Agricultural Analysis Server</p>
      <p style="margin-top: 10px;">
        <span class="status online"></span>
        Server Status: <strong>Online</strong> | 
        Uptime: <strong>${Math.floor(metrics.uptime_seconds / 60)} minutes</strong>
      </p>
    </div>

    <div class="metrics">
      <div class="metric-card">
        <h3>Total Requests</h3>
        <div class="value">${metrics.total_requests}</div>
        <div class="label">All time</div>
      </div>
      <div class="metric-card">
        <h3>Success Rate</h3>
        <div class="value">${metrics.total_requests > 0 ? Math.round((metrics.successful_requests / metrics.total_requests) * 100) : 0}%</div>
        <div class="label">${metrics.successful_requests} successful</div>
      </div>
      <div class="metric-card">
        <h3>Avg Response Time</h3>
        <div class="value">${Math.round(metrics.average_response_time_ms)}</div>
        <div class="label">milliseconds</div>
      </div>
      <div class="metric-card">
        <h3>Failed Requests</h3>
        <div class="value">${metrics.failed_requests}</div>
        <div class="label">Errors logged</div>
      </div>
    </div>

    <div class="logs">
      <h2>Recent Requests</h2>
      ${recentLogs.length === 0 ? '<p style="color: #999;">No requests yet</p>' : ''}
      ${recentLogs.map(log => `
        <div class="log-entry">
          <div class="timestamp">${new Date(log.timestamp).toLocaleString()}</div>
          <div>
            <span class="crop">${log.request.crop}</span> at ${log.request.location}
          </div>
          <div style="margin-top: 5px; font-size: 14px;">
            Soil: ${(log.request.soil_moisture * 100).toFixed(0)}% | 
            Temp: ${log.request.temperature}°C | 
            Rain: ${log.request.rainfall_mm}mm
          </div>
          <div>
            <span class="health ${log.response.crop_health.toLowerCase()}">${log.response.crop_health}</span>
            <span style="margin-left: 10px; font-size: 12px; color: #666;">
              Risk: ${(log.response.risk_score * 100).toFixed(0)}% | 
              Confidence: ${log.response.confidence} | 
              ${log.processing_time_ms}ms
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'AgriSense MCP Server',
    version: '1.0.0',
    description: 'AI-powered agricultural analysis endpoint for web frontends and AI agents',
    endpoints: {
      analyze: {
        method: 'POST',
        path: '/analyze',
        description: 'Analyze crop data with AI models'
      },
      dashboard: {
        method: 'GET',
        path: '/dashboard',
        description: 'View server metrics and recent requests'
      },
      health: {
        method: 'GET',
        path: '/health',
        description: 'Check server health status'
      }
    },
    ai_models: {
      agribert: 'GautamR/agri_bert_classifier',
      graphcast: 'GraphCast Weather Forecasting'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🌾 AgriSense MCP Server Started');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API docs: http://localhost:${PORT}/`);
  console.log('='.repeat(60));
  console.log('Ready to accept requests from:');
  console.log('  • Web frontends (fetch API)');
  console.log('  • AI agents (Claude, GPT, etc.)');
  console.log('  • MCP clients');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
