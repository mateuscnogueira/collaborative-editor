import { consumeQueue } from "../../infrastructure/rabbitmq/rabbitmq";

import { SaveDocumentVersionUseCase } from "../../application/use_cases/SaveDocumentVersionUseCase";

import { DocumentVersion } from "../../domain/entities/DocumentVersion";


// Consumer responsável por escutar mensagens enviadas pelo RabbitMQ.
// Ele pertence ao Worker e tem como responsabilidade receber eventos, transformar os dados recebidos e encaminhar para a regra de negócio.
export class DocumentVersionConsumer {

  constructor(
    private saveUseCase: SaveDocumentVersionUseCase

  ) {}

  // Inicializa o consumo da fila RabbitMQ.
  // O Worker permanece aguardando novas mensagens de versionamento.
  async start(): Promise<void> {

    await consumeQueue(

      // Callback executado sempre que uma nova mensagem chega na fila.
      async (message) => {
        const data = JSON.parse(
          message.content.toString()
        );

        // Converte o objeto recebido em uma entidade de domínio.
        // Dessa forma, as camadas internas trabalham com objetos do sistema e não diretamente com dados vindos da infraestrutura.
        const version = new DocumentVersion(
          data.id,
          data.documentId,
          data.content,
          data.userId,
          data.cursorPosition,
          new Date(data.createdAt)
        );

        // Encaminha a entidade para o caso de uso responsável pela persistência no banco SQLite.
        await this.saveUseCase.execute(version);
      }
    );
  }
}