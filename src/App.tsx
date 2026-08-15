import { useState } from "react";
import {
  INDRAPRASTHA,
  MAGADHA,
  OATHS_TO_WIN,
  type State,
} from "./engine/engine";
import { useGame, type Setup } from "./game/useGame";
import { PLAYER_NAME } from "./game/text";
import SetupScreen from "./ui/SetupScreen";
import ScoreBar from "./ui/ScoreBar";
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
    line: `At the twelfth turn the world's regard decided it: ${state.legitimacy[INDRAPRASTHA]} to ${state.legitimacy[MAGADHA]}.`,
  };
}

function Game({ setup, onNewGame }: { setup: Setup; onNewGame: () => void }) {
  const { state, legal, sessions, act, isHumanTurn } = useGame(setup);
  const [selected, setSelected] = useState<string | null>(null);
  const v = verdict(state);

  return (
    <div className="flex min-h-screen flex-col">
      <ScoreBar state={state} human={setup.human} isHumanTurn={isHumanTurn} />
      <div className="flex grow flex-col gap-3 p-3 lg:flex-row">
        <Board
          state={state}
          sessions={sessions}
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
