export interface SystemEventDTO {

  type:
    | "system"
    | "user-connected"
    | "user-disconnected";

  message: string;

  userId?: string;

  onlineUsers?: number;

  timestamp: string;

}