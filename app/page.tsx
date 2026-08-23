"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Sidebar } from "@/app/components/Sidebar";
import { Header } from "@/app/components/Header";
import { MessageInput } from "@/app/components/MessageInput";
import { MessageList } from "@/app/components/MessageList";
import { useI18n } from "@/app/contexts/I18nContext";
import { Conversation, Message, AnalysisContent } from "@/app/types";
import { loadProvider } from "@/app/lib/settings";
import { sendChatMessage } from "@/app/lib/chat";
import { MarkdownBody } from "@/app/components/MarkdownBody";

const initialConversations: Conversation[] = [
  { id: "today-1", titleKey: "conv1", active: true, group: "today" },
  { id: "today-2", titleKey: "conv2", group: "today" },
  { id: "today-3", titleKey: "conv3", group: "today" },
  { id: "week-1", titleKey: "conv4", group: "week" },
  { id: "week-2", titleKey: "conv5", group: "week" },
];

const conversationData: Record<string, { userQuery: string; aiReply: string }> = {
  "today-1": { userQuery: "conv1UserQuery", aiReply: "conv1AiReply" },
  "today-2": { userQuery: "conv2UserQuery", aiReply: "conv2AiReply" },
  "today-3": { userQuery: "conv3UserQuery", aiReply: "conv3AiReply" },
  "week-1": { userQuery: "conv4UserQuery", aiReply: "conv4AiReply" },
  "week-2": { userQuery: "conv5UserQuery", aiReply: "conv5AiReply" },
};

// 与 Provider 通信时携带的 system 角色提示，让模型扮演 R-bot 数据分析助手
const SYSTEM_PROMPT =
  "你是 R-bot，一个专注业务数据分析的 AI 助手。请用简洁、结构化的中文回答，必要时分点列出关键结论。不要输出任何代码（如 Python、JavaScript、SQL 等），用户只关心数据和结论。";

export default function Home() {
  const { t } = useI18n();
  const [activeConvId, setActiveConvId] = useState("today-1");
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const conversationsWithActive = useMemo(
    () => conversations.map((c) => ({ ...c, active: c.id === activeConvId })),
    [conversations, activeConvId]
  );

  const activeTitleKey = conversations.find((c) => c.id === activeConvId)?.titleKey || "conv1";

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConvId(id);
    setMessages([]);
    setIsTyping(false);
  }, []);

  const handleNewChat = useCallback(() => {
    const newId = `today-${Date.now()}`;
    const newConv: Conversation = { id: newId, titleKey: "newConversation", active: true, group: "today" };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setMessages([]);
    setIsTyping(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      // 保存本次请求对应的"上一份消息列表"，便于请求体按历史顺序构造
      const previousMessages = messages;

      // 立即把用户消息推入 UI
      const nextAllMessages: Message[] = [...previousMessages, userMsg];
      setMessages(nextAllMessages);
      setIsTyping(true);

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      // 创建新的 AbortController 用于本次请求
      const ac = new AbortController();
      abortControllerRef.current = ac;

      try {
        const provider = loadProvider();
        const payload: Message[] = [
          { id: "system", role: "system", content: SYSTEM_PROMPT, timestamp: 0 },
          ...nextAllMessages,
        ];

        const { content } = await sendChatMessage(payload, provider, ac.signal);
        const aiMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        // 用户主动取消时不显示错误
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const detail = err instanceof Error ? err.message : String(err);
        const aiMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: `请求出错：${detail}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } finally {
        setIsTyping(false);
        typingTimerRef.current = null;
        abortControllerRef.current = null;
      }
    },
    [messages]
  );

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTyping(false);
    }
  }, []);

  return (
    <div className="flex h-screen p-3 md:p-5 gap-3 md:gap-5 relative">
      {/* Sidebar */}
      <Sidebar
        conversations={conversationsWithActive}
        activeId={activeConvId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 glass rounded-[24px] shadow-[0_8px_32px_rgba(51,65,85,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Header */}
        <Header titleKey={activeTitleKey as never} statusKey="online" onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Message Flow */}
        <div className="flex-1 overflow-y-auto scroll-thin px-4 md:px-7 py-4">
          <div className="max-w-[720px] mx-auto w-full space-y-5">
            {/* 初始示例对话（仅已有数据的对话显示） */}
            {conversationData[activeConvId] && messages.length === 0 && !isTyping && (
              <>
                <UserStaticMessage text={t(conversationData[activeConvId].userQuery as never)} delay=".05s" />
                <AIMessageStatic text={t(conversationData[activeConvId].aiReply as never)} delay=".15s" />
              </>
            )}

            {/* 动态消息列表 */}
            <MessageList messages={messages} isTyping={isTyping} />
          </div>
        </div>

        {/* Input Area */}
        <MessageInput onSend={sendMessage} isStreaming={isTyping} onStop={handleStop} />
      </main>
    </div>
  );
}

function UserStaticMessage({ text, delay }: { text: string; delay?: string }) {
  return (
    <div className="msg-in flex justify-end" style={{ animationDelay: delay }}>
      <div
        className="rounded-2xl rounded-br-md px-4 py-3 max-w-[80%] shadow-[0_4px_16px_rgba(56,189,248,0.12)]"
        style={{ background: "linear-gradient(135deg,#38BDF8,#7DD3FC)" }}
      >
        <p className="text-[13px] leading-relaxed text-white">{text}</p>
      </div>
    </div>
  );
}

function AIMessageStatic({ text, delay }: { text: string; delay?: string }) {
  return (
    <div className="msg-in flex gap-3 items-start" style={{ animationDelay: delay }}>
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg,#38BDF8,#7DD3FC)",
          boxShadow: "0 4px 12px rgba(56,189,248,0.2)",
        }}
      >
        <span className="font-display font-bold text-xs text-white">M</span>
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="glass-strong rounded-2xl rounded-tl-md p-4 shadow-[0_4px_20px_rgba(51,65,85,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <MarkdownBody text={text} />
        </div>
      </div>
    </div>
  );
}
