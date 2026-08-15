"""Dump seeded agent games as JSONL fixtures for the TypeScript port.

One line per game:
  {"seed", "dharmas": {player: dharma}, "winner",
   "steps": [{"dharma", "legal": [...sorted], "argmax": [...sorted],
              "action", "state"}, ...]}

Per HANDOVER §4: the TS test replays each game's action sequence through the
TS engine and asserts deep equality of every resulting state. `legal` and
`argmax` additionally validate the generator ordering-independently and the
agent's scoring (argmax = every legal action tying at the best score, so no
RNG parity is needed).

Run:  python3 dump_validation.py [n_games] [out_path]
"""

import gzip
import json
import random
import sys

import engine_r9 as E
import agent


def action_key(a):
    return (a["verb"], a["target"] or "", a["visibility"])


def argmax_set(state, dharma):
    acts = E.legal_actions(state)
    w = agent.DHARMA[dharma]
    me = state["active_player"]

    def sc(a):
        v = agent.value(E.apply(state, a), me, w)
        if a["visibility"] == "hidden":
            v += w["hidden"]
        return v

    scores = [sc(a) for a in acts]
    best = max(scores)
    return [a for a, s in zip(acts, scores) if s == best]


MATCHUPS = [
    {"indraprastha": "expedient", "magadha": "expedient"},
    {"indraprastha": "righteous", "magadha": "righteous"},
    {"indraprastha": "righteous", "magadha": "expedient"},
    {"indraprastha": "expedient", "magadha": "righteous"},
]


def play_game(seed):
    dharmas = MATCHUPS[seed % len(MATCHUPS)]
    rng = random.Random(seed)
    state = E.initial_state(seed)
    steps = []
    while state["winner"] is None:
        dharma = dharmas[state["active_player"]]
        legal = E.legal_actions(state)
        best = argmax_set(state, dharma)
        action = rng.choice(best)
        state = E.apply(state, action)
        steps.append({
            "dharma": dharma,
            "legal": sorted(legal, key=action_key),
            "argmax": sorted(best, key=action_key),
            "action": action,
            "state": state,
        })
    return {"seed": seed, "dharmas": dharmas,
            "winner": state["winner"], "steps": steps}


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    out = sys.argv[2] if len(sys.argv) > 2 else "../tests/fixtures/games.jsonl.gz"
    with gzip.open(out, "wt") as f:
        for seed in range(n):
            game = play_game(seed)
            f.write(json.dumps(game, separators=(",", ":")) + "\n")
            print(f"seed {seed}: winner={game['winner']} "
                  f"steps={len(game['steps'])}", flush=True)


if __name__ == "__main__":
    main()
