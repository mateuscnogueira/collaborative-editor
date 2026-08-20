export class Document {
  constructor(
    public id: string,
    public title: string,
    public content: string,
    public updatedAt: Date = new Date()
  ) {}

  updateContent(newContent: string): void {
    this.content = newContent;
    this.updatedAt = new Date();
  }
}