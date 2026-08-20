export interface TextChangeDTO {
  type: "text-change";

  documentId: string;

  userId: string;

  content: string;

  cursorPosition: number;

  timestamp: string;
}