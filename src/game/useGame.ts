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

export interface Setup {
  human: Player;
  aiDharma: Dharma;
  seed: number;
}

const AI_BEAT_MS = 900;

export function useGame(setup: Setup) {
  const [state, setState] = useState<State>(() => initialState(setup.seed));
  const ai = other(setup.human);
  const isHumanTurn =
    state.winner === null && state.active_player === setup.human;

  useEffect(() => {
    if (state.winner !== null || state.active_player !== ai) return;
    const t = setTimeout(() => {
      const a = choose(state, setup.aiDharma);
      if (a) setState(apply(state, a));
    }, AI_BEAT_MS);
    return () => clearTimeout(t);
  }, [state, ai, setup.aiDharma]);

  const legal = useMemo(() => legalActions(state), [state]);
  const sessions = useMemo(() => inSession(state), [state]);

  const act = (a: Action) => {
    if (isHumanTurn) setState(apply(state, a));
  };

  return { state, legal, sessions, act, isHumanTurn, ai };
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
