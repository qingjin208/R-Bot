"use client";

import { Message, ProviderConfig, AnalysisContent } from "@/app/types";

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMessage(role: Message["role"], content: string): Message {
  return {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  };
}

export function createChatSessionTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Chat";
  const text =
    typeof firstUser.content === "string"
      ? firstUser.content.trim()
      : "New Chat";
  return text.length > 24 ? `${text.slice(0, 24)}…` : text || "New Chat";
}

export interface ChatError {
  code: "missing_key" | "network" | "api" | "empty";
  message: string;
}

/**
 * Calls the /api/chat proxy endpoint with the message history and receives the AI reply text.
 * - No API Key configured: returns a placeholder hint (does not throw)
 * - Network/service error: carries the error description in the message (does not throw)
 */
export async function sendChatMessage(
  messages: Message[],
  provider: ProviderConfig | null,
  signal?: AbortSignal
): Promise<{ content: string | AnalysisContent; error?: ChatError }> {
  if (!provider || !provider.apiKey || !provider.apiKey.trim()) {
    return {
      content:
        "Please configure the AI provider's API Key, Base URL, and model in Settings first, then ask again. Once configured, I will answer you through the real AI provider.",
      error: { code: "missing_key", message: "API Key is not configured" },
    };
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, provider }),
      signal,
    });

    let data: { content?: string | AnalysisContent; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      // Non-JSON error body
    }

    if (!res.ok) {
      const detail = data?.error || `HTTP ${res.status}`;
      return {
        content: `Failed to call the AI service: ${detail}`,
        error: { code: "api", message: detail },
      };
    }

    const raw = data.content;
    let content: string | AnalysisContent = "";
    if (typeof raw === "string") {
      content = raw.trim();
    } else if (raw && typeof raw === "object" && "analysis" in raw) {
      content = { ...raw, analysis: raw.analysis.trim() };
    }
    if (!content) {
      return {
        content: "The AI service returned empty content. Please retry later or switch the model.",
        error: { code: "empty", message: "Empty response" },
      };
    }

    return { content };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      content: `Network error: ${detail}`,
      error: { code: "network", message: detail },
    };
  }
}
