/** The ladder to an oath, from one player's side. Threshold logic mirrors
 * the engine's base requirements; vows and sessions can still bar a step —
 * legality always comes from legalActions(), never from here. */
import type { Player, State } from "../engine/engine";

export interface Progress {
  obligation: number;
  leverage: number;
  /** His allegiance is yours. */
  allied: boolean;
  /** His allegiance lies with your rival (stealable until he is sworn). */
  rivalAllied: boolean;
  locked: boolean;
  /** Obligation clears the open-petition bar and he is not yet yours. */
  petitionReady: boolean;
  /** Allied, and leverage or obligation clears the oath bar. */
  oathReady: boolean;
}

export function progressOf(state: State, id: string, me: Player): Progress {
  const f = state.figures[id];
  const obligation = f.obligation[me];
  const leverage = f.leverage[me];
  const allied = f.allegiance === me;
  return {
    obligation,
    leverage,
    allied,
    rivalAllied: f.allegiance !== null && !allied,
    locked: f.locked,
    petitionReady: !f.locked && !allied && obligation >= 3,
    oathReady: !f.locked && allied && (leverage >= 2 || obligation >= 6),
  };
}
