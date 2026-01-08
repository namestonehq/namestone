import { useState } from "react";
import { Icon } from "@iconify/react";

export default function CopyForLLM() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    setLoading(true);
    try {
      const response = await fetch("/llms.txt");
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleCopy}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition w-full"
    >
      <Icon
        icon={copied ? "bi:check-lg" : "bi:clipboard"}
        className="w-4 h-4"
      />
      <span>{copied ? "Copied!" : "Copy for AI"}</span>
    </button>
  );
}
