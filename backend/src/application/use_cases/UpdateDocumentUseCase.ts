import { randomUUID } from "crypto";
import { TextChange } from "../../domain/entities/TextChange";
import { DocumentVersion } from "../../domain/entities/DocumentVersion";
import { IDocumentRepository } from "../../domain/repositories/IDocumentRepository";
import { IOutboxRepository } from "../../domain/repositories/IOutboxRepository";

export class UpdateDocumentUseCase {
  constructor(
    private documentRepository: IDocumentRepository,
    private outboxRepository: IOutboxRepository // Substituímos o RabbitMQ pelo Outbox
  ) {}

  async execute(change: TextChange): Promise<void> {
    // 1. Atualiza o cache no Redis
    const document = await this.documentRepository.updateDocument(
      change.documentId,
      change.content
    );

    // 2. Cria o snapshot da nova versão
    const versionId = randomUUID();
    const version = new DocumentVersion(
      versionId,
      document.id,
      document.content,
      change.userId,
      change.cursorPosition,
      new Date()
    );

    // 3. Salva no banco de dados local (Outbox) como PENDING
    // Ao invés de arriscar enviar pela rede agora, garantimos a persistência local
    const payload = JSON.stringify(version);
    await this.outboxRepository.saveMessage(versionId, payload);

    console.log(
      `📦 Mensagem de atualização salva no Outbox (Doc: ${document.id}, User: ${change.userId})`
    );
  }
}