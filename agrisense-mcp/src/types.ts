export interface AnalyzeRequest {
  crop: string;
  location: string;
  soil_moisture: number;
  temperature: number;
  rainfall_mm: number;
  ndvi?: number;
  humidity?: number;
}

export interface AnalyzeResponse {
  crop_health: string;
  risk_score: number;
  suggestions: string[];
  confidence: string;
  ai_source: string;
  metadata?: {
    timestamp: string;
    location: string;
    crop: string;
    processing_time_ms: number;
  };
}

export interface LogEntry {
  timestamp: string;
  request: AnalyzeRequest;
  response: AnalyzeResponse;
  processing_time_ms: number;
}

export interface ServerMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time_ms: number;
  uptime_seconds: number;
  last_request_time: string | null;
}
