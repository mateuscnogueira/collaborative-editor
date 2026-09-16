import { randomUUID } from "crypto";
import { TextChange } from "../../domain/entities/TextChange";
import { DocumentVersion } from "../../domain/entities/DocumentVersion";
import { IDocumentRepository } from "../../domain/repositories/IDocumentRepository";
import { RabbitMQPublisher } from "../../infrastructure/rabbitmq/RabbitMQPublisher";

export class UpdateDocumentUseCase {

  constructor(
    private documentRepository: IDocumentRepository,
    private publisher: RabbitMQPublisher
  ) {}

  // Tornamos o método assíncrono
  async execute(change: TextChange): Promise<void> {

    // Adicionamos o 'await' para esperar o Redis responder
    const document = await this.documentRepository.updateDocument(
      change.documentId,
      change.content
    );

    // Cria um snapshot da nova versão
    const version = new DocumentVersion(
      randomUUID(),
      document.id,
      document.content,
      change.userId,
      change.cursorPosition,
      new Date()
    );

    // Publica para o RabbitMQ
    this.publisher.publish(version);

    console.log(
      `📄 Documento ${document.id} atualizado por ${change.userId}`
    );
  }
}