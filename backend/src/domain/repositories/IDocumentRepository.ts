import { Document } from "../entities/Document";

export interface IDocumentRepository {

  getDocument(documentId: string): Promise<Document>;

  updateDocument(documentId: string, content: string): Promise<Document>;
}