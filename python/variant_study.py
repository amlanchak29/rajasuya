"""Digvijaya variant study: can the game run longer and stay balanced?

Overrides TURN_LIMIT / OATHS_TO_WIN at module level (both are read at
call time) and measures each config with the r9 agent across all four
matchups. Control config first — its numbers must reproduce the design
doc's §7 table within noise, or the instrument is wrong.

Reported per config, per matchup:
  balance (first / second / draw), end method, mean end turn of oath
  wins, pass-action rate, figure liveness (allegiance-contested).

Run:  python3 variant_study.py [N per matchup, default 80]
"""

import collections
import random
import sys

import engine_r9 as E
import agent

CONFIGS = [
    ("control-12t-4o", 12, 4),
    ("digvijaya-16t-5o", 16, 5),
    ("digvijaya-16t-6o", 16, 6),
    ("digvijaya-18t-6o", 18, 6),
]

# Round 2: (16,5) failed on balance, (16,6) on endgame passes. Probe the
# middle — a 5-oath bar kept tight against a shorter clock.
if "--round2" in sys.argv:
    CONFIGS = [
        ("digvijaya-14t-5o", 14, 5),
        ("digvijaya-15t-5o", 15, 5),
    ]

# Round 5 (round 3/4's 16t rows were invalid — see play()): the (16,6)
# rule variants, measured with the fixed instrument. Control included so
# it must reproduce round 1's (16,6) numbers.
RULES = {}
if "--round5" in sys.argv:
    FLIP = {E.OPEN: 4, E.HIDDEN: 3}
    BASE = {E.OPEN: 3, E.HIDDEN: 4}
    CONFIGS = [
        ("control-16t-6o", 16, 6),
        ("flip-16t-6o", 16, 6),
        ("bind-16t-6o", 16, 6),
        ("flip+bind-16t-6o", 16, 6),
    ]
    RULES = {
        "control-16t-6o": (BASE, False),
        "flip-16t-6o": (FLIP, False),
        "bind-16t-6o": (BASE, True),
        "flip+bind-16t-6o": (FLIP, True),
    }

if "--round4" in sys.argv:
    CONFIGS = [("flip-16t-6o", 16, 6)]
    RULES = {"flip-16t-6o": ({E.OPEN: 4, E.HIDDEN: 3}, False)}

# Round 3: rule variants at the base clock. RULES maps config name ->
# (yachana_need, counsel_binds); clock stays (12, 4) unless suffixed.
if "--round3" in sys.argv:
    FLIP = {E.OPEN: 4, E.HIDDEN: 3}
    BASE = {E.OPEN: 3, E.HIDDEN: 4}
    CONFIGS = [
        ("r9-control", 12, 4),
        ("flip", 12, 4),
        ("bind", 12, 4),
        ("flip+bind", 12, 4),
        ("flip+bind-16t-6o", 16, 6),
    ]
    RULES = {
        "r9-control": (BASE, False),
        "flip": (FLIP, False),
        "bind": (BASE, True),
        "flip+bind": (FLIP, True),
        "flip+bind-16t-6o": (FLIP, True),
    }

MATCHUPS = [
    ("expedient", "expedient"),
    ("righteous", "righteous"),
    ("expedient", "righteous"),
    ("righteous", "expedient"),
]


def play(seed, di, dm, turns, oaths):
    # Pass the clock explicitly: initial_state's defaults were captured at
    # module load, so overriding E.TURN_LIMIT does NOT reach state anymore.
    # (Learned the hard way — rounds 3/4 first ran every "16t" config at
    # 12t/4o. Check the instrument before tuning the design.)
    state = E.initial_state(seed, turns, oaths)
    rng = random.Random(seed * 31 + 7)
    dharma = {E.INDRAPRASTHA: di, E.MAGADHA: dm}
    passes = 0
    contested = set()
    guard = 0
    while state["winner"] is None and guard < 2000:
        guard += 1
        a = agent.choose(E, state, dharma[state["active_player"]], rng)
        if a["verb"] == E.PASS:
            passes += 1
        state = E.apply(state, a)
        for k, f in state["figures"].items():
            if f["allegiance"] is not None:
                contested.add(k)
    return state, passes, contested


def run_matchup(n, di, dm, turns, oaths):
    res = collections.Counter()
    method = collections.Counter()
    oath_end_turns = []
    passes_total = 0
    contested_counts = collections.Counter()
    for seed in range(n):
        st, passes, contested = play(seed, di, dm, turns, oaths)
        w = st["winner"]
        res[w] += 1
        passes_total += passes
        for k in contested:
            contested_counts[k] += 1
        if w in E.PLAYERS:
            if st["oaths"][w] >= st["oaths_to_win"]:
                method["oath"] += 1
                oath_end_turns.append(st["turn"])
            else:
                method["legit"] += 1
    mean_turn = (
        sum(oath_end_turns) / len(oath_end_turns) if oath_end_turns else None
    )
    return res, method, mean_turn, passes_total, contested_counts


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 80
    for name, turns, oaths in CONFIGS:
        E.TURN_LIMIT = turns
        E.OATHS_TO_WIN = oaths
        if name in RULES:
            E.YACHANA_NEED, E.COUNSEL_BINDS = RULES[name]
        print(f"\n===== {name} (turns={turns}, oaths={oaths}, N={n}) =====",
              flush=True)
        all_contested = collections.Counter()
        games_total = 0
        for di, dm in MATCHUPS:
            res, method, mean_turn, passes, contested = run_matchup(
                n, di, dm, turns, oaths)
            games_total += n
            all_contested.update(contested)
            i, m = res[E.INDRAPRASTHA], res[E.MAGADHA]
            d = res["draw"]
            mt = f"{mean_turn:.1f}" if mean_turn else "-"
            print(f"{di[:3]} vs {dm[:3]}: {i}/{m} (draw {d})  "
                  f"oath {method['oath']} legit {method['legit']}  "
                  f"mean oath-end turn {mt}  passes {passes}", flush=True)
        dead = [k for k in E.initial_state()["figures"]
                if all_contested[k] / games_total < 0.5]
        floor = min(all_contested[k] / games_total
                    for k in E.initial_state()["figures"])
        print(f"liveness floor {floor:.0%}; under 50%: {dead or 'none'}",
              flush=True)


if __name__ == "__main__":
    main()
