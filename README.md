# Rajasuya

Two claims to paramountcy. Neither sits on a throne. A two-player
(human vs AI) offline strategy game set in the Rajasuya period — gather the
acknowledgment of twelve kings across four quadrants; first to four oaths
sworn before the world, or the greater legitimacy at turn 12.

See `design-doc.md` for the design and its reasoning, `HANDOVER.md` for the
UI/port spec this repo implements.

## Layout

| Path | What |
|---|---|
| `src/engine/engine.ts` | The rules engine — pure functions, zero React imports. Port of `python/engine_r9.py`, which stays the source of truth for rules. |
| `src/engine/agent.ts` | The 1-ply AI opponent, two dharmas (righteous, expedient). |
| `src/game/`, `src/ui/` | React UI: quadrant courts, figure cards, action panel, chronicle. |
| `python/` | The original engine (validation oracle) and the analytics rig (`diag.py`). See `python/README.md`. |
| `python/dump_validation.py` | Plays seeded agent games and dumps `(action, state)` JSONL fixtures. |
| `tests/seed-diff.test.ts` | Replays those fixtures through the TS engine; asserts every state, legal-action set, and agent argmax set matches Python exactly. |

## Run

```
npm install
npm run dev        # play in the browser
npm test           # seed-diff validation (61 tests)
npm run build      # static site in dist/ — the production deployment
```

To regenerate fixtures after an engine change (change Python first, then
re-port): `cd python && python3 dump_validation.py 60`.

## Rules for contributors

- The UI never computes legality, vow effects, session draws, or victory.
  It renders state and submits actions from `legalActions()`.
- Engine invariants (JSON state, pure `apply`, vows only subtract, open
  oaths only) are listed in `python/README.md` — do not break them.
- Any rule change lands in `python/engine_r9.py` first, then the TS port,
  then fixtures regenerate and the seed-diff must pass.
