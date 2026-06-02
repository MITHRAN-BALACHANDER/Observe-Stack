// Queue management for order processing
class OrderQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(order) {
    this.queue.push(order);
  }

  dequeue() {
    return this.queue.shift();
  }

  size() {
    return this.queue.length;
  }
}

module.exports = new OrderQueue();
