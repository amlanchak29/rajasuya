/**
 * Seed-diff validation per HANDOVER §4: replay the Python engine's action
 * sequences through the TS engine and assert deep equality of every
 * resulting state. Also asserts legal-action sets (generator parity) and
 * the agent's argmax sets (scoring parity, RNG-free).
 *
 * Fixtures: python/dump_validation.py -> tests/fixtures/games.jsonl.gz
 */
import { describe, it, expect } from "vitest";
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  initialState,
  legalActions,
  apply,
  type Action,
  type State,
} from "../src/engine/engine";
import { argmaxActions, type Dharma } from "../src/engine/agent";

interface Step {
  dharma: Dharma;
  legal: Action[];
  argmax: Action[];
  action: Action;
  state: State;
}

interface Game {
  seed: number;
  dharmas: Record<string, Dharma>;
  winner: string;
  steps: Step[];
}

const fixturePath = fileURLToPath(
  new URL("./fixtures/games.jsonl.gz", import.meta.url),
);
const games: Game[] = gunzipSync(readFileSync(fixturePath))
  .toString("utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));

const actionKey = (a: Action) => `${a.verb}|${a.target ?? ""}|${a.visibility}`;
const sortActions = (as: Action[]) =>
  [...as].sort((x, y) => actionKey(x).localeCompare(actionKey(y)));

describe("seed-diff against engine_r9.py", () => {
  it("loaded at least 50 games", () => {
    expect(games.length).toBeGreaterThanOrEqual(50);
  });

  for (const game of games) {
    it(`seed ${game.seed} (${game.dharmas.indraprastha} vs ${game.dharmas.magadha})`, () => {
      let state = initialState(game.seed);
      for (const [i, step] of game.steps.entries()) {
        const ctx = `seed ${game.seed} step ${i}`;
        expect(sortActions(legalActions(state)), `${ctx} legal`).toEqual(
          step.legal,
        );
        expect(
          sortActions(argmaxActions(state, step.dharma)),
          `${ctx} argmax`,
        ).toEqual(step.argmax);
        state = apply(state, step.action);
        expect(state, `${ctx} state`).toEqual(step.state);
      }
      expect(state.winner, `seed ${game.seed} winner`).toBe(game.winner);
    });
  }
});
