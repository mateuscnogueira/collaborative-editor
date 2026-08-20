import { Document } from "../domain/entities/Document";
import { IDocumentRepository } from "../domain/repositories/IDocumentRepository";

export class DocumentMemoryService implements IDocumentRepository {
  private documents: Map<string, Document> = new Map();

  /* Retorna um documento existente.
  Caso não exista, cria automaticamente. */
  getDocument(documentId: string): Document {
    let document = this.documents.get(documentId);

    if (!document) {
      document = new Document(
        documentId,
        "Documento sem título",
        ""
      );

      this.documents.set(documentId, document);
    }

    return document;
  }

  // Atualiza o conteúdo do documento.
  updateDocument(documentId: string, content: string): Document {
    const document = this.getDocument(documentId);

    document.updateContent(content);

    return document;
  }

  // Lista todos os documentos em memória.
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  // Retorna o estado atual do documento (seu conteúdo)
  getCurrentDocument(documentId: string): Document {
    return this.getDocument(documentId);
  }
}