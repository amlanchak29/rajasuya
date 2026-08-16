import { useEffect, useRef, useState } from "react";
import { QUADRANTS, type Player, type Quadrant, type State } from "./engine/engine";
import { useGame, type Setup } from "./game/useGame";
import { guideLine } from "./game/guide";
import { logLine, PLAYER_NAME, QUADRANT_NAME } from "./game/text";
import SetupScreen from "./ui/SetupScreen";
import ScoreBar from "./ui/ScoreBar";
import GuideStrip from "./ui/GuideStrip";
import Board from "./ui/Board";
import ActionPanel from "./ui/ActionPanel";
import Chronicle from "./ui/Chronicle";
import Ceremony, { type OathCeremony } from "./ui/Ceremony";
import Summary from "./ui/Summary";
import TitleScreen from "./ui/TitleScreen";
import TheWay, { WAY_SEEN_KEY } from "./ui/TheWay";
import SoundToggle from "./ui/SoundToggle";
import { PORTRAITS } from "./ui/assets";
import { initSound, playSfx } from "./game/sound";
import type { Action } from "./engine/engine";

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
    playSfx("courts");
    const t = setTimeout(() => setNote(null), 4500);
    return () => clearTimeout(t);
  }, [sessions, gameOver]);

  return { note, justLit, litStamp };
}

/** Watch for figures becoming locked: open oaths (in the public log) get
 * a ceremony for either actor; a concealed oath gets its private version
 * only when it is the human's own — the rival's secret stays secret. */
function useOathCeremony(state: State, human: Player) {
  const [ceremony, setCeremony] = useState<OathCeremony | null>(null);
  const prev = useRef(state);
  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    if (before === state) return;
    for (const [id, f] of Object.entries(state.figures)) {
      if (!f.locked || before.figures[id]?.locked || f.allegiance === null)
        continue;
      const open = state.log.some(
        (e) => e.verb === "pratigya" && e.target === id,
      );
      if (open || f.allegiance === human) {
        setCeremony((c) => ({
          figure: id,
          actor: f.allegiance!,
          open,
          stamp: (c?.stamp ?? 0) + 1,
        }));
      }
    }
  }, [state, human]);
  return { ceremony, dismiss: () => setCeremony(null) };
}

/** What an act sounds like. Oaths stay silent here — their ceremony
 * carries the gong or the seal. */
function sfxFor(a: Action): "tap" | "chime" | "thud" | null {
  if (a.verb === "pratigya") return null;
  if (a.verb === "pass") return "tap";
  return a.visibility === "open" ? "chime" : "thud";
}

function Game({ setup, onNewGame }: { setup: Setup; onNewGame: () => void }) {
  const { state, legal, sessions, act, isHumanTurn, ai, aiAct } =
    useGame(setup);
  const [selected, setSelected] = useState<string | null>(null);
  const [showWay, setShowWay] = useState(false);
  const [flash, setFlash] = useState<{ id: string; stamp: number } | null>(
    null,
  );

  // The rival's acts get quieter voices: a tap in the open, a low thud
  // unseen. Its target card flashes when the act was public.
  useEffect(() => {
    if (aiAct === null) return;
    playSfx(aiAct.action.visibility === "open" ? "tap" : "thud");
    if (aiAct.action.visibility === "open" && aiAct.action.target !== null) {
      const target = aiAct.action.target;
      setFlash((f) => ({ id: target, stamp: (f?.stamp ?? 0) + 1 }));
    }
  }, [aiAct]);
  const { note, justLit, litStamp } = useSessionNarration(
    sessions,
    state.winner !== null,
  );
  const { ceremony, dismiss } = useOathCeremony(state, setup.human);

  useEffect(() => {
    if (ceremony !== null) playSfx(ceremony.open ? "gong" : "seal");
  }, [ceremony]);

  useEffect(() => {
    if (state.winner !== null) playSfx("victory");
  }, [state.winner]);
  const guide =
    state.winner === null && isHumanTurn
      ? guideLine(state, setup.human, setup.veiled)
      : null;

  const aiOpen = aiAct !== null && aiAct.action.visibility === "open";
  const aiToastText =
    aiAct === null
      ? null
      : aiAct.action.verb === "pass"
        ? `${PLAYER_NAME[ai]} waits out the session.`
        : aiOpen
          ? logLine({
              actor: aiAct.action.actor,
              verb: aiAct.action.verb,
              target: aiAct.action.target as string,
            })
          : `${PLAYER_NAME[ai]} moves unseen.`;

  return (
    <div className="flex min-h-screen flex-col">
      <ScoreBar
        state={state}
        human={setup.human}
        veiled={setup.veiled}
        isHumanTurn={isHumanTurn}
        onShowWay={() => setShowWay(true)}
      />
      <GuideStrip guide={guide} sessionNote={note} />
      <div className="flex grow flex-col gap-3 p-3 lg:flex-row">
        <Board
          state={state}
          sessions={sessions}
          human={setup.human}
          veiled={setup.veiled}
          justLit={justLit}
          litStamp={litStamp}
          flash={flash}
          selected={selected}
          onSelect={(id) => setSelected(id === selected ? null : id)}
        />
        <aside className="flex flex-col gap-3 lg:w-80 lg:shrink-0">
          <ActionPanel
            state={state}
            legal={legal}
            human={setup.human}
            veiled={setup.veiled}
            isHumanTurn={isHumanTurn}
            selected={selected}
            onAct={(a) => {
              const s = sfxFor(a);
              if (s) playSfx(s);
              if (a.target !== null) {
                const target = a.target;
                setFlash((f) => ({
                  id: target,
                  stamp: (f?.stamp ?? 0) + 1,
                }));
              }
              act(a);
            }}
          />
          <Chronicle state={state} />
        </aside>
      </div>

      {aiToastText !== null && state.winner === null && (
        <div
          key={aiAct!.stamp}
          className="toast-fade pointer-events-none fixed bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-line-bright bg-court px-4 py-2 shadow-lg"
        >
          {aiOpen && aiAct!.action.target !== null && (
            <img
              src={PORTRAITS[aiAct!.action.target]}
              alt=""
              className="h-10 w-8 rounded object-cover object-top"
            />
          )}
          <span
            className={`font-body italic ${aiOpen ? "text-leaf-dim" : "text-shadow-blue"}`}
          >
            {aiToastText}
          </span>
        </div>
      )}

      <SoundToggle />

      {showWay && <TheWay onDone={() => setShowWay(false)} />}

      {ceremony !== null && (
        <Ceremony ceremony={ceremony} state={state} onClose={dismiss} />
      )}

      {state.winner !== null && ceremony === null && (
        <Summary state={state} onNewGame={onNewGame} />
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<"title" | "way" | "setup">("title");
  const [setup, setSetup] = useState<Setup | null>(null);

  if (setup !== null)
    return (
      <Game
        key={`${setup.human}-${setup.aiDharma}-${setup.seed}-${setup.mode}-${setup.veiled}`}
        setup={setup}
        onNewGame={() => {
          setSetup(null);
          setScreen("setup");
        }}
      />
    );
  if (screen === "title")
    return (
      <TitleScreen
        onEnter={() => {
          initSound();
          setScreen(localStorage.getItem(WAY_SEEN_KEY) ? "setup" : "way");
        }}
        onLearn={() => {
          initSound();
          setScreen("way");
        }}
      />
    );
  if (screen === "way") return <TheWay onDone={() => setScreen("setup")} />;
  return <SetupScreen onBegin={setSetup} />;
}
