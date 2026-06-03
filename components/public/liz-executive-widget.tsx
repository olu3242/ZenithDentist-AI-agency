"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight } from "lucide-react";

const messages = [
  {
    headline: "LIZ Executive Insight",
    body: "The average dental practice recovers $37,400 annually through automated recall and treatment recovery workflows.",
    type: "insight"
  },
  {
    headline: "Missed Recall Opportunity",
    body: "127 overdue hygiene patients represent an estimated $18,400 in recoverable annual production.",
    type: "recall"
  },
  {
    headline: "Treatment Acceptance Gap",
    body: "42 unscheduled treatment plans are sitting in the average practice — each week of delay costs real revenue.",
    type: "treatment"
  },
  {
    headline: "Review Generation Opportunity",
    body: "Practices that automate review requests see 3× more Google reviews within 90 days of activation.",
    type: "reviews"
  },
  {
    headline: "Referral Growth Opportunity",
    body: "Referral tracking shows practices lose 18% of word-of-mouth opportunities without structured follow-up.",
    type: "referral"
  },
  {
    headline: "Membership Plan Opportunity",
    body: "Membership plan churn costs the average practice $8,400 per year in recurring revenue. LIZ tracks it.",
    type: "membership"
  }
];

export function LizExecutiveWidget() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  // Auto-open after 4 seconds on first visit
  useEffect(() => {
    const seen = sessionStorage.getItem("liz_widget_seen");
    if (seen) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem("liz_widget_seen", "1");
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  // Rotate messages every 9 seconds
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setIndex(i => (i + 1) % messages.length), 9000);
    return () => clearInterval(t);
  }, [open]);

  if (dismissed) return null;

  const msg = messages[index];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-[min(340px,calc(100vw-40px))] overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1C]/90 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#14B8A6]/20">
                  <Sparkles className="h-3.5 w-3.5 text-[#14B8A6]" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-[#14B8A6]">LIZ Intelligence</span>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setDismissed(true); }}
                className="grid h-6 w-6 place-items-center rounded text-white/40 transition hover:text-white/70"
                aria-label="Dismiss LIZ"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Message */}
            <div className="px-4 pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="text-xs font-black text-white/50 uppercase tracking-wider mb-1.5">{msg.headline}</p>
                  <p className="text-sm leading-6 text-white/80">{msg.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1 px-4 pb-3">
              {messages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1 rounded-full transition-all ${i === index ? "w-5 bg-[#14B8A6]" : "w-1 bg-white/20"}`}
                  aria-label={`Message ${i + 1}`}
                />
              ))}
            </div>

            {/* CTA */}
            <div className="border-t border-white/10 px-4 py-3">
              <a
                href="#assessment"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#14B8A6] py-2.5 text-xs font-black text-[#0A0F1C] transition hover:bg-[#14B8A6]/90"
              >
                Start Free Assessment <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="bubble"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-[#0A0F1C]/90 px-4 py-3 text-sm font-black text-white shadow-2xl backdrop-blur transition hover:bg-[#0A0F1C]"
            aria-label="Open LIZ Executive Intelligence"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#14B8A6]/20">
              <Sparkles className="h-3.5 w-3.5 text-[#14B8A6]" />
            </span>
            <span className="text-[#14B8A6]">LIZ</span>
            <span className="text-white/60">Executive Insight</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
