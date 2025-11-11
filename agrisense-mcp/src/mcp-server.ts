#!/usr/bin/env node

/**
 * AgriSense MCP Server - Model Context Protocol Implementation
 * This wraps the HTTP API to work with Claude Desktop's MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000';
const MCP_HTTP_PORT = process.env.PORT || '9090';

// Create MCP server
const server = new Server(
  {
    name: 'agrisense-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the analyze_crop tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_crop',
        description: 'Analyze crop data using AI models (AgriBERT + GraphCast) to assess health, calculate risk scores, and provide farming recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            crop: {
              type: 'string',
              description: 'Type of crop (e.g., wheat, rice, cotton, sugarcane, soybean, maize)',
            },
            location: {
              type: 'string',
              description: 'Location in format "City,Country" (e.g., "Pune,IN", "Mumbai,IN")',
            },
            soil_moisture: {
              type: 'number',
              description: 'Soil moisture level from 0.0 to 1.0 (0% to 100%)',
              minimum: 0,
              maximum: 1,
            },
            temperature: {
              type: 'number',
              description: 'Temperature in Celsius',
            },
            rainfall_mm: {
              type: 'number',
              description: 'Rainfall in millimeters',
              minimum: 0,
            },
            ndvi: {
              type: 'number',
              description: 'Normalized Difference Vegetation Index (0.0 to 1.0) - optional',
              minimum: 0,
              maximum: 1,
            },
            humidity: {
              type: 'number',
              description: 'Humidity percentage (0 to 100) - optional',
              minimum: 0,
              maximum: 100,
            },
          },
          required: ['crop', 'location', 'soil_moisture', 'temperature', 'rainfall_mm'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'analyze_crop') {
    try {
      const args = request.params.arguments as any;

      // Call the HTTP API
      const response = await axios.post(
        `http://localhost:${MCP_HTTP_PORT}/analyze`,
        args,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      const result = response.data;

      // Format the response for Claude
      const formattedResponse = `
🌾 **Crop Health Analysis for ${args.crop} in ${args.location}**

**Health Status:** ${result.crop_health}
**Risk Score:** ${(result.risk_score * 100).toFixed(0)}%
**Confidence:** ${result.confidence}

**AI Recommendations:**
${result.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

**Analysis Details:**
- Location: ${result.metadata.location}
- Crop: ${result.metadata.crop}
- Processing Time: ${result.metadata.processing_time_ms}ms
- AI Source: ${result.ai_source}
- Timestamp: ${result.metadata.timestamp}

**Input Parameters:**
- Soil Moisture: ${(args.soil_moisture * 100).toFixed(0)}%
- Temperature: ${args.temperature}°C
- Rainfall: ${args.rainfall_mm}mm
${args.ndvi ? `- NDVI: ${args.ndvi}` : ''}
${args.humidity ? `- Humidity: ${args.humidity}%` : ''}
      `.trim();

      return {
        content: [
          {
            type: 'text',
            text: formattedResponse,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error analyzing crop: ${errorMessage}\n\nPlease ensure:\n1. AgriSense HTTP server is running on port ${MCP_HTTP_PORT}\n2. AI backend is running on port 8000\n3. All parameters are valid`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AgriSense MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
