"use client";

import { Plus } from "lucide-react";
import { useI18n } from "@/app/contexts/I18nContext";
import { SettingsPanel } from "./SettingsPanel";

interface Conversation {
  id: string;
  titleKey: string;
  active?: boolean;
  group: "today" | "week";
}

interface SidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ conversations, activeId, onSelect, onNewChat, isOpen, onClose }: SidebarProps) {
  const { t } = useI18n();

  const todayConversations = conversations.filter((c) => c.group === "today");
  const weekConversations = conversations.filter((c) => c.group === "week");

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          glass rounded-[24px] w-[260px] shrink-0 flex flex-col
          shadow-[0_8px_32px_rgba(51,65,85,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          m-3 md:m-0
        `}
      >
        {/* Logo (与右侧 Header 对齐) */}
        <div className="flex items-center gap-3 px-5 md:px-7 py-3 border-b border-white/40 dark:border-[#38BDF8]/10">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg,#38BDF8,#7DD3FC)",
              boxShadow: "0 4px 12px rgba(56,189,248,0.25)",
            }}
          >
            <span className="font-display font-bold text-sm text-white">M</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[16px] md:text-[17px] font-semibold leading-none text-[var(--text)]">
              {t("appName")}
            </h1>
            <p className="text-[10px] text-[#38BDF8]/70 mt-1 tracking-wide leading-none">
              {t("appTagline")}
            </p>
          </div>
        </div>

        {/* 主体滚动区 */}
        <div className="flex-1 overflow-y-auto scroll-thin px-5 md:px-7 pt-2 pb-2 flex flex-col">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="glass-strong rounded-xl py-2 px-4 text-[13px] font-medium flex items-center gap-2 mb-2 hover:scale-[1.02] transition-transform text-[var(--text)]"
          >
            <Plus className="text-[#38BDF8] w-4 h-4" /> {t("newChat")}
          </button>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto scroll-thin -mr-2 pr-2 space-y-1">
            {todayConversations.length > 0 && (
              <>
                <p className="text-[9px] uppercase tracking-[0.18em] text-[#38BDF8]/50 px-2 mb-2">
                  {t("today")}
                </p>
                {todayConversations.map((conv) => (
                  <a
                    key={conv.id}
                    className={`rounded-lg px-3 py-2 text-[12px] flex items-center justify-between cursor-pointer ${
                      activeId === conv.id
                        ? "glass-soft text-[var(--text)]"
                        : "hover:bg-white/40 dark:hover:bg-white/5 transition text-[var(--text)]/60"
                    }`}
                    onClick={() => {
                      onSelect?.(conv.id);
                      onClose();
                    }}
                  >
                    <span className="truncate">{t(conv.titleKey as never)}</span>
                    {activeId === conv.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
                    )}
                  </a>
                ))}
              </>
            )}

            {weekConversations.length > 0 && (
              <>
                <p className="text-[9px] uppercase tracking-[0.18em] text-[#38BDF8]/50 px-2 mb-2 mt-4">
                  {t("thisWeek")}
                </p>
                {weekConversations.map((conv) => (
                  <a
                    key={conv.id}
                    className={`rounded-lg px-3 py-2 text-[12px] flex items-center justify-between cursor-pointer ${
                      activeId === conv.id
                        ? "glass-soft text-[var(--text)]"
                        : "hover:bg-white/40 dark:hover:bg-white/5 transition text-[var(--text)]/60"
                    }`}
                    onClick={() => {
                      onSelect?.(conv.id);
                      onClose();
                    }}
                  >
                    <span className="truncate">{t(conv.titleKey as never)}</span>
                    {activeId === conv.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
                    )}
                  </a>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Settings Panel - 固定在底部 */}
        <div className="px-5 md:px-7 pb-5 pt-3 border-t border-white/40 dark:border-[#38BDF8]/10">
          <SettingsPanel />
        </div>
      </aside>
    </>
  );
}
