import {
  INDRAPRASTHA,
  MAGADHA,
  type Player,
  type State,
} from "../engine/engine";
import { PLAYER_NAME } from "../game/text";
import { SIGILS } from "./assets";

function OathPips({
  count,
  goal,
  color,
}: {
  count: number;
  goal: number;
  color: string;
}) {
  return (
    <span className="inline-flex gap-1" title={`${count} of ${goal} oaths sworn before the world`}>
      {Array.from({ length: goal }, (_, i) => (
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
  hideShadow,
  alignRight,
}: {
  state: State;
  player: Player;
  isHuman: boolean;
  hideShadow: boolean;
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
        className="h-8 w-8 rounded-full object-cover md:h-11 md:w-11"
      />
      <div>
      <div className={`font-display text-lg leading-tight md:text-xl ${nameColor}`}>
        {PLAYER_NAME[player]}
        <span className="ml-2 font-chrome text-xs text-leaf-faint">
          {isHuman ? "you" : "rival"}
        </span>
      </div>
      <div
        className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-chrome text-xs text-leaf-dim md:gap-4 md:text-sm ${alignRight ? "justify-end" : ""}`}
      >
        <OathPips
          count={state.oaths[player]}
          goal={state.oaths_to_win}
          color={pipColor}
        />
        <span title="Legitimacy — the world's regard; decides the game at the twelfth turn">
          legitimacy {state.legitimacy[player]}
        </span>
        {!hideShadow && (
          <span
            className="text-shadow-blue"
            title="Oaths sworn in secret — kings held, but they count for nothing toward victory"
          >
            in shadow {state.concealed_oaths[player]}
          </span>
        )}
      </div>
      </div>
    </div>
  );
}

export default function ScoreBar({
  state,
  human,
  veiled,
  isHumanTurn,
  onShowWay,
}: {
  state: State;
  human: Player;
  veiled: boolean;
  isHumanTurn: boolean;
  onShowWay: () => void;
}) {
  return (
    <header className="grid grid-cols-2 items-center gap-x-4 gap-y-1.5 border-b border-line px-4 py-3 md:grid-cols-[1fr_auto_1fr]">
      <Claim
        state={state}
        player={INDRAPRASTHA}
        isHuman={human === INDRAPRASTHA}
        hideShadow={veiled && human !== INDRAPRASTHA}
      />
      <div className="order-last col-span-2 text-center md:order-none md:col-span-1">
        <div className="font-chrome text-xs uppercase tracking-widest text-leaf-faint">
          Turn {Math.min(state.turn, state.turn_limit)} of {state.turn_limit}
        </div>
        <div className="mt-1 font-body text-leaf">
          {state.winner !== null
            ? "The matter is decided"
            : isHumanTurn
              ? `Your move — ${state.actions_remaining} of 3 acts remain`
              : `${PLAYER_NAME[state.active_player]} is acting…`}
        </div>
        <div className="mt-0.5 font-chrome text-[11px] text-leaf-faint">
          Win: {state.oaths_to_win} open oaths, or the legitimacy lead after
          turn {state.turn_limit}
          {" · "}
          <button
            onClick={onShowWay}
            className="underline decoration-line-bright underline-offset-2 hover:text-leaf-dim"
          >
            the way
          </button>
        </div>
      </div>
      <Claim
        state={state}
        player={MAGADHA}
        isHuman={human === MAGADHA}
        hideShadow={veiled && human !== MAGADHA}
        alignRight
      />
    </header>
  );
}
