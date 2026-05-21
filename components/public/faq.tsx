"use client";

import { useState } from "react";
import { trackClientEvent } from "@/lib/analytics";

const faqs = [
  {
    question: "Does Zenith replace our PMS?",
    answer: "No. The platform is designed to sit beside systems like Dentrix, Eaglesoft, OpenDental, or exports from your current scheduler.",
    category: "integration"
  },
  {
    question: "What happens after the audit?",
    answer: "You get a focused implementation walkthrough that prioritizes reminders, recall recovery, review requests, and reporting.",
    category: "audit"
  },
  {
    question: "Is this production-ready for patient data?",
    answer: "The architecture is Supabase-backed with server validation, RLS-ready tables, and admin protection scaffolds. HIPAA-grade deployment still requires a signed compliance path and vendor review.",
    category: "security"
  }
];

export function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-5xl px-5 py-20">
      <p className="text-sm font-black uppercase tracking-wider text-teal">FAQ</p>
      <h2 className="mt-3 text-4xl font-black">Operational questions, answered plainly.</h2>
      <div className="mt-8 divide-y divide-line rounded border border-line bg-white">
        {faqs.map((faq, index) => (
          <button
            key={faq.question}
            className="w-full px-5 py-5 text-left"
            onClick={() => {
              setOpen(index);
              trackClientEvent("faq_interaction", { question: faq.question, category: faq.category });
              fetch("/api/analytics/faq", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: faq.question, category: faq.category, interactionType: "open" })
              }).catch(() => undefined);
            }}
            type="button"
          >
            <span className="flex items-center justify-between gap-4 font-black">{faq.question}<span>{open === index ? "-" : "+"}</span></span>
            {open === index ? <p className="mt-3 max-w-3xl text-muted">{faq.answer}</p> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
