# Project Configuration

## Environment Setup

Copy .env.example to .env and configure:

```bash
cp .env.example .env
```

## Getting Started

1. Install Node.js 18+
2. Start the stack: `docker-compose up -d`
3. Access services:
   - Grafana: http://localhost:3000
   - Prometheus: http://localhost:9090
   - AlertManager: http://localhost:9093
   - Loki: http://localhost:3100

## Development

Each service has a dev script:

```bash
cd gateway && npm run dev
```


## License

MIT
