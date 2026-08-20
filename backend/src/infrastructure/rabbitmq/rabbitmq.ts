import amqp from "amqplib";

export const QUEUE_NAME = "document_versions";

let channel: amqp.Channel;

export async function connectRabbitMQ() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL ||
    "amqp://localhost:5672"
  );

  channel = await connection.createChannel();

  await channel.assertQueue(
    QUEUE_NAME,
    {
      durable: true,
    }
  );

  console.log("✅ RabbitMQ conectado.");
}

export function getChannel(): amqp.Channel {
  return channel;
}