import { TextChange } from "../../domain/entities/TextChange";
import { DocumentMemoryService } from "../../services/DocumentMemoryService";
import { RabbitMQPublisher } from "../../infrastructure/rabbitmq/RabbitMQPublisher";
import { DocumentVersion } from "../../domain/entities/DocumentVersion";

export class UpdateDocumentUseCase {
  constructor(
    private documentService: DocumentMemoryService,
    private publisher: RabbitMQPublisher
  ) {}

  execute(change: TextChange): void {

    // 1. Atualiza o documento atual em memória
    const document = this.documentService.updateDocument(
      change.documentId,
      change.content
    );


    // 2. Cria um snapshot/versionamento
    const version = new DocumentVersion(
      crypto.randomUUID(),
      document.id,
      document.content,
      change.userId,
      change.cursorPosition,
      new Date()
    );


    // 3. Publica a nova versão para o Worker
    this.publisher.publish(version);


    console.log(
      `Documento ${document.id} atualizado por ${change.userId}`
    );
  }
}