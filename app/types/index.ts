export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiFormat: "openai" | "anthropic";
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface Conversation {
  id: string;
  titleKey: string;
  active?: boolean;
  group: "today" | "week";
}
