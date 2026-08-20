import { DocumentVersion } from "../entities/DocumentVersion";

export interface IDocumentVersionRepository {
  save(version: DocumentVersion): Promise<void>;
}