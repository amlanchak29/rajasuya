/**
 * Goal-directed 1-ply agent — TypeScript port of python/agent.py.
 *
 * Scores the STATE each action produces (a flat verb-scorer never
 * invests toward an oath — see design doc §6). Still no tree search,
 * deliberately: the opponent must stay legible enough that a player
 * can reason about it and trap it.
 *
 * Float arithmetic mirrors the Python operation order exactly so that
 * argmax tie sets match bit-for-bit (validated in tests/seed-diff.test.ts).
 */

import {
  apply,
  legalActions,
  other,
  type Action,
  type State,
} from "./engine";

export type Dharma = "righteous" | "expedient";

interface Weights {
  oath: number;
  legit: number;
  held: number;
  lev: number;
  obl: number;
  deny: number;
  hidden: number;
  sealed: number;
}

export const DHARMA: Record<Dharma, Weights> = {
  // values the open path: legitimacy-heavy, reluctant to conceal
  righteous: {
    oath: 25,
    legit: 1.0,
    held: 5,
    lev: 1.5,
    obl: 0.8,
    deny: 0.6,
    hidden: -2.0,
    sealed: 6,
  },
  // values the oath itself: will conceal, will spend legitimacy
  expedient: {
    oath: 25,
    legit: 0.4,
    held: 5,
    lev: 2.0,
    obl: 1.0,
    deny: 1.0,
    hidden: 0.0,
    sealed: 16,
  },
};

export function value(state: State, me: State["active_player"], w: Weights) {
  const opp = other(me);
  let v = state.oaths[me] * w.oath + state.legitimacy[me] * w.legit;
  v -= state.oaths[opp] * w.oath * w.deny;
  for (const f of Object.values(state.figures)) {
    if (f.allegiance === me) {
      v += w.held;
      if (f.locked) {
        // A sealed king cannot be stolen. 1-ply cannot see future
        // theft, so denial value must be priced in directly — and
        // it must clear the lev/obl potentials that locking zeroes,
        // or concealed oaths never fire (measured: sealed < 12 for
        // expedient reads as zero concealed oaths).
        v += w.sealed;
      } else {
        v += Math.min(f.leverage[me], 2) * w.lev;
        v += Math.min(f.obligation[me], 6) * w.obl;
      }
    } else if (f.allegiance === opp) {
      v -= w.held * w.deny;
    } else {
      v += Math.min(f.obligation[me], 3) * w.obl;
    }
  }
  return v;
}

function score(state: State, a: Action, w: Weights): number {
  let v = value(apply(state, a), state.active_player, w);
  if (a.visibility === "hidden") v += w.hidden;
  return v;
}

/** Every legal action tying at the best score. Exposed so validation can
 * compare tie sets against Python without needing RNG parity. */
export function argmaxActions(state: State, dharma: Dharma): Action[] {
  const acts = legalActions(state);
  const w = DHARMA[dharma];
  const scores = acts.map((a) => score(state, a, w));
  const best = Math.max(...scores);
  return acts.filter((_, i) => scores[i] === best);
}

/** Pick the agent's move. `rng` returns a float in [0, 1) — pass
 * Math.random in the UI, or a seeded generator in tests. Random tiebreak
 * is load-bearing: a bare max starves figures whose names sort early. */
export function choose(
  state: State,
  dharma: Dharma,
  rng: () => number = Math.random,
): Action | null {
  const best = argmaxActions(state, dharma);
  if (best.length === 0) return null;
  return best[Math.floor(rng() * best.length)];
}
