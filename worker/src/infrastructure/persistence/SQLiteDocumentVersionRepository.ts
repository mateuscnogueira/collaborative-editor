import sqlite3 from "sqlite3";
import { DocumentVersion } from "../../domain/entities/DocumentVersion";
import { IDocumentVersionRepository } from "../../domain/repositories/IDocumentVersionRepository";

// Implementação concreta do repositório de versões de documentos.

// O restante da aplicação depende apenas da interface IDocumentVersionRepository
export class SQLiteDocumentVersionRepository implements IDocumentVersionRepository {
  constructor(
    private database: sqlite3.Database
  ) {}

  // Persiste uma nova versão do documento no banco de dados.
  async save(
    version: DocumentVersion
  ): Promise<void> {

    // O sqlite3 utiliza callbacks.
    // A Promise permite trabalhar com async/await nas camadas superiores.
    return new Promise((resolve, reject) => {

      this.database.run(

        // Comando SQL responsável por inserir uma nova versão.
        // Cada alteração realizada no documento gera um novo registro.
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
          // Dados extraídos da entidade de domínio.
          version.id,
          version.documentId,
          version.content,
          version.userId,
          version.cursorPosition,
          version.createdAt.toISOString()
        ],

        (error) => {
          // Caso ocorra algum erro durante a persistência, a Promise é rejeitada e o erro é propagado.
          if (error) {
            reject(error);
            return;
          }

          // Caso a inserção seja concluída com sucesso, libera a execução do fluxo assíncrono.
          resolve();
        }
      );
    });
  }
}