import { client as apiClient } from "../client";

export interface PortalMessage {
  id: number;
  engagement: number;
  client_profile: number;
  sender: number;
  sender_email: string;
  sender_name: string;
  is_own: boolean;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const fetchClientMessages = () =>
  apiClient.get<PortalMessage[]>("/portal/client/messages/").then(r => r.data);

export const sendClientMessage = (body: string) =>
  apiClient.post<PortalMessage>("/portal/client/messages/", { body }).then(r => r.data);

export const fetchEngagementMessages = (engagementId: number) =>
  apiClient.get<PortalMessage[]>(`/portal/engagements/${engagementId}/messages/`).then(r => r.data);

export const sendEngagementMessage = (engagementId: number, body: string) =>
  apiClient.post<PortalMessage>(`/portal/engagements/${engagementId}/messages/`, { body }).then(r => r.data);
