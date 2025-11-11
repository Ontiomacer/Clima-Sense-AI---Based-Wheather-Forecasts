# GraphCast Monitoring Setup

This directory contains the complete monitoring configuration for the ClimaSense GraphCast integration, including Prometheus metrics, Grafana dashboards, and alerting rules.

## Quick Start

### Using Docker Compose (Recommended)

1. **Start the monitoring stack**:
   ```bash
   cd ai-backend/monitoring
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access the dashboards**:
   - Grafana: http://localhost:3000 (admin/admin)
   - Prometheus: http://localhost:9090
   - Alertmanager: http://localhost:9093

3. **Configure alerts**:
   - Edit `alertmanager.yml` with your notification channels (email, Slack, PagerDuty)
   - Update SMTP settings or Slack webhooks
   - Restart Alertmanager: `docker-compose restart alertmanager`

### Manual Setup

1. **Install Prometheus**:
   ```bash
   # Download and extract Prometheus
   wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
   tar xvfz prometheus-*.tar.gz
   cd prometheus-*
   
   # Copy configuration files
   cp ../prometheus.yml .
   cp ../prometheus-rules.yml rules/
   cp ../prometheus-alerts.yml rules/
   
   # Start Prometheus
   ./prometheus --config.file=prometheus.yml
   ```

2. **Install Grafana**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y software-properties-common
   sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
   sudo apt-get update
   sudo apt-get install grafana
   
   # Start Grafana
   sudo systemctl start grafana-server
   sudo systemctl enable grafana-server
   ```

3. **Import Dashboard**:
   - Open Grafana at http://localhost:3000
   - Go to Dashboards > Import
   - Upload `grafana-dashboard.json`

## Configuration Files

### Core Files

- **`MONITORING.md`**: Complete monitoring documentation with metrics, thresholds, and troubleshooting
- **`grafana-dashboard.json`**: Pre-configured Grafana dashboard with 11 panels
- **`prometheus.yml`**: Prometheus scrape configuration
- **`prometheus-rules.yml`**: Recording rules for metric aggregations
- **`prometheus-alerts.yml`**: Alert rules with thresholds
- **`alertmanager.yml`**: Alert routing and notification configuration

### Docker Files

- **`docker-compose.monitoring.yml`**: Complete monitoring stack (Prometheus, Grafana, Alertmanager, Node Exporter)
- **`grafana-datasource.yml`**: Auto-provisioned Prometheus datasource for Grafana

## Key Metrics

### Request Metrics
- `graphcast_requests_total`: Total API requests
- `graphcast_requests_duration_seconds`: Request latency histogram
- `http_request_duration_seconds`: End-to-end API response time

### Cache Metrics
- `graphcast_cache_hits`: Cache hit counter
- `graphcast_cache_misses`: Cache miss counter
- `graphcast_cache_size_bytes`: Total cache size
- `graphcast_cache_entries_total`: Number of cached entries

### Inference Metrics
- `graphcast_inference_duration_seconds`: Model inference time
- `graphcast_inference_memory_bytes`: Memory used during inference
- `graphcast_inference_total`: Total inference operations

### Error Metrics
- `graphcast_errors_total`: Errors by type (model_load_error, era5_fetch_error, inference_timeout, etc.)

### ERA5 Metrics
- `graphcast_era5_fetch_attempts_total`: ERA5 fetch attempts
- `graphcast_era5_fetch_success_total`: Successful ERA5 fetches
- `graphcast_era5_fetch_duration_seconds`: ERA5 fetch latency

## Alert Thresholds

### Critical Alerts (Immediate Action)

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| High Error Rate | > 10% | 5 min | Check logs, verify dependencies |
| Model Load Failure | > 0 errors | 1 min | Check model weights, disk space |
| Inference Timeout | > 20% | 10 min | Check resources, consider GPU |
| Memory Exhaustion | > 90% | 5 min | Restart service, increase memory |
| Service Down | No metrics | 2 min | Check service status |

### Warning Alerts (Investigation Needed)

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| Low Cache Hit Rate | < 50% | 1 hour | Review cache config, check pre-computation |
| ERA5 Fetch Failures | < 95% success | 15 min | Check ERA5 API, verify credentials |
| Slow CPU Inference | p95 > 180s | 10 min | Consider GPU, check system load |
| Slow GPU Inference | p95 > 45s | 10 min | Check GPU utilization |
| High Request Rate | > 100/min | 5 min | Monitor resources, consider scaling |

### Info Alerts (Awareness)

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| Cache Size Growing | > 5GB | 30 min | Review cache cleanup |
| GPU Not Available | No GPU metrics | 5 min | Consider GPU for performance |
| Pre-computation Not Running | > 24h since last run | 1 hour | Check scheduler |

## Notification Channels

### Email
Configure SMTP settings in `alertmanager.yml`:
```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@climasense.com'
  smtp_auth_username: 'alerts@climasense.com'
  smtp_auth_password: 'your-password'
```

### Slack
Add Slack webhook URL in `alertmanager.yml`:
```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#graphcast-alerts'
```

### PagerDuty
Uncomment and configure PagerDuty in `alertmanager.yml`:
```yaml
pagerduty_configs:
  - service_key: 'your-pagerduty-service-key'
```

## Dashboard Panels

The Grafana dashboard includes:

1. **Request Rate**: Real-time throughput
2. **Cache Hit Rate**: Cache effectiveness (target: >80%)
3. **Error Rate**: Request failures (target: <1%)
4. **Inference Time**: p50/p95/p99 latencies
5. **API Response Time**: End-to-end response times
6. **CPU Usage**: Process CPU utilization
7. **Memory Usage**: Process memory consumption
8. **GPU Utilization**: GPU usage (if available)
9. **Cache Size**: Cache storage metrics
10. **ERA5 Success Rate**: Data fetch reliability
11. **Request Distribution**: Traffic by endpoint

## Performance Targets

### Response Times
- Cached requests: < 1s (target), < 2s (acceptable), > 5s (critical)
- CPU inference: < 180s (target), < 240s (acceptable), > 300s (critical)
- GPU inference: < 45s (target), < 60s (acceptable), > 90s (critical)

### Reliability
- Error rate: < 1% (target), < 5% (acceptable), > 10% (critical)
- Cache hit rate: > 80% (target), > 50% (acceptable), < 30% (critical)
- ERA5 success: > 99% (target), > 95% (acceptable), < 90% (critical)
- Uptime: > 99.9% (target), > 99% (acceptable), < 95% (critical)

## Troubleshooting

### Prometheus Not Scraping Metrics

1. Check if backend is exposing metrics:
   ```bash
   curl http://localhost:8000/metrics
   ```

2. Verify Prometheus targets:
   - Open http://localhost:9090/targets
   - Check if `graphcast-backend` is UP

3. Check Prometheus logs:
   ```bash
   docker logs graphcast-prometheus
   ```

### Grafana Dashboard Not Loading

1. Verify Prometheus datasource:
   - Go to Configuration > Data Sources
   - Test Prometheus connection

2. Check if metrics exist:
   - Go to Explore
   - Query: `graphcast_requests_total`

3. Reimport dashboard:
   - Delete existing dashboard
   - Import `grafana-dashboard.json` again

### Alerts Not Firing

1. Check alert rules in Prometheus:
   - Open http://localhost:9090/alerts
   - Verify rules are loaded

2. Check Alertmanager:
   - Open http://localhost:9093
   - Verify alerts are received

3. Test notification channel:
   - Send test alert from Alertmanager UI

### High Memory Usage

1. Check cache size:
   ```bash
   curl http://localhost:8000/metrics | grep cache_size
   ```

2. Clear cache if needed:
   ```bash
   # Restart backend to clear in-memory cache
   docker restart graphcast-backend
   ```

3. Adjust cache limits in config

## Maintenance

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
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [GraphCast Integration Guide](../GRAPHCAST_INTEGRATION.md)
- [Full Monitoring Documentation](./MONITORING.md)

## Support

For issues or questions:
- Check [MONITORING.md](./MONITORING.md) for detailed documentation
- Review [troubleshooting guide](#troubleshooting)
- Contact: monitoring@climasense.com
