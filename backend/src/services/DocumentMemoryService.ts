import { Document } from "../domain/entities/Document";
import { IDocumentRepository } from "../domain/repositories/IDocumentRepository";
import redisClient from "../infrastructure/redis/redisClient";

export class DocumentMemoryService implements IDocumentRepository {
  private static PREFIX = 'doc:';

  async getDocument(documentId: string): Promise<Document> {
    try {
      const data = await redisClient.get(`${DocumentMemoryService.PREFIX}${documentId}`);

      if (data) {
        const parsed = JSON.parse(data);
        return new Document(parsed.id, parsed.title, parsed.content);
      }

      return new Document(documentId, "Documento sem título", "");
      
    } catch (error) {
      console.error("Erro ao ler do Redis:", error);
      return new Document(documentId, "Erro no Servidor", "");
    }
  }

  async updateDocument(documentId: string, content: string): Promise<Document> {
    const document = await this.getDocument(documentId);
    document.updateContent(content);

    await redisClient.setEx(
      `${DocumentMemoryService.PREFIX}${documentId}`,
      86400,
      JSON.stringify({
        id: document.id,
        title: document.title,
        content: document.content
      })
    );

    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    try {
      const keys = await redisClient.keys(`${DocumentMemoryService.PREFIX}*`);
      const documents: Document[] = [];

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          documents.push(new Document(parsed.id, parsed.title, parsed.content));
        }
      }
      return documents;
    } catch (error) {
      console.error("Erro ao listar documentos do Redis:", error);
      return [];
    }
  }

  async getCurrentDocument(documentId: string): Promise<Document> {
    return this.getDocument(documentId);
  }
}