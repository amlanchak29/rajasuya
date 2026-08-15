"""Goal-directed 1-ply agent.

The flat verb-scorer could not test the design: it valued verbs in the
abstract, so it always cashed obligation into allegiance the moment that
became legal and never invested toward an oath. This one scores the STATE
the action produces, which is enough to make investment visible.

Still no tree search -- deliberately. The opponent must stay legible enough
that a player can reason about it and trap it.
"""

def value(state, me, w):
    other = [p for p in state["figures"]["shalya"]["obligation"] if p != me][0]
    v = state["oaths"][me] * w["oath"] + state["legitimacy"][me] * w["legit"]
    v -= state["oaths"][other] * w["oath"] * w["deny"]
    for f in state["figures"].values():
        if f["allegiance"] == me:
            v += w["held"]
            if f["locked"]:
                # A sealed king cannot be stolen. 1-ply cannot see future
                # theft, so denial value must be priced in directly -- and
                # it must clear the lev/obl potentials that locking zeroes,
                # or concealed oaths never fire (measured: sealed < 12 for
                # expedient reads as zero concealed oaths).
                v += w.get("sealed", 0)
            else:
                v += min(f["leverage"][me], 2) * w["lev"]
                v += min(f["obligation"][me], 6) * w["obl"]
        elif f["allegiance"] == other:
            v -= w["held"] * w["deny"]
        else:
            v += min(f["obligation"][me], 3) * w["obl"]
    return v


DHARMA = {
    # values the open path: legitimacy-heavy, reluctant to conceal
    "righteous": {"oath": 25, "legit": 1.0, "held": 5, "lev": 1.5, "obl": 0.8,
                  "deny": 0.6, "hidden": -2.0, "sealed": 6},
    # values the oath itself: will conceal, will spend legitimacy
    "expedient": {"oath": 25, "legit": 0.4, "held": 5, "lev": 2.0, "obl": 1.0,
                  "deny": 1.0, "hidden": 0.0, "sealed": 16},
}


def choose(E, state, dharma, rng):
    acts = E.legal_actions(state)
    if not acts:
        return None
    w = DHARMA[dharma]
    me = state["active_player"]

    def sc(a):
        v = value(E.apply(state, a), me, w)
        if a["visibility"] == "hidden":
            v += w["hidden"]
        return v

    best = max(map(sc, acts))
    return rng.choice([a for a in acts if sc(a) == best])
