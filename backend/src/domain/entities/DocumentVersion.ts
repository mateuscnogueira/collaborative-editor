export class DocumentVersion {
  constructor(
    public id: string,
    public documentId: string,
    public content: string,
    public createdAt: Date = new Date()
  ) {}
}