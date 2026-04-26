"use client";

import { useState } from "react";
import { IconArrowRight, IconSearch } from "./Icons";

const heroCardBase =
  "w-full rounded-ml border border-ml-line bg-ml-card p-3.5 shadow-ml-card";

export function HomePage({ onStart }: { onStart: (topic: string) => void }) {
  const [topic, setTopic] = useState("");

  return (
    <main className="mx-auto max-w-[1280px] px-10 pb-16 pt-12">
      <div className="grid items-center gap-12 max-[960px]:grid-cols-1 grid-cols-2">
        <div>
          <h1 className="mb-4 text-[clamp(1.85rem,3.2vw,2.65rem)] font-bold leading-[1.15] tracking-tight text-ml-ink">
            Turn your questions into a <span className="text-ml-blue">learning map.</span>
          </h1>
          <p className="mb-7 max-w-[28rem] text-base text-ml-muted">
            Start from any topic, ask follow-up questions, and build a map you can revisit.
          </p>
          <div className="flex max-w-[420px] items-center gap-3 rounded-full border border-ml-line bg-ml-card px-4 py-1 shadow-ml-card">
            <IconSearch className="shrink-0 text-ml-muted" />
            <input
              aria-label="Learning topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="What do you want to learn?"
              className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-1 outline-none"
            />
          </div>
          <button
            type="button"
            className="mt-5 inline-flex cursor-pointer items-center gap-2.5 rounded-ml-sm bg-ml-blue px-7 py-3.5 font-semibold text-white shadow-ml-cta hover:bg-ml-blue-deep [&_svg]:shrink-0"
            onClick={() => onStart(topic.trim() || "Transformer")}
          >
            Start learning
            <IconArrowRight />
          </button>
        </div>
        <div className="relative flex flex-col items-center gap-0 px-3 py-5" aria-hidden>
          <div className="flex flex-col items-center">
            <div className="h-5 w-0.5 rounded-sm bg-ml-hero-line" />
            <div className={`${heroCardBase} max-w-[280px]`}>
              <div className="mb-2.5 h-9 w-9 rounded-[10px] bg-gradient-to-br from-ml-blue-soft to-[#d4e5ff] shadow-[inset_0_0_0_1px_rgba(0,102,255,0.12)]" />
              <div>
                <strong className="mb-1.5 block text-[0.95rem]">Transformer</strong>
                <p className="m-0 text-[0.78rem] leading-[1.45] text-ml-muted">
                  A deep learning architecture that relies on self-attention mechanisms.
                </p>
              </div>
            </div>
            <div className="mb-0 flex flex-wrap items-start justify-center gap-5">
              <div className="flex max-w-[200px] flex-col items-center">
                <div className="h-3.5 w-0.5 rounded-sm bg-ml-hero-line" />
                <div className={heroCardBase}>
                  <div className="mb-2.5 h-9 w-9 rounded-[10px] bg-ml-blue-soft" />
                  <div>
                    <strong className="mb-1.5 block text-[0.95rem]">Self-attention</strong>
                    <p className="m-0 text-[0.78rem] leading-[1.45] text-ml-muted">
                      Allows the model to focus on different positions of the input sequence.
                    </p>
                  </div>
                </div>
                <div className="mt-1 h-3.5 w-0.5 rounded-sm bg-ml-hero-line" />
                <div className={`${heroCardBase} mt-1 max-w-[220px]`}>
                  <div className="mb-2.5 h-9 w-9 rounded-[10px] bg-ml-blue-soft" />
                  <div>
                    <strong className="mb-1.5 block text-[0.95rem]">Q/K/V</strong>
                    <p className="m-0 text-[0.78rem] leading-[1.45] text-ml-muted">
                      Queries, Keys, and Values are linear projections of the input embeddings.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex max-w-[200px] flex-col items-center">
                <div className="h-3.5 w-0.5 rounded-sm bg-ml-hero-line" />
                <div className={heroCardBase}>
                  <div className="mb-2.5 h-9 w-9 rounded-[10px] bg-ml-blue-soft" />
                  <div>
                    <strong className="mb-1.5 block text-[0.95rem]">Positional Encoding</strong>
                    <p className="m-0 text-[0.78rem] leading-[1.45] text-ml-muted">
                      Encodes the position of tokens since the model has no recurrence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
