# Rajasuya — UI Handover

*Drop this file in the root of the fresh repo. It is self-contained: everything needed to build the UI without the Python repo open, plus the state of the two engine investigations that ran alongside it.*

The design doc (`design-doc.md` in the engine repo) remains the source of truth for *why*. This document is the source of truth for *what the UI consumes*.

---

## 1. What you are building

A static, offline, two-player (human vs AI) strategy game. The player is a **claim to paramountcy** (Indraprastha = Yudhishthira, Magadha = Jarasandha), gathering the acknowledgment of twelve kings across four quadrants. Three actions per turn, twelve turns, first to four oaths or the legitimacy lead at the end.

The engine is a pure function and already exists in Python (`engine_r9.py`, included). The UI work is: **port the engine to TypeScript, then render it.** No server, no auth, no database, no Pyodide.

---

## 2. Engine version: r9, not r7

Two engine revisions were cut during the investigations (see §7). Three changes over r7:

1. **Dead courts do not convene** (r8). `in_session()` draws only from quadrants that still contain an unlocked figure. Actor-independent, so sessions stay blind to who is asking.
2. **A pass floor** (r8). `legal_actions()` returns a single `pass` action *only when nothing else is legal*. `apply()` burns the action and advances the turn.
3. **Only open oaths count toward the 4-oath victory** (r9). A concealed Pratigya still locks the figure — he is held, theft-proof, and closes Shalya to you — but brings you no nearer the sacrifice. The Rajasuya needs acknowledgment before the world.

Result: stalls 4–8% → **0** across every measured configuration; righteous vs expedient went from 63/29 to **80/75 of 160** — essentially even — with the dharma flavor intact (expedient mirrors end by oath 79%, righteous mirrors by legitimacy 75%). Port r9.

---

## 3. The engine API (what the UI calls)

Five functions. Nothing else crosses the boundary.

| Function | Signature | UI use |
|---|---|---|
| `initial_state` | `(seed) -> State` | New game |
| `legal_actions` | `(State) -> Action[]` | Everything the player may do right now |
| `apply` | `(State, Action) -> State` | Pure; never mutates its argument |
| `in_session` | `(State) -> Set<Quadrant>` | Which two courts are open this turn |
| `blocking_vows` | `(State, Action) -> [figureId, vowId][]` | Why a closed action is closed — **this is the tutorial** (see §5) |

Plus one data table: `VOW_TEXT`, mapping vow id → one-line English description. Render these verbatim; they are written to be shown to the player.

### State shape (JSON, always serializable)

```jsonc
{
  "turn": 1,                        // 1..12
  "active_player": "indraprastha",  // or "magadha"
  "actions_remaining": 3,
  "seed": 0,
  "figures": {
    "bhagadatta": {
      "quadrant": "north",
      "allegiance": null,           // null | player id
      "locked": false,              // true after a Pratigya; permanent
      "obligation": { "indraprastha": 0, "magadha": 0 },
      "leverage":   { "indraprastha": 0, "magadha": 0 },
      "vows": [ { "id": "old_friendship", "params": {} } ]
    }
    // ... twelve figures total
  },
  "legitimacy":      { "indraprastha": 0, "magadha": 0 },
  "concealed_oaths": { "indraprastha": 0, "magadha": 0 },
  "oaths":           { "indraprastha": 0, "magadha": 0 },
  "gratitude": {},                  // captiveId -> [players already credited]
  "log": [],                        // OPEN acts only — this is a design rule
  "winner": null                    // null | player id | "draw"
}
```

### Action shape

```jsonc
{ "actor": "indraprastha", "verb": "satkara", "target": "shalya", "visibility": "open" }
// pass action: { "actor": ..., "verb": "pass", "target": null, "visibility": "open" }
```

### Rules the UI must not re-implement

The UI never computes legality, vow effects, session draws, or victory. It renders state and submits actions from `legal_actions()`. If the UI ever needs to know "can I do X," the answer is "is X in the list" — never a reimplementation of the predicate.

---

## 4. The TypeScript port

**Order of work: port → validate → then any UI.** A UI on an unvalidated port debugs two layers at once.

1. Port `engine_r9.py` mechanically. It is ~350 lines, dependency-free, and every function is pure. Vows become a `Record<string, VowPredicate>` registry, exactly mirroring `VOW_REGISTRY`.
2. **Validation by seed-diffing:** run identical seeded games through both implementations and diff the state sequences. Concretely: a Python script plays N seeded games with the r8 agent, dumping every `(action, resulting state)` as JSONL; a Node script replays the *same action sequences* through the TS engine and asserts deep equality of every state. Integer arithmetic only — the session hash uses `%` and `//`, no floats — so equality is exact. Watch one porting hazard: Python `//` is floor division; use `Math.floor(a / b)` and keep everything in safe-integer range (the hash constants are small enough).
3. Keep the Python side as the analytics rig, per the design doc: Node generates JSONL, pandas interprets. No dual maintenance of analysis code.

**Stack suggestion:** given your Next.js/Tailwind familiarity, Next with static export works, though it is more machinery than this needs — Vite + React + Tailwind is the lighter fit for a single-page static game and there is no routing or data-fetching to speak of. Either way the engine lives in `src/engine/` with zero React imports, and the seed-diff test runs in plain Node/vitest against it.

---

## 5. UI design constraints (from the design doc, binding)

**The board is figures and courts, not a map.** Card layout: four quadrant columns/groups, twelve figure cards. Tailwind and divs get most of the way; SVG may never be needed.

**`blocking_vows()` is the tutorial.** The most interesting thing on screen is being told which door is shut and who shut it. When the player hovers/taps a disabled action, show the vow text: *"Shishupala will never be seen to submit; swears in secret only."* No glossary panel, no rules modal as primary teaching.

**Courts in session are the dominant visual state.** Two quadrants are open each turn; the other two are closed. Closed quadrants should read as unmistakably inert (dimmed, folded, whatever) — the player's first read of any turn is "where can I act."

**The log shows open acts only.** Hidden actions never appear in it. This is the information asymmetry the whole visibility mechanic exists for: the human sees their own hidden acts on their own cards (leverage numbers), but the log is the public record. The AI's hidden acts are invisible until their consequences surface.

**Language rules:** Sanskrit for the four verbs only — Satkara, Yachana, Mantrana, Pratigya, no diacritics. Everything else in plain English: obligation, leverage, legitimacy, oath, open, hidden, and all UI chrome. No religious content anywhere in the UI.

**Per-figure card, minimum contents:** name, quadrant, vow text (always visible — vows are public information and attack surfaces), allegiance marker, locked/oath marker, your obligation and leverage on them. Opponent's obligation/leverage: the design doc doesn't rule on whether these are public; the engine treats state as fully open except the log. Decision needed — flag it when you get there. Defaulting to *visible* matches "vows are visible and played against."

**What each verb needs from the player:** verb → target → visibility. Only Yachana and Pratigya carry a real visibility choice (Satkara is open-only, Mantrana hidden-only), so the visibility toggle should only appear when it is a choice.

---

## 6. AI in the browser

`agent.py` is ~60 lines: score every legal action's resulting state, 1-ply, pick the max with a random tiebreak. Port it with the engine — it needs `apply()` and nothing else. It is deliberately 1-ply (legibility over strength); do not "improve" it with search before it has been tested against a human. Two weight tables (`righteous`, `expedient`) selected at setup.

Speed is a non-issue in TS: one `apply()` per legal action per choice, ~10 legal actions, trivial.

---

## 7. Findings from the parallel engine work (Aug 2026)

Carried out alongside this handover; recorded here so the UI repo knows what engine changes may still land.

### Stalls — solved, shipped in r8

All observed stalls were **endgame exhaustion**, turns 10–12: both sitting quadrants contained only locked figures (occasionally one live figure closed by a vow — Shalya via `hospitality_bound`). Never a mid-game economy failure. Fix per §2: live-quadrant sessions + pass floor. 0/320 stalls after, balance unchanged. The invariants (pure `apply`, vows only subtract, JSON state) all survived.

### Righteous — diagnosed and resolved (r9)

The question was whether righteous is underpowered or merely different. Answer: **it was underpowered, structurally**, and the fix is in r9. The evidence chain:

1. Head-to-head, expedient beats righteous ~63/29, and those wins are overwhelmingly *oath* wins — expedient reaches four oaths at turns 9–13, before the legitimacy race can matter.
2. Weight tuning cannot close it: the best variant (softening the hidden-action penalty) reached only 37% for righteous *and* collapsed the righteous mirror's legitimacy-ending rate from 65% to ~35% — it wins more by becoming expedient.
3. The root cause: **legitimacy is not scarce.** Righteous's mean legitimacy lead over expedient is +2.6 on totals of ~45, because open actions are efficient (open Yachana is cheaper than hidden *and* pays legitimacy) so expedient accrues legitimacy incidentally. Expedient plays a superset of the open game; the dharmas only diverge on Mantrana and the occasional concealed oath.
4. A price flip (hidden Yachana 3, open 4 — making legitimacy something you pay tempo for) widened the legitimacy gap to ~5 and moved righteous to 34%. Directionally right, insufficient alone.

**The fix (r9): open acknowledgment wins; concealed oaths deny.** The 4-oath victory counts open oaths only. A concealed oath still locks the figure away from the opponent, still counts him as held, still closes Shalya. It sharpens Shishupala into what he should be: a king you can hold but never show. (Two alternatives were rejected on the numbers: pricing concealment in legitimacy fails because most expedient wins land before the turn-12 check; a legitimacy-threshold early win fails because measured leads, ~2.6 mean on totals of ~45, are too small for any honest threshold.)

Measured at N=80 per matchup, weights below:

| | r7 baseline | r9 |
|---|---|---|
| Righteous vs expedient (decisive) | 29 / 63 | **75 / 80** |
| Expedient mirror end method | 94% oath | 79% oath |
| Righteous mirror end method | 65% legitimacy | 75% legitimacy |
| Stalls | 4–8% | 0% |

**The agent needed a `sealed` weight to test this honestly** — a 1-ply evaluator cannot see that a locked ally is theft-proof (the theft it prevents never appears one ply ahead), so denial value has to be priced in directly, and it has to clear the leverage/obligation potentials that locking zeroes. Below `sealed≈12` for expedient, concealed oaths read as zero and Shishupala/Shakuni read as dead — which was the instrument, not the design. Shipped weights: expedient `sealed: 16`, righteous `sealed: 6`.

**A liveness-instrument lesson found on the way:** measuring figure liveness by *oath-locked* undercounts in righteous play. Righteous games end on legitimacy, so righteous banks allegiances without spending actions to lock them — the captives read 0/60 locked but 59–60/60 allegiance-won in righteous mirrors, in r8 *and* r9 alike. Measure liveness by allegiance-contested, not by locks. Corollary that is theme, not bug: righteous courts and wins Shishupala and Shakuni but never takes their secret oaths, so they stay flippable in its hands. Righteousness has a price again.

**UI impact:** the oath counter is *open* oaths; show `concealed_oaths` separately (both already in state). A concealed oath's card should read as held-and-sealed but visibly not advancing the sacrifice.

### Instrument notes (inherited, still true)

- Bare `max()` tiebreaks starve figures whose names sort early; the agent already uses a random tiebreak — keep it in the TS port.
- Random agents under-report chains; measure with the goal-directed agent.
- Balance figures above are N=60–80 per matchup; treat ±5 points as noise.

---

## 8. Files that travel with this document

| File | What |
|---|---|
| `HANDOVER.md` | This document |
| `engine_r9.py` | The engine to port. Source of truth for all rules. |
| `agent.py` | The 1-ply opponent, now with the `sealed` denial weight. Port after the engine validates. |
| `diag.py` | The measurement harness used for §7. Stays Python; not ported. |

## 9. Definition of done for phase one

1. TS engine passes seed-diff validation against `engine_r9.py` over ≥50 seeded full games.
2. A playable single page: quadrant/figure cards, session state, action picker with visibility toggle, vow text on disabled actions via `blocking_vows`, open-acts-only log, oath and legitimacy counters for both sides.
3. Human vs the expedient agent, full game to a winner, in the browser, offline.

Then — before any polish — the test the whole project has been deferring: *is engineering the AI's vow against it satisfying?* That answer decides everything after.
