import { getChannel, QUEUE_NAME } from "./rabbitmq";

// Classe responsável por publicar mensagens no RabbitMQ
export class RabbitMQPublisher {
  // Publica uma mensagem em uma fila RabbitMQ.
  publish(message: unknown): void {

    // Recupera o canal de comunicação já conectado ao RabbitMQ.
    const channel = getChannel();

    // Envia a mensagem para a fila configurada.
    channel.sendToQueue(
      QUEUE_NAME,

      // O RabbitMQ trabalha com mensagens em formato Buffer. Por isso o objeto recebido é convertido para JSON e depois para Buffer.
      Buffer.from(JSON.stringify(message)),
      {
        // Garante que a mensagem seja persistida pelo broker. Caso o RabbitMQ reinicie, a mensagem não deve ser perdida.
        persistent: true,
      }
    );
    console.log("📨 Snapshot enviado para RabbitMQ.");
  }
}