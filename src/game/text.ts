/** All player-facing copy in one place. Language rules (design doc §5):
 * Sanskrit for the four verbs only, no diacritics, everything else plain
 * English, no religious content. */
import {
  blockingVows,
  COUNSEL_BINDS,
  inSession,
  VOW_TEXT,
  YACHANA_NEED,
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

/** Two very different kinds of "no": a vow (permanent, the interesting
 * kind — blocking_vows() is the tutorial, design doc §5) and a gap you
 * can close with play. The UI styles them differently. */
export interface Blocked {
  kind: "locked" | "court" | "vow" | "gap";
  text: string;
}

function hospitalityHint(missing: number): string {
  const n = Math.ceil(missing / 2);
  return n === 1 ? "One more hospitality" : `${n} more hospitality`;
}

export function explainBlocked(state: State, action: Action): Blocked {
  const target = action.target as string;
  const f = state.figures[target];
  const me = action.actor;

  if (f.locked)
    return {
      kind: "locked",
      text: "He is sworn. Nothing more can be asked of him.",
    };
  if (!inSession(state).has(f.quadrant))
    return { kind: "court", text: "His court is not in session." };

  const vows = blockingVows(state, action);
  if (vows.length > 0) {
    const [holder, vowId] = vows[0];
    return { kind: "vow", text: `${FIGURE_NAME[holder]} ${VOW_TEXT[vowId]}.` };
  }

  if (action.verb === "yachana") {
    let need = YACHANA_NEED[action.visibility];
    const defender =
      COUNSEL_BINDS && f.allegiance !== null && f.allegiance !== me
        ? f.allegiance
        : null;
    if (defender !== null) need += f.leverage[defender];
    return {
      kind: "gap",
      text:
        `${hospitalityHint(need - f.obligation[me])} opens the ${action.visibility} petition (obligation ${f.obligation[me]} of ${need}` +
        (defender !== null && f.leverage[defender] > 0
          ? ` — his allegiance is defended by counsel).`
          : `).`),
    };
  }
  if (action.verb === "pratigya") {
    if (f.allegiance !== me)
      return {
        kind: "gap",
        text: "Petition him first — the oath needs his allegiance.",
      };
    return {
      kind: "gap",
      text: `Counsel him for leverage (${f.leverage[me]} of 2), or reach obligation 6 (${hospitalityHint(6 - f.obligation[me]).toLowerCase()}).`,
    };
  }
  return { kind: "gap", text: "Not possible now." };
}
