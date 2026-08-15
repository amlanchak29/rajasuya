import {
  INDRAPRASTHA,
  MAGADHA,
  OATHS_TO_WIN,
  TURN_LIMIT,
  type Player,
  type State,
} from "../engine/engine";
import { PLAYER_NAME } from "../game/text";
import { SIGILS } from "./assets";

function OathPips({ count, color }: { count: number; color: string }) {
  return (
    <span className="inline-flex gap-1" title={`${count} of ${OATHS_TO_WIN} oaths sworn before the world`}>
      {Array.from({ length: OATHS_TO_WIN }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-2.5 w-2.5 rounded-full border ${
            i < count ? `${color} border-transparent` : "border-line-bright"
          }`}
        />
      ))}
    </span>
  );
}

function Claim({
  state,
  player,
  isHuman,
  alignRight,
}: {
  state: State;
  player: Player;
  isHuman: boolean;
  alignRight?: boolean;
}) {
  const gold = player === INDRAPRASTHA;
  const nameColor = gold ? "text-indra" : "text-magadha";
  const pipColor = gold ? "bg-indra" : "bg-magadha";
  return (
    <div
      className={`flex items-center gap-3 ${alignRight ? "flex-row-reverse text-right" : ""}`}
    >
      <img
        src={SIGILS[player]}
        alt=""
        className="h-11 w-11 rounded-full object-cover"
      />
      <div>
      <div className={`font-display text-xl leading-tight ${nameColor}`}>
        {PLAYER_NAME[player]}
        <span className="ml-2 font-chrome text-xs text-leaf-faint">
          {isHuman ? "you" : "rival"}
        </span>
      </div>
      <div
        className={`mt-1 flex items-center gap-4 font-chrome text-sm text-leaf-dim ${alignRight ? "justify-end" : ""}`}
      >
        <OathPips count={state.oaths[player]} color={pipColor} />
        <span title="Legitimacy — the world's regard; decides the game at the twelfth turn">
          legitimacy {state.legitimacy[player]}
        </span>
        <span className="text-shadow-blue" title="Oaths sworn in secret — held, but not advancing the sacrifice">
          in shadow {state.concealed_oaths[player]}
        </span>
      </div>
      </div>
    </div>
  );
}

export default function ScoreBar({
  state,
  human,
  isHumanTurn,
}: {
  state: State;
  human: Player;
  isHumanTurn: boolean;
}) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line px-4 py-3">
      <Claim state={state} player={INDRAPRASTHA} isHuman={human === INDRAPRASTHA} />
      <div className="text-center">
        <div className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
          Turn {Math.min(state.turn, TURN_LIMIT)} of {TURN_LIMIT}
        </div>
        <div className="mt-1 font-body text-leaf">
          {state.winner !== null
            ? "The matter is decided"
            : isHumanTurn
              ? `Your move — ${state.actions_remaining} of 3 acts remain`
              : `${PLAYER_NAME[state.active_player]} is acting…`}
        </div>
        <div className="mt-0.5 font-chrome text-[11px] text-leaf-faint">
          Win: four open oaths, or the legitimacy lead after turn 12
        </div>
      </div>
      <Claim
        state={state}
        player={MAGADHA}
        isHuman={human === MAGADHA}
        alignRight
      />
    </header>
  );
}
