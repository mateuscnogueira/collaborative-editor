export class DocumentVersion {
  constructor(
    public id: string,
    public documentId: string,
    public content: string,
    public userId: string,
    public cursorPosition: number,
    public createdAt: Date = new Date()
  ) {}
}