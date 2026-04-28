import { messageEmitter } from "../../utils/messageEmitter";

// Server-Sent Events endpoint.
// Every AMQP message emitted by the consumer is forwarded to all
// connected browser clients as an SSE event named "new-message".
export default defineEventHandler((event) => {
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable Nginx buffering if behind a proxy
  };

  setResponseHeaders(event, headers);

  // Keep the response stream open
  const stream = new ReadableStream({
    start(controller) {
      // Send an initial ping so the client knows it's connected
      controller.enqueue(`event: connected\ndata: {}\n\n`);

      const onMessage = (data: unknown) => {
        try {
          controller.enqueue(
            `event: new-message\ndata: ${JSON.stringify(data)}\n\n`,
          );
        } catch {
          // Client disconnected; cleanup is handled below
        }
      };

      messageEmitter.on("new-message", onMessage);

      // Cleanup when the client closes the connection
      event.node.req.on("close", () => {
        messageEmitter.off("new-message", onMessage);
        controller.close();
      });
    },
  });

  return sendStream(event, stream);
});
