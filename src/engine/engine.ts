/**
 * Rajasuya engine — TypeScript port of python/engine_r9.py.
 *
 * The Python file is the source of truth for all rules; this port is
 * validated by seed-diffing (tests/seed-diff.test.ts) and must stay a
 * mechanical translation. Invariants (see python/README.md):
 *   1. State is JSON-serializable. Vows are data; predicates live in
 *      VOW_REGISTRY, keyed by id. No closures in state, ever.
 *   2. apply() is pure: deep-copies, never mutates its argument. No I/O,
 *      no RNG. Session draws derive from (seed, turn, actions_remaining).
 *   3. Vows only subtract. legalActions() generates the full space, then
 *      folds predicates over it. The pass floor is in the generator.
 *   4. Only open oaths advance the oath victory (r9).
 */

export const SATKARA = "satkara";
export const YACHANA = "yachana";
export const MANTRANA = "mantrana";
export const PRATIGYA = "pratigya";
export const VERBS = [SATKARA, YACHANA, MANTRANA, PRATIGYA] as const;

// The floor (r8): legal only when nothing else is. Burns the action.
export const PASS = "pass";

export const OPEN = "open";
export const HIDDEN = "hidden";

export type Verb = (typeof VERBS)[number];
export type Visibility = typeof OPEN | typeof HIDDEN;

const VERB_VISIBILITY: Record<Verb, readonly Visibility[]> = {
  [SATKARA]: [OPEN],
  [MANTRANA]: [HIDDEN],
  [YACHANA]: [OPEN, HIDDEN],
  [PRATIGYA]: [OPEN, HIDDEN],
};

export const INDRAPRASTHA = "indraprastha"; // Yudhishthira's claim
export const MAGADHA = "magadha"; // Jarasandha's claim
export const PLAYERS = [INDRAPRASTHA, MAGADHA] as const;

export type Player = (typeof PLAYERS)[number];

export const ACTIONS_PER_TURN = 3;
export const TURN_LIMIT = 12;
export const OATHS_TO_WIN = 4;
export const SESSIONS_PER_TURN = 2;

// r10 — mirrors python/engine_r9.py (measured: variant_study.py rounds
// 3 and 5; flip+bind even within noise at both clocks). YACHANA_NEED:
// the price flip — a hidden petition is cheaper than an open one, so
// legitimacy costs tempo. COUNSEL_BINDS: petitioning a figure allied to
// your rival additionally requires beating the rival's leverage on him.
export const YACHANA_NEED: Record<Visibility, number> = {
  [OPEN]: 4,
  [HIDDEN]: 3,
};
export const COUNSEL_BINDS = true;

export function other(p: Player): Player {
  return p === INDRAPRASTHA ? MAGADHA : INDRAPRASTHA;
}

// ---------------------------------------------------------------------------
// The four directions
// ---------------------------------------------------------------------------

export const QUADRANTS = ["north", "east", "south", "west"] as const;
export type Quadrant = (typeof QUADRANTS)[number];

export interface Vow {
  id: string;
  params: Record<string, unknown>;
}

export interface Figure {
  quadrant: Quadrant;
  allegiance: Player | null;
  locked: boolean;
  obligation: Record<Player, number>;
  leverage: Record<Player, number>;
  vows: Vow[];
}

export interface Action {
  actor: Player;
  verb: Verb | typeof PASS;
  target: string | null;
  visibility: Visibility;
}

export interface LogEntry {
  turn: number;
  actor: Player;
  verb: Verb;
  target: string;
}

export interface State {
  turn: number;
  turn_limit: number;
  oaths_to_win: number;
  active_player: Player;
  actions_remaining: number;
  seed: number;
  figures: Record<string, Figure>;
  legitimacy: Record<Player, number>;
  concealed_oaths: Record<Player, number>;
  oaths: Record<Player, number>;
  gratitude: Record<string, Player[]>;
  log: LogEntry[];
  winner: Player | "draw" | null;
}

/** A court convenes only where there is business: at least one figure
 * not yet locked by an oath. Actor-independent, so sessions stay blind
 * to who is asking. */
function liveQuadrants(state: State): Quadrant[] {
  const live = new Set<Quadrant>();
  for (const f of Object.values(state.figures)) {
    if (!f.locked) live.add(f.quadrant);
  }
  return QUADRANTS.filter((q) => live.has(q));
}

/** Deterministic from (seed, turn). Pure — no RNG object in state.
 * r8: draws only from live quadrants; dead courts do not convene. */
export function inSession(state: State): Set<Quadrant> {
  const pool = liveQuadrants(state);
  if (pool.length <= SESSIONS_PER_TURN) return new Set(pool);
  let h =
    (state.seed * 7919 +
      state.turn * 104729 +
      state.actions_remaining * 15485863) %
    1000003;
  const picks = [...pool];
  const picksOut: Quadrant[] = [];
  for (let n = 0; n < SESSIONS_PER_TURN; n++) {
    const i = h % picks.length;
    picksOut.push(picks.splice(i, 1)[0]);
    h = Math.floor(h / (picks.length + 1)); // Python h //= len(picks) + 1
  }
  return new Set(picksOut);
}

/** Variant support (digvijaya mode): the clock and the oath bar live in
 * state so apply() stays pure. Measured variants only — (16, 6) is the
 * one long config that held the dharma balance (79/78 at N=80/matchup);
 * 5-oath bars at any length favored expedient 60-73%. See
 * python/variant_study.py. */
export function initialState(
  seed = 0,
  turns = TURN_LIMIT,
  oaths = OATHS_TO_WIN,
): State {
  const fig = (
    quadrant: Quadrant,
    vows: Vow[] = [],
    allegiance: Player | null = null,
  ): Figure => ({
    quadrant,
    allegiance,
    locked: false,
    obligation: { [INDRAPRASTHA]: 0, [MAGADHA]: 0 },
    leverage: { [INDRAPRASTHA]: 0, [MAGADHA]: 0 },
    vows,
  });

  const v = (name: string): Vow => ({ id: name, params: {} });

  return {
    turn: 1,
    turn_limit: turns,
    oaths_to_win: oaths,
    active_player: INDRAPRASTHA,
    actions_remaining: ACTIONS_PER_TURN,
    seed,
    figures: {
      // NORTH
      bhagadatta: fig("north", [v("old_friendship")]),
      shakuni: fig("north", [v("shadow_bound")]),
      susharma: fig("north", [v("follows_strength")]),
      // EAST — Magadha's own quarter, and where the captives are
      shishupala: fig("east", [v("grievance_bound")]),
      karna: fig("east", [v("debt_bound")]),
      paundraka: fig("east", [v("held_captive")]),
      // SOUTH
      rukmi: fig("south", [v("pride_bound")]),
      nila: fig("south", [v("held_captive")]),
      pandya: fig("south"),
      // WEST
      shalya: fig("west", [v("hospitality_bound")]),
      jayadratha: fig("west"),
      kritavarma: fig("west", [v("stands_with_the_weaker")]),
    },
    legitimacy: { [INDRAPRASTHA]: 0, [MAGADHA]: 0 },
    concealed_oaths: { [INDRAPRASTHA]: 0, [MAGADHA]: 0 },
    oaths: { [INDRAPRASTHA]: 0, [MAGADHA]: 0 },
    gratitude: {},
    log: [],
    winner: null,
  };
}

// ---------------------------------------------------------------------------
// Vows
// ---------------------------------------------------------------------------

type VowPredicate = (
  state: State,
  action: Action,
  vow: Vow,
  holder: string,
) => boolean;

function held(state: State, player: Player): number {
  let n = 0;
  for (const f of Object.values(state.figures)) {
    if (f.allegiance === player) n++;
  }
  return n;
}

/** Bhagadatta was the father's friend. He is honoured openly or not at all. */
const oldFriendship: VowPredicate = (_state, action, _vow, holder) =>
  action.target !== holder || action.verb !== MANTRANA;

/** Shakuni takes gifts openly but will not be seen to swear. */
const shadowBound: VowPredicate = (_state, action, _vow, holder) => {
  if (action.target !== holder) return true;
  return !(
    action.visibility === OPEN &&
    (action.verb === YACHANA || action.verb === PRATIGYA)
  );
};

/** Susharma acknowledges only whoever is already ahead. A runaway-leader
 * vow: it rewards the front-runner and so must be cheap to reach. */
const followsStrength: VowPredicate = (state, action, _vow, holder) => {
  if (
    action.target !== holder ||
    (action.verb !== YACHANA && action.verb !== PRATIGYA)
  )
    return true;
  const a = action.actor;
  return held(state, a) >= held(state, other(a));
};

/** Shishupala carries an old grievance and will never be seen to submit.
 * ATTACK SURFACE: he can only be sworn in secret — and the secret oath is
 * exactly what closes Shalya. */
const grievanceBound: VowPredicate = (_state, action, _vow, holder) => {
  if (action.target !== holder) return true;
  return !(action.visibility === OPEN && action.verb === PRATIGYA);
};

/** Karna answers open honour, never counsel. */
const debtBound: VowPredicate = (_state, action, _vow, holder) =>
  action.target !== holder || action.verb !== MANTRANA;

/** Rukmi will be asked before the whole assembly or not at all.
 * The mirror of Shishupala: he forces you into the open. */
const prideBound: VowPredicate = (_state, action, _vow, holder) => {
  if (action.target !== holder) return true;
  return !(
    action.visibility === HIDDEN &&
    (action.verb === YACHANA || action.verb === PRATIGYA)
  );
};

/** Jarasandha's prisoners. Untouchable by anyone until his grip on the
 * east is broken — hold two eastern kings and they come free for both.
 * The entry is deliberately CHEAP: a chain is only as live as its first
 * link, and this one gates four figures. */
const heldCaptive: VowPredicate = (state, action, _vow, holder) => {
  if (action.target !== holder) return true;
  const quarter = state.figures[holder].quadrant;
  const peers = Object.entries(state.figures)
    .filter(
      ([k, f]) =>
        f.quadrant === quarter &&
        k !== holder &&
        !f.vows.some((w) => w.id === "held_captive"),
    )
    .map(([, f]) => f);
  return peers.some((f) => f.allegiance === action.actor);
};

/** Shalya will not deal with one who has sworn in secret. */
const hospitalityBound: VowPredicate = (state, action, _vow, holder) =>
  action.target !== holder || state.concealed_oaths[action.actor] === 0;

/** Kritavarma will not add to whoever is already ahead. A rubber band,
 * and the counterweight to Susharma. */
const standsWithTheWeaker: VowPredicate = (state, action, _vow, holder) => {
  if (
    action.target !== holder ||
    (action.verb !== YACHANA && action.verb !== PRATIGYA)
  )
    return true;
  const a = action.actor;
  return held(state, a) <= held(state, other(a));
};

export const VOW_REGISTRY: Record<string, VowPredicate> = {
  old_friendship: oldFriendship,
  shadow_bound: shadowBound,
  follows_strength: followsStrength,
  grievance_bound: grievanceBound,
  debt_bound: debtBound,
  pride_bound: prideBound,
  held_captive: heldCaptive,
  hospitality_bound: hospitalityBound,
  stands_with_the_weaker: standsWithTheWeaker,
};

export const VOW_TEXT: Record<string, string> = {
  old_friendship: "was your father's friend; honour him openly or not at all",
  shadow_bound: "takes gifts openly, but will not be seen to swear",
  follows_strength: "acknowledges only whoever is already ahead",
  grievance_bound: "will never be seen to submit; swears in secret only",
  debt_bound: "answers open honour, never counsel",
  pride_bound: "will be asked before the whole assembly or not at all",
  held_captive: "is Magadha's prisoner until a king of his own quarter turns",
  hospitality_bound: "will not deal with one who has sworn in secret",
  stands_with_the_weaker: "will not add to whoever is already ahead",
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function baseRequirements(state: State, action: Action): boolean {
  const actor = action.actor;
  const f = state.figures[action.target as string];
  const { verb, visibility: vis } = action;

  if (f.locked) return false;
  if (verb === SATKARA) return true;
  if (verb === YACHANA) {
    let need = YACHANA_NEED[vis];
    if (COUNSEL_BINDS && f.allegiance !== null && f.allegiance !== actor) {
      need += f.leverage[f.allegiance];
    }
    return f.obligation[actor] >= need;
  }
  if (verb === MANTRANA) return true;
  if (verb === PRATIGYA) {
    if (f.allegiance !== actor) return false;
    return f.leverage[actor] >= 2 || f.obligation[actor] >= 6;
  }
  return false;
}

function permittedByVows(state: State, action: Action): boolean {
  for (const [holder, f] of Object.entries(state.figures)) {
    for (const vow of f.vows) {
      if (!VOW_REGISTRY[vow.id](state, action, vow, holder)) return false;
    }
  }
  return true;
}

export function blockingVows(
  state: State,
  action: Action,
): [string, string][] {
  const out: [string, string][] = [];
  for (const [holder, f] of Object.entries(state.figures)) {
    for (const vow of f.vows) {
      if (!VOW_REGISTRY[vow.id](state, action, vow, holder)) {
        out.push([holder, vow.id]);
      }
    }
  }
  return out;
}

export function legalActions(state: State): Action[] {
  if (state.winner !== null) return [];
  const actor = state.active_player;
  const sitting = inSession(state);
  const out: Action[] = [];
  for (const [target, f] of Object.entries(state.figures)) {
    if (!sitting.has(f.quadrant)) continue;
    for (const verb of VERBS) {
      for (const vis of VERB_VISIBILITY[verb]) {
        const a: Action = { actor, verb, target, visibility: vis };
        if (baseRequirements(state, a) && permittedByVows(state, a)) {
          out.push(a);
        }
      }
    }
  }
  if (out.length === 0) {
    // The floor: waiting out a session where no court will hear you
    // is always possible. Only offered when nothing else is.
    out.push({ actor, verb: PASS, target: null, visibility: OPEN });
  }
  return out;
}

const deepCopy = <T>(x: T): T => structuredClone(x);

export function apply(state: State, action: Action): State {
  if (state.winner !== null) throw new Error("game is over");
  if (action.actor !== state.active_player)
    throw new Error("not this player's turn");
  if (action.verb === PASS) {
    if (legalActions(state).some((a) => a.verb !== PASS))
      throw new Error("pass is only legal when nothing else is");
    const s = deepCopy(state);
    s.actions_remaining -= 1;
    if (s.actions_remaining === 0) {
      s.active_player = other(action.actor);
      s.actions_remaining = ACTIONS_PER_TURN;
      if (s.active_player === INDRAPRASTHA) s.turn += 1;
    }
    if (
      s.active_player === INDRAPRASTHA &&
      s.actions_remaining === ACTIONS_PER_TURN
    ) {
      s.winner = checkWinner(s);
    }
    return s;
  }
  if (!inSession(state).has(state.figures[action.target as string].quadrant))
    throw new Error("that quarter is not sitting");
  if (!baseRequirements(state, action))
    throw new Error("action fails its requirements");
  if (!permittedByVows(state, action))
    throw new Error(
      `forbidden: ${JSON.stringify(blockingVows(state, action))}`,
    );

  const s = deepCopy(state);
  const { actor, verb, visibility: vis } = action;
  const target = action.target as string;
  const f = s.figures[target];

  if (verb === SATKARA) {
    f.obligation[actor] += 2;
    s.legitimacy[actor] += 1;
  } else if (verb === YACHANA) {
    f.allegiance = actor;
    if (vis === OPEN) s.legitimacy[actor] += 2;
  } else if (verb === MANTRANA) {
    f.leverage[actor] += 2;
  } else if (verb === PRATIGYA) {
    // r9: the Rajasuya needs acknowledgment BEFORE THE WORLD. Only an
    // open oath advances the victory count. A concealed oath is a king
    // you hold but cannot show: he is locked away from your rival, he
    // counts among those you hold, and he closes Shalya to you — but
    // he brings you no nearer the sacrifice.
    f.locked = true;
    if (vis === OPEN) {
      s.oaths[actor] += 1;
      s.legitimacy[actor] += 3;
    } else {
      s.concealed_oaths[actor] += 1;
    }
  }

  // Breaking Magadha's grip is itself a service. A prisoner who walks free
  // owes the claim that freed him — granted once, the first time the gate
  // opens for that claim. This is what makes the chain usable: without it
  // the captives came free around turn 8 and needed six actions to win,
  // which the clock never allowed.
  creditLiberator(s, actor);

  if (vis === OPEN) {
    s.log.push({ turn: s.turn, actor, verb, target });
  }

  s.actions_remaining -= 1;
  if (s.actions_remaining === 0) {
    s.active_player = other(actor);
    s.actions_remaining = ACTIONS_PER_TURN;
    if (s.active_player === INDRAPRASTHA) s.turn += 1;
  }
  if (
    s.active_player === INDRAPRASTHA &&
    s.actions_remaining === ACTIONS_PER_TURN
  ) {
    s.winner = checkWinner(s);
  }
  return s;
}

const LIBERATION_DEBT = 3;

function creditLiberator(s: State, actor: Player): void {
  for (const [fid, f] of Object.entries(s.figures)) {
    if (!f.vows.some((w) => w.id === "held_captive")) continue;
    const credited = (s.gratitude[fid] ??= []);
    if (credited.includes(actor)) continue;
    const probe: Action = {
      actor,
      verb: SATKARA,
      target: fid,
      visibility: OPEN,
    };
    if (permittedByVows(s, probe)) {
      f.obligation[actor] += LIBERATION_DEBT;
      credited.push(actor);
    }
  }
}

function checkWinner(s: State): Player | "draw" | null {
  const reached = PLAYERS.filter((p) => s.oaths[p] >= s.oaths_to_win);
  if (reached.length > 0) {
    const best = Math.max(...reached.map((p) => s.oaths[p]));
    const tied = reached.filter((p) => s.oaths[p] === best);
    if (tied.length === 1) return tied[0];
    const [a, b] = tied.map((p) => s.legitimacy[p]);
    return a === b ? "draw" : a > b ? tied[0] : tied[1];
  }
  if (s.turn > s.turn_limit) {
    const a = s.legitimacy[INDRAPRASTHA];
    const b = s.legitimacy[MAGADHA];
    return a === b ? "draw" : a > b ? INDRAPRASTHA : MAGADHA;
  }
  return null;
}
