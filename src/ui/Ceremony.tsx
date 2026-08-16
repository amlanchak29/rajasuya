import { useEffect } from "react";
import { INDRAPRASTHA, type Player, type State } from "../engine/engine";
import { FIGURE_NAME, PLAYER_NAME } from "../game/text";
import { PORTRAITS, SIGILS } from "./assets";

export interface OathCeremony {
  figure: string;
  actor: Player;
  open: boolean;
  stamp: number;
}

/** The game's central act gets a moment: full-screen, one beat, gone. */
export default function Ceremony({
  ceremony,
  state,
  onClose,
}: {
  ceremony: OathCeremony;
  state: State;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [ceremony.stamp, onClose]);

  const actorColor =
    ceremony.actor === INDRAPRASTHA ? "text-indra" : "text-magadha";

  return (
    <button
      onClick={onClose}
      className="ceremony-fade fixed inset-0 z-40 grid w-full cursor-pointer place-items-center bg-hall/90"
      aria-label="Dismiss"
    >
      {/* Embers drift up through the frame; a slow glow breathes behind
          the portrait. Deterministic per-index offsets, CSS only. */}
      {ceremony.open && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 14 }, (_, i) => (
            <span
              key={i}
              className="ember absolute bottom-1/4 h-1 w-1 rounded-full bg-indra"
              style={{
                left: `${18 + ((i * 37) % 64)}%`,
                animationDelay: `${(i * 0.37) % 2.8}s`,
                ["--ember-drift" as string]: `${((i % 5) - 2) * 22}px`,
              }}
            />
          ))}
        </span>
      )}
      <div className="relative flex flex-col items-center gap-4 text-center">
        <span
          className={`ceremony-glow pointer-events-none absolute -inset-16 -z-10 rounded-full ${
            ceremony.open ? "bg-indra/15" : "bg-shadow-blue/10"
          } blur-3xl`}
        />
        <img
          src={PORTRAITS[ceremony.figure]}
          alt=""
          className={`h-52 w-42 rounded-lg border object-cover object-top ${
            ceremony.open ? "border-indra/60" : "border-shadow-blue/60"
          }`}
        />
        <div className="font-display text-3xl text-leaf">
          {FIGURE_NAME[ceremony.figure]}
        </div>
        {ceremony.open ? (
          <p className="max-w-sm font-body text-lg italic text-leaf-dim">
            swears to{" "}
            <span className={actorColor}>{PLAYER_NAME[ceremony.actor]}</span>{" "}
            before the world — oath {state.oaths[ceremony.actor]} of{" "}
            {state.oaths_to_win}
          </p>
        ) : (
          <p className="max-w-sm font-body text-lg italic text-shadow-blue">
            swears in shadow — held and sealed, but it counts for nothing
            before the world
          </p>
        )}
        <img
          src={SIGILS[ceremony.actor]}
          alt=""
          className={`h-12 w-12 rounded-full object-cover ${
            ceremony.open ? "" : "opacity-60"
          }`}
        />
      </div>
    </button>
  );
}
