import { EventEmitter } from "node:events";

// Singleton emitter shared across all Nitro server modules.
// The AMQP consumer emits here; the SSE route listens here.
const messageEmitter = new EventEmitter();
messageEmitter.setMaxListeners(100); // support many concurrent SSE clients

export { messageEmitter };
