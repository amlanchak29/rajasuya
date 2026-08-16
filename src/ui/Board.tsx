import {
  INDRAPRASTHA,
  other,
  QUADRANTS,
  VOW_TEXT,
  type Player,
  type Quadrant,
  type State,
} from "../engine/engine";
import { sealOf } from "../game/useGame";
import {
  OATH_LEVERAGE,
  OATH_OBLIGATION,
  PETITION_MIN,
  progressOf,
} from "../game/progress";
import { FIGURE_NAME, PLAYER_NAME, QUADRANT_NAME } from "../game/text";
import { PORTRAITS } from "./assets";

const dot = (p: Player) => (p === INDRAPRASTHA ? "bg-indra" : "bg-magadha");
const tint = (p: Player) => (p === INDRAPRASTHA ? "text-indra" : "text-magadha");

/** A stat as a filling bar. Ticks mark the thresholds that matter, so
 * "how close is he" is a glance, not arithmetic. */
function StatBar({
  label,
  title,
  value,
  max,
  ticks,
  fill,
  rivalValue,
  rivalTint,
}: {
  label: string;
  title: string;
  value: number;
  max: number;
  ticks: number[];
  fill: string;
  rivalValue: number | null;
  rivalTint: string;
}) {
  return (
    <div className="flex items-center gap-2" title={title}>
      <span className="w-13 shrink-0 font-chrome text-[10px] uppercase tracking-wide text-leaf-faint">
        {label}
      </span>
      <span className="relative h-1.5 grow overflow-hidden rounded-full bg-line/60">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${fill} motion-safe:transition-all motion-safe:duration-500`}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute inset-y-0 w-px bg-leaf-dim/70"
            style={{ left: `${(t / max) * 100}%` }}
          />
        ))}
      </span>
      <span className="w-4 shrink-0 text-right font-chrome text-xs text-leaf-dim">
        {value}
      </span>
      {rivalValue !== null && (
        <span className={`w-4 shrink-0 text-right font-chrome text-xs ${rivalTint}`}>
          {rivalValue}
        </span>
      )}
    </div>
  );
}

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
  const p = progressOf(state, id, human, veiled);
  const rival = other(human);

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
          mode is a UI choice that hides the rival's columns. Bars show the
          human's progress; ticks mark the petition and oath thresholds. */}
      <div className="mt-1.5 flex flex-col gap-1">
        <StatBar
          label="owes"
          title={`Obligation — hospitality's debt. Ticks: petition (${PETITION_MIN}) and the oath's debt route (${OATH_OBLIGATION}).`}
          value={f.obligation[human]}
          max={OATH_OBLIGATION}
          ticks={[PETITION_MIN, OATH_OBLIGATION]}
          fill={human === INDRAPRASTHA ? "bg-indra" : "bg-magadha"}
          rivalValue={veiled ? null : f.obligation[rival]}
          rivalTint={tint(rival)}
        />
        <StatBar
          label="leverage"
          title={`Leverage — private counsel's hold. At ${OATH_LEVERAGE}, the oath is yours to take.`}
          value={f.leverage[human]}
          max={OATH_LEVERAGE}
          ticks={[]}
          fill="bg-shadow-blue"
          rivalValue={veiled ? null : f.leverage[rival]}
          rivalTint={tint(rival)}
        />
        {(p.oathReady || p.atRisk || p.stealReady || p.petitionReady) && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {p.oathReady && (
              <span className="rounded border border-indra/60 px-1.5 py-px text-[10px] uppercase tracking-wide text-indra">
                ready for the oath
              </span>
            )}
            {p.atRisk && !veiled && (
              <span
                className={`rounded border px-1.5 py-px text-[10px] uppercase tracking-wide ${rival === INDRAPRASTHA ? "border-indra/60 text-indra" : "border-magadha/60 text-magadha"}`}
                title="Your ally — but the rival's obligation clears the petition bar. Only the oath makes him safe."
              >
                at risk
              </span>
            )}
            {p.stealReady && (
              <span
                className="rounded border border-indra/60 px-1.5 py-px text-[10px] uppercase tracking-wide text-leaf"
                title="Allied to your rival, but your petition would turn him."
              >
                can be turned
              </span>
            )}
            {!p.oathReady && p.petitionReady && (
              <span className="rounded border border-leaf-dim/60 px-1.5 py-px text-[10px] uppercase tracking-wide text-leaf-dim">
                ready to petition
              </span>
            )}
          </div>
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
  flash,
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
  /** The card an act just landed on — gets a one-shot gold flash. */
  flash: { id: string; stamp: number } | null;
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
              <div
                key={
                  flash !== null && flash.id === id
                    ? `${id}-hit${flash.stamp}`
                    : id
                }
                className={
                  flash !== null && flash.id === id
                    ? "motion-safe:card-flash rounded"
                    : ""
                }
              >
                <FigureCard
                  id={id}
                  state={state}
                  human={human}
                  veiled={veiled}
                  inSess={inSess}
                  selected={selected === id}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
