# GraphCast Monitoring Configuration

## Overview

This document describes the monitoring setup for the ClimaSense GraphCast integration, including key metrics, alerting thresholds, and dashboard configuration.

## Key Metrics

### 1. Request Metrics

**Metric**: `graphcast_requests_total`  
**Type**: Counter  
**Description**: Total number of API requests received  
**Labels**: `endpoint`, `status_code`

**Metric**: `graphcast_requests_duration_seconds`  
**Type**: Histogram  
**Description**: Request duration in seconds  
**Labels**: `endpoint`, `cache_hit`

**Metric**: `http_request_duration_seconds`  
**Type**: Histogram  
**Description**: HTTP request duration including all processing  
**Labels**: `endpoint`, `method`, `status_code`

### 2. Cache Metrics

**Metric**: `graphcast_cache_hits`  
**Type**: Counter  
**Description**: Number of successful cache hits  
**Labels**: `location_hash`

**Metric**: `graphcast_cache_misses`  
**Type**: Counter  
**Description**: Number of cache misses requiring new inference  
**Labels**: `location_hash`

**Metric**: `graphcast_cache_size_bytes`  
**Type**: Gauge  
**Description**: Total size of cached forecasts in bytes  
**Labels**: None

**Metric**: `graphcast_cache_entries_total`  
**Type**: Gauge  
**Description**: Total number of cached forecast entries  
**Labels**: None

### 3. Inference Metrics

**Metric**: `graphcast_inference_duration_seconds`  
**Type**: Histogram  
**Description**: Time taken for GraphCast model inference  
**Labels**: `device` (cpu/gpu), `forecast_days`  
**Buckets**: [10, 30, 60, 120, 180, 240, 300, 600]

**Metric**: `graphcast_inference_memory_bytes`  
**Type**: Gauge  
**Description**: Memory used during inference  
**Labels**: `device`

**Metric**: `graphcast_inference_total`  
**Type**: Counter  
**Description**: Total number of inference operations  
**Labels**: `device`, `status` (success/failure)

### 4. Error Metrics

**Metric**: `graphcast_errors_total`  
**Type**: Counter  
**Description**: Total number of errors by type  
**Labels**: `error_type`, `endpoint`  
**Error Types**:
- `model_load_error`: Failed to load GraphCast model
- `era5_fetch_error`: Failed to fetch ERA5 data
- `inference_timeout`: Inference exceeded timeout
- `invalid_coordinates`: Request coordinates out of bounds
- `cache_error`: Cache read/write failure
- `validation_error`: Data validation failure

### 5. ERA5 Data Metrics

**Metric**: `graphcast_era5_fetch_attempts_total`  
**Type**: Counter  
**Description**: Total ERA5 data fetch attempts  
**Labels**: `source` (cds/gee/cache)

**Metric**: `graphcast_era5_fetch_success_total`  
**Type**: Counter  
**Description**: Successful ERA5 data fetches  
**Labels**: `source`

**Metric**: `graphcast_era5_fetch_duration_seconds`  
**Type**: Histogram  
**Description**: Time taken to fetch ERA5 data  
**Labels**: `source`

### 6. System Metrics

**Metric**: `process_cpu_seconds_total`  
**Type**: Counter  
**Description**: Total CPU time consumed by the process  
**Labels**: None

**Metric**: `process_resident_memory_bytes`  
**Type**: Gauge  
**Description**: Resident memory size in bytes  
**Labels**: None

**Metric**: `nvidia_gpu_utilization_percent`  
**Type**: Gauge  
**Description**: GPU utilization percentage (if GPU available)  
**Labels**: `gpu` (device index)

**Metric**: `nvidia_gpu_memory_used_bytes`  
**Type**: Gauge  
**Description**: GPU memory used in bytes  
**Labels**: `gpu`

## Alerting Thresholds

### Critical Alerts (Immediate Action Required)

#### 1. High Error Rate
**Condition**: Error rate > 10% over 5 minutes  
**Expression**: `(rate(graphcast_errors_total[5m]) / rate(graphcast_requests_total[5m])) > 0.10`  
**Severity**: Critical  
**Action**: 
- Check application logs for error details
- Verify ERA5 API connectivity
- Check model loading status
- Verify system resources (CPU, memory, disk)

#### 2. Model Load Failure
**Condition**: Model fails to load on startup  
**Expression**: `graphcast_errors_total{error_type="model_load_error"} > 0`  
**Severity**: Critical  
**Action**:
- Check model weights file integrity
- Verify disk space availability
- Check JAX/Haiku installation
- Review model download logs

#### 3. Inference Timeout Rate High
**Condition**: > 20% of inferences timing out  
**Expression**: `(rate(graphcast_errors_total{error_type="inference_timeout"}[10m]) / rate(graphcast_inference_total[10m])) > 0.20`  
**Severity**: Critical  
**Action**:
- Check CPU/GPU utilization
- Consider scaling to GPU instances
- Review inference queue depth
- Check for memory leaks

#### 4. Memory Exhaustion
**Condition**: Memory usage > 90% of available  
**Expression**: `(process_resident_memory_bytes / node_memory_total_bytes) > 0.90`  
**Severity**: Critical  
**Action**:
- Restart service to clear memory
- Review cache size limits
- Check for memory leaks in inference pipeline
- Consider increasing instance memory

### Warning Alerts (Investigation Needed)

#### 5. Low Cache Hit Rate
**Condition**: Cache hit rate < 50% over 1 hour  
**Expression**: `(rate(graphcast_cache_hits[1h]) / rate(graphcast_requests_total[1h])) < 0.50`  
**Severity**: Warning  
**Action**:
- Review cache TTL settings
- Check if pre-computation is running
- Verify cache storage is functioning
- Analyze request patterns for optimization

#### 6. ERA5 Fetch Failures
**Condition**: ERA5 fetch success rate < 95% over 15 minutes  
**Expression**: `(rate(graphcast_era5_fetch_success_total[15m]) / rate(graphcast_era5_fetch_attempts_total[15m])) < 0.95`  
**Severity**: Warning  
**Action**:
- Check ERA5 API status
- Verify API credentials
- Check network connectivity
- Review rate limiting

#### 7. Slow Inference Performance
**Condition**: p95 inference time > 180s on CPU or > 45s on GPU  
**Expression**: `histogram_quantile(0.95, rate(graphcast_inference_duration_seconds_bucket[10m])) > 180` (CPU)  
**Severity**: Warning  
**Action**:
- Check system load
- Review concurrent inference count
- Consider GPU acceleration
- Profile inference pipeline

#### 8. High Request Rate
**Condition**: Request rate > 100 requests/minute  
**Expression**: `rate(graphcast_requests_total[1m]) > 100`  
**Severity**: Warning  
**Action**:
- Monitor system resources
- Consider rate limiting
- Review cache effectiveness
- Plan for horizontal scaling

### Informational Alerts

#### 9. Cache Size Growing
**Condition**: Cache size > 5GB  
**Expression**: `graphcast_cache_size_bytes > 5368709120`  
**Severity**: Info  
**Action**:
- Review cache cleanup schedule
- Verify TTL is working correctly
- Consider cache size limits

#### 10. GPU Not Available
**Condition**: No GPU metrics reported  
**Expression**: `absent(nvidia_gpu_utilization_percent)`  
**Severity**: Info  
**Action**:
- Verify GPU drivers installed
- Check CUDA availability
- Consider GPU instance for better performance

## Dashboard Setup

### Grafana Dashboard

The included `grafana-dashboard.json` provides a comprehensive monitoring view with the following panels:

1. **Request Rate**: Real-time request throughput
2. **Cache Hit Rate**: Percentage of requests served from cache
3. **Error Rate**: Percentage of failed requests
4. **Inference Time**: p50, p95, p99 latencies for model inference
5. **API Response Time**: End-to-end response times by endpoint
6. **CPU Usage**: Process CPU utilization
7. **Memory Usage**: Process memory consumption
8. **GPU Utilization**: GPU usage (if available)
9. **Cache Size**: Cache storage metrics
10. **ERA5 Fetch Success Rate**: Data retrieval reliability
11. **Request Distribution**: Traffic breakdown by endpoint

### Installation

1. **Import Dashboard**:
   ```bash
   # Using Grafana API
   curl -X POST http://localhost:3000/api/dashboards/db \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d @grafana-dashboard.json
   ```

2. **Configure Data Source**:
   - Add Prometheus data source in Grafana
   - Point to your Prometheus instance (default: http://localhost:9090)
   - Test connection

3. **Set Up Alerts**:
   - Navigate to Alerting > Alert Rules
   - Create alert rules based on thresholds above
   - Configure notification channels (email, Slack, PagerDuty)

## Prometheus Configuration

### Scrape Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'graphcast-backend'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

### Recording Rules

Create `graphcast_rules.yml`:

```yaml
groups:
  - name: graphcast_aggregations
    interval: 30s
    rules:
      # Cache hit rate
      - record: graphcast:cache_hit_rate:5m
        expr: rate(graphcast_cache_hits[5m]) / rate(graphcast_requests_total[5m])
      
      # Error rate
      - record: graphcast:error_rate:5m
        expr: rate(graphcast_errors_total[5m]) / rate(graphcast_requests_total[5m])
      
      # Average inference time
      - record: graphcast:inference_duration:avg:5m
        expr: rate(graphcast_inference_duration_seconds_sum[5m]) / rate(graphcast_inference_duration_seconds_count[5m])
      
      # ERA5 success rate
      - record: graphcast:era5_success_rate:15m
        expr: rate(graphcast_era5_fetch_success_total[15m]) / rate(graphcast_era5_fetch_attempts_total[15m])
```

### Alert Rules

Create `graphcast_alerts.yml`:

```yaml
groups:
  - name: graphcast_critical
    rules:
      - alert: HighErrorRate
        expr: graphcast:error_rate:5m > 0.10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes"
      
      - alert: InferenceTimeoutHigh
        expr: (rate(graphcast_errors_total{error_type="inference_timeout"}[10m]) / rate(graphcast_inference_total[10m])) > 0.20
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "High inference timeout rate"
          description: "{{ $value | humanizePercentage }} of inferences are timing out"
      
      - alert: MemoryExhaustion
        expr: (process_resident_memory_bytes / node_memory_total_bytes) > 0.90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Memory usage critical"
          description: "Memory usage is {{ $value | humanizePercentage }}"
  
  - name: graphcast_warnings
    rules:
      - alert: LowCacheHitRate
        expr: graphcast:cache_hit_rate:5m < 0.50
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is {{ $value | humanizePercentage }}"
      
      - alert: ERA5FetchFailures
        expr: graphcast:era5_success_rate:15m < 0.95
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "ERA5 fetch failures detected"
          description: "ERA5 success rate is {{ $value | humanizePercentage }}"
      
      - alert: SlowInferencePerformance
        expr: histogram_quantile(0.95, rate(graphcast_inference_duration_seconds_bucket{device="cpu"}[10m])) > 180
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow inference performance on CPU"
          description: "p95 inference time is {{ $value }}s"
```

## Logging Integration

### Structured Logging Format

All logs should follow this JSON structure:

```json
{
  "timestamp": "2025-11-09T12:34:56.789Z",
  "level": "INFO",
  "request_id": "req_abc123",
  "endpoint": "/api/graphcast_forecast",
  "message": "Inference completed successfully",
  "metrics": {
    "inference_time_ms": 45230,
    "cache_hit": false,
    "forecast_days": 10,
    "device": "gpu"
  }
}
```

### Log Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages (requests, cache hits)
- **WARNING**: Warning messages (cache misses, slow performance)
- **ERROR**: Error messages (inference failures, API errors)
- **CRITICAL**: Critical errors requiring immediate attention

### Key Log Events

1. **Model Loading**: Log when model is loaded/failed
2. **Inference Start/End**: Log inference duration and result
3. **Cache Operations**: Log cache hits/misses
4. **ERA5 Fetches**: Log data retrieval attempts
5. **Errors**: Log all errors with stack traces

## Performance Targets

### Response Time Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Cached Request | < 1s | < 2s | > 5s |
| CPU Inference | < 180s | < 240s | > 300s |
| GPU Inference | < 45s | < 60s | > 90s |
| ERA5 Fetch | < 30s | < 60s | > 120s |

### Reliability Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Error Rate | < 1% | < 5% | > 10% |
| Cache Hit Rate | > 80% | > 50% | < 30% |
| ERA5 Success Rate | > 99% | > 95% | < 90% |
| Uptime | > 99.9% | > 99% | < 95% |

### Resource Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| CPU Usage | < 60% | < 80% | > 90% |
| Memory Usage | < 70% | < 85% | > 90% |
| GPU Usage | < 80% | < 90% | > 95% |
| Disk Usage | < 70% | < 85% | > 90% |

## Troubleshooting Guide

### High Error Rate

1. Check application logs for specific error types
2. Verify external dependencies (ERA5 API, model weights)
3. Check system resources (CPU, memory, disk)
4. Review recent deployments or configuration changes

### Low Cache Hit Rate

1. Verify cache is enabled and configured correctly
2. Check cache TTL settings (should be 24 hours)
3. Review request patterns (are users requesting diverse locations?)
4. Verify pre-computation scheduler is running

### Slow Performance

1. Check if running on CPU vs GPU
2. Review concurrent request count
3. Check system load and resource utilization
4. Profile inference pipeline for bottlenecks
5. Consider horizontal scaling

### ERA5 Fetch Failures

1. Check ERA5 API status and credentials
2. Verify network connectivity
3. Review rate limiting settings
4. Check cache for fallback data

## Maintenance Tasks

### Daily
- Review error logs for patterns
- Check cache hit rate trends
- Monitor inference performance

### Weekly
- Review alert history
- Analyze performance trends
- Check disk space usage
- Verify backup processes

### Monthly
- Review and update alert thresholds
- Analyze capacity planning metrics
- Update documentation
- Review and optimize cache strategy

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [GraphCast Paper](https://arxiv.org/abs/2212.12794)
- [FastAPI Metrics](https://github.com/trallnag/prometheus-fastapi-instrumentator)