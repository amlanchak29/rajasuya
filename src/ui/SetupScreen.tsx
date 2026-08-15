import { useState } from "react";
import { INDRAPRASTHA, MAGADHA, type Player } from "../engine/engine";
import type { Dharma } from "../engine/agent";
import { MODES, type Mode, type Setup } from "../game/useGame";
import { PLAYER_EPITHET, PLAYER_NAME } from "../game/text";
import { HERO, SIGILS } from "./assets";

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
  const [veiled, setVeiled] = useState(false);
  const [mode, setMode] = useState<Mode>("quick");
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
        <div className="relative -mx-6 mb-6 overflow-hidden sm:mx-0 sm:rounded-lg">
          <img
            src={HERO}
            alt="Two empty thrones face each other across a lamplit hall"
            className="h-44 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-hall via-transparent to-transparent" />
        </div>
        <h1 className="font-display text-5xl tracking-wide text-leaf">
          Rajasuya
        </h1>
        <p className="mt-2 font-body italic text-leaf-dim">
          Two rivals claim the high kingship. Neither holds the throne. Win
          the oaths of kings before the world, or hold the greater
          legitimacy when the clock runs out.
        </p>
      </header>

      <section className="rounded-lg border border-line-bright bg-court p-4">
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
          className="w-full rounded bg-indra px-6 py-3 font-chrome text-lg font-bold text-hall hover:brightness-110"
        >
          Begin your first game
        </button>
        <p className="mt-2 text-center font-chrome text-sm text-leaf-dim">
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

      <section>
        <h2 className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
          Your claim
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {([INDRAPRASTHA, MAGADHA] as const).map((p) => (
            <button key={p} className={pick(human === p)} onClick={() => setHuman(p)}>
              <img
                src={SIGILS[p]}
                alt=""
                className="mb-2 h-12 w-12 rounded-full object-cover"
              />
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

      <section>
        <h2 className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
          The game
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button className={pick(mode === "quick")} onClick={() => setMode("quick")}>
            <div className="font-body text-lg text-leaf">Quick game</div>
            <div className="font-chrome text-sm text-leaf-dim">
              {MODES.quick.turns} turns, {MODES.quick.oaths} oaths. One
              sitting.
            </div>
          </button>
          <button
            className={pick(mode === "digvijaya")}
            onClick={() => setMode("digvijaya")}
          >
            <div className="font-body text-lg text-leaf">The long road</div>
            <div className="font-chrome text-sm text-leaf-dim">
              {MODES.digvijaya.turns} turns, {MODES.digvijaya.oaths} oaths.
              A slower, deeper game.
            </div>
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
          The veil
        </h2>
        <button
          onClick={() => setVeiled(!veiled)}
          aria-pressed={veiled}
          className={`${pick(veiled)} mt-2 w-full`}
        >
          <div className="font-body text-lg text-leaf">
            {veiled ? "Veiled numbers — on" : "Veiled numbers — off"}
          </div>
          <div className="font-chrome text-sm text-leaf-dim">
            Your rival's debts and leverage stay hidden. You know only what
            happens in open court — their secret work surfaces as surprises.
          </div>
        </button>
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
        onClick={() => onBegin({ human, aiDharma, seed, mode, veiled })}
        className="rounded bg-indra px-6 py-3 font-chrome text-lg font-bold text-hall hover:brightness-110"
      >
        Enter the hall
      </button>
    </main>
  );
}
