/** The guide teaches one concept at a time, reading progress straight from
 * the state — no lesson bookkeeping. It walks the ladder (hospitality →
 * petition → leverage → oath), gives one vow-trap lesson after the first
 * seal, then retires. Teaching stays in situ per design doc §5: this is a
 * single line of counsel, never a rules screen. */
import type { Player, State } from "../engine/engine";
import {
  OATH_LEVERAGE,
  OATH_OBLIGATION,
  PETITION_MIN,
  progressOf,
} from "./progress";
import { FIGURE_NAME } from "./text";

export interface GuideLine {
  id: string;
  text: string;
}

export function guideLine(
  state: State,
  human: Player,
  veiled = false,
): GuideLine | null {
  const ids = Object.keys(state.figures);
  const prog = ids.map(
    (id) => [id, progressOf(state, id, human, veiled)] as const,
  );

  const seals = prog.filter(
    ([id, p]) => p.locked && state.figures[id].allegiance === human,
  );
  const allies = prog.filter(([, p]) => p.allied);
  const anyObligation = prog.some(([, p]) => !p.locked && p.obligation > 0);
  const petitionReady = prog.find(([, p]) => p.petitionReady);
  const oathReady = prog.find(([, p]) => p.oathReady);
  // atRisk reads the rival's numbers — never surface it under the veil.
  const atRisk = veiled ? undefined : prog.find(([, p]) => p.atRisk);
  const stealReady = prog.find(([, p]) => p.stealReady);

  if (seals.length >= 3) return null;

  if (seals.length >= 1) {
    if (oathReady) {
      const [id] = oathReady;
      return {
        id: "oath",
        text: `${FIGURE_NAME[id]} is ready to swear — Pratigya seals him forever.`,
      };
    }
    if (atRisk) {
      const [id] = atRisk;
      return {
        id: "defend",
        text:
          `${FIGURE_NAME[id]} is yours — but your rival's debt on him ` +
          "clears the petition bar. Allegiance can be stolen; only the " +
          "oath is forever. Seal him, or accept the risk.",
      };
    }
    if (stealReady) {
      const [id] = stealReady;
      return {
        id: "steal",
        text:
          `${FIGURE_NAME[id]} leans to your rival but is not sworn. He ` +
          "owes you enough to hear you — your petition would turn him.",
      };
    }
    return {
      id: "vow-trap",
      text:
        "You know the way now. Vows cut both ways — a rival who swears " +
        "Shishupala in secret shuts Shalya's door on himself. Play their " +
        "vows against them.",
    };
  }

  if (allies.length === 0) {
    if (petitionReady) {
      const [id] = petitionReady;
      return {
        id: "petition",
        text:
          `${FIGURE_NAME[id]} owes you enough to hear you. Yachana — the ` +
          "petition — claims his allegiance: quietly and cheap, or before " +
          "the court at a higher price, for legitimacy.",
      };
    }
    if (anyObligation)
      return {
        id: "build",
        text:
          "Debt opens doors. Each hospitality adds 2 to what a king owes " +
          `you; at ${PETITION_MIN} he will hear a quiet petition.`,
      };
    return {
      id: "hospitality",
      text:
        "Every king begins a stranger. Offer Satkara — hospitality — in a " +
        "lit court; a king who accepts owes you for it.",
    };
  }

  if (oathReady) {
    const [id] = oathReady;
    return {
      id: "oath",
      text:
        `${FIGURE_NAME[id]} is ready to swear. Pratigya — the oath — seals ` +
        "him forever. Sworn openly it counts toward your four; hidden, it " +
        "only denies him to your rival.",
    };
  }

  return {
    id: "leverage",
    text:
      "Allegiance can still be stolen — only an oath is forever. Mantrana " +
      `— private counsel — builds leverage; at ${OATH_LEVERAGE}, or ` +
      `obligation ${OATH_OBLIGATION}, the oath is yours to take.`,
  };
}
