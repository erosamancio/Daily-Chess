"use client";

import { Check, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ShareButton({ text }: { text: string }) {
  const t = useTranslations("result");
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-ink shadow-card transition hover:bg-brand-2 active:scale-[0.98]"
    >
      {copied ? <Check className="size-5" /> : <Share2 className="size-5" />}
      {copied ? t("copied") : t("share")}
    </button>
  );
}
