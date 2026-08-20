import amqp from "amqplib";

let connection: amqp.ChannelModel;

export async function connectRabbitMQ() {

    connection = await amqp.connect(
        process.env.RABBITMQ_URL || "amqp://localhost:5672"
    );

    console.log("✅ RabbitMQ conectado.");

}

export function getRabbitMQConnection() {

    return connection;

}