import { client } from "./client";

export interface AppNotification {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  action_url: string;
  created_at: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const r = await client.get<AppNotification[]>("/users/inapp-notifications/");
  return r.data;
}

export async function getUnreadCount(): Promise<number> {
  const r = await client.get<{ count: number }>("/users/inapp-notifications/unread-count/");
  return r.data.count;
}

export async function markRead(id: number): Promise<void> {
  await client.patch(`/users/inapp-notifications/${id}/read/`);
}

export async function markAllRead(): Promise<void> {
  await client.post("/users/inapp-notifications/read-all/");
}

export async function clearNotification(id: number): Promise<void> {
  await client.delete(`/users/inapp-notifications/${id}/`);
}
