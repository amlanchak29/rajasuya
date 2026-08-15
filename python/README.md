# Engine

Plain Python 3, no dependencies. See `../design-doc.md` for the design.

## Current

| File             | What                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `engine_r9.py`   | **The engine.** Rajasuya setting, open-oath victory. Start here.                                                   |
| `agent.py`       | Goal-directed 1-ply opponent. Two dharmas: righteous, expedient. Carries the `sealed` denial weight — see Gotchas. |
| `diag.py`        | Stall capture, balance, and liveness harness (both instruments).                                                   |
| `simr.py`        | Older balance + action-count simulator for the Rajasuya engines.                                                   |
| `play.py`        | Terminal play loop. **Switch its import to `engine_r9`.**                                                          |
| `test_engine.py` | Tests. Written against `engine.py` (v1); needs porting.                                                            |

## Run

```
python3 diag.py                  # balance, stalls, win methods (edit N inside)
python3 simr.py engine_r9        # older balance and action-count report
python3 play.py                  # terminal game (fix the import first)
```

Simulations with `agent.py` are slow — it calls `apply()` once per legal action
per turn. 110 games takes a couple of minutes. Keep sample sizes modest or
memoise.

## History

Kept for the diffs, not because they run better.

**Pre-war setting (abandoned — see design doc §1):**
`engine.py` (v1) → `engine_v2.py` → `engine_v3.py` / `v3b` / `v3c` →
`engine_v4.py` → `v5` → `v6`

**Rajasuya:**
`engine_r1.py` → … → `engine_r7.py` → `engine_r8.py` (live-quadrant sessions,
pass floor; stalls → 0) → `engine_r9.py` (only open oaths count toward the
4-oath victory; righteous vs expedient 29/63 → 75/80)

`sim.py` and `sim3.py` target the pre-war engines.

## Invariants — do not break

1. **State is JSON-serializable.** Vows are data in state; predicates live in
   `VOW_REGISTRY`, keyed by id. No closures in state, ever.
2. **`apply()` is pure.** Deep-copies, never mutates its argument. No I/O, no
   global RNG. Session draws derive from `(seed, turn, actions_remaining)`.
3. **Vows only subtract.** `legal_actions()` generates the full space, then
   folds predicates over it. A new vow is a registry entry plus a data row —
   it never touches the generator. (The pass floor is in the generator: it is
   the guaranteed minimum, offered only when nothing else is legal.)
4. **Only open oaths advance the oath victory** (r9). Concealed oaths lock,
   deny, and close Shalya — nothing else. Reverting this reverts the
   righteous/expedient balance to 29/63.

## Gotchas

- `SEATS` is dead code in r6+. The home-quadrant bonus was removed to kill a
  seat asymmetry; nothing reads it now.
- Score ties resolved with bare `max()` sort alphabetically and will silently
  starve figures whose names sort early. Use a random tiebreak when measuring.
- Random agents under-report chain mechanics badly. Measure chains with
  `agent.py`, not random play.
- **Measure figure liveness by allegiance-contested, not by oath-locked.**
  Righteous play banks allegiances without sealing them; by locks alone the
  captives read 0% in righteous mirrors while being won 98–100% of games.
- **The agent's `sealed` weight must clear the potentials locking zeroes.**
  A 1-ply evaluator cannot see that a sealed king is theft-proof, so denial
  is priced in directly. Below ~12 for expedient it reads as zero concealed
  oaths and Shishupala/Shakuni look dead. That is the instrument, not the
  design. Shipped: expedient 16, righteous 6.
- Righteous mirrors showed an apparent second-mover lean across several
  N=80 runs. Tested at N=300: noise (p≈0.20; close games even; expedient
  control even). See design doc §8. Don't re-chase it without new evidence.
