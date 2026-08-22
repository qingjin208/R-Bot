"use client";

import { ProviderConfig } from "@/app/types";

const PROVIDER_KEY = "r-bot-provider";

export const defaultProvider: ProviderConfig = {
  name: "SenseNova",
  baseUrl: "https://token.sensenova.cn/v1",
  apiFormat: "openai",
  apiKey: "",
  model: "sensenova-6.8-flash-lite",
  enabled: true,
};

export function loadProvider(): ProviderConfig {
  if (typeof window === "undefined") return defaultProvider;
  try {
    const raw = window.localStorage.getItem(PROVIDER_KEY);
    if (!raw) return defaultProvider;
    const parsed = JSON.parse(raw) as Partial<ProviderConfig>;
    return { ...defaultProvider, ...parsed };
  } catch {
    return defaultProvider;
  }
}

export function saveProvider(provider: ProviderConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROVIDER_KEY, JSON.stringify(provider));
}
