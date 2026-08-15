/** The ladder to an oath, from one player's side. Threshold logic mirrors
 * the engine's base requirements (via its exported rule constants) —
 * legality always comes from legalActions(); these are advisory readouts
 * for bars, badges, and the guide, and they ignore vow blocks. */
import {
  COUNSEL_BINDS,
  HIDDEN,
  OPEN,
  other,
  YACHANA_NEED,
  type Player,
  type State,
} from "../engine/engine";

export const PETITION_MIN = Math.min(YACHANA_NEED[OPEN], YACHANA_NEED[HIDDEN]);
export const OATH_OBLIGATION = 6;
export const OATH_LEVERAGE = 2;

/** Obligation a petition by `by` needs against this figure, counting the
 * counsel-binds defense when the target is allied to the rival. */
export function petitionBar(state: State, id: string, by: Player): number {
  const f = state.figures[id];
  let need = PETITION_MIN;
  if (COUNSEL_BINDS && f.allegiance !== null && f.allegiance !== by) {
    need += f.leverage[f.allegiance];
  }
  return need;
}

export interface Progress {
  obligation: number;
  leverage: number;
  /** His allegiance is yours. */
  allied: boolean;
  /** His allegiance lies with your rival (stealable until he is sworn). */
  rivalAllied: boolean;
  locked: boolean;
  /** Obligation clears the petition bar against an unallied king. */
  petitionReady: boolean;
  /** A rival ally your petition could turn right now. */
  stealReady: boolean;
  /** Your unsworn ally whom the rival's obligation could turn. */
  atRisk: boolean;
  /** Allied, and leverage or obligation clears the oath bar. */
  oathReady: boolean;
}

/** With `veiled`, advisory readouts use only what the player may see:
 * the steal bar ignores the rival's hidden leverage (the engine's actual
 * refusal is the surprise), and atRisk is computed but must not be shown. */
export function progressOf(
  state: State,
  id: string,
  me: Player,
  veiled = false,
): Progress {
  const f = state.figures[id];
  const rival = other(me);
  const obligation = f.obligation[me];
  const leverage = f.leverage[me];
  const allied = f.allegiance === me;
  const rivalAllied = f.allegiance === rival;
  const bar = veiled ? PETITION_MIN : petitionBar(state, id, me);
  const clears = !f.locked && obligation >= bar;
  return {
    obligation,
    leverage,
    allied,
    rivalAllied,
    locked: f.locked,
    petitionReady: clears && f.allegiance === null,
    stealReady: clears && rivalAllied,
    atRisk:
      !f.locked &&
      allied &&
      f.obligation[rival] >= petitionBar(state, id, rival),
    oathReady:
      !f.locked &&
      allied &&
      (leverage >= OATH_LEVERAGE || obligation >= OATH_OBLIGATION),
  };
}
