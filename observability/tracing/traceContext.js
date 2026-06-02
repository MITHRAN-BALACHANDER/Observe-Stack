// Trace context management for distributed tracing
class TraceContext {
  constructor() {
    this.traces = new Map();
  }

  startTrace(traceId, spanId, parentSpanId = null) {
    if (!this.traces.has(traceId)) {
      this.traces.set(traceId, {
        spans: [],
        startTime: Date.now()
      });
    }

    const span = {
      traceId,
      spanId,
      parentSpanId,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      tags: {},
      logs: []
    };

    this.traces.get(traceId).spans.push(span);
    return span;
  }

  endSpan(traceId, spanId) {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    const span = trace.spans.find(s => s.spanId === spanId);
    if (span) {
      span.endTime = Date.now();
      span.duration = span.endTime - span.startTime;
    }

    return span;
  }

  getTrace(traceId) {
    return this.traces.get(traceId);
  }
}

module.exports = new TraceContext();
