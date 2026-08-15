"""
Rajasuya period. Two claims to paramountcy, neither seated on a throne.

Why this window beats the pre-war one:
  - It is canonically an acknowledgment-gathering exercise. Our four verbs
    are what the period is actually made of.
  - The target list is fixed and quadrant-shaped: the digvijaya went north,
    east, south and west, so the map structure is given, not invented.
  - Both claimants are outsiders wanting the same thing. No incumbent, so
    the roster asymmetry that kept skewing balance does not arise.
  - It needs no protagonist we have had to remove.

New lever: COURTS IN SESSION. Two of four quadrants convene each turn; the
rest are closed. You travel to where the assembly is meeting. This gates the
action count without touching the roster, and supplies the per-game variance
that fixed-setup play was missing.
"""

import copy

SATKARA = "satkara"
YACHANA = "yachana"
MANTRANA = "mantrana"
PRATIGYA = "pratigya"
VERBS = (SATKARA, YACHANA, MANTRANA, PRATIGYA)

# The floor (r8): legal only when nothing else is. Burns the action.
PASS = "pass"

OPEN = "open"
HIDDEN = "hidden"

VERB_VISIBILITY = {
    SATKARA: (OPEN,),
    MANTRANA: (HIDDEN,),
    YACHANA: (OPEN, HIDDEN),
    PRATIGYA: (OPEN, HIDDEN),
}

INDRAPRASTHA = "indraprastha"   # Yudhishthira's claim
MAGADHA = "magadha"             # Jarasandha's claim
PLAYERS = (INDRAPRASTHA, MAGADHA)

ACTIONS_PER_TURN = 3
TURN_LIMIT = 12
OATHS_TO_WIN = 4
SESSIONS_PER_TURN = 2


def other(p):
    return MAGADHA if p == INDRAPRASTHA else INDRAPRASTHA


# --------------------------------------------------------------------------
# The four directions
# --------------------------------------------------------------------------

QUADRANTS = ("north", "east", "south", "west")

SEATS = {INDRAPRASTHA: "north", MAGADHA: "east"}


def _live_quadrants(state):
    """A court convenes only where there is business: at least one figure
    not yet locked by an oath. Actor-independent, so sessions stay blind
    to who is asking."""
    live = set()
    for f in state["figures"].values():
        if not f["locked"]:
            live.add(f["quadrant"])
    return [q for q in QUADRANTS if q in live]


def in_session(state):
    """Deterministic from (seed, turn). Pure -- no RNG object in state.
    r8: draws only from live quadrants; dead courts do not convene."""
    pool = _live_quadrants(state)
    if len(pool) <= SESSIONS_PER_TURN:
        return set(pool)
    h = (state["seed"] * 7919 + state["turn"] * 104729
         + state["actions_remaining"] * 15485863) % 1000003
    picks = list(pool)
    picks_out = []
    for _ in range(SESSIONS_PER_TURN):
        i = h % len(picks)
        picks_out.append(picks.pop(i))
        h //= len(picks) + 1
    return set(picks_out)


def initial_state(seed=0):
    def fig(quadrant, vows=(), allegiance=None):
        return {
            "quadrant": quadrant,
            "allegiance": allegiance,
            "locked": False,
            "obligation": {INDRAPRASTHA: 0, MAGADHA: 0},
            "leverage": {INDRAPRASTHA: 0, MAGADHA: 0},
            "vows": list(vows),
        }

    def v(name):
        return {"id": name, "params": {}}

    return {
        "turn": 1,
        "active_player": INDRAPRASTHA,
        "actions_remaining": ACTIONS_PER_TURN,
        "seed": seed,
        "figures": {
            # NORTH
            "bhagadatta": fig("north", [v("old_friendship")]),
            "shakuni":    fig("north", [v("shadow_bound")]),
            "susharma":   fig("north", [v("follows_strength")]),
            # EAST -- Magadha's own quarter, and where the captives are
            "shishupala": fig("east", [v("grievance_bound")]),
            "karna":      fig("east", [v("debt_bound")]),
            "paundraka":  fig("east", [v("held_captive")]),
            # SOUTH
            "rukmi":      fig("south", [v("pride_bound")]),
            "nila":       fig("south", [v("held_captive")]),
            "pandya":     fig("south"),
            # WEST
            "shalya":     fig("west", [v("hospitality_bound")]),
            "jayadratha": fig("west"),
            "kritavarma": fig("west", [v("stands_with_the_weaker")]),
        },
        "legitimacy": {INDRAPRASTHA: 0, MAGADHA: 0},
        "concealed_oaths": {INDRAPRASTHA: 0, MAGADHA: 0},
        "oaths": {INDRAPRASTHA: 0, MAGADHA: 0},
        "gratitude": {},
        "log": [],
        "winner": None,
    }


# --------------------------------------------------------------------------
# Vows
# --------------------------------------------------------------------------

def _held(state, player):
    return sum(1 for f in state["figures"].values() if f["allegiance"] == player)


def _old_friendship(state, action, vow, holder):
    """Bhagadatta was the father's friend. He is honoured openly or not at all."""
    return action["target"] != holder or action["verb"] != MANTRANA


def _shadow_bound(state, action, vow, holder):
    """Shakuni takes gifts openly but will not be seen to swear."""
    if action["target"] != holder:
        return True
    return not (action["visibility"] == OPEN and action["verb"] in (YACHANA, PRATIGYA))


def _follows_strength(state, action, vow, holder):
    """Susharma acknowledges only whoever is already ahead. A runaway-leader
    vow: it rewards the front-runner and so must be cheap to reach."""
    if action["target"] != holder or action["verb"] not in (YACHANA, PRATIGYA):
        return True
    a = action["actor"]
    return _held(state, a) >= _held(state, other(a))


def _grievance_bound(state, action, vow, holder):
    """Shishupala carries an old grievance and will never be seen to submit.
    ATTACK SURFACE: he can only be sworn in secret -- and the secret oath is
    exactly what closes Shalya."""
    if action["target"] != holder:
        return True
    return not (action["visibility"] == OPEN and action["verb"] == PRATIGYA)


def _debt_bound(state, action, vow, holder):
    """Karna answers open honour, never counsel."""
    return action["target"] != holder or action["verb"] != MANTRANA


def _pride_bound(state, action, vow, holder):
    """Rukmi will be asked before the whole assembly or not at all.
    The mirror of Shishupala: he forces you into the open."""
    if action["target"] != holder:
        return True
    return not (action["visibility"] == HIDDEN and action["verb"] in (YACHANA, PRATIGYA))


def _held_captive(state, action, vow, holder):
    """Jarasandha's prisoners. Untouchable by anyone until his grip on the
    east is broken -- hold two eastern kings and they come free for both.
    The entry is deliberately CHEAP: a chain is only as live as its first
    link, and this one gates four figures."""
    if action["target"] != holder:
        return True
    quarter = state["figures"][holder]["quadrant"]
    peers = [f for k, f in state["figures"].items()
             if f["quadrant"] == quarter and k != holder
             and "held_captive" not in [w["id"] for w in f["vows"]]]
    return any(f["allegiance"] == action["actor"] for f in peers)


def _hospitality_bound(state, action, vow, holder):
    """Shalya will not deal with one who has sworn in secret."""
    return action["target"] != holder or state["concealed_oaths"][action["actor"]] == 0


def _stands_with_the_weaker(state, action, vow, holder):
    """Kritavarma will not add to whoever is already ahead. A rubber band,
    and the counterweight to Susharma."""
    if action["target"] != holder or action["verb"] not in (YACHANA, PRATIGYA):
        return True
    a = action["actor"]
    return _held(state, a) <= _held(state, other(a))


VOW_REGISTRY = {
    "old_friendship": _old_friendship,
    "shadow_bound": _shadow_bound,
    "follows_strength": _follows_strength,
    "grievance_bound": _grievance_bound,
    "debt_bound": _debt_bound,
    "pride_bound": _pride_bound,
    "held_captive": _held_captive,
    "hospitality_bound": _hospitality_bound,
    "stands_with_the_weaker": _stands_with_the_weaker,
}

VOW_TEXT = {
    "old_friendship": "was your father's friend; honour him openly or not at all",
    "shadow_bound": "takes gifts openly, but will not be seen to swear",
    "follows_strength": "acknowledges only whoever is already ahead",
    "grievance_bound": "will never be seen to submit; swears in secret only",
    "debt_bound": "answers open honour, never counsel",
    "pride_bound": "will be asked before the whole assembly or not at all",
    "held_captive": "is Magadha's prisoner until a king of his own quarter turns",
    "hospitality_bound": "will not deal with one who has sworn in secret",
    "stands_with_the_weaker": "will not add to whoever is already ahead",
}


# --------------------------------------------------------------------------
# Actions
# --------------------------------------------------------------------------

def _base_requirements(state, action):
    actor = action["actor"]
    f = state["figures"][action["target"]]
    verb, vis = action["verb"], action["visibility"]

    if f["locked"]:
        return False
    if verb == SATKARA:
        return True
    if verb == YACHANA:
        return f["obligation"][actor] >= (3 if vis == OPEN else 4)
    if verb == MANTRANA:
        return True
    if verb == PRATIGYA:
        if f["allegiance"] != actor:
            return False
        return f["leverage"][actor] >= 2 or f["obligation"][actor] >= 6
    return False


def _permitted_by_vows(state, action):
    for holder, f in state["figures"].items():
        for vow in f["vows"]:
            if not VOW_REGISTRY[vow["id"]](state, action, vow, holder):
                return False
    return True


def blocking_vows(state, action):
    out = []
    for holder, f in state["figures"].items():
        for vow in f["vows"]:
            if not VOW_REGISTRY[vow["id"]](state, action, vow, holder):
                out.append((holder, vow["id"]))
    return out


def legal_actions(state):
    if state["winner"] is not None:
        return []
    actor = state["active_player"]
    sitting = in_session(state)
    out = []
    for target, f in state["figures"].items():
        if f["quadrant"] not in sitting:
            continue
        for verb in VERBS:
            for vis in VERB_VISIBILITY[verb]:
                a = {"actor": actor, "verb": verb, "target": target,
                     "visibility": vis}
                if _base_requirements(state, a) and _permitted_by_vows(state, a):
                    out.append(a)
    if not out:
        # The floor: waiting out a session where no court will hear you
        # is always possible. Only offered when nothing else is.
        out.append({"actor": actor, "verb": PASS, "target": None,
                    "visibility": OPEN})
    return out


def apply(state, action):
    if state["winner"] is not None:
        raise ValueError("game is over")
    if action["actor"] != state["active_player"]:
        raise ValueError("not this player's turn")
    if action["verb"] == PASS:
        if any(a["verb"] != PASS for a in legal_actions(state)):
            raise ValueError("pass is only legal when nothing else is")
        s = copy.deepcopy(state)
        s["actions_remaining"] -= 1
        if s["actions_remaining"] == 0:
            s["active_player"] = other(action["actor"])
            s["actions_remaining"] = ACTIONS_PER_TURN
            if s["active_player"] == INDRAPRASTHA:
                s["turn"] += 1
        if s["active_player"] == INDRAPRASTHA and s["actions_remaining"] == ACTIONS_PER_TURN:
            s["winner"] = _check_winner(s)
        return s
    if state["figures"][action["target"]]["quadrant"] not in in_session(state):
        raise ValueError("that quarter is not sitting")
    if not _base_requirements(state, action):
        raise ValueError("action fails its requirements")
    if not _permitted_by_vows(state, action):
        raise ValueError(f"forbidden: {blocking_vows(state, action)}")

    s = copy.deepcopy(state)
    actor, target = action["actor"], action["target"]
    verb, vis = action["verb"], action["visibility"]
    f = s["figures"][target]

    if verb == SATKARA:
        f["obligation"][actor] += 2
        s["legitimacy"][actor] += 1
    elif verb == YACHANA:
        f["allegiance"] = actor
        if vis == OPEN:
            s["legitimacy"][actor] += 2
    elif verb == MANTRANA:
        f["leverage"][actor] += 2
    elif verb == PRATIGYA:
        # r9: the Rajasuya needs acknowledgment BEFORE THE WORLD. Only an
        # open oath advances the victory count. A concealed oath is a king
        # you hold but cannot show: he is locked away from your rival, he
        # counts among those you hold, and he closes Shalya to you -- but
        # he brings you no nearer the sacrifice.
        f["locked"] = True
        if vis == OPEN:
            s["oaths"][actor] += 1
            s["legitimacy"][actor] += 3
        else:
            s["concealed_oaths"][actor] += 1

    # Breaking Magadha's grip is itself a service. A prisoner who walks free
    # owes the claim that freed him -- granted once, the first time the gate
    # opens for that claim. This is what makes the chain usable: without it
    # the captives came free around turn 8 and needed six actions to win,
    # which the clock never allowed.
    _credit_liberator(s, actor)

    if vis == OPEN:
        s["log"].append({"turn": s["turn"], "actor": actor,
                         "verb": verb, "target": target})

    s["actions_remaining"] -= 1
    if s["actions_remaining"] == 0:
        s["active_player"] = other(actor)
        s["actions_remaining"] = ACTIONS_PER_TURN
        if s["active_player"] == INDRAPRASTHA:
            s["turn"] += 1
    if s["active_player"] == INDRAPRASTHA and s["actions_remaining"] == ACTIONS_PER_TURN:
        s["winner"] = _check_winner(s)
    return s


LIBERATION_DEBT = 3


def _credit_liberator(s, actor):
    for fid, f in s["figures"].items():
        if "held_captive" not in [w["id"] for w in f["vows"]]:
            continue
        credited = s["gratitude"].setdefault(fid, [])
        if actor in credited:
            continue
        probe = {"actor": actor, "verb": SATKARA, "target": fid,
                 "visibility": OPEN}
        if _permitted_by_vows(s, probe):
            f["obligation"][actor] += LIBERATION_DEBT
            credited.append(actor)


def _check_winner(s):
    reached = [p for p in PLAYERS if s["oaths"][p] >= OATHS_TO_WIN]
    if reached:
        best = max(s["oaths"][p] for p in reached)
        tied = [p for p in reached if s["oaths"][p] == best]
        if len(tied) == 1:
            return tied[0]
        a, b = (s["legitimacy"][p] for p in tied)
        return "draw" if a == b else (tied[0] if a > b else tied[1])
    if s["turn"] > TURN_LIMIT:
        a, b = s["legitimacy"][INDRAPRASTHA], s["legitimacy"][MAGADHA]
        return "draw" if a == b else (INDRAPRASTHA if a > b else MAGADHA)
    return None
