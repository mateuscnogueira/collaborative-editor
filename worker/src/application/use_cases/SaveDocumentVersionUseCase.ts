import { DocumentVersion } from "../../domain/entities/DocumentVersion";
import { IDocumentVersionRepository } from "../../domain/repositories/IDocumentVersionRepository";

export class SaveDocumentVersionUseCase {

  constructor(
    private repository: IDocumentVersionRepository
  ) {}

  async execute(
    version: DocumentVersion
  ): Promise<void> {

    await this.repository.save(version);

    console.log(
      `💾 Versão salva: documento ${version.documentId}`
    );
  }
}