export interface DocumentStateDTO {
  type: "document-state";
  documentId: string;
  content: string;
  timestamp: string;
}