import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Indian states with coordinates
const INDIAN_STATES: Record<string, { lat: number; lon: number; capital: string }> = {
  'andhra pradesh': { lat: 15.9129, lon: 79.7400, capital: 'Amaravati' },
  'arunachal pradesh': { lat: 28.2180, lon: 94.7278, capital: 'Itanagar' },
  'assam': { lat: 26.2006, lon: 92.9376, capital: 'Dispur' },
  'bihar': { lat: 25.0961, lon: 85.3131, capital: 'Patna' },
  'chhattisgarh': { lat: 21.2787, lon: 81.8661, capital: 'Raipur' },
  'goa': { lat: 15.2993, lon: 74.1240, capital: 'Panaji' },
  'gujarat': { lat: 22.2587, lon: 71.1924, capital: 'Gandhinagar' },
  'haryana': { lat: 29.0588, lon: 76.0856, capital: 'Chandigarh' },
  'himachal pradesh': { lat: 31.1048, lon: 77.1734, capital: 'Shimla' },
  'jharkhand': { lat: 23.6102, lon: 85.2799, capital: 'Ranchi' },
  'karnataka': { lat: 15.3173, lon: 75.7139, capital: 'Bangalore' },
  'kerala': { lat: 10.8505, lon: 76.2711, capital: 'Thiruvananthapuram' },
  'madhya pradesh': { lat: 22.9734, lon: 78.6569, capital: 'Bhopal' },
  'maharashtra': { lat: 19.7515, lon: 75.7139, capital: 'Mumbai' },
  'manipur': { lat: 24.6637, lon: 93.9063, capital: 'Imphal' },
  'meghalaya': { lat: 25.4670, lon: 91.3662, capital: 'Shillong' },
  'mizoram': { lat: 23.1645, lon: 92.9376, capital: 'Aizawl' },
  'nagaland': { lat: 26.1584, lon: 94.5624, capital: 'Kohima' },
  'odisha': { lat: 20.9517, lon: 85.0985, capital: 'Bhubaneswar' },
  'punjab': { lat: 31.1471, lon: 75.3412, capital: 'Chandigarh' },
  'rajasthan': { lat: 27.0238, lon: 74.2179, capital: 'Jaipur' },
  'sikkim': { lat: 27.5330, lon: 88.5122, capital: 'Gangtok' },
  'tamil nadu': { lat: 11.1271, lon: 78.6569, capital: 'Chennai' },
  'telangana': { lat: 18.1124, lon: 79.0193, capital: 'Hyderabad' },
  'tripura': { lat: 23.9408, lon: 91.9882, capital: 'Agartala' },
  'uttar pradesh': { lat: 26.8467, lon: 80.9462, capital: 'Lucknow' },
  'uttarakhand': { lat: 30.0668, lon: 79.0193, capital: 'Dehradun' },
  'west bengal': { lat: 22.9868, lon: 87.8550, capital: 'Kolkata' },
  'delhi': { lat: 28.7041, lon: 77.1025, capital: 'New Delhi' },
  'jammu and kashmir': { lat: 33.7782, lon: 76.5762, capital: 'Srinagar' },
  'ladakh': { lat: 34.1526, lon: 77.5771, capital: 'Leh' },
  'puducherry': { lat: 11.9416, lon: 79.8083, capital: 'Puducherry' },
};

// City to state mapping
const CITY_TO_STATE: Record<string, string> = {
  'mumbai': 'maharashtra',
  'pune': 'maharashtra',
  'bangalore': 'karnataka',
  'bengaluru': 'karnataka',
  'chennai': 'tamil nadu',
  'hyderabad': 'telangana',
  'kolkata': 'west bengal',
  'lucknow': 'uttar pradesh',
  'bhopal': 'madhya pradesh',
  'jaipur': 'rajasthan',
  'ahmedabad': 'gujarat',
  'surat': 'gujarat',
  'kochi': 'kerala',
  'thiruvananthapuram': 'kerala',
  'bhubaneswar': 'odisha',
  'patna': 'bihar',
  'ranchi': 'jharkhand',
  'raipur': 'chhattisgarh',
  'indore': 'madhya pradesh',
  'guwahati': 'assam',
  'gangtok': 'sikkim',
  'shillong': 'meghalaya',
  'imphal': 'manipur',
  'aizawl': 'mizoram',
  'kohima': 'nagaland',
  'agartala': 'tripura',
  'itanagar': 'arunachal pradesh',
  'panaji': 'goa',
  'amaravati': 'andhra pradesh',
  'vijayawada': 'andhra pradesh',
  'visakhapatnam': 'andhra pradesh',
  'dehradun': 'uttarakhand',
  'leh': 'ladakh',
  'srinagar': 'jammu and kashmir',
};

// Detect location from user input
function detectLocation(input: string): { state: string; coords: { lat: number; lon: number } } | null {
  const lowerInput = input.toLowerCase();
  
  // Check for exact state match
  for (const [state, coords] of Object.entries(INDIAN_STATES)) {
    if (lowerInput.includes(state)) {
      return { state, coords };
    }
  }
  
  // Check for city match
  for (const [city, state] of Object.entries(CITY_TO_STATE)) {
    if (lowerInput.includes(city)) {
      return { state, coords: INDIAN_STATES[state] };
    }
  }
  
  return null;
}

// Fetch AI forecast data
async function fetchAIForecast(lat: number, lon: number, location: string) {
  try {
    const response = await axios.post('http://localhost:3002/api/ai-forecast', {
      lat,
      lon,
      location,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI forecast:', error);
    return null;
  }
}

// Fetch agricultural analysis
async function fetchAgriAnalysis(query: string) {
  try {
    const response = await axios.post('http://localhost:8000/api/agri_analysis', {
      text: query,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching agri analysis:', error);
    return null;
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'climasense-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_weather_forecast',
        description: 'Get comprehensive weather forecast for any Indian state or city. Provides 180-day AI-powered predictions including temperature, rainfall, and humidity with confidence intervals.',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Name of Indian state, city, or village (e.g., "Maharashtra", "Mumbai", "Uttar Pradesh", "Lucknow")',
            },
          },
          required: ['location'],
        },
      },
      {
        name: 'get_agricultural_advice',
        description: 'Get AI-powered agricultural recommendations based on crop conditions, soil status, weather patterns, or farming queries. Powered by AgriBERT model.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Agricultural query or condition description (e.g., "soil is dry and temperature rising", "suggest crops for high humidity", "pest control for rice")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_climate_summary',
        description: 'Get a comprehensive climate summary for a location including current conditions, 6-month outlook, and agricultural insights.',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Name of Indian state, city, or village',
            },
          },
          required: ['location'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: '❌ No arguments provided',
        },
      ],
      isError: true,
    };
  }

  try {
    if (name === 'get_weather_forecast') {
      const location = args.location as string;
      const detected = detectLocation(location);

      if (!detected) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Location "${location}" not recognized. Please provide a valid Indian state or city name.\n\nExamples: Maharashtra, Mumbai, Uttar Pradesh, Lucknow, Tamil Nadu, Chennai`,
            },
          ],
        };
      }

      const forecastData = await fetchAIForecast(
        detected.coords.lat,
        detected.coords.lon,
        detected.state.charAt(0).toUpperCase() + detected.state.slice(1)
      );

      if (!forecastData || !forecastData.success) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unable to fetch weather data for ${detected.state}. The AI Forecast server may be unavailable.`,
            },
          ],
        };
      }

      const current = forecastData.current;
      const monthly = forecastData.forecast.monthly;
      const nextMonth = monthly[0];
      const futureMonth = monthly[monthly.length - 1];

      const avgTemp = monthly.reduce((sum: number, m: any) => sum + m.temperature.predicted, 0) / monthly.length;
      const totalRain = monthly.reduce((sum: number, m: any) => sum + m.rainfall.predicted, 0);

      let response = `# 🌤️ Weather Forecast for ${detected.state.toUpperCase()}\n\n`;
      response += `**Location:** ${detected.state} (${detected.coords.lat.toFixed(2)}°N, ${detected.coords.lon.toFixed(2)}°E)\n`;
      response += `**Generated:** ${new Date().toLocaleString()}\n\n`;

      if (current) {
        response += `## Current Conditions\n`;
        response += `- **Temperature:** ${current.temperature}°C\n`;
        response += `- **Humidity:** ${current.humidity}%\n`;
        response += `- **Conditions:** ${current.description}\n\n`;
      }

      response += `## Next Month Forecast (${nextMonth.month})\n`;
      response += `- **Temperature:** ${nextMonth.temperature.predicted.toFixed(1)}°C (Range: ${nextMonth.temperature.lower.toFixed(1)}°C - ${nextMonth.temperature.upper.toFixed(1)}°C)\n`;
      response += `- **Rainfall:** ${nextMonth.rainfall.predicted.toFixed(0)}mm\n`;
      response += `- **Humidity:** ${nextMonth.humidity.predicted.toFixed(0)}%\n\n`;

      response += `## 6-Month Outlook (${nextMonth.month} - ${futureMonth.month})\n`;
      response += `- **Average Temperature:** ${avgTemp.toFixed(1)}°C\n`;
      response += `- **Total Rainfall:** ${totalRain.toFixed(0)}mm\n`;
      response += `- **Peak Temperature:** ${futureMonth.temperature.predicted.toFixed(1)}°C in ${futureMonth.month}\n\n`;

      response += `## Agricultural Insights\n`;
      if (avgTemp > 35) {
        response += `- ⚠️ **High Temperature Alert:** Heat stress likely for crops and livestock\n`;
      }
      if (totalRain < 300) {
        response += `- 🌵 **Low Rainfall:** Below-average rainfall expected. Water conservation and drought-resistant crops recommended\n`;
      } else if (totalRain > 1000) {
        response += `- 🌧️ **Heavy Rainfall:** Above-average rainfall expected. Monitor for flooding and plan drainage\n`;
      }
      if (avgTemp > 30 && totalRain > 500) {
        response += `- 🌾 **Good Monsoon Conditions:** Favorable for monsoon crops like rice, cotton, and sugarcane\n`;
      }

      response += `\n## Model Information\n`;
      response += `- **Model:** ${forecastData.model.type}\n`;
      response += `- **Training Data:** ${forecastData.historical.dataPoints} days of historical data\n`;
      response += `- **Confidence:** ${forecastData.model.confidence}\n`;
      response += `- **Data Sources:** NASA POWER API + OpenWeather\n`;

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    }

    if (name === 'get_agricultural_advice') {
      const query = args.query as string;
      const aiResponse = await fetchAgriAnalysis(query);

      if (!aiResponse) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unable to get agricultural advice. The AI Backend server may be unavailable.`,
            },
          ],
        };
      }

      let response = `# 🌾 Agricultural AI Recommendation\n\n`;
      response += `**Query:** ${query}\n\n`;
      response += `## Recommendation\n${aiResponse.recommendation}\n\n`;
      response += `**Model:** ${aiResponse.model}\n`;
      response += `**Generated:** ${new Date(aiResponse.timestamp).toLocaleString()}\n`;

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    }

    if (name === 'get_climate_summary') {
      const location = args.location as string;
      const detected = detectLocation(location);

      if (!detected) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Location "${location}" not recognized. Please provide a valid Indian state or city name.`,
            },
          ],
        };
      }

      const forecastData = await fetchAIForecast(
        detected.coords.lat,
        detected.coords.lon,
        detected.state.charAt(0).toUpperCase() + detected.state.slice(1)
      );

      if (!forecastData || !forecastData.success) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unable to fetch climate data for ${detected.state}.`,
            },
          ],
        };
      }

      const current = forecastData.current;
      const monthly = forecastData.forecast.monthly;
      const avgTemp = monthly.reduce((sum: number, m: any) => sum + m.temperature.predicted, 0) / monthly.length;
      const totalRain = monthly.reduce((sum: number, m: any) => sum + m.rainfall.predicted, 0);

      let response = `# 🌍 Climate Summary for ${detected.state.toUpperCase()}\n\n`;
      
      if (current) {
        response += `**Current:** ${current.temperature}°C, ${current.humidity}% humidity, ${current.description}\n\n`;
      }

      response += `## 6-Month Climate Outlook\n`;
      response += `- Average Temperature: ${avgTemp.toFixed(1)}°C\n`;
      response += `- Total Rainfall: ${totalRain.toFixed(0)}mm\n`;
      response += `- Climate Pattern: ${totalRain > 1000 ? 'Wet' : totalRain < 300 ? 'Dry' : 'Moderate'}\n\n`;

      response += `## Agricultural Suitability\n`;
      if (avgTemp > 30 && totalRain > 500) {
        response += `✅ **Excellent** for monsoon crops (rice, cotton, sugarcane)\n`;
      } else if (avgTemp < 25 && totalRain < 500) {
        response += `✅ **Good** for winter crops (wheat, barley, mustard)\n`;
      } else if (totalRain < 300) {
        response += `⚠️ **Challenging** - Drought-resistant crops recommended (millets, pulses)\n`;
      } else {
        response += `✅ **Moderate** - Suitable for diverse crop cultivation\n`;
      }

      response += `\n💡 **Tip:** Use the \`get_agricultural_advice\` tool for specific crop recommendations based on your conditions.\n`;

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `❌ Unknown tool: ${name}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ClimaSense MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
