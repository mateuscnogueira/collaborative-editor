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

  execute(change: TextChange): void {

    // Atualiza o documento em memória
    const document = this.documentRepository.updateDocument(
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