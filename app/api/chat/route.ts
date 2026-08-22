import { NextRequest, NextResponse } from "next/server";
import type { Message, ProviderConfig } from "@/app/types";

// 强制使用 Node.js runtime，便于进行流式响应和 HTTP 代理
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  messages: Message[];
  provider: ProviderConfig;
}

function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function buildEndpoint(baseUrl: string, apiFormat: ProviderConfig["apiFormat"]): string {
  const base = trimTrailingSlash(baseUrl);
  // 已包含完整路径则原样使用
  if (/\/chat\/completions$/.test(base) || /\/messages$/.test(base)) return base;
  // 否则按格式拼接
  return apiFormat === "anthropic" ? `${base}/messages` : `${base}/chat/completions`;
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const { messages, provider } = body;

  if (!provider || !provider.apiKey || !provider.apiKey.trim()) {
    return NextResponse.json(
      { error: "Missing API Key. Please configure your AI provider settings first." },
      { status: 400 }
    );
  }
  if (!provider.baseUrl || !provider.baseUrl.trim()) {
    return NextResponse.json(
      { error: "Missing Base URL. Please configure your AI provider settings first." },
      { status: 400 }
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "No messages to send." },
      { status: 400 }
    );
  }

  const endpoint = buildEndpoint(provider.baseUrl, provider.apiFormat);
  const apiFormat = provider.apiFormat || "openai";

  try {
    if (apiFormat === "anthropic") {
      // Anthropic Messages API 格式
      const systemMsg = messages.find((m) => m.role === "system");
      const userMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const anthropicRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": provider.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: 2048,
          system: systemMsg?.content,
          messages: userMessages,
        }),
        signal: req.signal,
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text().catch(() => "");
        return NextResponse.json(
          { error: `Provider returned ${anthropicRes.status}: ${errText.slice(0, 500)}` },
          { status: anthropicRes.status }
        );
      }
      const data = await anthropicRes.json();
      const content = data?.content?.[0]?.text ?? "";
      return NextResponse.json({ content });
    }

    // OpenAI 兼容格式（含 SenseNova / OpenAI / 其它兼容服务）
    const openaiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: false,
      }),
      signal: req.signal,
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Provider returned ${openaiRes.status}: ${errText.slice(0, 500)}` },
        { status: openaiRes.status }
      );
    }

    const data = await openaiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    if (!content) {
      return NextResponse.json(
        { error: "Provider returned an empty response.", raw: data },
        { status: 502 }
      );
    }
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json(
      { error: `Network error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
