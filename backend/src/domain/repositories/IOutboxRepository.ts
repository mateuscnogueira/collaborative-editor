export interface IOutboxRepository {
  saveMessage(messageId: string, payload: string): Promise<void>;
  
  getPendingMessages(): Promise<{ id: string; payload: string }[]>;
  markAsProcessed(messageId: string): Promise<void>;
}