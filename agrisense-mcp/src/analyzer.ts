import { AnalyzeRequest, AnalyzeResponse } from './types';
import { AIService } from './aiService';

export class CropAnalyzer {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    const startTime = Date.now();

    try {
      // Get AgriBERT analysis
      const agriBertResult = await this.aiService.analyzeWithAgriBERT(request);

      // Get weather forecast
      let weatherForecast = null;
      try {
        weatherForecast = await this.aiService.getWeatherForecast(request.location);
      } catch (error) {
        console.warn('Weather forecast unavailable, continuing with AgriBERT only');
      }

      // Calculate crop health
      const cropHealth = this.calculateCropHealth(request, agriBertResult);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(request, agriBertResult, weatherForecast);

      // Generate suggestions
      const suggestions = this.generateSuggestions(
        request,
        agriBertResult,
        weatherForecast
      );

      // Calculate confidence
      const confidence = this.calculateConfidence(agriBertResult, weatherForecast);

      const processingTime = Date.now() - startTime;

      return {
        crop_health: cropHealth,
        risk_score: riskScore,
        suggestions,
        confidence,
        ai_source: 'AgriSense AI Engine v1.0 (AgriBERT + GraphCast)',
        metadata: {
          timestamp: new Date().toISOString(),
          location: request.location,
          crop: request.crop,
          processing_time_ms: processingTime
        }
      };
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateCropHealth(
    request: AnalyzeRequest,
    agriBertResult: any
  ): string {
    // Use AgriBERT category and request parameters
    const category = agriBertResult?.analysis?.category || 'Unknown';

    if (category.includes('Optimal')) return 'Excellent';
    if (category.includes('Stress') || category.includes('Risk')) return 'Poor';
    if (category.includes('Deficiency')) return 'Moderate';

    // Fallback to parameter-based assessment
    const healthScore = this.calculateHealthScore(request);
    if (healthScore > 0.7) return 'Good';
    if (healthScore > 0.4) return 'Moderate';
    return 'Poor';
  }

  private calculateHealthScore(request: AnalyzeRequest): number {
    let score = 0.5; // Base score

    // Soil moisture contribution (0-0.3)
    if (request.soil_moisture >= 0.4 && request.soil_moisture <= 0.7) {
      score += 0.2;
    } else if (request.soil_moisture < 0.3 || request.soil_moisture > 0.8) {
      score -= 0.1;
    }

    // Temperature contribution (0-0.3)
    if (request.temperature >= 20 && request.temperature <= 30) {
      score += 0.2;
    } else if (request.temperature < 15 || request.temperature > 35) {
      score -= 0.1;
    }

    // NDVI contribution (0-0.2)
    if (request.ndvi !== undefined) {
      if (request.ndvi > 0.6) score += 0.2;
      else if (request.ndvi < 0.3) score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateRiskScore(
    request: AnalyzeRequest,
    agriBertResult: any,
    weatherForecast: any
  ): number {
    let riskScore = 0;

    // AgriBERT-based risk (0-0.4)
    const category = agriBertResult?.analysis?.category || '';
    if (category.includes('Stress')) riskScore += 0.3;
    if (category.includes('Pest')) riskScore += 0.4;
    if (category.includes('Disease')) riskScore += 0.4;
    if (category.includes('Deficiency')) riskScore += 0.2;

    // Parameter-based risk (0-0.3)
    if (request.soil_moisture < 0.3) riskScore += 0.15;
    if (request.temperature > 35 || request.temperature < 15) riskScore += 0.15;
    if (request.ndvi !== undefined && request.ndvi < 0.3) riskScore += 0.1;

    // Weather forecast risk (0-0.3)
    if (weatherForecast?.forecast) {
      const avgRainRisk = weatherForecast.forecast
        .slice(0, 3)
        .reduce((sum: number, day: any) => sum + day.rain_risk, 0) / 3;
      const avgTempExtreme = weatherForecast.forecast
        .slice(0, 3)
        .reduce((sum: number, day: any) => sum + day.temp_extreme, 0) / 3;

      riskScore += (avgRainRisk / 100) * 0.15;
      riskScore += (avgTempExtreme / 100) * 0.15;
    }

    return Math.round(Math.min(1, riskScore) * 100) / 100;
  }

  private generateSuggestions(
    request: AnalyzeRequest,
    agriBertResult: any,
    weatherForecast: any
  ): string[] {
    const suggestions: string[] = [];

    // Add AgriBERT recommendations
    if (agriBertResult?.analysis?.recommendations) {
      suggestions.push(...agriBertResult.analysis.recommendations.slice(0, 3));
    }

    // Add parameter-based suggestions
    if (request.soil_moisture < 0.3) {
      suggestions.push('Increase irrigation by 15-20% to improve soil moisture levels.');
    } else if (request.soil_moisture > 0.7) {
      suggestions.push('Reduce irrigation and ensure proper drainage to prevent waterlogging.');
    }

    if (request.temperature > 35) {
      suggestions.push('Apply mulch to reduce soil temperature and conserve moisture.');
    } else if (request.temperature < 15) {
      suggestions.push('Consider protective covering during cold nights to prevent frost damage.');
    }

    if (request.ndvi !== undefined && request.ndvi < 0.4) {
      suggestions.push('Vegetation health is low - consider nutrient supplementation (NPK 20-20-0).');
    }

    // Add weather-based suggestions
    if (weatherForecast?.forecast) {
      const next3Days = weatherForecast.forecast.slice(0, 3);
      const avgRainfall = next3Days.reduce(
        (sum: number, day: any) => sum + day.raw_data.precipitation_mm,
        0
      ) / 3;

      if (avgRainfall > 20) {
        suggestions.push('Heavy rainfall expected - ensure drainage systems are clear.');
      } else if (avgRainfall < 5) {
        suggestions.push('Low rainfall forecast - plan irrigation schedule for next 3 days.');
      }

      const highTempDays = next3Days.filter(
        (day: any) => day.raw_data.temp_max_c > 35
      ).length;
      if (highTempDays >= 2) {
        suggestions.push('Heat stress expected - consider shade nets or increased irrigation frequency.');
      }
    }

    // Ensure we have at least 3 suggestions
    if (suggestions.length < 3) {
      suggestions.push('Monitor crop health daily for early detection of issues.');
      suggestions.push('Maintain detailed records of weather, irrigation, and crop observations.');
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  private calculateConfidence(agriBertResult: any, weatherForecast: any): string {
    let confidence = 0.7; // Base confidence

    // AgriBERT confidence contribution
    if (agriBertResult?.analysis?.confidence) {
      confidence = agriBertResult.analysis.confidence * 0.6 + confidence * 0.4;
    }

    // Weather forecast confidence contribution
    if (weatherForecast?.forecast?.[0]?.confidence_score) {
      const forecastConfidence = weatherForecast.forecast[0].confidence_score;
      confidence = confidence * 0.7 + forecastConfidence * 0.3;
    }

    return `${Math.round(confidence * 100)}%`;
  }
}
