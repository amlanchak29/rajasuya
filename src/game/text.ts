/** All player-facing copy in one place. Language rules (design doc §5):
 * Sanskrit for the four verbs only, no diacritics, everything else plain
 * English, no religious content. */
import {
  blockingVows,
  inSession,
  VOW_TEXT,
  type Action,
  type Player,
  type State,
  type Verb,
} from "../engine/engine";

export const PLAYER_NAME: Record<Player, string> = {
  indraprastha: "Indraprastha",
  magadha: "Magadha",
};

export const PLAYER_EPITHET: Record<Player, string> = {
  indraprastha: "Yudhishthira's claim",
  magadha: "Jarasandha's claim",
};

export const FIGURE_NAME: Record<string, string> = {
  bhagadatta: "Bhagadatta",
  shakuni: "Shakuni",
  susharma: "Susharma",
  shishupala: "Shishupala",
  karna: "Karna",
  paundraka: "Paundraka",
  rukmi: "Rukmi",
  nila: "Nila",
  pandya: "Pandya",
  shalya: "Shalya",
  jayadratha: "Jayadratha",
  kritavarma: "Kritavarma",
};

export const QUADRANT_NAME: Record<string, string> = {
  north: "The North",
  east: "The East",
  south: "The South",
  west: "The West",
};

export const VERB_GLOSS: Record<Verb, string> = {
  satkara: "hospitality",
  yachana: "petition",
  mantrana: "counsel",
  pratigya: "the oath",
};

export const VERB_EFFECT: Record<string, string> = {
  "satkara|open": "+2 obligation, +1 legitimacy",
  "yachana|open": "claims his allegiance, +2 legitimacy",
  "yachana|hidden": "claims his allegiance, unseen",
  "mantrana|hidden": "+2 leverage, unseen",
  "pratigya|open": "seals him before the world: +1 oath, +3 legitimacy",
  "pratigya|hidden": "seals him in shadow: held, but no nearer the sacrifice",
};

const LOG_VERB: Record<string, string> = {
  satkara: "honoured",
  yachana: "petitioned",
  pratigya: "took the oath of",
};

export function logLine(entry: {
  actor: Player;
  verb: Verb;
  target: string;
}): string {
  return `${PLAYER_NAME[entry.actor]} ${LOG_VERB[entry.verb]} ${FIGURE_NAME[entry.target]}`;
}

/** Why a closed action is closed — blocking_vows() is the tutorial
 * (design doc §5). Vow blocks are quoted in the vow-holder's terms;
 * everything else states the unmet requirement plainly. */
export function explainBlocked(state: State, action: Action): string {
  const target = action.target as string;
  const f = state.figures[target];
  const me = action.actor;

  if (f.locked) return "He is sworn. Nothing more can be asked of him.";
  if (!inSession(state).has(f.quadrant)) return "His court is not in session.";

  const vows = blockingVows(state, action);
  if (vows.length > 0) {
    const [holder, vowId] = vows[0];
    return `${FIGURE_NAME[holder]} ${VOW_TEXT[vowId]}.`;
  }

  if (action.verb === "yachana") {
    const need = action.visibility === "open" ? 3 : 4;
    return `A ${action.visibility} petition needs obligation ${need}; he owes you ${f.obligation[me]}.`;
  }
  if (action.verb === "pratigya") {
    if (f.allegiance !== me) return "He has not given you his allegiance.";
    return `The oath needs leverage 2 or obligation 6; you hold ${f.leverage[me]} and ${f.obligation[me]}.`;
  }
  return "Not possible now.";
}
