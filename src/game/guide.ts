/** The guide teaches one concept at a time, reading progress straight from
 * the state — no lesson bookkeeping. It walks the ladder (hospitality →
 * petition → leverage → oath), gives one vow-trap lesson after the first
 * seal, then retires. Teaching stays in situ per design doc §5: this is a
 * single line of counsel, never a rules screen. */
import type { Player, State } from "../engine/engine";
import { progressOf } from "./progress";
import { FIGURE_NAME } from "./text";

export interface GuideLine {
  id: string;
  text: string;
}

export function guideLine(state: State, human: Player): GuideLine | null {
  const ids = Object.keys(state.figures);
  const prog = ids.map((id) => [id, progressOf(state, id, human)] as const);

  const seals = prog.filter(
    ([id, p]) => p.locked && state.figures[id].allegiance === human,
  );
  const allies = prog.filter(([, p]) => p.allied);
  const anyObligation = prog.some(([, p]) => !p.locked && p.obligation > 0);
  const petitionReady = prog.find(([, p]) => p.petitionReady);
  const oathReady = prog.find(([, p]) => p.oathReady);

  if (seals.length >= 2) return null;

  if (seals.length === 1)
    return {
      id: "vow-trap",
      text:
        "You know the way now. Vows cut both ways — a rival who swears " +
        "Shishupala in secret shuts Shalya's door on himself. Play their " +
        "vows against them.",
    };

  if (allies.length === 0) {
    if (petitionReady) {
      const [id] = petitionReady;
      return {
        id: "petition",
        text:
          `${FIGURE_NAME[id]} owes you enough to hear you. Yachana — the ` +
          "petition — claims his allegiance: openly for legitimacy, or " +
          "hidden to keep it out of the chronicle.",
      };
    }
    if (anyObligation)
      return {
        id: "build",
        text:
          "Debt opens doors. Each hospitality adds 2 to what a king owes " +
          "you; at 3 he will hear your petition.",
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
      "— private counsel — builds leverage; at 2, or obligation 6, the " +
      "oath is yours to take.",
  };
}
