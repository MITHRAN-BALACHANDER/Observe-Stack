# Distributed Microservices Observability Platform

A comprehensive observability platform for monitoring and tracing distributed microservices with Prometheus, Grafana, Loki, and custom metrics.

## Features

- **Multi-service Architecture**: Gateway, Auth, Order, and Notification services
- **Advanced Monitoring**: Prometheus metrics, custom business metrics, latency tracking
- **Centralized Logging**: Loki-based log aggregation with request tracing
- **Visualization**: Pre-built Grafana dashboards for infrastructure, application, and business metrics
- **Alerting**: AlertManager integration with predefined alert rules
- **Load Testing**: k6 load testing scenarios
- **Incident Labs**: Simulation scenarios for various failure modes

## Quick Start

```bash
docker-compose up -d
```

## Services

- **Gateway**: API Gateway on port 3000
- **Auth Service**: Authentication on port 3001
- **Order Service**: Order management on port 3002
- **Notification Service**: Email/SMS notifications on port 3003

## Monitoring Stack

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000
- **AlertManager**: http://localhost:9093
- **Loki**: http://localhost:3100

## Documentation

See [docs/](docs/) directory for detailed documentation.

## License

See LICENSE file.
