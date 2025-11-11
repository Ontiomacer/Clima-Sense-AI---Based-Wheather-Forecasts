import axios from 'axios';
import { AnalyzeRequest } from './types';

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000';

export class AIService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = AI_BACKEND_URL;
  }

  async analyzeWithAgriBERT(request: AnalyzeRequest): Promise<any> {
    try {
      // Create analysis text from request parameters
      const analysisText = this.createAnalysisText(request);

      const response = await axios.post(
        `${this.backendUrl}/api/agri_analysis`,
        {
          text: analysisText,
          context: {
            crop: request.crop,
            region: request.location,
            season: this.getCurrentSeason()
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('AgriBERT analysis failed:', error);
      throw error;
    }
  }

  async getWeatherForecast(location: string): Promise<any> {
    try {
      const coords = this.parseLocation(location);

      const response = await axios.post(
        `${this.backendUrl}/api/graphcast_forecast`,
        {
          latitude: coords.lat,
          longitude: coords.lon,
          forecast_days: 7
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Weather forecast failed:', error);
      throw error;
    }
  }

  private createAnalysisText(request: AnalyzeRequest): string {
    const conditions: string[] = [];

    // Soil moisture analysis
    if (request.soil_moisture < 0.3) {
      conditions.push('soil is dry');
    } else if (request.soil_moisture > 0.7) {
      conditions.push('soil has excess moisture');
    } else {
      conditions.push('soil moisture is adequate');
    }

    // Temperature analysis
    if (request.temperature > 35) {
      conditions.push('temperature is very high');
    } else if (request.temperature < 15) {
      conditions.push('temperature is low');
    } else {
      conditions.push('temperature is moderate');
    }

    // Rainfall analysis
    if (request.rainfall_mm > 50) {
      conditions.push('heavy rainfall observed');
    } else if (request.rainfall_mm > 20) {
      conditions.push('moderate rainfall');
    } else if (request.rainfall_mm < 5) {
      conditions.push('low rainfall');
    }

    // NDVI analysis (vegetation health)
    if (request.ndvi !== undefined) {
      if (request.ndvi < 0.3) {
        conditions.push('vegetation health is poor');
      } else if (request.ndvi > 0.6) {
        conditions.push('vegetation is healthy');
      }
    }

    return `${request.crop} crop showing ${conditions.join(', ')}`;
  }

  private parseLocation(location: string): { lat: number; lon: number } {
    // Map common locations to coordinates
    const locationMap: Record<string, { lat: number; lon: number }> = {
      'pune,in': { lat: 18.5204, lon: 73.8567 },
      'mumbai,in': { lat: 19.0760, lon: 72.8777 },
      'nagpur,in': { lat: 21.1458, lon: 79.0882 },
      'nashik,in': { lat: 19.9975, lon: 73.7898 },
      'maharashtra,in': { lat: 19.7515, lon: 75.7139 }
    };

    const key = location.toLowerCase();
    return locationMap[key] || locationMap['maharashtra,in'];
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 9) return 'monsoon';
    if (month >= 10 && month <= 2) return 'winter';
    return 'summer';
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.backendUrl}/api/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
