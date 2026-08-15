import { useEffect, useMemo, useState } from "react";
import {
  apply,
  initialState,
  inSession,
  legalActions,
  other,
  type Action,
  type Player,
  type State,
} from "../engine/engine";
import { choose, type Dharma } from "../engine/agent";

export type Mode = "quick" | "digvijaya";

/** Measured configs only — see python/variant_study.py before adding. */
export const MODES: Record<Mode, { turns: number; oaths: number }> = {
  quick: { turns: 12, oaths: 4 },
  digvijaya: { turns: 16, oaths: 6 },
};

export interface Setup {
  human: Player;
  aiDharma: Dharma;
  seed: number;
  mode: Mode;
  /** Veiled numbers: the UI hides the rival's obligation/leverage and
   * concealed-oath count. Pure presentation — the engine is unchanged
   * (design doc §8 leaves this to human play; we make it a choice). */
  veiled: boolean;
}

/** One beat per AI act so its turn reads as play, not as a log diff. */
const AI_BEAT_MS = 1400;

export interface AiAct {
  action: Action;
  /** Monotonic stamp so the toast retriggers per act. */
  stamp: number;
}

export function useGame(setup: Setup) {
  const [state, setState] = useState<State>(() => {
    const { turns, oaths } = MODES[setup.mode];
    return initialState(setup.seed, turns, oaths);
  });
  const [aiAct, setAiAct] = useState<AiAct | null>(null);
  const ai = other(setup.human);
  const isHumanTurn =
    state.winner === null && state.active_player === setup.human;

  useEffect(() => {
    if (state.winner !== null || state.active_player !== ai) return;
    const t = setTimeout(() => {
      const a = choose(state, setup.aiDharma);
      if (a) {
        setState(apply(state, a));
        setAiAct((prev) => ({ action: a, stamp: (prev?.stamp ?? 0) + 1 }));
      }
    }, AI_BEAT_MS);
    return () => clearTimeout(t);
  }, [state, ai, setup.aiDharma]);

  const legal = useMemo(() => legalActions(state), [state]);
  const sessions = useMemo(() => inSession(state), [state]);

  const act = (a: Action) => {
    if (isHumanTurn) setState(apply(state, a));
  };

  return { state, legal, sessions, act, isHumanTurn, ai, aiAct };
}

/** Who sealed this figure, and was the oath sworn before the world?
 * Open oaths are in the public log; a locked figure absent from it was
 * sworn in secret. His allegiance names the holder — nothing can change
 * allegiance after the lock. */
export function sealOf(
  state: State,
  figureId: string,
): { holder: Player; open: boolean } | null {
  const f = state.figures[figureId];
  if (!f.locked || f.allegiance === null) return null;
  const open = state.log.some(
    (e) => e.verb === "pratigya" && e.target === figureId,
  );
  return { holder: f.allegiance, open };
}
