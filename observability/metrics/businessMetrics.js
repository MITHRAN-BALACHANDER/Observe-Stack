const client = require('prom-client');

// Business-related metrics
const businessMetrics = {
  transactionCount: new client.Counter({
    name: 'transactions_total',
    help: 'Total transactions',
    labelNames: ['type', 'status']
  }),

  transactionAmount: new client.Gauge({
    name: 'transaction_amount_total',
    help: 'Total transaction amount',
    labelNames: ['type']
  }),

  customerSatisfaction: new client.Gauge({
    name: 'customer_satisfaction_score',
    help: 'Customer satisfaction score',
    labelNames: ['service']
  })
};

module.exports = businessMetrics;
