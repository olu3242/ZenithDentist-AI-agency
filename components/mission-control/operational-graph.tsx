"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { WorkflowGraph, OperationalGraphNode } from "@/lib/runtime/operational-graph";

const nodeStyles: Record<OperationalGraphNode["type"], string> = {
  workflow: "border-teal/40 bg-teal/10 text-teal",
  event: "border-blue/40 bg-blue/10 text-blue",
  queue_handler: "border-gold/50 bg-gold/10 text-ink",
  provider: "border-rust/40 bg-rust/10 text-rust",
  persistence: "border-green/40 bg-green/10 text-green",
  ui_visibility: "border-line bg-white text-ink",
  alice_grounding: "border-purple-300 bg-purple-50 text-purple-700",
  sla: "border-ink/20 bg-ink text-white"
};

export function OperationalGraph({ graph }: { graph: WorkflowGraph }) {
  const [zoom, setZoom] = useState(0.82);
  const nodes = useMemo(() => graph.nodes.slice(0, 42), [graph.nodes]);

  return (
    <section className="overflow-hidden rounded border border-line bg-ink text-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Operational Runtime Graph</p>
          <h2 className="mt-1 text-2xl font-black">Connected execution topology</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-white/60">
            Workflows, events, queues, providers, persistence, UI visibility, ALICE grounding, SLA states, replay paths, and dead-letter systems.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="grid size-9 place-items-center rounded border border-white/10 bg-white/8" onClick={() => setZoom(value => Math.max(0.55, value - 0.08))} aria-label="Zoom out">
            <Minus size={16} />
          </button>
          <span className="min-w-16 text-center text-xs font-black text-white/60">{Math.round(zoom * 100)}%</span>
          <button className="grid size-9 place-items-center rounded border border-white/10 bg-white/8" onClick={() => setZoom(value => Math.min(1.25, value + 0.08))} aria-label="Zoom in">
            <Plus size={16} />
          </button>
          <button className="grid size-9 place-items-center rounded border border-white/10 bg-white/8" onClick={() => setZoom(0.82)} aria-label="Reset graph zoom">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
      <div className="relative h-[560px] overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.13)_1px,transparent_0)] [background-size:26px_26px]">
        <div className="relative h-[900px] w-[1180px] origin-top-left" style={{ transform: `scale(${zoom})` }}>
          <svg className="absolute inset-0 h-full w-full opacity-35" aria-hidden="true">
            {graph.edges.slice(0, 80).map(edge => {
              const fromIndex = nodes.findIndex(node => node.id === edge.from);
              const toIndex = nodes.findIndex(node => node.id === edge.to);
              if (fromIndex < 0 || toIndex < 0) return null;
              const from = positionForIndex(fromIndex);
              const to = positionForIndex(toIndex);
              return <line key={edge.id} x1={from.x + 110} y1={from.y + 34} x2={to.x + 110} y2={to.y + 34} stroke="currentColor" strokeWidth="1" strokeDasharray="6 8" />;
            })}
          </svg>
          {nodes.map((node, index) => {
            const position = positionForIndex(index);
            const isCritical = graph.criticalPath.includes(node.id) || graph.criticalPath.includes(node.workflowId ?? "");
            return (
              <motion.div
                drag
                dragMomentum={false}
                key={node.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.015, 0.35) }}
                className={`absolute w-[220px] cursor-grab rounded border p-3 shadow-sm backdrop-blur ${nodeStyles[node.type]} ${isCritical ? "ring-2 ring-rust/60" : ""}`}
                style={{ left: position.x, top: position.y }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-black uppercase">{node.type.replace(/_/g, " ")}</span>
                  <span className={node.riskScore > 70 ? "size-2 rounded-full bg-rust shadow-[0_0_18px_rgba(207,93,65,0.8)]" : "size-2 rounded-full bg-teal shadow-[0_0_18px_rgba(43,151,142,0.8)]"} />
                </div>
                <strong className="mt-2 block truncate text-sm font-black">{node.label}</strong>
                <p className="mt-1 truncate text-xs font-bold opacity-70">{node.domain?.replace(/_/g, " ")} · risk {node.riskScore}/100</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function positionForIndex(index: number) {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return { x: 50 + col * 220 + (row % 2) * 45, y: 40 + row * 105 };
}
