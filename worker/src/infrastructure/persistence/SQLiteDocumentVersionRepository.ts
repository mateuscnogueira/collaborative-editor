import sqlite3 from "sqlite3";
import { DocumentVersion } from "../../domain/entities/DocumentVersion";
import { IDocumentVersionRepository } from "../../domain/repositories/IDocumentVersionRepository";

export class SQLiteDocumentVersionRepository implements IDocumentVersionRepository {

  constructor(
    private database: sqlite3.Database
  ) {}

  async save(
    version: DocumentVersion
  ): Promise<void> {

    return new Promise((resolve, reject) => {

      this.database.run(

        `
        INSERT INTO document_versions
        (
          id,
          document_id,
          content,
          user_id,
          cursor_position,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,

        [
          version.id,
          version.documentId,
          version.content,
          version.userId,
          version.cursorPosition,
          version.createdAt.toISOString()
        ],

        (error) => {

          if (error) {
            reject(error);
            return;
          }

          resolve();
        }
      );
    });
  }
}