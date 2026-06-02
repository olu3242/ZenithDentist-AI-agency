"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Bot, ExternalLink, Play, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type LizActionType = "navigation" | "assessment" | "workflow" | "sales" | "support" | "enterprise";
type LizActionVariant = "primary" | "secondary" | "outline";

interface LizAction {
  id: string;
  label: string;
  description?: string;
  href?: string;
  workflowId?: string;
  actionType: LizActionType;
  variant: LizActionVariant;
}

interface LizResponse {
  answer: string;
  message: string;
  intent: string;
  leadScore: number;
  recommendedOutcome: string;
  escalationPath: "sales" | "support" | "enterprise" | "none";
  citations: Array<{ title: string; source: string }>;
  actions: LizAction[];
  suggestedQuestions: string[];
  escalation?: { type: "sales" | "support" | "enterprise" };
  guardrail: { blocked: boolean; reason?: string };
}

interface ChatMessage {
  role: "liz" | "user";
  text: string;
  response?: LizResponse;
}

const starters = [
  "How much revenue am I losing?",
  "How does Recall Recovery work?",
  "Can Zenith integrate with OpenDental?"
];

export function LizChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("liz-session");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "liz",
      text: "Hi, I am your Zenith Revenue Advisor. Ask me about recall recovery, reviews, workflows, assessment results, or the right next step."
    }
  ]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const existing = window.localStorage.getItem("liz_session_id");
    const next = existing ?? `liz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem("liz_session_id", next);
    setSessionId(next);
  }, []);

  const latestSuggestions = useMemo(() => {
    const response = [...messages].reverse().find(message => message.response?.suggestedQuestions.length)?.response;
    return response?.suggestedQuestions ?? starters;
  }, [messages]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setMessages(current => [...current, { role: "user", text: trimmed }]);
    startTransition(async () => {
      try {
        const result = await fetch("/api/liz/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, context: { page: window.location.pathname } })
        });
        const json = await result.json();
        if (!json.ok) throw new Error(json.error ?? "The advisor could not answer.");
        const response = json.response as LizResponse;
        setMessages(current => [...current, { role: "liz", text: response.message ?? response.answer, response }]);
      } catch {
        setMessages(current => [...current, { role: "liz", text: "Could not reach the advisor service. You can still start the free assessment or contact support." }]);
      }
    });
  }

  async function handleAction(action: LizAction, response?: LizResponse) {
    await fetch("/api/liz/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        message: response?.message,
        sessionId,
        page: window.location.pathname,
        leadScore: response?.leadScore,
        intent: response?.intent,
        escalationPath: response?.escalationPath
      })
    }).catch(() => undefined);

    if (action.actionType === "workflow") {
      setMessages(current => [...current, { role: "liz", text: `${action.label} launched. I routed it through Workflow OS and will keep the recommendation grounded in runtime outcomes.` }]);
    }

    if (action.href) window.location.href = action.href;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <section className="flex h-[min(720px,calc(100vh-40px))] w-[min(440px,calc(100vw-40px))] flex-col overflow-hidden rounded border border-line bg-white shadow-2xl" aria-label="Revenue Advisor chat">
          <header className="flex items-center justify-between gap-3 border-b border-line bg-ink p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded bg-teal">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black">Revenue Advisor</p>
                <p className="text-xs font-semibold text-white/60">Actionable, grounded, tracked</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close LIZ chat">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-paper p-4">
            {messages.map((message, index) => (
              <article key={`${message.role}-${index}`} className={cn("rounded border p-3 text-sm shadow-sm", message.role === "user" ? "ml-8 border-teal/30 bg-teal/10 text-ink" : "mr-8 border-line bg-white text-muted")}>
                <p className="whitespace-pre-line font-semibold">{message.text}</p>
                {message.response ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded bg-paper px-2 py-1">Intent: {message.response.intent.replace(/_/g, " ")}</span>
                      <span className="rounded bg-paper px-2 py-1">Score: {message.response.leadScore}</span>
                      <span className="rounded bg-paper px-2 py-1">Outcome: {message.response.recommendedOutcome}</span>
                    </div>
                    {message.response.citations.length ? (
                      <p className="text-xs font-bold text-muted">Grounded by {message.response.citations.map(citation => citation.title).join(", ")}</p>
                    ) : null}
                    <div className="grid gap-2">
                      {message.response.actions.map(action => (
                        <LizActionButton key={action.id} action={action} onClick={() => handleAction(action, message.response)} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
            {isPending ? <div className="rounded border border-line bg-white p-3 text-sm font-bold text-muted">Checking grounded sources...</div> : null}
          </div>

          <div className="border-t border-line bg-white p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {latestSuggestions.slice(0, 5).map(question => (
                <button key={question} type="button" onClick={() => sendMessage(question)} className="rounded border border-line bg-paper px-3 py-2 text-xs font-black text-ink">
                  {question}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={event => {
                event.preventDefault();
                sendMessage(input);
              }}
            >
              <label className="sr-only" htmlFor="liz-message">Message advisor</label>
              <input id="liz-message" value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about your practice revenue..." className="min-w-0 flex-1 rounded border border-line px-3 py-2 text-sm font-semibold text-ink" />
              <button type="submit" disabled={isPending} className="grid h-10 w-10 shrink-0 place-items-center rounded bg-primary text-white disabled:opacity-60" aria-label="Send message">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-3 rounded-full bg-ink px-5 py-4 text-sm font-black text-white shadow-2xl" aria-label="Open Revenue Advisor">
          <Bot className="h-5 w-5 text-teal" />
          Ask LIZ
        </button>
      )}
    </div>
  );
}

function LizActionButton({ action, onClick }: { action: LizAction; onClick: () => void }) {
  const Icon = action.actionType === "workflow" ? Play : action.actionType === "assessment" ? Sparkles : ExternalLink;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded border px-3 py-3 text-left transition",
        action.variant === "primary" ? "border-primary bg-primary text-white hover:bg-primary/90" : null,
        action.variant === "secondary" ? "border-teal/30 bg-teal/10 text-ink hover:bg-teal/15" : null,
        action.variant === "outline" ? "border-line bg-white text-ink hover:bg-paper" : null
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span>
          <span className="block text-sm font-black">{action.label}</span>
          {action.description ? <span className={cn("mt-1 block text-xs font-semibold", action.variant === "primary" ? "text-white/75" : "text-muted")}>{action.description}</span> : null}
        </span>
        <Icon className="h-4 w-4 shrink-0" />
      </span>
      {action.workflowId ? <span className={cn("mt-2 block text-[11px] font-black uppercase tracking-wider", action.variant === "primary" ? "text-white/65" : "text-teal")}>Workflow: {action.workflowId}</span> : null}
    </button>
  );
}
