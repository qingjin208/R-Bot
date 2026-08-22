"use client";

import { Sparkles } from "lucide-react";
import { useI18n } from "@/app/contexts/I18nContext";

export function WelcomeScreen() {
  const { t } = useI18n();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center animate-card-enter">
      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-6 animate-pulse-glow">
        <Sparkles className="w-8 h-8 text-[var(--color-accent)]" />
      </div>
      <h2 className="font-title text-2xl sm:text-3xl font-semibold mb-3">
        {t("welcomeTitle")}
      </h2>
      <p className="text-[var(--color-text-secondary)] text-sm sm:text-base max-w-md">
        {t("welcomeSubtitle")}
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        {[
          "Explain quantum computing in simple terms",
          "Write a Python function to sort a list",
          "Suggest a healthy meal plan for today",
          "How do I implement dark mode in Tailwind?",
        ].map((text, index) => (
          <button
            key={index}
            className="glass-card p-3 text-left text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]/40 transition-all"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
