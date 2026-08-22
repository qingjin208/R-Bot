"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * AI 消息的 Markdown 渲染容器样式（覆盖 react-markdown 默认输出）
 */
const markdownBody = `
  text-[13px] leading-relaxed text-[var(--text)]
  [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0
  [&_strong]:font-semibold
  [&_em]:italic
  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5
  [&_li]:my-0.5
  [&_h1]:text-[15px] [&_h1]:font-semibold [&_h1]:my-2
  [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:my-2
  [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:my-1.5
  [&_blockquote]:border-l-2 [&_blockquote]:border-[#38BDF8]/40 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-[var(--text)]/70
  [&_code]:font-mono [&_code]:text-[12px] [&_code]:bg-[var(--text)]/8 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
  [&_pre]:my-2 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:bg-[var(--text)]/8 [&_pre]:overflow-x-auto
  [&_pre_code]:bg-transparent [&_pre_code]:p-0
  [&_a]:text-[#38BDF8] [&_a]:underline
  [&_hr]:my-3 [&_hr]:border-[var(--text)]/10
  [&_table]:w-full [&_table]:my-2 [&_table]:text-[12px] [&_table]:border-collapse
  [&_th]:border [&_th]:border-[var(--text)]/10 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium [&_th]:bg-[var(--text)]/5
  [&_td]:border [&_td]:border-[var(--text)]/10 [&_td]:px-2 [&_td]:py-1
`;

interface MarkdownBodyProps {
  text: string;
}

/**
 * 统一的 AI 消息 Markdown 渲染组件
 * 支持 GFM：表格、删除线、任务列表、自动链接等
 */
export function MarkdownBody({ text }: MarkdownBodyProps) {
  return (
    <div className={markdownBody}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
