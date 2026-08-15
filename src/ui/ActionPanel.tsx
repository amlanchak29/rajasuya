import {
  HIDDEN,
  OPEN,
  PASS,
  VERBS,
  type Action,
  type Player,
  type State,
  type Verb,
  type Visibility,
} from "../engine/engine";
import { progressOf, type Progress } from "../game/progress";
import {
  explainBlocked,
  FIGURE_NAME,
  QUADRANT_NAME,
  VERB_EFFECT,
  VERB_GLOSS,
} from "../game/text";
import { PORTRAITS } from "./assets";

const VERB_CHOICES: [Verb, Visibility][] = VERBS.flatMap((verb) =>
  verb === "satkara"
    ? [[verb, OPEN] as [Verb, Visibility]]
    : verb === "mantrana"
      ? [[verb, HIDDEN] as [Verb, Visibility]]
      : [
          [verb, OPEN] as [Verb, Visibility],
          [verb, HIDDEN] as [Verb, Visibility],
        ],
);

const sameAction = (a: Action, b: Action) =>
  a.verb === b.verb && a.target === b.target && a.visibility === b.visibility;

/** The way to an oath, with live numbers. Legality still comes only from
 * legalActions() — this shows the road, not the permission. */
function PathLadder({ p }: { p: Progress }) {
  const steps: { label: string; detail: string; done: boolean; now: boolean }[] =
    [
      {
        label: "Hospitality",
        detail: `he owes you ${p.obligation} of the 3 a petition needs`,
        done: p.obligation >= 3 || p.allied || p.locked,
        now: !p.allied && !p.locked && p.obligation < 3,
      },
      {
        label: "Petition",
        detail: p.allied
          ? "his allegiance is yours"
          : p.rivalAllied
            ? "his allegiance lies with your rival — petition to steal it"
            : "claims his allegiance",
        done: p.allied,
        now: p.petitionReady || (p.rivalAllied && p.obligation >= 3),
      },
      {
        label: "The oath",
        detail: p.locked
          ? "he is sworn"
          : `leverage ${p.leverage} of 2 (counsel), or obligation ${p.obligation} of 6`,
        done: p.locked,
        now: p.oathReady,
      },
    ];
  return (
    <ol className="mt-2 flex flex-col gap-1 rounded border border-line bg-court/50 px-3 py-2">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-baseline gap-2">
          <span
            className={`font-chrome text-xs ${
              s.done
                ? "text-indra"
                : s.now
                  ? "text-leaf"
                  : "text-leaf-faint"
            }`}
          >
            {s.done ? "✓" : `${i + 1}.`}
          </span>
          <span
            className={`font-chrome text-xs uppercase tracking-wide ${
              s.done ? "text-indra" : s.now ? "text-leaf" : "text-leaf-faint"
            }`}
          >
            {s.label}
          </span>
          <span
            className={`font-body text-[13px] italic ${
              s.now ? "text-leaf-dim" : "text-leaf-faint"
            }`}
          >
            {s.detail}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function ActionPanel({
  state,
  legal,
  human,
  isHumanTurn,
  selected,
  onAct,
}: {
  state: State;
  legal: Action[];
  human: Player;
  isHumanTurn: boolean;
  selected: string | null;
  onAct: (a: Action) => void;
}) {
  const mustPass = isHumanTurn && legal.length === 1 && legal[0].verb === PASS;

  return (
    <section className="rounded-lg border border-line bg-court-closed p-3">
      <h2 className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
        Your move
      </h2>

      {mustPass && (
        <div className="mt-2">
          <p className="font-body italic text-leaf-dim">
            No court will hear you.
          </p>
          <button
            onClick={() => onAct(legal[0])}
            className="mt-2 w-full rounded bg-indra px-4 py-2 font-chrome font-bold text-hall hover:brightness-110"
          >
            Wait out the session
          </button>
        </div>
      )}

      {!selected && !mustPass && (
        <p className="mt-2 font-body italic text-leaf-dim">
          Choose a king. His vow tells you which doors are open — and which
          of your rival's are shut.
        </p>
      )}

      {selected && !mustPass && (
        <div className="mt-2">
          <div className="flex items-center gap-3">
            <img
              src={PORTRAITS[selected]}
              alt=""
              className="h-14 w-11 rounded object-cover object-top"
            />
            <div className="font-display text-xl text-leaf">
              {FIGURE_NAME[selected]}
              <span className="ml-2 font-chrome text-xs uppercase tracking-wide text-leaf-faint">
                {QUADRANT_NAME[state.figures[selected].quadrant]}
              </span>
            </div>
          </div>

          <PathLadder p={progressOf(state, selected, human)} />

          <ul className="mt-2 flex flex-col gap-2">
            {VERB_CHOICES.map(([verb, vis]) => {
              const action: Action = {
                actor: state.active_player,
                verb,
                target: selected,
                visibility: vis,
              };
              const isLegal =
                isHumanTurn && legal.some((a) => sameAction(a, action));
              const blocked =
                !isLegal && isHumanTurn
                  ? explainBlocked(state, { ...action, actor: human })
                  : null;
              return (
                <li key={`${verb}-${vis}`}>
                  <button
                    disabled={!isLegal}
                    onClick={() => onAct(action)}
                    className={`w-full rounded border px-3 py-1.5 text-left ${
                      isLegal
                        ? "border-line-bright bg-court hover:border-indra"
                        : blocked?.kind === "vow"
                          ? "cursor-not-allowed border-shadow-blue/30 opacity-80"
                          : "cursor-not-allowed border-line opacity-70"
                    }`}
                  >
                    <span className="font-display text-base text-leaf">
                      {verb[0].toUpperCase() + verb.slice(1)}
                    </span>
                    <span className="ml-2 font-chrome text-xs text-leaf-dim">
                      {VERB_GLOSS[verb]} ·{" "}
                      <span
                        className={
                          vis === HIDDEN ? "text-shadow-blue" : "text-indra"
                        }
                      >
                        {vis}
                      </span>
                    </span>
                    <div
                      className={`mt-0.5 font-body text-[13px] leading-snug ${
                        blocked === null
                          ? "text-leaf-dim"
                          : blocked.kind === "vow"
                            ? "italic text-shadow-blue"
                            : "text-leaf-faint"
                      }`}
                    >
                      {blocked === null
                        ? VERB_EFFECT[`${verb}|${vis}`]
                        : blocked.kind === "vow"
                          ? `His vow forbids it: ${blocked.text}`
                          : blocked.text}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!isHumanTurn && state.winner === null && (
        <p className="mt-2 font-body text-sm italic text-leaf-faint">
          Your rival moves. Only open acts will reach the chronicle.
        </p>
      )}
    </section>
  );
}
