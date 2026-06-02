# Architecture Overview

## System Design

The Distributed Microservices Observability Platform uses a modular architecture with:

### Components

1. **API Gateway**: Entry point for all requests
2. **Auth Service**: User authentication and authorization
3. **Order Service**: Order processing and management
4. **Notification Service**: Email and SMS notifications

### Observability Layer

- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Loki**: Centralized logging
- **AlertManager**: Alert routing and management

## Data Flow

1. Requests enter through the API Gateway
2. Gateway routes requests to appropriate services
3. Each service emits metrics and logs
4. Prometheus scrapes metrics at configurable intervals
5. Logs are collected by Promtail and shipped to Loki
6. Grafana visualizes metrics from both sources
7. AlertManager triggers alerts based on configured rules

## Service Communication

- Services use REST APIs for synchronous communication
- Order Service uses Redis/RabbitMQ for async task queuing
- Request correlation IDs propagate across services

## High Availability

- Services are containerized and can be scaled horizontally
- Prometheus has built-in redundancy support
- Grafana datasources can failover
- AlertManager supports clustering
