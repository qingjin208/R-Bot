"use client";

import { Menu } from "lucide-react";
import { useI18n } from "@/app/contexts/I18nContext";

interface HeaderProps {
  titleKey?: string;
  statusKey?: string;
  onOpenSidebar: () => void;
}

export function Header({ titleKey = "title", statusKey = "online", onOpenSidebar }: HeaderProps) {
  const { t } = useI18n();

  return (
    <header className="flex items-center justify-between px-5 md:px-7 py-3 border-b border-white/60 dark:border-[#38BDF8]/10">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-[var(--text)]" />
        </button>
        {/* Mobile Logo */}
        <div
          className="w-8 h-8 rounded-full md:hidden flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#38BDF8,#7DD3FC)" }}
        >
          <span className="font-display font-bold text-xs text-white">M</span>
        </div>
        <div>
          <h2 className="font-display text-[16px] md:text-[18px] font-semibold leading-none text-[var(--text)]">
            {t(titleKey as never)}
          </h2>
          <p className="text-[10px] text-[#38BDF8]/60 mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> {t(statusKey as never)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="glass-soft rounded-full px-3 py-1.5 text-[11px] font-medium hover:scale-105 transition text-[var(--text)]">
          {t("export")}
        </button>
        <button className="glass-soft rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition text-[var(--text)]/50">
          ⋯
        </button>
      </div>
    </header>
  );
}
