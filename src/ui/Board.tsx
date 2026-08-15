import {
  INDRAPRASTHA,
  MAGADHA,
  QUADRANTS,
  VOW_TEXT,
  type Player,
  type Quadrant,
  type State,
} from "../engine/engine";
import { sealOf } from "../game/useGame";
import { progressOf } from "../game/progress";
import { FIGURE_NAME, PLAYER_NAME, QUADRANT_NAME } from "../game/text";
import { PORTRAITS } from "./assets";

const dot = (p: Player) => (p === INDRAPRASTHA ? "bg-indra" : "bg-magadha");
const tint = (p: Player) => (p === INDRAPRASTHA ? "text-indra" : "text-magadha");

function FigureCard({
  id,
  state,
  human,
  veiled,
  inSess,
  selected,
  onSelect,
}: {
  id: string;
  state: State;
  human: Player;
  veiled: boolean;
  inSess: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const f = state.figures[id];
  const seal = sealOf(state, id);
  const allied = !f.locked && f.allegiance !== null;
  const p = progressOf(state, id, human);

  return (
    <button
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className={`w-full rounded border p-2.5 text-left transition-colors ${
        selected
          ? "border-indra bg-court"
          : "border-line bg-court/60 hover:border-line-bright"
      } ${inSess ? "" : "opacity-50 saturate-50"}`}
    >
      <div className="flex gap-2.5">
        <img
          src={PORTRAITS[id]}
          alt=""
          className={`h-16 w-13 shrink-0 rounded object-cover object-top ${
            f.locked ? "opacity-80" : ""
          }`}
        />
        <div className="min-w-0 grow">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-lg leading-tight text-leaf">
              {FIGURE_NAME[id]}
            </span>
        {seal && (
          <span
            className={`font-chrome text-[11px] uppercase tracking-wide ${
              seal.open ? tint(seal.holder) : "text-shadow-blue"
            }`}
            title={
              seal.open
                ? `Sworn to ${PLAYER_NAME[seal.holder]} before the world`
                : `Sealed by ${PLAYER_NAME[seal.holder]} in secret`
            }
          >
            {seal.open ? "sworn" : "sealed"}
          </span>
        )}
        {allied && (
          <span
            className={`inline-flex items-center gap-1 font-chrome text-[11px] uppercase tracking-wide ${tint(f.allegiance!)}`}
            title={`His allegiance lies with ${PLAYER_NAME[f.allegiance!]} — but he is not yet sworn`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dot(f.allegiance!)}`} />
            allied
          </span>
        )}
      </div>

      {/* Vows are public information and attack surfaces: always visible. */}
      <p className="mt-1 min-h-8 font-body text-[13px] italic leading-snug text-leaf-dim">
        {f.vows.length > 0
          ? f.vows.map((v) => `${VOW_TEXT[v.id]}.`).join(" ")
          : "No vow binds him."}
      </p>

      {/* Engine state is fully open except the log (HANDOVER §5); veiled
          mode is a UI choice that hides the rival's columns. */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-chrome text-xs text-leaf-faint">
        <span title="Obligation — debts of hospitality owed to each claim">
          owes{" "}
          {veiled ? (
            <span className={tint(human)}>{f.obligation[human]}</span>
          ) : (
            <>
              <span className={tint(INDRAPRASTHA)}>
                {f.obligation[INDRAPRASTHA]}
              </span>
              {" · "}
              <span className={tint(MAGADHA)}>{f.obligation[MAGADHA]}</span>
            </>
          )}
        </span>
        <span title="Leverage — what each claim holds over him from private counsel">
          leverage{" "}
          {veiled ? (
            <span className={tint(human)}>{f.leverage[human]}</span>
          ) : (
            <>
              <span className={tint(INDRAPRASTHA)}>
                {f.leverage[INDRAPRASTHA]}
              </span>
              {" · "}
              <span className={tint(MAGADHA)}>{f.leverage[MAGADHA]}</span>
            </>
          )}
        </span>
        {p.oathReady && (
          <span className="rounded border border-indra/60 px-1.5 py-px text-[10px] uppercase tracking-wide text-indra">
            ready for the oath
          </span>
        )}
        {!p.oathReady && p.petitionReady && (
          <span className="rounded border border-leaf-dim/60 px-1.5 py-px text-[10px] uppercase tracking-wide text-leaf-dim">
            ready to petition
          </span>
        )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Board({
  state,
  sessions,
  human,
  veiled,
  justLit,
  litStamp,
  selected,
  onSelect,
}: {
  state: State;
  sessions: Set<Quadrant>;
  human: Player;
  veiled: boolean;
  /** Quadrants that just came into session — get a one-shot wake pulse. */
  justLit: Set<Quadrant>;
  /** Changes on every session redraw so the pulse retriggers via remount. */
  litStamp: number;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grow grid-cols-2 gap-3 xl:grid-cols-4">
      {QUADRANTS.map((q) => {
        const inSess = sessions.has(q);
        const ids = Object.keys(state.figures).filter(
          (id) => state.figures[id].quadrant === q,
        );
        return (
          <section
            key={justLit.has(q) ? `${q}-${litStamp}` : q}
            className={`flex flex-col gap-2 rounded-lg border p-3 motion-safe:transition-all motion-safe:duration-700 ${
              inSess
                ? `lamplit border-line-bright ${justLit.has(q) ? "motion-safe:court-wake" : ""}`
                : "border-line bg-court-closed"
            }`}
          >
            <header className="flex items-baseline justify-between">
              <h2
                className={`font-chrome text-xs uppercase tracking-widest ${
                  inSess ? "text-indra" : "text-leaf-faint"
                }`}
              >
                {QUADRANT_NAME[q]}
              </h2>
              <span
                className={`font-body text-xs italic ${
                  inSess ? "text-leaf-dim" : "text-leaf-faint"
                }`}
              >
                {inSess ? "the court sits" : "does not sit"}
              </span>
            </header>
            {ids.map((id) => (
              <FigureCard
                key={id}
                id={id}
                state={state}
                human={human}
                veiled={veiled}
                inSess={inSess}
                selected={selected === id}
                onSelect={onSelect}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
