export interface SystemEventDTO {
  type: "user-connected" | "user-disconnected";

  userId: string;

  onlineUsers: number;

  timestamp: string;
}