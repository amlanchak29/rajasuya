import { INDRAPRASTHA, type State } from "../engine/engine";
import { logLine } from "../game/text";

/** The public record. Open acts only — hidden actions never appear here;
 * that asymmetry is the whole point of the visibility mechanic. */
export default function Chronicle({ state }: { state: State }) {
  const entries = [...state.log].reverse();
  return (
    <section className="flex min-h-0 grow flex-col rounded-lg border border-line bg-court-closed p-3">
      <h2 className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
        The chronicle — what the world has seen
      </h2>
      <ol className="mt-2 flex flex-col gap-1 overflow-y-auto">
        {entries.length === 0 && (
          <li className="font-body text-sm italic text-leaf-faint">
            Nothing yet. The hall waits.
          </li>
        )}
        {entries.map((e, i) => (
          <li key={entries.length - i} className="font-body text-sm leading-snug">
            <span className="font-chrome text-xs text-leaf-faint">
              T{e.turn}
            </span>{" "}
            <span
              className={
                e.actor === INDRAPRASTHA ? "text-indra" : "text-magadha"
              }
            >
              ●
            </span>{" "}
            <span className="text-leaf-dim">{logLine(e)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
