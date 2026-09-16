import { IOutboxRepository } from "../../domain/repositories/IOutboxRepository";
import { database } from "./database";

export class SQLiteOutboxRepository implements IOutboxRepository {
  async saveMessage(messageId: string, payload: string): Promise<void> {
    return new Promise((resolve, reject) => {
      database.run(
        `INSERT INTO outbox_messages (id, payload, created_at) VALUES (?, ?, ?)`,
        [messageId, payload, new Date().toISOString()],
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  }

  async getPendingMessages(): Promise<{ id: string; payload: string }[]> {
    return new Promise((resolve, reject) => {
      // Pega até 50 mensagens pendentes por vez, ordenadas da mais antiga para a mais nova
      database.all(
        `SELECT id, payload FROM outbox_messages WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 50`,
        (error, rows: any[]) => {
          if (error) reject(error);
          else resolve(rows);
        }
      );
    });
  }

  async markAsProcessed(messageId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Atualiza o status para PROCESSED para não enviar em duplicidade
      database.run(
        `UPDATE outbox_messages SET status = 'PROCESSED' WHERE id = ?`,
        [messageId],
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  }
}