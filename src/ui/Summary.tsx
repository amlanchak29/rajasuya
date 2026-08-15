import {
  INDRAPRASTHA,
  MAGADHA,
  type Player,
  type State,
} from "../engine/engine";
import { sealOf } from "../game/useGame";
import { FIGURE_NAME, PLAYER_NAME } from "../game/text";
import { PORTRAITS, SIGILS } from "./assets";

const NUMBER_WORD: Record<number, string> = {
  4: "Four",
  5: "Five",
  6: "Six",
};

function verdict(state: State): { title: string; line: string } {
  const w = state.winner;
  if (w === "draw")
    return {
      title: "No decision",
      line: "Neither claim prevailed. The kings keep their own counsel.",
    };
  if (w === null) return { title: "", line: "" };
  if (state.oaths[w] >= state.oaths_to_win)
    return {
      title: PLAYER_NAME[w],
      line: `${NUMBER_WORD[state.oaths_to_win] ?? state.oaths_to_win} kings acknowledged ${PLAYER_NAME[w]} before the world. The sacrifice is theirs.`,
    };
  return {
    title: PLAYER_NAME[w],
    line: `At the final turn legitimacy decided it: ${state.legitimacy[INDRAPRASTHA]} to ${state.legitimacy[MAGADHA]}.`,
  };
}

const tint = (p: Player) => (p === INDRAPRASTHA ? "text-indra" : "text-magadha");

function fate(state: State, id: string): { text: string; className: string } {
  const seal = sealOf(state, id);
  if (seal && seal.open)
    return {
      text: `sworn to ${PLAYER_NAME[seal.holder]} before the world`,
      className: tint(seal.holder),
    };
  if (seal)
    return {
      text: `sealed by ${PLAYER_NAME[seal.holder]} in shadow`,
      className: "text-shadow-blue",
    };
  const a = state.figures[id].allegiance;
  if (a !== null)
    return {
      text: `allied to ${PLAYER_NAME[a]}, never sworn`,
      className: "text-leaf-dim",
    };
  return { text: "kept his own counsel", className: "text-leaf-faint" };
}

/** How the game ended, king by king — the chronicle's last page. */
export default function Summary({
  state,
  onNewGame,
}: {
  state: State;
  onNewGame: () => void;
}) {
  const v = verdict(state);
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto bg-hall/95 p-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-line-bright bg-court p-8">
        <div className="text-center">
          {state.winner !== "draw" && state.winner !== null && (
            <img
              src={SIGILS[state.winner]}
              alt=""
              className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
            />
          )}
          <div
            className={`font-display text-4xl ${
              state.winner === INDRAPRASTHA
                ? "text-indra"
                : state.winner === MAGADHA
                  ? "text-magadha"
                  : "text-leaf"
            }`}
          >
            {v.title}
          </div>
          <p className="mt-3 font-body text-lg italic text-leaf-dim">
            {v.line}
          </p>
          <div className="mt-4 flex justify-center gap-8 font-chrome text-sm text-leaf-dim">
            {([INDRAPRASTHA, MAGADHA] as const).map((p) => (
              <span key={p}>
                <span className={tint(p)}>{PLAYER_NAME[p]}</span> — oaths{" "}
                {state.oaths[p]}, legitimacy {state.legitimacy[p]}, in shadow{" "}
                {state.concealed_oaths[p]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.keys(state.figures).map((id) => {
            const f = fate(state, id);
            return (
              <div
                key={id}
                className="flex items-center gap-2 rounded border border-line bg-court-closed p-2"
              >
                <img
                  src={PORTRAITS[id]}
                  alt=""
                  className="h-12 w-10 shrink-0 rounded object-cover object-top"
                />
                <div className="min-w-0">
                  <div className="font-display text-sm leading-tight text-leaf">
                    {FIGURE_NAME[id]}
                  </div>
                  <div
                    className={`font-body text-xs italic leading-snug ${f.className}`}
                  >
                    {f.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onNewGame}
          className="mt-6 w-full rounded bg-indra px-6 py-2 font-chrome font-bold text-hall hover:brightness-110"
        >
          New game
        </button>
      </div>
    </div>
  );
}
