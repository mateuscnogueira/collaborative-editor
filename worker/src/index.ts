import { connectRabbitMQ } from "./infrastructure/rabbitmq/rabbitmq";
import { database } from "./infrastructure/persistence/database";
import { SQLiteDocumentVersionRepository } from "./infrastructure/persistence/SQLiteDocumentVersionRepository";
import { SaveDocumentVersionUseCase } from "./application/use_cases/SaveDocumentVersionUseCase";
import { DocumentVersionConsumer } from "./interfaces/consumers/DocumentVersionConsumer";

async function startWorker(): Promise<void> {
  try {

    // Conecta ao RabbitMQ
    await connectRabbitMQ();

    // Instancia Repository
    const repository = new SQLiteDocumentVersionRepository(database);

    // Instancia Use Case
    const saveUseCase = new SaveDocumentVersionUseCase(repository);

    // Instancia Consumer
    const consumer = new DocumentVersionConsumer(saveUseCase);

    // Inicia o consumo da fila
    await consumer.start();

    console.log("🚀 Worker iniciado com sucesso.");

  } catch (error) {

    console.error("Erro ao iniciar Worker:", error);

    process.exit(1);

  }
}

startWorker();