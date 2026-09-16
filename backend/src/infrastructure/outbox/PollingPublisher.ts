import { IOutboxRepository } from "../../domain/repositories/IOutboxRepository";
import { RabbitMQPublisher } from "../rabbitmq/RabbitMQPublisher";

export class PollingPublisher {
  private isPolling = false;

  constructor(
    private outboxRepository: IOutboxRepository,
    private publisher: RabbitMQPublisher
  ) {}

  // Inicia um loop que roda a cada 2 segundos (2000 milissegundos)
  start(intervalMs: number = 2000): void {
    setInterval(async () => {
      if (this.isPolling) return; // Evita sobreposição se o banco demorar a responder
      this.isPolling = true;

      try {
        const messages = await this.outboxRepository.getPendingMessages();
        
        for (const msg of messages) {
          const version = JSON.parse(msg.payload);
          
          // Envia para o RabbitMQ
          this.publisher.publish(version);
          
          // Se enviou com sucesso, marca como processado
          await this.outboxRepository.markAsProcessed(msg.id);
          console.log(`📮 Outbox: Mensagem enviada ao RabbitMQ (ID: ${msg.id})`);
        }
      } catch (error) {
        console.error("Erro no Polling Publisher:", error);
      } finally {
        this.isPolling = false;
      }
    }, intervalMs);
  }
}