import { Document } from "../entities/Document";

export interface IDocumentRepository {

  getDocument(documentId: string): Document;

  updateDocument(
    documentId: string,
    content: string
  ): Document;

}