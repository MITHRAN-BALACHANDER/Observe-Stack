# Troubleshooting

## Common Issues

### Services won't start
```bash
# Check logs
docker-compose logs <service-name>

# Rebuild containers
docker-compose down
docker-compose up --build
```

### Prometheus not scraping metrics
- Verify service health endpoints are accessible
- Check prometheus.yml configuration
- Restart Prometheus: `docker-compose restart prometheus`

### Grafana dashboards are empty
- Verify Prometheus datasource is configured
- Check Prometheus is collecting metrics
- Wait 1-2 minutes for data to accumulate

### High memory usage
- Check data retention settings
- Reduce Prometheus retention: `PROMETHEUS_RETENTION`
- Clear old data volumes

### Cannot access services
- Verify ports are not in use: `netstat -an | grep <port>`
- Check firewall settings
- Verify .env file configuration

## Debug Mode

Enable verbose logging:
```
LOG_LEVEL=debug docker-compose up
```

## Performance Issues

1. Reduce scrape interval in prometheus.yml
2. Limit number of metrics collected
3. Increase resource limits in docker-compose.yml
4. Archive old data to external storage

## Getting Help

- Check documentation in docs/
- Review logs with: `docker-compose logs -f`
- Create GitHub issue with reproducible example
