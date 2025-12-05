import { useState } from "react";
import type { AssistantMessage, PortfolioSummaryPayload } from "../types/portfolio";


export function usePortfolioAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen(snapshot: PortfolioSummaryPayload | null) {
    if (!snapshot) return;

    setOpen(true);
    setError(null);

    if (messages.length > 0) {
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/assistant/portfolio/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          snapshot,
          message:
            "Explain this virtual stock portfolio: cash, positions, market value, and unrealized P/L. Point out any concentration, big winners/losers, and anything a student should pay attention to.",
        }),
      });
      const json = await resp.json();
      if (!resp.ok || (json as any).error) {
        setError((json as any).error || "Assistant request failed");
      } else if ((json as any).reply) {
        setMessages([
          {
            id: Date.now(),
            role: "assistant",
            content: (json as any).reply,
          },
        ]);
      }
    } catch (err: any) {
      setError(err?.message || "Assistant request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent, snapshot: PortfolioSummaryPayload | null) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!snapshot) return;

    const userMsg: AssistantMessage = {
      id: Date.now(),
      role: "user",
      content: trimmed,
    };

    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/assistant/portfolio/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          snapshot,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await resp.json();
      if (!resp.ok || (json as any).error) {
        setError((json as any).error || "Assistant request failed");
      } else if ((json as any).reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            content: (json as any).reply,
          },
        ]);
      }
    } catch (err: any) {
      setError(err?.message || "Assistant request failed");
    } finally {
      setLoading(false);
    }
  }

  return {
    open,
    setOpen,
    messages,
    input,
    setInput,
    loading,
    error,
    handleOpen,
    handleSendMessage,
  };
}
