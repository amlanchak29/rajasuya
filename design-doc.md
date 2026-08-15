# Rajasuya — Design Doc

*Two-player, human vs AI, offline. A game about claims to paramountcy.*

**Status:** core loop implemented and measured. Engine at `engine/engine_r9.py`. No UI yet; UI work handed off to a separate repo (see `HANDOVER.md` there).

Written as a handoff: this should be enough to resume work cold, in a new session, without the conversation that produced it.

---

## 1. The Premise

Yudhishthira, seated at Indraprastha, seeks the acknowledgment of every king in the subcontinent — the precondition for the Rajasuya sacrifice. Jarasandha of Magadha wants that same acknowledgment for himself, and holds captive kings to make sure he gets it.

Two claims to paramountcy. Neither sits on a throne. Both are travelling.

**Why this window and not the pre-war one.** We started with the period between the dice game and the failed embassy, and abandoned it for three reasons that all proved out under testing:

- Rajasuya is *canonically* an acknowledgment-gathering exercise. The four verbs are what the period is actually made of, rather than a mechanic imposed on it.
- The target list is fixed and quadrant-shaped. The digvijaya went north, east, south and west, so the map structure is given rather than invented.
- Both claimants are outsiders wanting the same thing. The pre-war setting had one player holding the throne and the entire interesting roster — Bhishma, Drona, Karna, Shakuni, Ashwatthama — sitting in his court. That asymmetry produced balance drift in every version and could not be wired away.

It also needs no protagonist we removed. Krishna's absence gutted the embassy period specifically, because there he *is* the negotiator. Rajasuya works without him.

---

## 2. The Core Mechanic

### Vows constrain

A vow is a rule attached to a figure that removes actions from the legal set. In code it is a predicate; in state it is data. Bhagadatta is honoured openly or not at all. Shishupala will never be seen to submit. Karna answers honour, never counsel.

### Vows are attack surfaces

Vows are visible to the opponent, who plays to trigger them. Shishupala can only be sworn in secret — and the secret oath is exactly what closes Shalya. Your route to one figure is your disqualification from another.

**These two together are the irreducible core.** Everything else here is negotiable.

---

## 3. The Loop

**Three actions per turn.** Each action is `verb × target × visibility`.

| Verb | Effect | Visibility |
|---|---|---|
| **Satkara** | Hospitality. +2 obligation, +1 legitimacy. | open only |
| **Yachana** | Petition. Claims allegiance. Needs obligation ≥3 open, ≥4 hidden. Open grants +2 legitimacy. | either |
| **Mantrana** | Private counsel. +2 leverage. | hidden only |
| **Pratigya** | The oath. Locks the figure permanently. Open counts toward victory and grants +3 legitimacy. Hidden counts toward nothing — it seals the king away from your rival, and increments your concealed-oath count. | either |

Pratigya requires allegiance **and** either leverage ≥2 **or** obligation ≥6 — a man you hold something over, or a man too deep in your debt to refuse.

**Victory: four *open* oaths, or the legitimacy lead at turn 12.** Checked only at the end of a complete round.

### Only open oaths win

The Rajasuya needs acknowledgment *before the world*. A concealed oath is a king you hold but cannot show: he is locked, he can never be stolen, and he closes Shalya to you — but he brings you no nearer the sacrifice. This is the r9 rule, and it is what made the two dharmas a real contest (§6, §7). It also sharpens Shishupala into what he should be — the king you can hold but never show.

### Why visibility is not a free rider

Hospitality is performed before the whole court by definition. Counsel is secret by definition. Only the two binding acts carry a real choice, and those are exactly where public-versus-private is dramatic. Folding visibility into verb identity halved the action space at no cost to theme.

### Courts in session

Two of the four quadrants convene each turn, derived deterministically from `(seed, turn, actions_remaining)`. The rest are closed. You travel to where the assembly is meeting.

This is the best lever we found. It cut the median action count from 15 to 10 while the roster *grew*, and supplied the per-game variance that fixed-setup play was missing.

**Sessions must be blind to who is asking.** An early version forced the active player's own quarter to sit, which pinned two quadrants permanently open and left the others meeting a third of the time. Half the board was decorative. Removing that one clause moved random balance from 62/30 to 48/44.

**Dead courts do not convene** (r8). Sessions draw only from quadrants that still hold an unlocked figure — a court with no business does not sit. Filtering on locked status is actor-independent, so blindness is preserved. This killed the endgame stalls: every observed stall was turns 10–12 with both sitting quadrants fully locked. A pass floor covers the residual case (a live figure closed by a vow): `legal_actions()` offers a single pass, only when nothing else is legal. Stalls went from 4–8% to zero.

---

## 4. Roster

Twelve figures, nine vowed, three unvowed anchors.

**North** — Bhagadatta *(honoured openly; no counsel)*, Shakuni *(takes gifts openly, will not be seen to swear)*, Susharma *(acknowledges only whoever is already ahead)*

**East** — Shishupala *(never seen to submit; secret oaths only)*, Karna *(open honour, never counsel)*, Paundraka *(captive)*

**South** — Rukmi *(asked before the assembly or not at all)*, Nila *(captive)*, Pandya *(unvowed)*

**West** — Shalya *(will not deal with one who has sworn in secret)*, Jayadratha *(unvowed)*, Kritavarma *(will not add to whoever is already ahead)*

### Designed pairs

- **Shishupala / Rukmi** — one can only be sworn in secret, the other only in the open. Mirrored constraints pulling opposite ways. Under r9 the mirror deepens: Rukmi's oath advances the sacrifice, Shishupala's never can.
- **Susharma / Kritavarma** — one follows the leader, the other props up the trailer. A runaway check and its counterweight.
- **Paundraka / Nila** — Jarasandha's prisoners, freed when a king of their own quarter turns. A freed prisoner arrives owing his liberator +3 obligation.

---

## 5. Locked Decisions

**Two players, human vs AI, offline.** No server, no auth, no state sync.

**The engine is a pure function.** `apply(state, action) -> state`. Seeded, no I/O, no global RNG. Sessions are derived from state, never sampled.

**State is JSON-serializable.** Vows live in state as data (`{"id": ..., "params": {}}`); predicates live in a registry keyed by id. Never store a closure in state — it costs you save games, replays, undo and analytics all at once.

**Vows only ever subtract.** `legal_actions()` generates the full space, then folds vow predicates over it. Adding a vow never touches the generator. (The pass floor lives in the generator, not in a vow — it is the guaranteed minimum, not a permission.)

**The map is a readout, not an input.** No action moves anything. Position shifts only as a consequence of obligation resolving.

**Only open oaths count toward the oath victory.** Locked as of r9. Concealed oaths are denial tools. Reverting this reverts the righteous/expedient balance to 29/63.

**No religious content.** Krishna and the Gita are not referable and not usable. Player roles stay at the level of kshatriya political actors.

**Sanskrit is confined to the four verbs.** The test: *if English needs more than two words to say it, Sanskrit earns its place.* Everything else — obligation, leverage, legitimacy, oath, open, hidden, and all UI chrome — stays plain English. `Mandala` was in the lexicon and has been dropped: quadrants replaced the ring, and "direction" says it fine.

No diacritics. *Satkara*, not *Satkāra*.

**Teaching is through constrained play.** The engine exposes `blocking_vows()`, which reports why each unavailable action is closed and who closed it. Surfacing that in situ turned out to be the most interesting thing on screen — the player learns the system by being told which door is shut. That, rather than a glossary panel, is the tutorial.

---

## 6. What the Measurements Established

Recorded because these cost real effort and are easy to lose.

**Complexity is the product of dimensions, not the count of mechanics.** Nothing was ever deleted to fix the action count. `5 targets × 4 verbs × 2 visibilities` is 40 before filtering; deleting a whole mechanic still leaves 12. Collapsing a dimension halves it. Every count fix came from collapsing, never cutting.

**A chained vow is only as live as its first link.** Drona's vow made him 3× harder to reach, so he was won 0% of the time, so Ashwatthama and Drupada — both hanging off him — were dead too. Chains need their entry point *easier* than average, not harder.

**Chains fail on timing, not legality.** The captives were legally reachable and still never won: the gate opened around turn 8 and winning one from zero took six actions. The fix was the liberation debt, not the gate.

**Random-play statistics understate chains.** Random agents don't pursue chains, because a chain only pays if you intend it. Under random play the captives read 6%; under policy play, 76–79%. Any chain measured with random agents is under-reported.

**Evaluate resulting states, not verbs.** A flat verb-scorer never invests, so it cashed obligation into allegiance the moment that became legal and never built toward an oath. Consequence: **Pratigya never fired in a single game across six engine versions.** Every balance number gathered before that was noise on a legitimacy tiebreak neither side was contesting. The bug stayed invisible until the agent scored the state its action produced.

**A 1-ply agent cannot see denial.** The sequel to the lesson above: some values live further than one state away. A sealed king is theft-proof, but the theft he prevents never appears one ply ahead, so the agent needed an explicit `sealed` weight to express it — and the weight had to clear the leverage/obligation potentials that locking zeroes. Below `sealed≈12`, concealed oaths read as zero and Shishupala and Shakuni read as dead. That was the instrument, not the design.

**Check the instrument before tuning the design.** A figure reading exactly 0% turned out to be an alphabetical tiebreak in `max()`. With a random tiebreak it read 76%. When a metric looks like noise, suspect the measurement first.

**Locks are the wrong liveness metric.** Righteous games end on legitimacy, so righteous banks allegiances without spending actions to seal them — the captives read 0/60 *locked* but 59–60/60 *allegiance-won* in righteous mirrors, in r8 and r9 alike. Measure liveness by allegiance-contested. (A figure nobody courts is dead; a figure courted but unsealed is a live risk, which is the game working.)

**When weights can't fix it, the structure is wrong.** Righteous lost to expedient 29/63 and no weight variant got past 37% without collapsing the dharma flavor. Root cause: legitimacy wasn't scarce — open actions are efficient anyway, so expedient accrued legitimacy incidentally and played a superset of the open game. One rule (only open oaths win) moved the matchup to 75/80 *and improved* the flavor. Tuning respects the structure; it cannot substitute for it.

**Equalise structure rather than handicapping players.** First-mover advantage ran 63/32. Checking victory only at the end of a complete round brought it to 48/43. Giving the first player a shorter opening turn *overcorrected* to 58/32 the other way. Compensation is a blunt instrument.

**The source is a better solution generator than tuning.** Every real fix came from the epic: gifts travel but counsel doesn't; Shakuni takes gifts openly but won't be seen to swear; a freed prisoner owes his liberator; a court with no business does not convene; the sacrifice requires acknowledgment before the world. Rules derived from the source are self-justifying — you never have to defend why counsel needs presence.

---

## 7. Current State (r9)

All figures at N=80 per matchup with the `sealed`-weighted agent; treat ±5 points as noise.

| Measure | Value |
|---|---|
| Median legal actions | 10 (p90 14) |
| Games ending by oath | 79% expedient mirror, 23% righteous mirror |
| Expedient mirror balance | 36 / 40 |
| Righteous mirror balance | 30 / 43 |
| Expedient vs righteous | 80 / 75 |
| Figures live (allegiance-contested) | 70% – 100%, all twelve |
| Figures oath-locked | 28% – 70% |
| Stalls | 0% |

### The two dharmas

Declared at setup, they weight the state evaluation and produce structurally different games. Righteous mirrors end by legitimacy 75% of the time; expedient mirrors end by oath 79%. Head-to-head they are even — 75/80 — where r7 read 28/58. Same board, same rules, two different games, neither dominant: the character-relative dharma idea, now actually working.

The difference is structural, not just numeric. Expedient seals Shishupala and Shakuni in secret and eats the Shalya closure. Righteous courts and *wins* both — but will never take their secret oaths, so they stay flippable in its hands for the whole game. Righteousness has a visible price again.

---

## 8. Open Problems

**Never tested against a human.** The AI is 1-ply, deliberately — it must stay legible enough that a player can reason about it and trap it. But "legible" and "competent" may pull apart, and the founding test — *is engineering an opponent's vow against him satisfying?* — has still only been run agent-vs-agent. This is now the top item; everything below it is cheaper to answer after a few human games.

**Second-mover lean in righteous mirrors — resolved: noise.** 30/43 at N=80, with earlier runs leaning the same way (35/41, 30/44). Tested at N=300: noise (p≈0.20; close games even; expedient control even). Don't re-chase it without new evidence.

**Opponent's obligation and leverage numbers: visible or hidden?** The engine treats all state as open except the log. Visible matches "vows are public attack surfaces"; hidden makes Mantrana genuinely sneaky against a human. Deliberately undecided until human play; the UI should not hard-bake either.

**No UI.** In progress in a separate repo; see §9.

**Third dharma?** Two feels thin, given the other replayability levers are all seed-driven. Note the constraint r9 revealed: a dharma is only real if some structure prices it — righteous pays in sealing, expedient pays in Shalya and legitimacy. A third dharma needs its own price, not just its own weights.

---

## 9. Build Path

**Now:** Python, no dependencies, terminal. `play.py` needs its import switched to `engine_r9`.

**Next:** port the engine to TypeScript and ship a static site — underway in the UI repo, spec in its `HANDOVER.md`. Pure functions with no dependencies are the most portable code there is. Validate the port by running identical seeded games through both implementations and diffing state sequences (integer arithmetic throughout, so equality is exact; mind Python `//` vs JS `Math.floor`).

Do *not* use Pyodide — a ~10MB download with slow startup is real friction for a game meant to be opened casually.

Keep the Python analytics: run headless sims in Node, dump JSONL, analyse in pandas. Node generates, Python interprets. No dual maintenance. `diag.py` is the current harness (stall capture, balance, liveness by both instruments).

**The UI is not a map problem.** The board is figures and courts — closer to a card layout than a hex renderer. Tailwind and divs get most of the way; SVG may never be needed. The oath counter is *open* oaths; concealed oaths display separately (both already in state).

**Skip:** Godot/Unity, any database (state is one JSON blob), packaging until someone other than you wants to play.

---

## 10. Deferred

Shortlisted, deliberately not in the base game. Each must be a module the core does not need — a tuned economy breaks when you pull pieces out, but adding to a complete one is safe.

**Decaying rules of engagement.** Kurukshetra begins with explicit rules — no attacking the unarmed, no fighting after sundown — and over eighteen days every one breaks. A tracked variable where each violation gives immediate advantage and permanently loosens what the opponent may do to you. Strong idea, but it is a war mechanic and this is not a war game. Revisit only if scope extends past the sacrifice.

**Kinship as a second graph.** Blood and marriage overlaid on the quadrants, with different topology. Historically true of how these polities worked. Deferred because two graphs is a lot to read on screen — though note Gandhari's marriage already earned its way in as a single map edge in the pre-war build.

**Armed time bombs.** Conditional-trigger cards placed early, fired by circumstance rather than play. Cheap to add later.

**Legitimacy and force as separate non-convertible tracks.** Force does not exist in the current model at all. Rajasuya is about acknowledgment, so this may simply not belong here.

**The Yachana price flip** (hidden 3, open 4 — legitimacy as something you pay tempo for). Tested during the r9 work: directionally right, not needed once the open-oath rule landed. In the back pocket if human play shows expedient still too strong.

---

## Appendix: Version History

| | Change | Result |
|---|---|---|
| v1 | Pre-war, 5 figures, 3 vows | median 18 actions |
| v2 | Visibility folded into verbs; mandala gates reach | median 7 |
| v3 | 11 figures, 9 vows, chained | median 16, four dead figures |
| v4–v6 | Chain entries cheapened, map edges fixed | all figures live, balance 77/19 |
| r1 | Rajasuya, quadrants, sessions | median 10, balance 48/44 |
| r2–r4 | Session bias fixed; liberation debt added | captives live |
| r5–r6 | Two routes to Pratigya; home bonus removed | 86% of games end by oath |
| r7 | Victory checked on complete rounds | first-mover 63/32 → 48/43 |
| r8 | Live-quadrant sessions; pass floor | stalls 4–8% → 0 |
| r9 | Only open oaths count toward victory; agent gains `sealed` weight | righteous vs expedient 29/63 → 75/80, flavor intact |
