const { activeOrdersTotal } = require('../metrics/prometheus');

class OrderQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(order) {
    this.queue.push(order);
    activeOrdersTotal.set(this.queue.length);
  }

  dequeue() {
    const order = this.queue.shift();
    activeOrdersTotal.set(this.queue.length);
    return order;
  }

  size() {
    return this.queue.length;
  }
}

module.exports = new OrderQueue();
