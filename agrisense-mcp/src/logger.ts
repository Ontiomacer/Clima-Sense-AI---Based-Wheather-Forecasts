import fs from 'fs';
import path from 'path';
import { LogEntry, ServerMetrics } from './types';

export class Logger {
  private logFilePath: string;
  private dataDir: string;
  private metrics: ServerMetrics;
  private startTime: number;

  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.logFilePath = process.env.LOG_FILE || path.join(this.dataDir, 'agrisense_logs.json');
    this.startTime = Date.now();
    
    this.metrics = {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time_ms: 0,
      uptime_seconds: 0,
      last_request_time: null
    };

    this.ensureDataDirectory();
    this.loadMetrics();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, JSON.stringify([], null, 2));
    }
  }

  private loadMetrics(): void {
    try {
      const logs = this.readLogs();
      if (logs.length > 0) {
        this.metrics.total_requests = logs.length;
        this.metrics.successful_requests = logs.filter(
          log => log.response && !log.response.ai_source.includes('Error')
        ).length;
        this.metrics.failed_requests = this.metrics.total_requests - this.metrics.successful_requests;
        
        const totalTime = logs.reduce((sum, log) => sum + log.processing_time_ms, 0);
        this.metrics.average_response_time_ms = totalTime / logs.length;
        
        this.metrics.last_request_time = logs[logs.length - 1]?.timestamp || null;
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }

  logRequest(entry: LogEntry): void {
    try {
      const logs = this.readLogs();
      logs.push(entry);

      // Keep only last 1000 entries
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      fs.writeFileSync(this.logFilePath, JSON.stringify(logs, null, 2));

      // Update metrics
      this.metrics.total_requests++;
      this.metrics.successful_requests++;
      this.metrics.last_request_time = entry.timestamp;
      
      const totalTime = this.metrics.average_response_time_ms * (this.metrics.total_requests - 1) + entry.processing_time_ms;
      this.metrics.average_response_time_ms = totalTime / this.metrics.total_requests;

    } catch (error) {
      console.error('Failed to log request:', error);
    }
  }

  logError(request: any, error: Error, processingTime: number): void {
    try {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        request,
        response: {
          crop_health: 'Error',
          risk_score: 0,
          suggestions: [error.message],
          confidence: '0%',
          ai_source: 'Error'
        },
        processing_time_ms: processingTime
      };

      const logs = this.readLogs();
      logs.push(entry);

      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      fs.writeFileSync(this.logFilePath, JSON.stringify(logs, null, 2));

      // Update metrics
      this.metrics.total_requests++;
      this.metrics.failed_requests++;
      this.metrics.last_request_time = entry.timestamp;

    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  readLogs(): LogEntry[] {
    try {
      const data = fs.readFileSync(this.logFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  getMetrics(): ServerMetrics {
    this.metrics.uptime_seconds = Math.floor((Date.now() - this.startTime) / 1000);
    return { ...this.metrics };
  }

  getRecentLogs(limit: number = 10): LogEntry[] {
    const logs = this.readLogs();
    return logs.slice(-limit).reverse();
  }
}
