"""Diagnostics for open problems #2 (stalls) and #3 (righteous underpowered).

Stall = active player has no legal actions while the game is unresolved.
We record the full state at first stall for post-mortem.
"""
import random, json, collections
import engine_r7 as E
import agent


def play(seed, dharma_i, dharma_m, capture_stalls):
    state = E.initial_state(seed)
    rng = random.Random(seed * 31 + 7)
    dharma = {E.INDRAPRASTHA: dharma_i, E.MAGADHA: dharma_m}
    stalled = False
    stall_info = None
    guard = 0
    while state["winner"] is None and guard < 500:
        guard += 1
        a = agent.choose(E, state, dharma[state["active_player"]], rng)
        if a is None:
            # no legal action: diagnose then force-advance by burning the action
            if not stalled:
                stalled = True
                if capture_stalls:
                    stall_info = diagnose(state)
            # burn the remaining actions of this player (engine has no pass;
            # emulate what a pass rule would do so the game can finish)
            s = state
            s = dict(state)  # shallow ok? no -- just mutate a deepcopy
            import copy as _c
            s = _c.deepcopy(state)
            s["actions_remaining"] -= 1
            if s["actions_remaining"] == 0:
                s["active_player"] = E.other(s["active_player"])
                s["actions_remaining"] = E.ACTIONS_PER_TURN
                if s["active_player"] == E.INDRAPRASTHA:
                    s["turn"] += 1
            if s["active_player"] == E.INDRAPRASTHA and s["actions_remaining"] == E.ACTIONS_PER_TURN:
                s["winner"] = E._check_winner(s)
            state = s
            continue
        state = E.apply(state, a)
    return state, stalled, stall_info


def diagnose(state):
    sitting = E.in_session(state)
    actor = state["active_player"]
    figs = {}
    for k, f in state["figures"].items():
        if f["quadrant"] not in sitting:
            continue
        # why is every action on this figure closed?
        reasons = set()
        if f["locked"]:
            reasons.add("locked")
        else:
            for verb in E.VERBS:
                for vis in E.VERB_VISIBILITY[verb]:
                    a = {"actor": actor, "verb": verb, "target": k, "visibility": vis}
                    if not E._base_requirements(state, a):
                        continue
                    bv = E.blocking_vows(state, a)
                    for h, vid in bv:
                        reasons.add(vid)
        figs[k] = sorted(reasons)
    return {"turn": state["turn"], "actor": actor, "sitting": sorted(sitting),
            "figures": figs,
            "oaths": dict(state["oaths"]),
            "held": {p: sum(1 for f in state["figures"].values() if f["allegiance"] == p) for p in E.PLAYERS}}


def run(n, di, dm, capture_stalls=False):
    res = collections.Counter()
    stalls = []
    win_method = collections.Counter()
    legit_margin = []
    for seed in range(n):
        st, stalled, info = play(seed, di, dm, capture_stalls)
        w = st["winner"]
        res[w] += 1
        if stalled and info:
            stalls.append(info)
        if w in E.PLAYERS:
            if st["oaths"][w] >= E.OATHS_TO_WIN:
                win_method[(w, "oath")] += 1
            else:
                win_method[(w, "legit")] += 1
                legit_margin.append(st["legitimacy"][w] - st["legitimacy"][E.other(w)])
        res["_stalled"] += 1 if stalled else 0
    return res, stalls, win_method, legit_margin


if __name__ == "__main__":
    N = 80
    print("=== expedient mirror ===")
    r, stalls, wm, _ = run(N, "expedient", "expedient", capture_stalls=True)
    print(dict(r)); print("win methods:", dict(wm))
    print(f"stall rate: {r['_stalled']}/{N}")
    with open("stalls_exp.json", "w") as fh:
        json.dump(stalls, fh, indent=1)

    print("\n=== righteous mirror ===")
    r, stalls, wm, _ = run(N, "righteous", "righteous", capture_stalls=True)
    print(dict(r)); print("win methods:", dict(wm))
    print(f"stall rate: {r['_stalled']}/{N}")
    with open("stalls_rig.json", "w") as fh:
        json.dump(stalls, fh, indent=1)

    print("\n=== expedient (I) vs righteous (M) ===")
    r, _, wm, lm = run(N, "expedient", "righteous")
    print(dict(r)); print("win methods:", dict(wm))

    print("\n=== righteous (I) vs expedient (M) ===")
    r, _, wm, lm = run(N, "righteous", "expedient")
    print(dict(r)); print("win methods:", dict(wm))
