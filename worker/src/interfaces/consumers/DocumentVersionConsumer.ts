import { consumeQueue } from "../../infrastructure/rabbitmq/rabbitmq";
import { SaveDocumentVersionUseCase } from "../../application/use_cases/SaveDocumentVersionUseCase";
import { DocumentVersion } from "../../domain/entities/DocumentVersion";


export class DocumentVersionConsumer {

  constructor(
    private saveUseCase: SaveDocumentVersionUseCase
  ) {}

  async start(): Promise<void> {

    await consumeQueue(
      async (message) => {

        const data = JSON.parse(
          message.content.toString()
        );

        const version = new DocumentVersion(
          data.id,
          data.documentId,
          data.content,
          data.userId,
          data.cursorPosition,
          new Date(data.createdAt)
        );

        await this.saveUseCase.execute(version);
      }
    );
  }
}