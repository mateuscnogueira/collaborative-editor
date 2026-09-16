import sqlite3 from "sqlite3";
import path from "path";

sqlite3.verbose();

// Cria um arquivo .sqlite específico para o backend, separado do worker
const databasePath = path.resolve(
  __dirname,
  "../../../backend-database.sqlite"
);

export const database = new sqlite3.Database(
  databasePath,
  (error) => {
    if (error) {
      console.error("Erro ao conectar ao SQLite no Backend:", error);
      return;
    }

    console.log("✅ SQLite (Outbox) conectado no Backend.");
    createTables();
  }
);

function createTables(): void {
  // A tabela outbox guarda o payload (a mensagem que iria para o RabbitMQ) e o status dela
  database.run(
    `
    CREATE TABLE IF NOT EXISTS outbox_messages (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL
    )
    `,
    (error) => {
      if (error) {
        console.error("Erro ao criar tabela outbox_messages:", error);
        return;
      }
      console.log("✅ Tabela outbox_messages pronta.");
    }
  );
}