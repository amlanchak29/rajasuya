import { useState } from "react";
import { INDRAPRASTHA, MAGADHA, type Player } from "../engine/engine";
import type { Dharma } from "../engine/agent";
import type { Setup } from "../game/useGame";
import { PLAYER_EPITHET, PLAYER_NAME } from "../game/text";

const DHARMA_LINE: Record<Dharma, string> = {
  expedient: "Will swear kings in shadow and spend legitimacy to do it.",
  righteous: "Courts legitimacy and pays for it by staying in the open.",
};

export default function SetupScreen({
  onBegin,
}: {
  onBegin: (setup: Setup) => void;
}) {
  const [human, setHuman] = useState<Player>(INDRAPRASTHA);
  const [aiDharma, setAiDharma] = useState<Dharma>("expedient");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));

  const pick = (selected: boolean) =>
    `rounded border px-4 py-3 text-left transition-colors ${
      selected
        ? "border-line-bright bg-court"
        : "border-line bg-court-closed hover:border-line-bright"
    }`;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-12">
      <header>
        <h1 className="font-display text-5xl tracking-wide text-leaf">
          Rajasuya
        </h1>
        <p className="mt-2 font-body italic text-leaf-dim">
          Two claims to paramountcy. Neither sits on a throne. First to four
          oaths sworn before the world, or the greater legitimacy at the
          twelfth turn.
        </p>
      </header>

      <section>
        <h2 className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
          Your claim
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {([INDRAPRASTHA, MAGADHA] as const).map((p) => (
            <button key={p} className={pick(human === p)} onClick={() => setHuman(p)}>
              <div
                className={`font-display text-xl ${p === INDRAPRASTHA ? "text-indra" : "text-magadha"}`}
              >
                {PLAYER_NAME[p]}
              </div>
              <div className="font-chrome text-sm text-leaf-dim">
                {PLAYER_EPITHET[p]}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
          Your rival's way
        </h2>
        <div className="mt-2 grid grid-cols-1 gap-3">
          {(["expedient", "righteous"] as const).map((d) => (
            <button key={d} className={pick(aiDharma === d)} onClick={() => setAiDharma(d)}>
              <div className="font-body text-lg capitalize text-leaf">{d}</div>
              <div className="font-chrome text-sm text-leaf-dim">
                {DHARMA_LINE[d]}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="flex items-end gap-3">
        <label className="grow">
          <span className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
            Seed — decides which courts convene
          </span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
            className="mt-2 w-full rounded border border-line bg-court-closed px-3 py-2 font-chrome text-leaf"
          />
        </label>
        <button
          onClick={() => setSeed(Math.floor(Math.random() * 100000))}
          className="rounded border border-line px-3 py-2 font-chrome text-sm text-leaf-dim hover:border-line-bright"
        >
          Redraw
        </button>
      </section>

      <button
        onClick={() => onBegin({ human, aiDharma, seed })}
        className="rounded bg-indra px-6 py-3 font-chrome text-lg font-bold text-hall hover:brightness-110"
      >
        Enter the hall
      </button>
    </main>
  );
}
