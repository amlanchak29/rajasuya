import { useState } from "react";
import { INDRAPRASTHA, MAGADHA, type Player } from "../engine/engine";
import type { Dharma } from "../engine/agent";
import { MODES, type Mode, type Setup } from "../game/useGame";
import { PLAYER_EPITHET, PLAYER_NAME } from "../game/text";
import { SIGILS } from "./assets";

const DHARMA_LINE: Record<Dharma, string> = {
  expedient: "Swears kings in shadow; spends legitimacy.",
  righteous: "Courts legitimacy; stays in the open.",
};

export default function SetupScreen({
  onBegin,
}: {
  onBegin: (setup: Setup) => void;
}) {
  const [human, setHuman] = useState<Player>(INDRAPRASTHA);
  const [aiDharma, setAiDharma] = useState<Dharma>("expedient");
  const [veiled, setVeiled] = useState(false);
  const [mode, setMode] = useState<Mode>("quick");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));

  const pick = (selected: boolean) =>
    `rounded border px-3 py-2.5 text-left transition-colors ${
      selected
        ? "border-line-bright bg-court"
        : "border-line bg-court-closed hover:border-line-bright"
    }`;

  const label = (text: string) => (
    <h2 className="mb-1.5 font-chrome text-xs uppercase tracking-widest text-leaf-faint">
      {text}
    </h2>
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-5 px-6 py-8">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
        <h1 className="font-display text-4xl tracking-wide text-leaf">
          Rajasuya
        </h1>
        <p className="font-body italic text-leaf-dim">
          Win the oaths of kings before the world — or hold the greater
          legitimacy when the clock runs out.
        </p>
      </header>

      <section className="rounded-lg border border-line-bright bg-court p-3">
        <button
          onClick={() =>
            onBegin({
              human: INDRAPRASTHA,
              aiDharma: "expedient",
              seed: Math.floor(Math.random() * 100000),
              mode: "quick",
              veiled: false,
            })
          }
          className="w-full rounded bg-indra px-6 py-2.5 font-chrome text-lg font-bold text-hall hover:brightness-110"
        >
          Begin your first game
        </button>
        <p className="mt-1.5 text-center font-chrome text-sm text-leaf-dim">
          Indraprastha, against an expedient rival. The counsel strip will
          walk you to your first oath.
        </p>
      </section>

      <div className="flex items-center gap-3">
        <span className="h-px grow bg-line" />
        <span className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
          or shape your own game
        </span>
        <span className="h-px grow bg-line" />
      </div>

      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <section>
          {label("Your claim")}
          <div className="grid grid-cols-2 gap-2">
            {([INDRAPRASTHA, MAGADHA] as const).map((p) => (
              <button key={p} className={pick(human === p)} onClick={() => setHuman(p)}>
                <div className="flex items-center gap-2">
                  <img
                    src={SIGILS[p]}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div>
                    <div
                      className={`font-display leading-tight ${p === INDRAPRASTHA ? "text-indra" : "text-magadha"}`}
                    >
                      {PLAYER_NAME[p]}
                    </div>
                    <div className="font-chrome text-xs text-leaf-dim">
                      {PLAYER_EPITHET[p]}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          {label("The game")}
          <div className="grid grid-cols-2 gap-2">
            <button className={pick(mode === "quick")} onClick={() => setMode("quick")}>
              <div className="font-body text-leaf">Quick game</div>
              <div className="font-chrome text-xs text-leaf-dim">
                {MODES.quick.turns} turns, {MODES.quick.oaths} oaths
              </div>
            </button>
            <button
              className={pick(mode === "digvijaya")}
              onClick={() => setMode("digvijaya")}
            >
              <div className="font-body text-leaf">The long road</div>
              <div className="font-chrome text-xs text-leaf-dim">
                {MODES.digvijaya.turns} turns, {MODES.digvijaya.oaths} oaths
              </div>
            </button>
          </div>
        </section>

        <section>
          {label("Your rival's way")}
          <div className="grid grid-cols-2 gap-2">
            {(["expedient", "righteous"] as const).map((d) => (
              <button key={d} className={pick(aiDharma === d)} onClick={() => setAiDharma(d)}>
                <div className="font-body capitalize text-leaf">{d}</div>
                <div className="font-chrome text-xs text-leaf-dim">
                  {DHARMA_LINE[d]}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          {label("The veil")}
          <button
            onClick={() => setVeiled(!veiled)}
            aria-pressed={veiled}
            className={`${pick(veiled)} w-full`}
          >
            <div className="font-body text-leaf">
              Veiled numbers — {veiled ? "on" : "off"}
            </div>
            <div className="font-chrome text-xs text-leaf-dim">
              The rival's debts and leverage stay hidden; their secret work
              surfaces as surprises.
            </div>
          </button>
        </section>
      </div>

      <section className="flex flex-wrap items-end gap-3">
        <label className="w-44">
          <span className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
            Seed
          </span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
            title="Decides which courts convene each turn"
            className="mt-1.5 w-full rounded border border-line bg-court-closed px-3 py-2 font-chrome text-leaf"
          />
        </label>
        <button
          onClick={() => setSeed(Math.floor(Math.random() * 100000))}
          className="rounded border border-line px-3 py-2 font-chrome text-sm text-leaf-dim hover:border-line-bright"
        >
          Redraw
        </button>
        <button
          onClick={() => onBegin({ human, aiDharma, seed, mode, veiled })}
          className="grow rounded bg-indra px-6 py-2 font-chrome text-lg font-bold text-hall hover:brightness-110"
        >
          Enter the hall
        </button>
      </section>
    </main>
  );
}
