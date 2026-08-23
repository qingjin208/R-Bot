import { NextRequest, NextResponse } from "next/server";
import type { Message, ProviderConfig } from "@/app/types";
import { analyzeWithCube } from "@/app/lib/ai-analyze";

// 强制使用 Node.js runtime，便于进行流式响应和 HTTP 代理
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  messages: Message[];
  provider: ProviderConfig;
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

  // ── Always run through analyzeWithCube: LLM decides whether to use Cube.js tool ──
  try {
    const content = await analyzeWithCube(messages, provider, req.signal);
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json(
      { error: `请求失败: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
