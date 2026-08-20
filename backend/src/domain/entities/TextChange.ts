export class TextChange {
  constructor(
    public documentId: string,
    public userId: string,
    public content: string,
    public cursorPosition: number,
    public timestamp: Date = new Date()
  ) {}
}