import { getChannel, QUEUE_NAME } from "./rabbitmq";

export class RabbitMQPublisher {
  publish(message: unknown): void {
    const channel = getChannel();

    channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
      }
    );

    console.log("📨 Snapshot enviado para RabbitMQ.");
  }
}