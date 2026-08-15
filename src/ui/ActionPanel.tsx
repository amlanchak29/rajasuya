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
import {
  explainBlocked,
  FIGURE_NAME,
  QUADRANT_NAME,
  VERB_EFFECT,
  VERB_GLOSS,
} from "../game/text";

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
          <div className="font-display text-xl text-leaf">
            {FIGURE_NAME[selected]}
            <span className="ml-2 font-chrome text-xs uppercase tracking-wide text-leaf-faint">
              {QUADRANT_NAME[state.figures[selected].quadrant]}
            </span>
          </div>
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
              return (
                <li key={`${verb}-${vis}`}>
                  <button
                    disabled={!isLegal}
                    onClick={() => onAct(action)}
                    className={`w-full rounded border px-3 py-1.5 text-left ${
                      isLegal
                        ? "border-line-bright bg-court hover:border-indra"
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
                        isLegal ? "text-leaf-dim" : "italic text-leaf-faint"
                      }`}
                    >
                      {isLegal || !isHumanTurn
                        ? VERB_EFFECT[`${verb}|${vis}`]
                        : explainBlocked(state, { ...action, actor: human })}
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
