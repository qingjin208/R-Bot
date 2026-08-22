"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/app/types";
import { MarkdownBody } from "./MarkdownBody";

interface UserMessageProps {
  text: string;
  delay?: string;
}

function UserMessage({ text, delay }: UserMessageProps) {
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

interface AIMessageProps {
  text?: string;
  delay?: string;
}

function AIMessage({ text, delay }: AIMessageProps) {
  return (
    <div className="msg-in flex gap-3 items-start" style={{ animationDelay: delay }}>
      {/* AI Avatar */}
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg,#38BDF8,#7DD3FC)",
          boxShadow: "0 4px 12px rgba(56,189,248,0.2)",
        }}
      >
        <span className="font-display font-bold text-xs text-white">M</span>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="glass-strong rounded-2xl rounded-tl-md p-4 shadow-[0_4px_20px_rgba(51,65,85,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          {/* Markdown 渲染 */}
          {text && <MarkdownBody text={text} />}
        </div>
      </div>
    </div>
  );
}

interface TypingIndicatorProps {
  delay?: string;
}

function TypingIndicator({ delay }: TypingIndicatorProps) {
  return (
    <div className="msg-in flex gap-3 items-end" style={{ animationDelay: delay }}>
      <div
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#38BDF8,#7DD3FC)" }}
      >
        <span className="font-display font-bold text-xs text-white">M</span>
      </div>
      <div className="glass-strong rounded-2xl rounded-tl-md px-4 py-3.5 flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#38BDF8]/50 animate-bounce" style={{ animationDelay: "0s" }}></span>
        <span className="w-2 h-2 rounded-full bg-[#38BDF8]/50 animate-bounce" style={{ animationDelay: ".15s" }}></span>
        <span className="w-2 h-2 rounded-full bg-[#38BDF8]/50 animate-bounce" style={{ animationDelay: ".3s" }}></span>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto scroll-thin px-4 md:px-7 py-6">
      <div className="max-w-[720px] mx-auto w-full space-y-5">
        {messages.map((msg, index) => {
          const delay = `${Math.min(index * 0.05, 0.3)}s`;
          if (msg.role === "user") {
            return <UserMessage key={msg.id} text={msg.content} delay={delay} />;
          }
          return <AIMessage key={msg.id} text={msg.content} delay={delay} />;
        })}
        {isTyping && <TypingIndicator delay=".1s" />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
