import amqp from "amqplib";
import { messageEmitter } from "../utils/messageEmitter";

export default defineNitroPlugin(async (_nitroApp) => {
  try {
    const connection = await amqp.connect(
      "amqp://guest:guest@localhost:5672/everlasting",
    );
    const channel = await connection.createChannel();
    const queue = "everlasting_queue";

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);

    console.log(`[*] Waiting for messages in ${queue}`);

    channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());

        console.log(`📥 Message received from [everlasting] =>`, content);

        // Unwrap nested Payload if present (e.g. { TaskName, Payload: {...} })
        const messageData = content?.Payload ?? content;

        // Broadcast the flat message to all connected SSE clients
        messageEmitter.emit("new-message", messageData);

        channel.ack(msg); // acknowledge message
      }
    });
  } catch (error) {
    console.error("AMQP Error:", error);
  }
});
