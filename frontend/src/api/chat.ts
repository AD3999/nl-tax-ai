import { client } from "./client";

export interface AskPayload {
  question: string;
  conversation_id?: number | null;
  language?: "nl" | "en" | "fa";
}

export interface AskResponse {
  task_id: string;
  conversation_id: number;
}

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  retrieved_sources: string[];
  created_at: string;
}

export interface Conversation {
  id: number;
  language: string;
  tax_year: number;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export const ask = async (payload: AskPayload): Promise<AskResponse> => {
  const { data } = await client.post<AskResponse>("/chat/ask/", payload);
  return data;
};

export const getConversation = async (id: number): Promise<Conversation> => {
  const { data } = await client.get<Conversation>(`/chat/conversations/${id}/`);
  return data;
};

export const listConversations = async (): Promise<Conversation[]> => {
  const { data } = await client.get<Conversation[]>("/chat/conversations/");
  return data;
};
