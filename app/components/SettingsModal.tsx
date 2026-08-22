"use client";

import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/app/contexts/I18nContext";
import { ProviderConfig } from "@/app/types";
import { defaultProvider, loadProvider, saveProvider } from "@/app/lib/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useI18n();
  const [provider, setProvider] = useState<ProviderConfig>(defaultProvider);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProvider(loadProvider());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveProvider(provider);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl msg-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--text)]/8">
          <h2 className="font-display text-lg font-semibold text-[var(--text)]">{t("providerSettings")}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-white/5 transition"
          >
            <X className="w-5 h-5 text-[var(--text)]" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-xs text-[var(--text)]/60 mb-1.5">{t("providerName")}</label>
            <input
              type="text"
              value={provider.name}
              onChange={(e) => setProvider({ ...provider, name: e.target.value })}
              className="glass-soft w-full px-3 py-2 text-sm rounded-lg bg-transparent outline-none text-[var(--text)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text)]/60 mb-1.5">{t("baseUrl")}</label>
            <input
              type="text"
              value={provider.baseUrl}
              onChange={(e) => setProvider({ ...provider, baseUrl: e.target.value })}
              className="glass-soft w-full px-3 py-2 text-sm rounded-lg bg-transparent outline-none text-[var(--text)] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text)]/60 mb-1.5">{t("apiFormat")}</label>
            <select
              value={provider.apiFormat}
              onChange={(e) => setProvider({ ...provider, apiFormat: e.target.value as ProviderConfig["apiFormat"] })}
              className="glass-soft w-full px-3 py-2 text-sm rounded-lg bg-transparent outline-none text-[var(--text)] appearance-none"
            >
              <option value="openai">{t("chatCompletions")}</option>
              <option value="anthropic">Anthropic Messages (/messages)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text)]/60 mb-1.5">{t("apiKey")}</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={provider.apiKey}
                onChange={(e) => setProvider({ ...provider, apiKey: e.target.value })}
                placeholder="sk-..."
                className="glass-soft w-full px-3 py-2 pr-10 text-sm rounded-lg bg-transparent outline-none text-[var(--text)] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text)]/40 hover:text-[var(--text)]"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text)]/60 mb-1.5">{t("model")}</label>
            <input
              type="text"
              value={provider.model}
              onChange={(e) => setProvider({ ...provider, model: e.target.value })}
              className="glass-soft w-full px-3 py-2 text-sm rounded-lg bg-transparent outline-none text-[var(--text)] font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--text)]/8">
          <button
            onClick={onClose}
            className="glass-soft px-4 py-2 text-sm font-medium rounded-lg text-[var(--text)] hover:scale-105 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:scale-105 transition"
            style={{
              background: "linear-gradient(135deg,#38BDF8,#7DD3FC)",
              boxShadow: "0 4px 12px rgba(56,189,248,0.25)",
            }}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
