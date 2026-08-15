import { useEffect, useRef, useState } from "react";
import {
  INDRAPRASTHA,
  MAGADHA,
  OATHS_TO_WIN,
  QUADRANTS,
  type Quadrant,
  type State,
} from "./engine/engine";
import { useGame, type Setup } from "./game/useGame";
import { guideLine } from "./game/guide";
import { PLAYER_NAME, QUADRANT_NAME } from "./game/text";
import SetupScreen from "./ui/SetupScreen";
import ScoreBar from "./ui/ScoreBar";
import GuideStrip from "./ui/GuideStrip";
import Board from "./ui/Board";
import ActionPanel from "./ui/ActionPanel";
import Chronicle from "./ui/Chronicle";

function verdict(state: State): { title: string; line: string } {
  const w = state.winner;
  if (w === "draw")
    return {
      title: "No decision",
      line: "Neither claim prevailed. The kings keep their own counsel.",
    };
  if (w === null) return { title: "", line: "" };
  if (state.oaths[w] >= OATHS_TO_WIN)
    return {
      title: PLAYER_NAME[w],
      line: `Four kings acknowledged ${PLAYER_NAME[w]} before the world. The sacrifice is theirs.`,
    };
  return {
    title: PLAYER_NAME[w],
    line: `At the twelfth turn legitimacy decided it: ${state.legitimacy[INDRAPRASTHA]} to ${state.legitimacy[MAGADHA]}.`,
  };
}

/** Announce session redraws and flare the newly lit courts — the redraw
 * happens after every act (in_session hashes actions_remaining), so it
 * must be narrated or it reads as arbitrary. */
function useSessionNarration(sessions: Set<Quadrant>, gameOver: boolean) {
  const [note, setNote] = useState<string | null>(null);
  const [justLit, setJustLit] = useState<Set<Quadrant>>(new Set());
  const [litStamp, setLitStamp] = useState(0);
  const prev = useRef<Set<Quadrant> | null>(null);

  useEffect(() => {
    const before = prev.current;
    prev.current = sessions;
    if (before === null || gameOver) return;
    const same =
      before.size === sessions.size &&
      [...sessions].every((q) => before.has(q));
    if (same) return;
    setJustLit(new Set([...sessions].filter((q) => !before.has(q))));
    setLitStamp((s) => s + 1);
    const sitting = QUADRANTS.filter((q) => sessions.has(q)).map((q) =>
      QUADRANT_NAME[q].replace("The", "the"),
    );
    setNote(`The courts rise — ${sitting.join(" and ")} now sit.`);
    const t = setTimeout(() => setNote(null), 4500);
    return () => clearTimeout(t);
  }, [sessions, gameOver]);

  return { note, justLit, litStamp };
}

function Game({ setup, onNewGame }: { setup: Setup; onNewGame: () => void }) {
  const { state, legal, sessions, act, isHumanTurn } = useGame(setup);
  const [selected, setSelected] = useState<string | null>(null);
  const { note, justLit, litStamp } = useSessionNarration(
    sessions,
    state.winner !== null,
  );
  const guide =
    state.winner === null && isHumanTurn ? guideLine(state, setup.human) : null;
  const v = verdict(state);

  return (
    <div className="flex min-h-screen flex-col">
      <ScoreBar state={state} human={setup.human} isHumanTurn={isHumanTurn} />
      <GuideStrip guide={guide} sessionNote={note} />
      <div className="flex grow flex-col gap-3 p-3 lg:flex-row">
        <Board
          state={state}
          sessions={sessions}
          human={setup.human}
          justLit={justLit}
          litStamp={litStamp}
          selected={selected}
          onSelect={(id) => setSelected(id === selected ? null : id)}
        />
        <aside className="flex flex-col gap-3 lg:w-80 lg:shrink-0">
          <ActionPanel
            state={state}
            legal={legal}
            human={setup.human}
            isHumanTurn={isHumanTurn}
            selected={selected}
            onAct={act}
          />
          <Chronicle state={state} />
        </aside>
      </div>

      {state.winner !== null && (
        <div className="fixed inset-0 grid place-items-center bg-hall/80 p-6">
          <div className="max-w-md rounded-lg border border-line-bright bg-court p-8 text-center">
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
            <button
              onClick={onNewGame}
              className="mt-6 rounded bg-indra px-6 py-2 font-chrome font-bold text-hall hover:brightness-110"
            >
              New game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [setup, setSetup] = useState<Setup | null>(null);
  if (!setup) return <SetupScreen onBegin={setSetup} />;
  return (
    <Game
      key={`${setup.human}-${setup.aiDharma}-${setup.seed}`}
      setup={setup}
      onNewGame={() => setSetup(null)}
    />
  );
}
