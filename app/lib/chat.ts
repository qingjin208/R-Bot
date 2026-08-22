"use client";

import { Message, ProviderConfig } from "@/app/types";

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
  const text = firstUser.content.trim();
  return text.length > 24 ? `${text.slice(0, 24)}…` : text || "New Chat";
}

export interface ChatError {
  code: "missing_key" | "network" | "api" | "empty";
  message: string;
}

/**
 * 调用 /api/chat 代理端点发送消息历史，收到 AI 回复文本。
 * - 未配置 API Key：返回占位提示（不抛错）
 * - 网络/服务错误：在 message 中携带错误描述（不抛错）
 */
export async function sendChatMessage(
  messages: Message[],
  provider: ProviderConfig | null,
  signal?: AbortSignal
): Promise<{ content: string; error?: ChatError }> {
  if (!provider || !provider.apiKey || !provider.apiKey.trim()) {
    return {
      content:
        "请先在「设置」中配置 AI 服务的 API Key、Base URL 与模型，然后再次提问。配置完成后，我会通过真实的 AI Provider 为您回答。",
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

    let data: { content?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      // 非 JSON 错误体
    }

    if (!res.ok) {
      const detail = data?.error || `HTTP ${res.status}`;
      return {
        content: `请求 AI 服务失败：${detail}`,
        error: { code: "api", message: detail },
      };
    }

    const content = (data.content || "").trim();
    if (!content) {
      return {
        content: "AI 服务返回了空内容，请稍后重试或更换模型。",
        error: { code: "empty", message: "Empty response" },
      };
    }

    return { content };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      content: `网络错误：${detail}`,
      error: { code: "network", message: detail },
    };
  }
}
